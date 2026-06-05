import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { api, ApiRequestError } from "@/lib/api";
import type { User } from "@/types/api";
import { useAuth } from "@/features/auth/auth-context";
import { AuthHeader } from "./components/auth-header";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { setUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      api<User>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      setUser(data);
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        if (err.details) {
          for (const [field, messages] of Object.entries(err.details)) {
            const formField = field as keyof LoginFormData;
            if (formField in loginSchema.shape) {
              setError(formField, { message: messages[0] });
            }
          }
        }
      }
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <AuthHeader />

      {/* Main Content */}
      <main className="flex-grow flex flex-col md:flex-row mt-16">
        {/* Left Side Background Pattern */}
        <div className="hidden md:flex flex-1 bg-surface-container-low relative items-center justify-center overflow-hidden border-r border-outline-variant/20">
          <svg
            className="absolute inset-0 w-full h-full text-primary/10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="arch-pattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 40V0h40v40H0zm20-20L0 0m20 20l20-20M0 40l20-20m20 20L20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect fill="url(#arch-pattern)" width="100%" height="100%" />
            <circle
              cx="0"
              cy="100%"
              fill="currentColor"
              filter="blur(80px)"
              opacity="0.3"
              r="300"
            />
            <circle
              cx="100%"
              cy="0"
              fill="currentColor"
              filter="blur(80px)"
              opacity="0.2"
              r="200"
            />
          </svg>
          <div className="relative z-10 p-16 max-w-lg text-center">
            <span className="material-symbols-outlined text-primary mb-6 block" style={{ fontSize: "80px" }}>
              assured_workload
            </span>
            <h2 className="text-headline-lg font-headline-lg text-on-surface mb-3">
              Civic Digital Portal
            </h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant">
              Engage with your city services through a transparent and efficient
              digital platform.
            </p>
          </div>
        </div>

        {/* Right Side Login Form */}
        <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center px-4 py-16 bg-surface-bright relative">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] z-10 p-10 relative overflow-hidden">
            {/* Subtle accent top bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

            <div className="text-center mb-10">
              <h1 className="text-headline-lg font-headline-lg text-on-surface mb-1">
                Welcome Back
              </h1>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Log in to manage your civic reports.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {/* Server-level error banner */}
              {loginMutation.isError &&
                loginMutation.error instanceof ApiRequestError &&
                !loginMutation.error.details && (
                  <div className="rounded-lg bg-error-container/50 border border-error/30 p-3 text-body-sm text-error">
                    {loginMutation.error.message}
                  </div>
                )}

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

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label
                    className="block text-label-md font-label-md text-on-surface"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link
                    className="text-label-sm font-label-sm text-primary hover:text-on-primary-fixed-variant transition-colors"
                    to="#"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">
                      lock
                    </span>
                  </div>
                  <input
                    className={`block w-full pl-16 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md font-body-md transition-all outline-none placeholder-on-surface-variant/50 ${errors.password ? "border-error" : "border-outline-variant"}`}
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-body-sm text-error mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="pt-3">
                <button
                  className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-label-md font-label-md text-on-primary bg-primary hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-12 active:scale-[0.98] gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging In..." : "Log In"}
                </button>
              </div>
            </form>

            <div className="mt-10 pt-6 border-t border-outline-variant/50 text-center">
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                New citizen?{" "}
                <Link
                  className="font-label-md text-primary hover:underline hover:text-on-primary-fixed-variant transition-colors"
                  to="/register"
                >
                  Sign up here
                </Link>
                .
              </p>
              <p className="text-label-sm font-label-sm text-outline mt-3">
                Staff members can also log in using this portal.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
