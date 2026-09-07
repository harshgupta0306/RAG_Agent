import { useCallback, useEffect, useState } from "react";
import type {
  Checkpoint,
  Conversation,
  DocumentMeta,
  Message,
  NodeState,
  RetrievedDocument,
  SearchMode,
  StreamEvent,
} from "../../types/rag";

import { getConversations, createConversation, getMessages } from "../../api/conversations";
import { getNotebooks, type Notebook } from "../../api/notebooks";
import {
  streamRAG,
  getCheckpointHistory,
  resumeFromCheckpoint,
} from "../../api/rag";

import Sidebar from "./Sidebar";
import AgentPanel from "./AgentPanel";
import Chat from "../chat/Chat";

// ─── Helpers ───────────────────────────────────────────────

function createNode(event: StreamEvent): NodeState | null {
  if (event.type !== "node") return null;
  const now = Date.now();
  return {
    id: `${now}-${Math.random()}`,
    node: event.node,
    status: "completed",
    data: event.data,
    startedAt: now,
    completedAt: now + 1,
  };
}

function getDocuments(value: unknown): RetrievedDocument[] {
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

function loadLocalDocuments(notebookId: string): DocumentMeta[] {
  try {
    const key = `rag:documents:${notebookId}`;
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

// ─── Workspace ─────────────────────────────────────────────

export default function Workspace() {
  // ── Notebook state ───────────────────────────────────────
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);

  // ── Document state ───────────────────────────────────────
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);

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

  // ── Load notebooks on mount ──────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await getNotebooks();
        setNotebooks(data);
        if (data.length > 0 && !selectedNotebookId) {
          setSelectedNotebookId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load notebooks", err);
      }
    })();
  }, []);

  // ── Load conversations + documents when notebook changes ─
  useEffect(() => {
    if (!selectedNotebookId) {
      setConversations([]);
      setDocuments([]);
      return;
    }

    // Load conversations from API
    (async () => {
      try {
        setConversationsLoading(true);
        const convs = await getConversations(selectedNotebookId);
        setConversations(convs);

        // Auto-select first conversation if available
        if (convs.length > 0 && (!selectedConversation || selectedConversation.notebook_id !== selectedNotebookId)) {
          setSelectedConversation(convs[0]);
        } else if (convs.length === 0) {
          setSelectedConversation(null);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setConversationsLoading(false);
      }
    })();

    // Load documents from localStorage
    setDocuments(loadLocalDocuments(selectedNotebookId));

    // Clear agent state
    setNodes([]);
    setRetrievedDocuments([]);
    setCheckpoints([]);
    setSelectedCheckpoint(undefined);
    setAnswer("");
    setErrorMessage("");
  }, [selectedNotebookId]);

  // ── Load messages when conversation changes ──────────────
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

    // Clear agent state when switching conversations
    setNodes([]);
    setRetrievedDocuments([]);
    setCheckpoints([]);
    setSelectedCheckpoint(undefined);
    setAnswer("");
    setErrorMessage("");
  }, [selectedConversation?.id]);

  // ── Listen for document changes (localStorage events) ────
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.notebookId === selectedNotebookId) {
        setDocuments(loadLocalDocuments(selectedNotebookId!));
      }
    }
    window.addEventListener("documents:changed", handler);
    return () => window.removeEventListener("documents:changed", handler);
  }, [selectedNotebookId]);

  // ── Notebook selection ───────────────────────────────────
  const handleSelectNotebook = useCallback((id: string) => {
    setSelectedNotebookId(id);
  }, []);

  // ── Document uploaded ────────────────────────────────────
  const handleDocumentUploaded = useCallback((doc: DocumentMeta) => {
    setDocuments(prev => [...prev, doc]);
  }, []);

  // ── Conversation selection ───────────────────────────────
  const handleSelectConversation = useCallback((conv: Conversation) => {
    if (running || timeTravelLoading) return;
    setSelectedConversation(conv);
  }, [running, timeTravelLoading]);

  // ── Create conversation ──────────────────────────────────
  const handleCreateConversation = useCallback(async () => {
    if (!selectedNotebookId || running) return;
    try {
      const conv = await createConversation(selectedNotebookId);
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
  }, [selectedNotebookId, running]);

  // ── Submit query ─────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || running || !selectedNotebookId) return;

    let activeConversation = selectedConversation;

    // Create conversation if none exists
    if (!activeConversation) {
      try {
        activeConversation = await createConversation(selectedNotebookId, getTitle(trimmed));
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
        selectedNotebookId,
        (event: StreamEvent) => {
          if (event.type === "node") {
            const node = createNode(event);
            if (node) {
              nextNodes = [...nextNodes, node];
              setNodes(nextNodes);
            }

            if (event.node === "retrieval" && event.data?.results) {
              nextDocuments = getDocuments(event.data.results);
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
        // Keep the optimistic messages if API fails
      }

      // Load checkpoints
      try {
        const history = await getCheckpointHistory(activeConversation!.thread_id);
        setCheckpoints(history?.checkpoints ?? []);
      } catch (err) {
        console.error("Failed to load checkpoints:", err);
      }
    }
  }, [query, running, selectedNotebookId, selectedConversation, searchMode]);

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
              nextDocuments = getDocuments(event.data.results);
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

  // ── View sources scroll ──────────────────────────────────
  const handleViewSources = useCallback(() => {
    const el = document.getElementById("retrieved-sources");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // ── Derived values ───────────────────────────────────────
  const selectedNotebook = notebooks.find(n => n.id === selectedNotebookId);
  const statusMessage = running ? getRunningMessage(nodes) : timeTravelLoading ? "Resuming execution…" : "";

  return (
    <div className="workspace">
      {/* Header */}
      <header className="workspace-header">
        <div className="header-brand">
          <span className="header-logo" aria-hidden="true">AR</span>
          <div>
            <h1>Agentic RAG</h1>
            <span className="header-subtitle">LangGraph Retrieval Agent</span>
          </div>
        </div>
        <div className="header-actions">
          <span className={`header-status ${running ? "active" : ""}`}>
            <span className="header-status-dot" aria-hidden="true" />
            {running ? "Agent Running" : "Online"}
          </span>
          <button
            type="button"
            className="panel-toggle-btn sidebar-toggle-btn"
            onClick={() => setLeftOpen(prev => !prev)}
            aria-label={leftOpen ? "Hide sidebar" : "Show sidebar"}
          >
            ☰
          </button>
          <button
            type="button"
            className="panel-toggle-btn agent-toggle-btn"
            onClick={() => setRightOpen(prev => !prev)}
            aria-label={rightOpen ? "Hide agent panel" : "Show agent panel"}
          >
            ⬡
          </button>
        </div>
      </header>

      {/* Three-column body */}
      <div className={`workspace-body ${leftOpen ? "" : "left-closed"} ${rightOpen ? "" : "right-closed"}`}>
        {/* Backdrop for mobile drawers */}
        {leftOpen && (
          <div className="drawer-backdrop left-backdrop" onClick={() => setLeftOpen(false)} />
        )}
        {rightOpen && (
          <div className="drawer-backdrop right-backdrop" onClick={() => setRightOpen(false)} />
        )}

        <Sidebar
          selectedNotebookId={selectedNotebookId}
          onSelectNotebook={handleSelectNotebook}
          documents={documents}
          onDocumentUploaded={handleDocumentUploaded}
          conversations={conversations}
          selectedConversationId={selectedConversation?.id ?? null}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
          conversationsLoading={conversationsLoading}
        />

        <Chat
          conversationTitle={selectedConversation?.title ?? ""}
          notebookName={selectedNotebook?.name ?? ""}
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
