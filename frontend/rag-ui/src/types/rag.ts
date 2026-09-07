export type SearchMode =
  | "auto"
  | "semantic"
  | "hybrid";


export type AgentNode =
  | "router"
  | "retrieval"
  | "semantic"
  | "hybrid"
  | "rerank"
  | "generation"
  | "grading"
  | "rewrite"
  | "apply_rewrite";


export interface NodeEvent {
    type: "node";
    node: AgentNode | string;
    data?: Record<string, unknown>;
}


export interface TokenEvent {
    type: "token";
    content: string;
}


export interface DoneEvent {
    type: "done";
}


export interface ErrorEvent {
    type: "error";
    message: string;
}

export interface CheckpointValues {
  query?: string;
  search_mode?: string;
  grade?: string;
  retry_count?: number;
  rewritten_query?: string;
}

export interface Checkpoint {
  checkpoint_id: string;
  thread_id: string;
  next: string[];
  values: CheckpointValues;
}

export interface CheckpointHistory {
  thread_id: string;
  checkpoints: Checkpoint[];
}


export type StreamEvent =
    | NodeEvent
    | TokenEvent
    | DoneEvent
    | ErrorEvent;

export type NodeStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export interface NodeState {
  id: string;
  node: AgentNode | string;
  status: NodeStatus;
  data?: Record<string, unknown>;
  startedAt: number;
  completedAt?: number;
}

export interface RetrievedDocument {
  chunk_id?: string;
  content?: string;
  page_content?: string;
  text?: string;
  metadata?: Record<string, unknown>;
  score?: number;
  relevance_score?: number;
  [key: string]: unknown;
}

export interface ConversationSummary {
  threadId: string;
  title: string;
  mode: SearchMode;
  createdAt: number;
  updatedAt: number;
  checkpointCount: number;
}

// -------------------------------------------------
// Backend-aligned types
// -------------------------------------------------

export interface Conversation {
  id: string;
  notebook_id: string;
  title: string;
  thread_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
}

export interface DocumentMeta {
  document_id: string;
  notebook_id: string;
  file_name: string;
  file_type: string;
  chunks: number;
  status: string;
}

// Citation UI placeholder — ready for future backend support
export interface Citation {
  index: number;
  filename: string;
  page?: number | string;
  chunkId?: string;
}
