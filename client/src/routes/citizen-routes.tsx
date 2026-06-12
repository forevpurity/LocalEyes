import { Routes, Route, Navigate } from "react-router";
import { MapPage } from "@/features/reports/map-page";
import { ReportDetailPage } from "@/features/reports/report-detail-page";
import { CreateReportPage } from "@/features/reports/create-report-page";
import { MyReportsPage } from "@/features/reports/my-reports-page";

export function CitizenRoutes() {
  return (
    <Routes>
      <Route path="/map" element={<MapPage />} />
      <Route path="/reports" element={<MyReportsPage />} />
      <Route path="/reports/new" element={<CreateReportPage />} />
      <Route path="/reports/:id" element={<ReportDetailPage />} />
      <Route path="*" element={<Navigate to="/map" replace />} />
    </Routes>
  );
}
