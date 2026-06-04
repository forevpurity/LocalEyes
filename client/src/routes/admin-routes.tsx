import { Routes, Route, Navigate } from "react-router";

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
