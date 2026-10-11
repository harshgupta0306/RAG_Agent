import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import type {
  Checkpoint,
  Conversation,
  DocumentMeta,
  Message,
  NodeState,
  RetrievedDocument,
  SearchMode,
  StreamEvent,
} from "../types/rag";

import { getConversations, createConversation, getMessages } from "../api/conversations";
import { getNotebooks, getNotebook, type Notebook } from "../api/notebooks";
import { getDocuments, deleteDocument } from "../api/documents";
import {
  streamRAG,
  getCheckpointHistory,
  resumeFromCheckpoint,
} from "../api/rag";

import SourcesPanel from "../components/sources/SourcesPanel";
import AgentPanel from "../components/layout/AgentPanel";
import Chat from "../components/chat/Chat";

// ─── Helpers ───────────────────────────────────────────────

function createNode(event: StreamEvent): NodeState | null {
  if (event.type !== "node") return null;
  const now = Date.now();
  return {
    id: `${now}-${Math.random()}`,
    checkpoint_id : event.checkpoint_id,
    node: event.node,
    status: "completed",
    data: event.data,
    startedAt: now,
    completedAt: now + 1,
  };
}

function parseDocuments(value: unknown): RetrievedDocument[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    item => typeof item === "object" && item !== null
  ) as RetrievedDocument[];
}

function getRunningMessage(nodes: NodeState[]) {
  const last = nodes.at(-1)?.node;
  switch (last) {
    case "retrieval":
    case "semantic":
    case "hybrid":
      return "Searching knowledge base…";
    case "rerank":
      return "Reranking context…";
    case "generation":
      return "Generating answer…";
    case "grading":
      return "Evaluating response…";
    case "rewrite":
    case "apply_rewrite":
      return "Rewriting query…";
    default:
      return "Preparing execution…";
  }
}

function getTitle(query: string) {
  return query.length > 56 ? `${query.slice(0, 56)}…` : query;
}

export default function ChatWorkspacePage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();

  // ── Notebook state ───────────────────────────────────────
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null);
  const [notebookLoading, setNotebookLoading] = useState(true);

  // ── Document / Sources state ─────────────────────────────
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());

  // ── Conversation state ───────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // ── Message state ────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);

  // ── Query / streaming state ──────────────────────────────
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("auto");
  const [answer, setAnswer] = useState("");
  const [running, setRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ── Agent state ──────────────────────────────────────────
  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [retrievedDocuments, setRetrievedDocuments] = useState<RetrievedDocument[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>();
  const [timeTravelLoading, setTimeTravelLoading] = useState(false);

  // ── Responsive panel state ───────────────────────────────
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // ── Load notebook details & list ─────────────────────────
  useEffect(() => {
    if (!notebookId) return;

    (async () => {
      try {
        setNotebookLoading(true);
        const [nbList, nbData] = await Promise.all([
          getNotebooks(),
          getNotebook(notebookId).catch(() => null),
        ]);
        setNotebooks(nbList);

        if (nbData) {
          setCurrentNotebook(nbData);
        } else if (nbList.length > 0) {
          // If the requested ID wasn't found, find in list or navigate
          const found = nbList.find(n => n.id === notebookId);
          if (found) setCurrentNotebook(found);
          else navigate("/notebooks");
        } else {
          navigate("/notebooks");
        }
      } catch (err) {
        console.error("Failed to load notebook", err);
      } finally {
        setNotebookLoading(false);
      }
    })();
  }, [notebookId, navigate]);

  // ── Load documents and conversations for current notebook ─
  useEffect(() => {
    if (!notebookId) return;

    // Fetch documents
    (async () => {
      try {
        const docs = await getDocuments(notebookId);
        setDocuments(docs);
        // Default: select all documents for retrieval
        setSelectedDocumentIds(new Set(docs.map(d => d.document_id)));
      } catch (err) {
        console.error("Failed to fetch documents", err);
      }
    })();

    // Fetch conversations
    (async () => {
      try {
        setConversationsLoading(true);
        const convs = await getConversations(notebookId);
        setConversations(convs);

        // Select the first conversation if available
        if (convs.length > 0) {
          setSelectedConversation(convs[0]);
        } else {
          setSelectedConversation(null);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setConversationsLoading(false);
      }
    })();

    // Clear agent state on notebook switch
    setNodes([]);
    setRetrievedDocuments([]);
    setCheckpoints([]);
    setSelectedCheckpoint(undefined);
    setAnswer("");
    setErrorMessage("");
  }, [notebookId]);

  // ── Load messages when selected conversation changes ─────
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    (async () => {
      try {
        const msgs = await getMessages(selectedConversation.id);
        setMessages(msgs);
      } catch (err) {
        console.error("Failed to load messages", err);
        setMessages([]);
      }
    })();

    // Clear active trace for this conversation
    setNodes([]);
    setRetrievedDocuments([]);
    setCheckpoints([]);
    setSelectedCheckpoint(undefined);
    setAnswer("");
    setErrorMessage("");
  }, [selectedConversation?.id]);

  // ── Document Selection Handlers ──────────────────────────
  const handleToggleSelectDocument = useCallback((docId: string) => {
    setSelectedDocumentIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  }, []);

  const handleSelectAllDocuments = useCallback(() => {
    setSelectedDocumentIds(new Set(documents.map(d => d.document_id)));
  }, [documents]);

  const handleDeselectAllDocuments = useCallback(() => {
    setSelectedDocumentIds(new Set());
  }, []);

  // ── Document Uploaded Handler ────────────────────────────
  const handleDocumentUploaded = useCallback((doc: DocumentMeta) => {
    setDocuments(prev => [doc, ...prev]);
    setSelectedDocumentIds(prev => new Set(prev).add(doc.document_id));
  }, []);

  // ── Document Delete Handler ──────────────────────────────
  const handleDeleteDocument = useCallback(async (docId: string) => {
    if (!notebookId) return;
    await deleteDocument(notebookId, docId);
    setDocuments(prev => prev.filter(d => d.document_id !== docId));
    setSelectedDocumentIds(prev => {
      const next = new Set(prev);
      next.delete(docId);
      return next;
    });
  }, [notebookId]);

  // ── Conversation Selection ───────────────────────────────
  const handleSelectConversation = useCallback((conv: Conversation) => {
    if (running || timeTravelLoading) return;
    setSelectedConversation(conv);
  }, [running, timeTravelLoading]);

  // ── Create Conversation ──────────────────────────────────
  const handleCreateConversation = useCallback(async () => {
    if (!notebookId || running) return;
    try {
      const conv = await createConversation(notebookId);
      setConversations(prev => [conv, ...prev]);
      setSelectedConversation(conv);
      setMessages([]);
      setNodes([]);
      setRetrievedDocuments([]);
      setCheckpoints([]);
      setAnswer("");
      setErrorMessage("");
    } catch (err) {
      console.error("Failed to create conversation", err);
    }
  }, [notebookId, running]);

  // ── Submit query ─────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || running || !notebookId) return;

    let activeConversation = selectedConversation;

    // Create conversation if none exists
    if (!activeConversation) {
      try {
        activeConversation = await createConversation(notebookId, getTitle(trimmed));
        setConversations(prev => [activeConversation!, ...prev]);
        setSelectedConversation(activeConversation);
      } catch (err) {
        setErrorMessage("Failed to create conversation.");
        return;
      }
    }

    setQuery("");
    setAnswer("");
    setNodes([]);
    setRetrievedDocuments([]);
    setSelectedCheckpoint(undefined);
    setErrorMessage("");
    setRunning(true);

    // Optimistically add user message to the UI
    const userMsg: Message = {
      id: `pending-${Date.now()}`,
      conversation_id: activeConversation.id,
      role: "user",
      content: trimmed,
    };
    setMessages(prev => [...prev, userMsg]);

    let nextAnswer = "";
    let nextNodes: NodeState[] = [];
    let nextDocuments: RetrievedDocument[] = [];

    try {
      await streamRAG(
        trimmed,
        searchMode,
        activeConversation.id,
        notebookId,
        (event: StreamEvent) => {
          if (event.type === "node") {
            const node = createNode(event);
            if (node) {
              nextNodes = [...nextNodes, node];
              setNodes(nextNodes);
            }

            if (event.node === "retrieval" && event.data?.results) {
              nextDocuments = parseDocuments(event.data.results);
              setRetrievedDocuments(nextDocuments);
            }

            if (event.node === "generation" && typeof event.data?.answer === "string") {
              nextAnswer = event.data.answer;
              setAnswer(nextAnswer);
            }

            return;
          }

          if (event.type === "token") {
            nextAnswer += event.content;
            setAnswer(nextAnswer);
            return;
          }

          if (event.type === "error") {
            setErrorMessage(event.message);
          }
        },
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRunning(false);

      // Reload messages from API to get the persisted version
      try {
        const msgs = await getMessages(activeConversation!.id);
        setMessages(msgs);
      } catch {
        // Keep optimistic messages
      }

      // Load checkpoints
      try {
        const history = await getCheckpointHistory(activeConversation!.thread_id);
        setCheckpoints(history?.checkpoints ?? []);
      } catch (err) {
        console.error("Failed to load checkpoints:", err);
      }
    }
  }, [query, running, notebookId, selectedConversation, searchMode]);

  // ── Time travel ──────────────────────────────────────────
  const handleTimeTravel = useCallback(async (checkpointId: string) => {
    if (timeTravelLoading || !selectedConversation) return;

    setSelectedCheckpoint(checkpointId);
    setTimeTravelLoading(true);
    setAnswer("");
    setErrorMessage("");

    let nextAnswer = "";
    let nextNodes = nodes;
    let nextDocuments = retrievedDocuments;

    try {
      await resumeFromCheckpoint(
        selectedConversation.thread_id,
        checkpointId,
        (event: StreamEvent) => {
          if (event.type === "token") {
            nextAnswer += event.content;
            setAnswer(nextAnswer);
            return;
          }

          if (event.type === "node") {
            const node = createNode(event);
            if (node) {
              nextNodes = [...nextNodes, node];
              setNodes(nextNodes);
            }

            if (event.node === "retrieval" && event.data?.results) {
              nextDocuments = parseDocuments(event.data.results);
              setRetrievedDocuments(nextDocuments);
            }

            if (event.node === "generation" && typeof event.data?.answer === "string") {
              nextAnswer = event.data.answer;
              setAnswer(nextAnswer);
            }

            return;
          }

          if (event.type === "error") {
            setErrorMessage(event.message);
          }
        },
      );

      const history = await getCheckpointHistory(selectedConversation.thread_id);
      setCheckpoints(history?.checkpoints ?? []);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Time travel failed.");
    } finally {
      setTimeTravelLoading(false);
    }
  }, [timeTravelLoading, selectedConversation, nodes, retrievedDocuments]);

  const handleViewSources = useCallback(() => {
    const el = document.getElementById("retrieved-sources");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const statusMessage = running
    ? getRunningMessage(nodes)
    : timeTravelLoading
    ? "Resuming execution…"
    : "";

  if (notebookLoading && !currentNotebook) {
    return (
      <div className="workspace" style={{ display: "grid", placeItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
          <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>📓</span>
          <p>Loading notebook workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      {/* Three-panel Header with Breadcrumbs and Controls */}
      <header className="workspace-header">
        <div className="header-brand">
          <Link to="/notebooks" className="header-back-link" title="Back to Notebooks">
            ← Notebooks
          </Link>
          <span className="header-divider">/</span>
          <div className="header-notebook-info">
            <span className="header-logo-sm" aria-hidden="true">📓</span>
            <select
              className="header-notebook-select"
              value={notebookId}
              onChange={e => navigate(`/notebooks/${e.target.value}`)}
              title="Switch notebook"
            >
              {notebooks.map(nb => (
                <option key={nb.id} value={nb.id}>
                  {nb.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="header-actions">
          <span className={`header-status ${running ? "active" : ""}`}>
            <span className="header-status-dot" aria-hidden="true" />
            {running ? "Agent Running" : "Online"}
          </span>

          <button
            type="button"
            className={`panel-toggle-btn ${leftOpen ? "panel-active" : ""}`}
            onClick={() => setLeftOpen(prev => !prev)}
            aria-label={leftOpen ? "Hide sources panel" : "Show sources panel"}
            title="Toggle Sources (Left Panel)"
          >
            🗂 Sources
          </button>

          <button
            type="button"
            className={`panel-toggle-btn ${rightOpen ? "panel-active" : ""}`}
            onClick={() => setRightOpen(prev => !prev)}
            aria-label={rightOpen ? "Hide agent executions panel" : "Show agent executions panel"}
            title="Toggle Agent Executions (Right Panel)"
          >
            ⬡ Executions
          </button>
        </div>
      </header>

      {/* Three-Panel Body */}
      <div
        className={`workspace-body ${leftOpen ? "" : "left-closed"} ${
          rightOpen ? "" : "right-closed"
        }`}
      >
        {/* Backdrop for mobile */}
        {leftOpen && (
          <div className="drawer-backdrop left-backdrop" onClick={() => setLeftOpen(false)} />
        )}
        {rightOpen && (
          <div className="drawer-backdrop right-backdrop" onClick={() => setRightOpen(false)} />
        )}

        {/* 1. LEFT PANEL: Sources & Knowledge Management */}
        <SourcesPanel
          notebookId={notebookId ?? ""}
          documents={documents}
          selectedDocumentIds={selectedDocumentIds}
          onToggleSelectDocument={handleToggleSelectDocument}
          onSelectAllDocuments={handleSelectAllDocuments}
          onDeselectAllDocuments={handleDeselectAllDocuments}
          onDocumentUploaded={handleDocumentUploaded}
          onDeleteDocument={handleDeleteDocument}
          conversations={conversations}
          selectedConversationId={selectedConversation?.id ?? null}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
          conversationsLoading={conversationsLoading}
        />

        {/* 2. MIDDLE PANEL: Chat & Streaming Responses */}
        <Chat
          conversationTitle={selectedConversation?.title ?? ""}
          notebookName={currentNotebook?.name ?? ""}
          searchMode={searchMode}
          messages={messages}
          streamingAnswer={answer}
          isStreaming={running || timeTravelLoading}
          retrievedDocuments={retrievedDocuments}
          statusMessage={statusMessage}
          query={query}
          running={running || timeTravelLoading}
          error={errorMessage || undefined}
          onQueryChange={setQuery}
          onModeChange={setSearchMode}
          onSubmit={handleSubmit}
          onViewSources={handleViewSources}
          hasConversation={!!selectedConversation}
        />

        {/* 3. RIGHT PANEL: Agent Executions, History & Checkpoints */}
        <AgentPanel
          nodes={nodes}
          running={running}
          retrievedDocuments={retrievedDocuments}
          checkpoints={checkpoints}
          selectedCheckpoint={selectedCheckpoint}
          timeTravelLoading={timeTravelLoading}
          onResume={handleTimeTravel}
        />
      </div>
    </div>
  );
}
