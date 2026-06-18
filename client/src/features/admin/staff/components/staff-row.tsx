import { useState } from "react";
import { Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getRelativeTime } from "@/lib/utils";
import type { StaffListItem } from "@/types/api";
import { Avatar } from "@/components/avatar";
import { useBanStaff } from "../hooks/use-ban-staff";
import { useUnbanStaff } from "../hooks/use-unban-staff";

interface StaffRowProps {
  staff: StaffListItem;
}

type RowMode = "view" | "ban-confirm";

export function StaffRow({ staff }: StaffRowProps) {
  const [mode, setMode] = useState<RowMode>("view");
  const isBanned = staff.bannedAt !== null;
  const banStaff = useBanStaff(staff.id);
  const unbanStaff = useUnbanStaff(staff.id);

  const handleUnban = () => {
    unbanStaff.mutate(undefined, {
      onSuccess: () => toast.success("Staff member unbanned"),
      onError: () => toast.error("Couldn't unban staff member."),
    });
  };

  const confirmBan = () => {
    banStaff.mutate(undefined, {
      onSuccess: () => {
        setMode("view");
        toast.success("Staff member banned");
      },
      onError: () => {
        setMode("view");
        toast.error("Couldn't ban staff member.");
      },
    });
  };

  return (
    <tr
      className={`border-b border-border transition-colors last:border-none ${
        mode === "ban-confirm" ? "bg-destructive/5" : "hover:bg-muted/50"
      }`}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar src={staff.avatarUrl} name={staff.displayName} size="md" />
          <div>
            <p className="font-medium text-foreground">{staff.displayName}</p>
            <p className="text-xs text-muted-foreground">{staff.email}</p>
          </div>
        </div>
      </td>

      {/* Department */}
      <td className="px-4 py-3 text-sm text-foreground">
        {staff.departmentName ?? (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {isBanned ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold uppercase text-destructive">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Banned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold uppercase text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Active
          </span>
        )}
      </td>

      {/* Created */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {getRelativeTime(staff.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {mode === "ban-confirm" ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-foreground">Ban this staff member?</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={confirmBan}
                disabled={banStaff.isPending}
                className="rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/80 disabled:opacity-50"
              >
                Ban
              </button>
              <button
                onClick={() => setMode("view")}
                className="rounded-md border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : isBanned ? (
          <button
            onClick={handleUnban}
            disabled={unbanStaff.isPending}
            title="Unban"
            className="inline-flex items-center gap-1 rounded p-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs">Unban</span>
          </button>
        ) : (
          <button
            onClick={() => setMode("ban-confirm")}
            title="Ban"
            className="inline-flex items-center gap-1 rounded p-1 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Ban className="h-4 w-4" />
            <span className="text-xs">Ban</span>
          </button>
        )}
      </td>
    </tr>
  );
}
