import {
  useMemo,
  useState,
} from "react";

import type {
  Checkpoint,
} from "../types/rag";

interface Props {
  checkpoints?: Checkpoint[];
  selectedCheckpoint?: string;
  onResume: (checkpointId: string) => void;
  loading?: boolean;
}

function shortenId(id: string) {
  if (id.length <= 14) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function getCheckpointLabel(checkpoint: Checkpoint) {
  const next = checkpoint.next?.[0];

  if (next) {
    return next;
  }

  if (checkpoint.values?.grade) {
    return "grading";
  }

  return "complete";
}

export default function CheckpointTimeline({
  checkpoints = [],
  selectedCheckpoint,
  onResume,
  loading = false,
}: Props) {
  const [localActiveCheckpointId, setLocalActiveCheckpointId] = useState<string>();
  const activeCheckpointId =
    selectedCheckpoint ??
    localActiveCheckpointId ??
    checkpoints[0]?.checkpoint_id;

  const activeCheckpoint = useMemo(
    () =>
      checkpoints.find(
        checkpoint => checkpoint.checkpoint_id === activeCheckpointId,
      ) ?? checkpoints[0],
    [activeCheckpointId, checkpoints],
  );

  if (!checkpoints.length) {
    return null;
  }

  const isCompleted =
    !activeCheckpoint?.next ||
    activeCheckpoint.next.length === 0;

  return (
    <section className="panel checkpoint-panel" aria-labelledby="checkpoint-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Time Travel</p>
          <h2 id="checkpoint-title">Execution History</h2>
        </div>
        <span className="panel-count">{checkpoints.length} checkpoints</span>
      </div>

      <div className="checkpoint-layout">
        <div className="checkpoint-list" role="list">
          {checkpoints.map((checkpoint, index) => {
            const selected = checkpoint.checkpoint_id === activeCheckpoint?.checkpoint_id;
            const completed = !checkpoint.next || checkpoint.next.length === 0;

            return (
              <button
                key={checkpoint.checkpoint_id}
                type="button"
                className={`checkpoint-item ${selected ? "selected" : ""}`}
                onClick={() => setLocalActiveCheckpointId(checkpoint.checkpoint_id)}
              >
                <span className="checkpoint-dot" aria-hidden="true">
                  {index + 1}
                </span>
                <span>
                  <strong>{getCheckpointLabel(checkpoint)}</strong>
                  <small>{shortenId(checkpoint.checkpoint_id)}</small>
                </span>
                <em>{completed ? "END" : checkpoint.next.join(", ")}</em>
              </button>
            );
          })}
        </div>

        {activeCheckpoint && (
          <div className="checkpoint-details">
            <p className="eyebrow">Checkpoint Details</p>
            <h3>{shortenId(activeCheckpoint.checkpoint_id)}</h3>

            <dl>
              {activeCheckpoint.values?.query && (
                <>
                  <dt>Query</dt>
                  <dd>{activeCheckpoint.values.query}</dd>
                </>
              )}
              {activeCheckpoint.values?.rewritten_query && (
                <>
                  <dt>Rewritten query</dt>
                  <dd>{activeCheckpoint.values.rewritten_query}</dd>
                </>
              )}
              {activeCheckpoint.values?.grade && (
                <>
                  <dt>Grade</dt>
                  <dd>{activeCheckpoint.values.grade}</dd>
                </>
              )}
              <dt>Retry count</dt>
              <dd>{activeCheckpoint.values?.retry_count ?? 0}</dd>
              <dt>Next</dt>
              <dd>{isCompleted ? "END" : activeCheckpoint.next.join(", ")}</dd>
            </dl>

            {!isCompleted && (
              <button
                className="resume-button"
                type="button"
                onClick={() => onResume(activeCheckpoint.checkpoint_id)}
                disabled={loading}
              >
                {loading && selectedCheckpoint === activeCheckpoint.checkpoint_id
                  ? "Resuming execution..."
                  : "Resume from here"}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
