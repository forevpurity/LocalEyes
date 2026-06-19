import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, ApiRequestError } from "@/lib/api";
import type { User } from "@/types/api";
import { useAuth } from "@/features/auth/use-auth";
import { AuthHeader } from "./components/auth-header";
import { toast } from "sonner";

// Separate base schema so we can reference .shape for backend error matching
const registerSchemaBase = z.object({
  displayName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
});

type RegisterFormData = z.infer<typeof registerSchemaBase>;

const registerSchema = registerSchemaBase.refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] },
);

export function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: (data: Omit<RegisterFormData, "confirmPassword">) =>
      api<User>("/auth/register", {
        method: "POST",
        json: data,
      }),
    onSuccess: (data) => {
      setUser(data);
      navigate("/map");
      toast.success("Account created!");
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        if (err.details) {
          for (const [field, messages] of Object.entries(err.details)) {
            const formField = field as keyof RegisterFormData;
            if (formField in registerSchemaBase.shape) {
              setError(formField, { message: messages[0] });
            }
          }
        }
      }
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate({
      displayName: data.displayName,
      email: data.email,
      password: data.password,
    });
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <AuthHeader />
      <main className="flex-grow flex flex-col md:flex-row mt-16">
        {/* Left Side Background Pattern */}
        <div className="hidden md:flex flex-1 bg-surface-container-low relative items-center justify-center overflow-hidden border-r border-outline-variant/20">
          <svg
            className="absolute inset-0 w-full h-full text-primary/10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                height="40"
                id="arch-pattern"
                patternUnits="userSpaceOnUse"
                width="40"
              >
                <path
                  d="M0 40V0h40v40H0zm20-20L0 0m20 20l20-20M0 40l20-20m20 20L20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                ></path>
              </pattern>
            </defs>
            <rect fill="url(#arch-pattern)" height="100%" width="100%"></rect>
            <circle
              cx="0"
              cy="100%"
              fill="currentColor"
              filter="blur(80px)"
              opacity="0.3"
              r="300"
            ></circle>
            <circle
              cx="100%"
              cy="0"
              fill="currentColor"
              filter="blur(80px)"
              opacity="0.2"
              r="200"
            ></circle>
          </svg>
          <div className="relative z-10 p-16 max-w-lg text-center">
            <span
              className="material-symbols-outlined text-primary mb-6 block"
              style={{ fontSize: "80px" }}
            >
              assured_workload
            </span>
            <h2 className="text-headline-lg text-on-surface mb-3">
              Civic Digital Portal
            </h2>
            <p className="text-body-lg text-on-surface-variant">
              Engage with your city services through a transparent and efficient
              digital platform.
            </p>
          </div>
        </div>

        {/* Right Side Register Form */}
        <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center px-4 py-16 bg-surface-bright relative">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] z-10 p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>

            <div className="text-center mb-10">
              <h1 className="text-headline-lg text-on-surface mb-2 hidden md:block">
                LocalEyes
              </h1>
              <h1 className="text-headline-lg-mobile text-on-surface mb-2 md:hidden">
                LocalEyes
              </h1>
              <p className="text-body-md text-on-surface-variant">
                Join your community. Report issues. Make an impact.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              {/* Server-level error banner */}
              {registerMutation.isError &&
                registerMutation.error instanceof ApiRequestError &&
                !registerMutation.error.details && (
                  <div className="rounded-lg bg-error-container/50 border border-error/30 p-3 text-body-sm text-error">
                    {registerMutation.error.message}
                  </div>
                )}

              {/* Display Name */}
              <div className="space-y-1">
                <label
                  className="block text-label-md text-on-surface"
                  htmlFor="displayName"
                >
                  Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">
                      person
                    </span>
                  </div>
                  <input
                    className={`block w-full pl-16 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md transition-all outline-none placeholder-on-surface-variant/50 ${errors.displayName ? "border-error" : "border-outline-variant"}`}
                    id="displayName"
                    placeholder="Your display name"
                    {...register("displayName")}
                  />
                </div>
                {errors.displayName && (
                  <p className="text-body-sm text-error mt-1">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label
                  className="block text-label-md text-on-surface"
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
                    className={`block w-full pl-16 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md transition-all outline-none placeholder-on-surface-variant/50 ${errors.email ? "border-error" : "border-outline-variant"}`}
                    id="email"
                    type="email"
                    placeholder="jane@example.com"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-body-sm text-error mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label
                  className="block text-label-md text-on-surface"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">
                      lock
                    </span>
                  </div>
                  <input
                    className={`block w-full pl-16 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md transition-all outline-none placeholder-on-surface-variant/50 ${errors.password ? "border-error" : "border-outline-variant"}`}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-primary transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p className="text-body-sm text-error mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label
                  className="block text-label-md text-on-surface"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">
                      lock_reset
                    </span>
                  </div>
                  <input
                    className={`block w-full pl-16 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md transition-all outline-none placeholder-on-surface-variant/50 ${errors.confirmPassword ? "border-error" : "border-outline-variant"}`}
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-primary transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-body-sm text-error mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-label-md text-on-primary bg-primary hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-12 active:scale-[0.98] gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerMutation.isPending
                    ? "Creating Account..."
                    : "Create Account"}
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-2 pt-2 border-t border-outline-variant/50 text-center space-y-3">
              <p className="text-body-sm text-on-surface">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-label-md text-primary hover:underline hover:text-on-primary-fixed-variant transition-colors ml-1"
                >
                  Log In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
