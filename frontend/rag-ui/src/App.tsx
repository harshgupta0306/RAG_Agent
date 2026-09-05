import { BrowserRouter, Routes, Route } from "react-router";
import Notebooks from "./pages/Notebooks";
import Chat from "./pages/Chat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Notebooks />} />
        <Route path="/notebooks/:notebookId" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;