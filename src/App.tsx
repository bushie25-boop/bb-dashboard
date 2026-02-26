import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import OfficePage  from "./pages/Office";
import KanbanPage  from "./pages/Kanban";
import ReportsPage from "./pages/Reports";
import FilesPage   from "./pages/Files";
import AuditPage   from "./pages/Audit";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Root → Office */}
          <Route path="/" element={<Navigate to="/office" replace />} />
          <Route path="/office"  element={<OfficePage  />} />
          <Route path="/kanban"  element={<KanbanPage  />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/files"   element={<FilesPage   />} />
          <Route path="/audit"   element={<AuditPage   />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
