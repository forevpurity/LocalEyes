import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { api, apiUpload, ApiRequestError } from "@/lib/api";
import type { User } from "@/types/api";
import { useAuth } from "@/features/auth/auth-context";
import { Navbar } from "@/features/layout/components/navbar";
import { Avatar } from "@/components/avatar";
import { toast } from "sonner";

const displayNameSchema = z.object({
  displayName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be 50 characters or fewer"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type DisplayNameFormData = z.infer<typeof displayNameSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const isStaff = user?.role === "staff";

  const {
    register: regName,
    handleSubmit: handleNameSubmit,
    formState: { errors: nameErrors },
    setError: setNameError,
  } = useForm<DisplayNameFormData>({
    resolver: zodResolver(displayNameSchema),
    defaultValues: { displayName: user?.displayName ?? "" },
  });

  const {
    register: regPw,
    handleSubmit: handlePwSubmit,
    formState: { errors: pwErrors },
    setError: setPwError,
    reset: resetPw,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const updateNameMutation = useMutation({
    mutationFn: (data: DisplayNameFormData) =>
      api<User>("/auth/me", { method: "PATCH", json: data }),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Display name updated.");
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.details) {
        for (const [field, messages] of Object.entries(err.details)) {
          if (field in displayNameSchema.shape) {
            setNameError(field as keyof DisplayNameFormData, {
              message: messages[0],
            });
          }
        }
      }
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordFormData) =>
      api("/auth/password", {
        method: "PATCH",
        json: { currentPassword, newPassword },
      }),
    onSuccess: () => {
      toast.success("Password changed successfully.");
      resetPw();
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        if (err.details) {
          for (const [field, messages] of Object.entries(err.details)) {
            if (field === "newPassword") {
              setPwError("newPassword", { message: messages[0] });
            }
          }
        } else {
          setPwError("currentPassword", { message: err.message });
        }
      }
    },
  });

  return (
    <div className="min-h-screen bg-surface-container-low text-on-background">
      {!isStaff && <Navbar />}
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">
            Profile
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Manage your account details.
          </p>
        </div>

        {/* Avatar */}
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30">
            <h2 className="text-title-md font-title-md text-on-surface">
              Profile Picture
            </h2>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.avatarUrl}
                name={user?.displayName}
                size="lg"
                className="ring-1 ring-outline-variant/40"
              />
              <div className="space-y-2">
                <label className="inline-block cursor-pointer rounded-lg bg-primary px-4 py-2 text-label-md font-label-md text-on-primary hover:bg-primary/90 transition-colors">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const input = e.target;
                      const file = input.files?.[0];
                      // Reset so re-selecting the same file fires onChange again
                      input.value = "";
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("File must be under 2 MB");
                        return;
                      }
                      const formData = new FormData();
                      formData.append("avatar", file);
                      try {
                        const result = await apiUpload<{ avatarUrl: string }>(
                          "/auth/avatar",
                          formData,
                        );
                        setUser({ ...user!, avatarUrl: result.avatarUrl });
                        toast.success("Profile picture updated.");
                      } catch {
                        toast.error("Couldn't upload profile picture.");
                      }
                    }}
                  />
                </label>
                {user?.avatarUrl && (
                  <button
                    onClick={async () => {
                      try {
                        const result = await api<{ avatarUrl: null }>(
                          "/auth/avatar",
                          { method: "DELETE" },
                        );
                        setUser({ ...user!, avatarUrl: result.avatarUrl });
                        toast.success("Profile picture removed.");
                      } catch {
                        toast.error("Couldn't remove profile picture.");
                      }
                    }}
                    className="block text-label-md font-label-md text-error hover:text-error/80 transition-colors"
                  >
                    Remove
                  </button>
                )}
                <p className="text-body-sm text-on-surface-variant">
                  JPEG, PNG, or WebP. Max 2 MB.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Display Name */}
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30">
            <h2 className="text-title-md font-title-md text-on-surface">
              Display Name
            </h2>
          </div>
          <form
            onSubmit={handleNameSubmit((data) =>
              updateNameMutation.mutate(data),
            )}
            className="px-6 py-5 space-y-4"
          >
            {updateNameMutation.isError &&
              updateNameMutation.error instanceof ApiRequestError &&
              !updateNameMutation.error.details && (
                <div className="rounded-lg bg-error-container/50 border border-error/30 p-3 text-body-sm text-error">
                  {updateNameMutation.error.message}
                </div>
              )}
            <div className="space-y-1">
              <label
                className="block text-label-md font-label-md text-on-surface"
                htmlFor="displayName"
              >
                Name
              </label>
              <input
                id="displayName"
                type="text"
                className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md font-body-md transition-all outline-none ${nameErrors.displayName ? "border-error" : "border-outline-variant"}`}
                {...regName("displayName")}
              />
              {nameErrors.displayName && (
                <p className="text-body-sm text-error">
                  {nameErrors.displayName.message}
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateNameMutation.isPending}
                className="py-2 px-5 rounded-lg bg-primary text-on-primary text-label-md font-label-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateNameMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </section>

        {/* Change Password */}
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30">
            <h2 className="text-title-md font-title-md text-on-surface">
              Change Password
            </h2>
          </div>
          <form
            onSubmit={handlePwSubmit((data) =>
              changePasswordMutation.mutate(data),
            )}
            className="px-6 py-5 space-y-4"
          >
            <div className="space-y-1">
              <label
                className="block text-label-md font-label-md text-on-surface"
                htmlFor="currentPassword"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md font-body-md transition-all outline-none placeholder-on-surface-variant/50 ${pwErrors.currentPassword ? "border-error" : "border-outline-variant"}`}
                {...regPw("currentPassword")}
              />
              {pwErrors.currentPassword && (
                <p className="text-body-sm text-error">
                  {pwErrors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label
                className="block text-label-md font-label-md text-on-surface"
                htmlFor="newPassword"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md font-body-md transition-all outline-none placeholder-on-surface-variant/50 ${pwErrors.newPassword ? "border-error" : "border-outline-variant"}`}
                {...regPw("newPassword")}
              />
              {pwErrors.newPassword && (
                <p className="text-body-sm text-error">
                  {pwErrors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label
                className="block text-label-md font-label-md text-on-surface"
                htmlFor="confirmPassword"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright text-on-surface text-body-md font-body-md transition-all outline-none placeholder-on-surface-variant/50 ${pwErrors.confirmPassword ? "border-error" : "border-outline-variant"}`}
                {...regPw("confirmPassword")}
              />
              {pwErrors.confirmPassword && (
                <p className="text-body-sm text-error">
                  {pwErrors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="py-2 px-5 rounded-lg bg-primary text-on-primary text-label-md font-label-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changePasswordMutation.isPending
                  ? "Saving..."
                  : "Change Password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
