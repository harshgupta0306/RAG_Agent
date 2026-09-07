import type { Conversation, Message } from "../types/rag";

const API_URL = "http://127.0.0.1:8000";

export async function getConversations(
  notebookId: string,
): Promise<Conversation[]> {
  const response = await fetch(
    `${API_URL}/api/notebooks/${notebookId}/conversations`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

export async function createConversation(
  notebookId: string,
  title = "New Conversation",
): Promise<Conversation> {
  const response = await fetch(
    `${API_URL}/api/conversations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notebook_id: notebookId,
        title,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to create conversation");
  }

  return response.json();
}

export async function getConversation(
  conversationId: string,
): Promise<Conversation> {
  const response = await fetch(
    `${API_URL}/api/conversations/${conversationId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch conversation");
  }

  return response.json();
}

export async function getMessages(
  conversationId: string,
): Promise<Message[]> {
  const response = await fetch(
    `${API_URL}/api/conversations/${conversationId}/messages`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  return response.json();
}
