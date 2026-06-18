import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatResolution } from "@/features/admin/analytics/lib/format-resolution";
import type { DashboardDepartment } from "@/types/api";

interface DepartmentPerformanceTableProps {
  departments: DashboardDepartment[];
}

export function DepartmentPerformanceTable({
  departments,
}: DepartmentPerformanceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Department performance</CardTitle>
      </CardHeader>
      <CardContent>
        {departments.length === 0 ? (
          <p className="py-8 text-center text-body-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Department</th>
                  <th className="py-2 pr-4 font-medium">Open</th>
                  <th className="py-2 pr-4 font-medium">Resolved</th>
                  <th className="py-2 pr-4 font-medium">Avg. speed</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr
                    key={dept.departmentId ?? "__unassigned"}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-medium text-foreground">
                      {dept.departmentName}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">{dept.open}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{dept.resolved}</td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {formatResolution(dept.avgSpeedHours)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
