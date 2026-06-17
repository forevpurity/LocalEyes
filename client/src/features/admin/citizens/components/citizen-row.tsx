import { useState } from "react";
import { Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getRelativeTime } from "@/lib/utils";
import type { CitizenListItem } from "@/types/api";
import { Avatar } from "@/components/avatar";
import { useBanCitizen } from "../hooks/use-ban-citizen";
import { useUnbanCitizen } from "../hooks/use-unban-citizen";

interface CitizenRowProps {
  citizen: CitizenListItem;
}

type RowMode = "view" | "ban-confirm";

export function CitizenRow({ citizen }: CitizenRowProps) {
  const [mode, setMode] = useState<RowMode>("view");
  const isBanned = citizen.bannedAt !== null;
  const banCitizen = useBanCitizen(citizen.id);
  const unbanCitizen = useUnbanCitizen(citizen.id);

  const handleUnban = () => {
    unbanCitizen.mutate(undefined, {
      onSuccess: () => toast.success("Citizen unbanned"),
      onError: () => toast.error("Couldn't unban citizen."),
    });
  };

  const confirmBan = () => {
    banCitizen.mutate(undefined, {
      onSuccess: () => {
        setMode("view");
        toast.success("Citizen banned");
      },
      onError: () => {
        setMode("view");
        toast.error("Couldn't ban citizen.");
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
          <Avatar src={citizen.avatarUrl} name={citizen.displayName} size="md" />
          <div>
            <p className="font-medium text-foreground">{citizen.displayName}</p>
            <p className="text-xs text-muted-foreground">{citizen.email}</p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {isBanned ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold uppercase text-destructive">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Banned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase text-green-600 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Active
          </span>
        )}
      </td>

      {/* Created */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {getRelativeTime(citizen.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {mode === "ban-confirm" ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-foreground">Ban this citizen?</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={confirmBan}
                disabled={banCitizen.isPending}
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
            disabled={unbanCitizen.isPending}
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
