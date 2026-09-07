import { useMemo, useState } from "react";
import type { Checkpoint } from "../../types/rag";

interface CheckpointSectionProps {
  checkpoints: Checkpoint[];
  selectedCheckpoint?: string;
  onResume: (checkpointId: string) => void;
  loading?: boolean;
}

function shortenId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function getCheckpointLabel(cp: Checkpoint) {
  const next = cp.next?.[0];
  if (next) return next;
  if (cp.values?.grade) return "grading";
  return "complete";
}

export default function CheckpointSection({
  checkpoints,
  selectedCheckpoint,
  onResume,
  loading = false,
}: CheckpointSectionProps) {
  const [activeId, setActiveId] = useState<string>();

  const resolvedActiveId =
    selectedCheckpoint ?? activeId ?? checkpoints[0]?.checkpoint_id;

  const activeCheckpoint = useMemo(
    () => checkpoints.find(cp => cp.checkpoint_id === resolvedActiveId) ?? checkpoints[0],
    [resolvedActiveId, checkpoints],
  );

  if (!checkpoints.length) return null;

  const isCompleted = !activeCheckpoint?.next || activeCheckpoint.next.length === 0;

  return (
    <section className="agent-section" aria-labelledby="checkpoint-section-title">
      <details className="checkpoint-expandable" open>
        <summary className="agent-section-header clickable">
          <h3 id="checkpoint-section-title">Checkpoints</h3>
          <span className="agent-count">{checkpoints.length}</span>
        </summary>

        <div className="checkpoint-body">
          <div className="checkpoint-list" role="list">
            {checkpoints.map((cp, i) => {
              const selected = cp.checkpoint_id === activeCheckpoint?.checkpoint_id;
              const completed = !cp.next || cp.next.length === 0;

              return (
                <button
                  key={cp.checkpoint_id}
                  type="button"
                  className={`checkpoint-row ${selected ? "selected" : ""}`}
                  onClick={() => setActiveId(cp.checkpoint_id)}
                >
                  <span className="checkpoint-idx">{i + 1}</span>
                  <div className="checkpoint-info">
                    <span className="checkpoint-label">{getCheckpointLabel(cp)}</span>
                    <span className="checkpoint-id">{shortenId(cp.checkpoint_id)}</span>
                  </div>
                  <span className="checkpoint-next">
                    {completed ? "END" : cp.next.join(", ")}
                  </span>
                </button>
              );
            })}
          </div>

          {activeCheckpoint && (
            <div className="checkpoint-detail">
              <dl className="checkpoint-dl">
                {activeCheckpoint.values?.query && (
                  <>
                    <dt>Query</dt>
                    <dd>{activeCheckpoint.values.query}</dd>
                  </>
                )}
                {activeCheckpoint.values?.rewritten_query && (
                  <>
                    <dt>Rewritten</dt>
                    <dd>{activeCheckpoint.values.rewritten_query}</dd>
                  </>
                )}
                {activeCheckpoint.values?.grade && (
                  <>
                    <dt>Grade</dt>
                    <dd>{activeCheckpoint.values.grade}</dd>
                  </>
                )}
                <dt>Retries</dt>
                <dd>{activeCheckpoint.values?.retry_count ?? 0}</dd>
                <dt>Next</dt>
                <dd>{isCompleted ? "END" : activeCheckpoint.next.join(", ")}</dd>
              </dl>

              {!isCompleted && (
                <button
                  type="button"
                  className="btn-sm checkpoint-resume"
                  onClick={() => onResume(activeCheckpoint.checkpoint_id)}
                  disabled={loading}
                >
                  {loading && selectedCheckpoint === activeCheckpoint.checkpoint_id
                    ? "Resuming…"
                    : "Resume from here"}
                </button>
              )}
            </div>
          )}
        </div>
      </details>
    </section>
  );
}
