import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OfficePage from "./pages/Office";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home → Office dashboard */}
        <Route path="/" element={<Navigate to="/office" replace />} />
        <Route path="/office" element={<OfficePage />} />
        {/* Future pages go here */}
      </Routes>
    </BrowserRouter>
  );
}
