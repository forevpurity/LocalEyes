import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { ApiRequestError } from "@/lib/api";
import { useDepartments } from "@/features/admin/departments/hooks/use-departments";
import { useCreateStaff } from "../hooks/use-create-staff";

interface CreateStaffModalProps {
  onClose: () => void;
}

export function CreateStaffModal({ onClose }: CreateStaffModalProps) {
  const { data: departments, isLoading: depsLoading } = useDepartments();
  const createStaff = useCreateStaff();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    displayName?: string;
    departmentId?: string;
  }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required";
    if (!password) next.password = "Password is required (min 8 characters)";
    else if (password.length < 8) next.password = "Password must be at least 8 characters";
    if (!displayName.trim()) next.displayName = "Display name is required";
    else if (displayName.trim().length < 2) next.displayName = "Display name must be at least 2 characters";
    if (!departmentId) next.departmentId = "Select a department";
    return next;
  };

  const handleSubmit = () => {
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    createStaff.mutate(
      {
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        departmentId,
      },
      {
        onSuccess: () => {
          toast.success("Staff member created — they must change their password on first login.");
          onClose();
        },
        onError: (err) => {
          const apiErr = err as ApiRequestError;
          if (apiErr.status === 409) {
            setErrors({ email: apiErr.message });
            return;
          }
          if (apiErr.status === 404) {
            setErrors({ departmentId: "Department not found" });
            return;
          }
          toast.error(apiErr.message || "Couldn't create staff member.");
        },
      },
    );
  };

  return (
    <Modal title="Add staff member" onClose={onClose}>
      <div className="flex flex-col gap-3">
        {/* Display name */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Display name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setErrors((prev) => ({ ...prev, displayName: undefined }));
            }}
            placeholder="Jane Smith"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          {errors.displayName && (
            <p className="text-xs text-destructive">{errors.displayName}</p>
          )}
        </label>

        {/* Email */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="jane@example.com"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </label>

        {/* Password */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Temporary password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="Min. 8 characters"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </label>

        {/* Department */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Department</span>
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setErrors((prev) => ({ ...prev, departmentId: undefined }));
            }}
            disabled={depsLoading}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            <option value="">
              {depsLoading ? "Loading…" : "Select a department…"}
            </option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          {errors.departmentId && (
            <p className="text-xs text-destructive">{errors.departmentId}</p>
          )}
        </label>

        <div className="mt-1 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createStaff.isPending}
            className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
          >
            {createStaff.isPending ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
