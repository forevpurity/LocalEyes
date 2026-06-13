import { Routes, Route, Navigate } from "react-router";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { AdminDashboard } from "@/features/admin/dashboard-page";
import { AdminReportsPage } from "@/features/admin/reports-page";
import { DepartmentListPage } from "@/features/admin/departments/department-list-page";
import { DepartmentCreatePage } from "@/features/admin/departments/department-create-page";
import { DepartmentEditPage } from "@/features/admin/departments/department-edit-page";
import { AdminCategoriesPage } from "@/features/admin/categories/categories-page";
import { AdminStaffPage } from "@/features/admin/staff-page";
import { AdminCitizensPage } from "@/features/admin/citizens-page";
import { AdminAnalyticsPage } from "@/features/admin/analytics-page";
import { ReportDetailPage } from "@/features/reports/report-detail-page";

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="reports/:id" element={<ReportDetailPage />} />
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="departments" element={<DepartmentListPage />} />
        <Route path="departments/new" element={<DepartmentCreatePage />} />
        <Route path="departments/:id/edit" element={<DepartmentEditPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="staff" element={<AdminStaffPage />} />
        <Route path="citizens" element={<AdminCitizensPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
