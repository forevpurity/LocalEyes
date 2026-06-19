import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { api, ApiRequestError } from "@/lib/api";
import type { User } from "@/types/api";
import { useAuth } from "@/features/auth/use-auth";
import { AuthHeader } from "./components/auth-header";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetMutation = useMutation({
    mutationFn: (data: Pick<ResetPasswordFormData, "newPassword">) =>
      api<User>("/auth/reset-password", {
        method: "POST",
        json: { token, newPassword: data.newPassword },
      }),
    onSuccess: (data) => {
      setUser(data);
      navigate("/map", { replace: true });
      toast.success("Password reset. You are now logged in.");
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        toast.error(err.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    resetMutation.mutate({ newPassword: data.newPassword });
  };

  if (!token) {
    return (
      <div className="bg-background text-on-background min-h-screen flex flex-col">
        <AuthHeader />
        <main className="flex-grow flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-10 relative overflow-hidden text-center space-y-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-error" />
            <h1 className="text-headline-lg font-headline-lg text-on-surface">
              Missing Reset Token
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant">
              This page requires a valid reset token. Please use the link from
              your email.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block text-label-md font-label-md text-primary hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <AuthHeader />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

          <div className="text-center mb-10">
            <h1 className="text-headline-lg font-headline-lg text-on-surface mb-1">
              Reset Password
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Choose a new password for your account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <div className="space-y-1">
              <label
                className="block text-label-md font-label-md text-on-surface"
                htmlFor="newPassword"
              >
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">
                    lock
                  </span>
                </div>
                <input
                  className={`block w-full pl-16 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md font-body-md transition-all outline-none placeholder-on-surface-variant/50 ${errors.newPassword ? "border-error" : "border-outline-variant"}`}
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("newPassword")}
                />
              </div>
              {errors.newPassword && (
                <p className="text-body-sm text-error mt-1">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                className="block text-label-md font-label-md text-on-surface"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">
                    lock
                  </span>
                </div>
                <input
                  className={`block w-full pl-16 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md font-body-md transition-all outline-none placeholder-on-surface-variant/50 ${errors.confirmPassword ? "border-error" : "border-outline-variant"}`}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-body-sm text-error mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="pt-3">
              <button
                className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-label-md font-label-md text-on-primary bg-primary hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-12 active:scale-[0.98] gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
