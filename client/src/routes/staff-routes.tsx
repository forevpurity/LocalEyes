import { Routes, Route, Navigate } from "react-router";

export function StaffRoutes() {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
