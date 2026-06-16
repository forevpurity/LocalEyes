import { Routes, Route, Navigate } from "react-router";
import { StaffLayout } from "@/features/staff/components/staff-layout";
import { StaffDashboardPage } from "@/features/staff/staff-dashboard-page";
import { StaffQueuePage } from "@/features/staff/staff-queue-page";
import { ReportDetailPage } from "@/features/reports/report-detail-page";
import { ProfilePage } from "@/features/profile/profile-page";

export function StaffRoutes() {
  return (
    <Routes>
      {/* Full-page views rendered outside the sidebar layout (they carry their own top bar) */}
      <Route path="reports/:id" element={<ReportDetailPage />} />

      {/* Sidebar layout */}
      <Route element={<StaffLayout />}>
        <Route path="dashboard" element={<StaffDashboardPage />} />
        <Route path="queue" element={<StaffQueuePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
