import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AuthHeader } from "./components/auth-header";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotMutation = useMutation({
    mutationFn: (data: ForgotPasswordFormData) =>
      api<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        json: data,
      }),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotMutation.mutate(data);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <AuthHeader />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

          <div className="text-center mb-10">
            <h1 className="text-headline-lg font-headline-lg text-on-surface mb-1">
              Forgot Password
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {submitted ? (
            <div className="text-center space-y-6">
              <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-body-md text-success">
                If an account with that email exists, a reset link has been
                sent. Check your inbox.
              </div>
              <Link
                to="/login"
                className="inline-block text-label-md font-label-md text-primary hover:underline"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              <div className="space-y-1">
                <label
                  className="block text-label-md font-label-md text-on-surface"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">
                      mail
                    </span>
                  </div>
                  <input
                    className={`block w-full pl-16 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md font-body-md transition-all outline-none placeholder-on-surface-variant/50 ${errors.email ? "border-error" : "border-outline-variant"}`}
                    id="email"
                    type="email"
                    placeholder="citizen@hcmc.gov.vn"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-body-sm text-error mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="pt-3">
                <button
                  className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-label-md font-label-md text-on-primary bg-primary hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-12 active:scale-[0.98] gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={forgotMutation.isPending}
                >
                  {forgotMutation.isPending ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          )}

          {!submitted && (
            <div className="mt-10 pt-6 border-t border-outline-variant/50 text-center">
              <Link
                className="text-label-md font-label-md text-primary hover:underline"
                to="/login"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
