import { useEffect, useState } from "react";
import {
  getNotebooks,
  createNotebook,
  type Notebook,
} from "../api/notebooks";
import { useNavigate } from "react-router";

export default function Notebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    loadNotebooks();
  }, []);

  async function loadNotebooks() {
    try {
      const data = await getNotebooks();
      setNotebooks(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleCreate() {
    if (!name.trim()) return;

    try {
      const notebook = await createNotebook(name);

      setNotebooks((current) => [
        ...current,
        notebook,
      ]);

      setName("");
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      <h1>My Notebooks</h1>

      <div>
        <input
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="Notebook name"
        />

        <button onClick={handleCreate}>
          Create Notebook
        </button>
      </div>

      <div>
        {notebooks.map((notebook) => (
            <div
                key={notebook.id}
                onClick={() =>
                navigate(`/notebooks/${notebook.id}`)
                }
            >
                {notebook.name}
            </div>
            ))}
      </div>
    </div>
  );
}