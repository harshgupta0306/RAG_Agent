import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import NotebooksPage from "./pages/NotebooksPage";
import ChatWorkspacePage from "./pages/ChatWorkspacePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/notebooks" element={<NotebooksPage />} />
        <Route path="/notebooks/:notebookId" element={<ChatWorkspacePage />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;