import { Routes, Route, Navigate } from "react-router";
import { MapPage } from "@/features/reports/map-page";

export function CitizenRoutes() {
  return (
    <Routes>
      <Route path="/map" element={<MapPage />} />
      <Route path="*" element={<Navigate to="/map" replace />} />
    </Routes>
  );
}
