const API_URL = "http://127.0.0.1:8000";

export interface Notebook {
  id: string;
  name: string;
  created_at: string;
  documents_count?: number;
  conversations_count?: number;
}

export async function getNotebooks(): Promise<Notebook[]> {
  const response = await fetch(`${API_URL}/api/notebooks`);

  if (!response.ok) {
    throw new Error("Failed to fetch notebooks");
  }

  return response.json();
}

export async function getNotebook(id: string): Promise<Notebook> {
  const response = await fetch(`${API_URL}/api/notebooks/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch notebook");
  }

  return response.json();
}

export async function createNotebook(
  name: string
): Promise<Notebook> {
  const response = await fetch(
    `${API_URL}/api/notebooks`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create notebook");
  }

  return response.json();
}

export async function deleteNotebook(
  id: string
): Promise<{ status: string; id: string }> {
  const response = await fetch(
    `${API_URL}/api/notebooks/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete notebook");
  }

  return response.json();
}