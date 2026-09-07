import { useEffect, useState } from "react";
import { getNotebooks, createNotebook, type Notebook } from "../../api/notebooks";

interface NotebookSelectorProps {
  selectedId: string | null;
  onSelect: (notebookId: string) => void;
}

export default function NotebookSelector({
  selectedId,
  onSelect,
}: NotebookSelectorProps) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadNotebooks();
  }, []);

  async function loadNotebooks() {
    try {
      setLoading(true);
      const data = await getNotebooks();
      setNotebooks(data);
    } catch (err) {
      console.error("Failed to load notebooks", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed || creating) return;

    try {
      setCreating(true);
      const nb = await createNotebook(trimmed);
      setNotebooks(prev => [...prev, nb]);
      setNewName("");
      setShowCreate(false);
      onSelect(nb.id);
    } catch (err) {
      console.error("Failed to create notebook", err);
    } finally {
      setCreating(false);
    }
  }


  return (
    <div className="notebook-selector">
      <div className="notebook-selector-header">
        <div className="notebook-selector-current">
          <span className="notebook-selector-icon" aria-hidden="true">◈</span>
          <select
            id="notebook-select"
            aria-label="Select notebook"
            value={selectedId ?? ""}
            onChange={e => {
              if (e.target.value) onSelect(e.target.value);
            }}
            className="notebook-select"
          >
            <option value="">Select notebook</option>
            {notebooks.map(nb => (
              <option key={nb.id} value={nb.id}>
                {nb.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn-icon"
          onClick={() => setShowCreate(prev => !prev)}
          title="Create notebook"
          aria-label="Create notebook"
        >
          +
        </button>
      </div>

      {showCreate && (
        <div className="notebook-create-row">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setShowCreate(false);
            }}
            placeholder="Notebook name…"
            className="notebook-create-input"
            autoFocus
          />
          <button
            type="button"
            className="btn-sm"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
          >
            {creating ? "…" : "Create"}
          </button>
        </div>
      )}

      {loading && notebooks.length === 0 && (
        <div className="notebook-loading">Loading notebooks…</div>
      )}
    </div>
  );
}
