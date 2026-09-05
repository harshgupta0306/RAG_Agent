import {
  useMemo,
  useState,
} from "react";

import {
  getCheckpointHistory,
  resumeFromCheckpoint,
  streamRAG,
} from "../api/rag";
import type {
  Checkpoint,
  ConversationSummary,
  NodeState,
  RetrievedDocument,
  SearchMode,
  StreamEvent,
} from "../types/rag";
import AgentTimeline from "../components/AgentTimeline";
import ChatInput from "../components/ChatInput";
import ChatMessage from "../components/ChatMessage";
import CheckpointTimeline from "../components/CheckpointTimeline";
import EmptyState from "../components/EmptyState";
import ErrorCard from "../components/ErrorCard";
import Header from "../components/Header";
import RetrievedDocuments from "../components/RetrievedDocuments";
import Sidebar from "../components/Sidebar";
import { useParams } from "react-router";

interface ConversationSnapshot extends ConversationSummary {
  answer: string;
  checkpoints: Checkpoint[];
  errorMessage?: string;
  lastSubmittedQuery: string;
  nodes: NodeState[];
  retrievedDocuments: RetrievedDocument[];
  selectedCheckpoint?: string;
}

function createThreadId() {
  return crypto.randomUUID();
}

function createNode(event: StreamEvent): NodeState | null {
  if (event.type !== "node") {
    return null;
  }

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

function getTitle(query: string) {
  return query.length > 56 ? `${query.slice(0, 56)}...` : query;
}

function getDocuments(value: unknown): RetrievedDocument[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    item => typeof item === "object" && item !== null,
  ) as RetrievedDocument[];
}

function getRunningMessage(nodes: NodeState[]) {
  const lastNode = nodes.at(-1)?.node;

  switch (lastNode) {
    case "retrieval":
    case "semantic":
    case "hybrid":
      return "Searching knowledge base...";
    case "rerank":
      return "Reranking retrieved context...";
    case "generation":
      return "Generating answer...";
    case "grading":
      return "Evaluating response...";
    case "rewrite":
    case "apply_rewrite":
      return "Preparing a rewritten query...";
    default:
      return "Preparing graph execution...";
  }
}

export default function Chat() {
  const [threadId, setThreadId] = useState<string>(() => createThreadId());
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [retrievedDocuments, setRetrievedDocuments] = useState<RetrievedDocument[]>([]);
  const [running, setRunning] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("auto");
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>();
  const [timeTravelLoading, setTimeTravelLoading] = useState(false);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [snapshots, setSnapshots] = useState<Record<string, ConversationSnapshot>>({});

  const conversations = useMemo(
    () =>
      Object.values(snapshots).sort(
        (first, second) => second.updatedAt - first.updatedAt,
      ),
    [snapshots],
  );

  const { notebookId } = useParams<{
  notebookId: string;
}>();

  function saveSnapshot(overrides: Partial<ConversationSnapshot> = {}) {
    const submittedQuery = overrides.lastSubmittedQuery ?? lastSubmittedQuery;

    if (!submittedQuery) {
      return;
    }

    const now = Date.now();

    setSnapshots(previous => {
      const existing = previous[threadId];

      return {
        ...previous,
        [threadId]: {
          threadId,
          title: getTitle(submittedQuery),
          mode: overrides.mode ?? searchMode,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          checkpointCount: overrides.checkpoints?.length ?? checkpoints.length,
          answer: overrides.answer ?? answer,
          checkpoints: overrides.checkpoints ?? checkpoints,
          errorMessage: overrides.errorMessage ?? errorMessage,
          lastSubmittedQuery: submittedQuery,
          nodes: overrides.nodes ?? nodes,
          retrievedDocuments: overrides.retrievedDocuments ?? retrievedDocuments,
          selectedCheckpoint: overrides.selectedCheckpoint ?? selectedCheckpoint,
        },
      };
    });
  }

  function resetWorkspace(nextThreadId = createThreadId()) {
    setThreadId(nextThreadId);
    setQuery("");
    setAnswer("");
    setNodes([]);
    setRetrievedDocuments([]);
    setCheckpoints([]);
    setSelectedCheckpoint(undefined);
    setLastSubmittedQuery("");
    setErrorMessage("");
  }

  function handleNewChat() {
    if (running || timeTravelLoading) {
      return;
    }

    saveSnapshot();
    resetWorkspace();
  }

  function handleSelectConversation(nextThreadId: string) {
    if (running || timeTravelLoading || nextThreadId === threadId) {
      return;
    }

    saveSnapshot();

    const snapshot = snapshots[nextThreadId];
    if (!snapshot) {
      return;
    }

    setThreadId(snapshot.threadId);
    setQuery("");
    setAnswer(snapshot.answer);
    setNodes(snapshot.nodes);
    setRetrievedDocuments(snapshot.retrievedDocuments);
    setCheckpoints(snapshot.checkpoints);
    setSelectedCheckpoint(snapshot.selectedCheckpoint);
    setLastSubmittedQuery(snapshot.lastSubmittedQuery);
    setErrorMessage(snapshot.errorMessage ?? "");
    setSearchMode(snapshot.mode);
  }

  async function runQuery(rawQuery = query) {
    const submittedQuery = rawQuery.trim();

    if (!submittedQuery || running) {
      return;
    }

    const activeThreadId = threadId;
    const activeMode = searchMode;
    let nextAnswer = "";
    let nextNodes: NodeState[] = [];
    let nextDocuments: RetrievedDocument[] = [];
    let nextError = "";
    let nextCheckpoints: Checkpoint[] = [];

    setLastSubmittedQuery(submittedQuery);
    setQuery("");
    setAnswer("");
    setNodes([]);
    setRetrievedDocuments([]);
    setSelectedCheckpoint(undefined);
    setErrorMessage("");
    setRunning(true);

    try {
      await streamRAG(
        submittedQuery,
        activeMode,
        activeThreadId,
        notebookId!,
        event => {
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
            nextError = event.message;
            setErrorMessage(nextError);
          }
        },
      );
    } catch (error) {
      nextError =
        error instanceof Error
          ? error.message
          : "Something went wrong.";
      setErrorMessage(nextError);
    } finally {
      setRunning(false);

      try {
        const history = await getCheckpointHistory(activeThreadId);
        nextCheckpoints = history?.checkpoints ?? [];
        setCheckpoints(nextCheckpoints);
      } catch (error) {
        console.error("Failed to load checkpoints:", error);
      }

      const now = Date.now();
      setSnapshots(previous => {
        const existing = previous[activeThreadId];

        return {
          ...previous,
          [activeThreadId]: {
            threadId: activeThreadId,
            title: getTitle(submittedQuery),
            mode: activeMode,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            checkpointCount: nextCheckpoints.length,
            answer: nextAnswer,
            checkpoints: nextCheckpoints,
            errorMessage: nextError,
            lastSubmittedQuery: submittedQuery,
            nodes: nextNodes,
            retrievedDocuments: nextDocuments,
            selectedCheckpoint: undefined,
          },
        };
      });
    }
  }

  async function handleTimeTravel(checkpointId: string) {
    if (timeTravelLoading) {
      return;
    }

    const activeThreadId = threadId;
    let nextNodes = nodes;
    let nextAnswer = "";
    let nextDocuments = retrievedDocuments;
    let nextError = "";
    let nextCheckpoints = checkpoints;

    setSelectedCheckpoint(checkpointId);
    setTimeTravelLoading(true);
    setAnswer("");
    setErrorMessage("");

    try {
      await resumeFromCheckpoint(
        activeThreadId,
        checkpointId,
        event => {
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
            nextError = event.message;
            setErrorMessage(nextError);
          }
        },
      );

      const history = await getCheckpointHistory(activeThreadId);
      nextCheckpoints = history?.checkpoints ?? [];
      setCheckpoints(nextCheckpoints);
    } catch (error) {
      nextError =
        error instanceof Error
          ? error.message
          : "Time travel failed.";
      setErrorMessage(nextError);
    } finally {
      setTimeTravelLoading(false);
      saveSnapshot({
        answer: nextAnswer,
        checkpoints: nextCheckpoints,
        errorMessage: nextError,
        nodes: nextNodes,
        retrievedDocuments: nextDocuments,
        selectedCheckpoint: checkpointId,
      });
    }
  }

  const hasWorkspace =
    Boolean(lastSubmittedQuery) ||
    Boolean(answer) ||
    nodes.length > 0 ||
    retrievedDocuments.length > 0 ||
    checkpoints.length > 0 ||
    Boolean(errorMessage);

  return (
    <div className="rag-console">
      <Header running={running || timeTravelLoading} checkpointCount={checkpoints.length} />

      <div className="console-body">
        <Sidebar
          collapsed={sidebarCollapsed}
          conversations={conversations}
          currentThreadId={threadId}
          searchMode={searchMode}
          onToggle={() => setSidebarCollapsed(previous => !previous)}
          onNewChat={handleNewChat}
          onModeChange={setSearchMode}
          onSelectConversation={handleSelectConversation}
        />

        <main className="workspace">
          <div className="workspace-scroll">
            {!hasWorkspace ? (
              <EmptyState searchMode={searchMode} onExampleSelect={setQuery} />
            ) : (
              <div className="run-stack">
                {lastSubmittedQuery && (
                  <ChatMessage role="user" content={lastSubmittedQuery} />
                )}

                {(running || timeTravelLoading) && (
                  <section className="live-status" aria-live="polite">
                    <span aria-hidden="true" />
                    {timeTravelLoading ? "Resuming execution..." : getRunningMessage(nodes)}
                  </section>
                )}

                {(nodes.length > 0 || running) && (
                  <AgentTimeline nodes={nodes} running={running || timeTravelLoading} />
                )}

                {retrievedDocuments.length > 0 && (
                  <RetrievedDocuments documents={retrievedDocuments} />
                )}

                {answer && (
                  <ChatMessage
                    role="assistant"
                    content={answer}
                    streaming={running || timeTravelLoading}
                  />
                )}

                {errorMessage && (
                  <ErrorCard
                    message={errorMessage}
                    onRetry={() => {
                      if (lastSubmittedQuery) {
                        void runQuery(lastSubmittedQuery);
                      }
                    }}
                  />
                )}

                {checkpoints.length > 0 && (
                  <CheckpointTimeline
                    checkpoints={checkpoints}
                    selectedCheckpoint={selectedCheckpoint}
                    onResume={handleTimeTravel}
                    loading={timeTravelLoading}
                  />
                )}
              </div>
            )}
          </div>

          <div className="workspace-composer">
            <ChatInput
              query={query}
              searchMode={searchMode}
              running={running || timeTravelLoading}
              onQueryChange={setQuery}
              onSubmit={() => {
                void runQuery();
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
