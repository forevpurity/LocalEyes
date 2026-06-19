import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/features/auth/use-auth";
import { CivicShield } from "@/components/civic-shield";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

/**
 * Full-screen gate shown when `user.mustChangePassword` is true.
 * Submits `PATCH /auth/password` without a current password — the server
 * skips that check for flagged accounts. On success the flag is cleared
 * client-side so the user falls through to their normal route tree.
 */
export function ForcePasswordChangePage() {
  const { user, setUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: ({ newPassword }: FormData) =>
      api("/auth/password", {
        method: "PATCH",
        json: { newPassword },
      }),
    onSuccess: () => {
      if (user) setUser({ ...user, mustChangePassword: false });
      toast.success("Password set. Welcome!");
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.details) {
        for (const [field, messages] of Object.entries(
          err.details as Record<string, string[]>,
        )) {
          if (field === "newPassword") {
            setError("newPassword", { message: messages[0] });
          }
        }
      } else {
        setError("newPassword", {
          message: "Something went wrong. Please try again.",
        });
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <CivicShield className="h-10 w-10" />
          <div>
            <h1 className="text-headline-sm font-semibold text-foreground">
              Set your password
            </h1>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Choose a new password before continuing.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-1">
            <label
              htmlFor="newPassword"
              className="block text-label-md font-medium text-foreground"
            >
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`block w-full rounded-lg border px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 ${
                errors.newPassword ? "border-destructive" : "border-border"
              }`}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="confirmPassword"
              className="block text-label-md font-medium text-foreground"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`block w-full rounded-lg border px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 ${
                errors.confirmPassword ? "border-destructive" : "border-border"
              }`}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? (
              "Saving…"
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                Set password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
