import type {
  SearchMode,
  StreamEvent,
  CheckpointHistory
} from "../types/rag";


const API_URL =
  "http://127.0.0.1:8000";


export async function streamRAG(
  query: string,
  searchMode: SearchMode,
  threadId: string,
  onEvent: (event: StreamEvent) => void,
) {

  const response = await fetch(
    `${API_URL}/api/rag/stream`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Accept:
          "text/event-stream",
      },

      body: JSON.stringify({
        query,
        search_mode: searchMode,
        thread_id: threadId,
      }),
    }
  );


  if (!response.ok) {

    throw new Error(
      await response.text()
    );
  }


  if (!response.body) {

    throw new Error(
      "Streaming is not supported."
    );
  }


  const reader =
    response.body.getReader();


  const decoder =
    new TextDecoder();


  let buffer = "";


  while (true) {

    const {
      value,
      done,
    } = await reader.read();


    if (done) {
      break;
    }


    buffer += decoder.decode(
      value,
      {
        stream: true,
      }
    );


    const messages =
      buffer.split("\n\n");


    buffer =
      messages.pop() ?? "";


    for (
      const message of messages
    ) {

      const line =
        message
          .split("\n")
          .find(
            line =>
              line.startsWith("data:")
          );


      if (!line) {
        continue;
      }


      const data =
        line
          .replace(
            /^data:\s*/,
            ""
          );


      if (!data) {
        continue;
      }


      const event =
        JSON.parse(data);


      onEvent(event);
    }
  }
}
export async function getCheckpointHistory(
  threadId: string
): Promise<CheckpointHistory> {

  const response = await fetch(
    `${API_URL}/api/rag/history/${threadId}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch checkpoint history"
    );
  }

  return response.json();
}

export async function resumeFromCheckpoint(
  threadId: string,
  checkpointId: string,
  onEvent: (event: StreamEvent) => void
) {

  const response = await fetch(
    `${API_URL}/api/rag/time-travel/resume`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        thread_id: threadId,
        checkpoint_id: checkpointId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to resume checkpoint"
    );
  }

  if (!response.body) {
    throw new Error(
      "Streaming not supported"
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = "";

  while (true) {

    const {
      value,
      done,
    } = await reader.read();

    if (done) break;

    buffer += decoder.decode(
      value,
      { stream: true }
    );

    const events =
      buffer.split("\n\n");

    buffer =
      events.pop() ?? "";

    for (const event of events) {

      const line =
        event
          .split("\n")
          .find(line =>
            line.startsWith("data:")
          );

      if (!line) continue;

      const json =
        line
          .replace(/^data:\s*/, "");

      try {

        onEvent(
          JSON.parse(json)
        );

      } catch {
        console.error(
          "Invalid SSE event:",
          json
        );

      }

    }
  }
}
