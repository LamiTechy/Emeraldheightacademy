"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/client-api";
import { createUserSchema, updateUserSchema } from "@/lib/validators/admin";
import type { z } from "zod";
import type { UserView } from "@/components/admin/types";
import { ShuffleIcon } from "lucide-react";

type CreateValues = z.infer<typeof createUserSchema>;
type EditValues = z.infer<typeof updateUserSchema>;
type FormValues = CreateValues & Partial<EditValues>;

function generatePassword(): string {
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#%+";
  let out = "";
  for (const b of bytes) out += chars[b % chars.length];
  // Guarantee strength components (upper, lower, digit, symbol).
  return `Aa1@${out.slice(0, 10)}`;
}

export function UserForm({
  mode,
  user,
  onDone,
}: {
  mode: "create" | "edit";
  user?: UserView;
  onDone: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(mode === "create" ? createUserSchema : updateUserSchema) as Resolver<FormValues>,
    defaultValues:
      mode === "edit" && user
        ? {
            name: user.name,
            email: user.email,
            phone: user.phone ?? "",
            status: user.status,
            mustChangePassword: user.mustChangePassword,
            educationLevel: (user.educationLevel as never) ?? undefined,
            gender: (user.gender as never) ?? undefined,
            school: user.school ?? "",
            guardianName: user.guardianName ?? "",
            guardianPhone: user.guardianPhone ?? "",
            bio: user.bio ?? "",
            qualifications: user.qualifications ?? "",
          }
        : {
            role: "student",
            name: "",
            email: "",
            phone: "",
            password: "",
            status: "active",
            educationLevel: undefined,
            gender: undefined,
            school: "",
            guardianName: "",
            guardianPhone: "",
            bio: "",
            qualifications: "",
          },
  });

  const roleWatch = useWatch({ control: form.control, name: "role" });
  const watchedRole = mode === "edit" ? user?.role : roleWatch;

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await apiRequest("/api/admin/users", { method: "POST", body: values })
          : await apiRequest(`/api/admin/users/${user!.id}`, {
              method: "PATCH",
              body: values,
            });

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            form.setError(key as never, { message: messages[0] });
          }
        }
        toast.error(result.error ?? "Something went wrong");
        return;
      }

      toast.success(mode === "create" ? "Account created" : "Account updated");
      onDone();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form form={form} onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
      {mode === "create" ? (
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Editing <span className="font-medium text-foreground">{user?.email}</span>
          {" — "}
          role: <span className="font-medium text-foreground">{user?.role}</span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Aisha Bello" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="+234…" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mode === "edit" ? (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temporary password</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Generate password"
                    onClick={() => field.onChange(generatePassword())}
                  >
                    <ShuffleIcon />
                  </Button>
                </div>
                <FormDescription>They must change it on first login.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {mode === "edit" ? (
        <FormField
          control={form.control}
          name="mustChangePassword"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Force password change on next login</FormLabel>
            </FormItem>
          )}
        />
      ) : null}

      {watchedRole === "student" ? (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">Student details (optional)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="educationLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education level</FormLabel>
                  <Select
                    value={field.value ?? "__none__"}
                    onValueChange={(v) => field.onChange(v === "__none__" ? undefined : v)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="junior_secondary">Junior secondary</SelectItem>
                      <SelectItem value="senior_secondary">Senior secondary</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                      <SelectItem value="adult">Adult</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    value={field.value ?? "__none__"}
                    onValueChange={(v) => field.onChange(v === "__none__" ? undefined : v)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guardianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardian name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guardianPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardian phone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ) : null}

      {watchedRole === "tutor" ? (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">Tutor details (optional)</p>
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="qualifications"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Qualifications</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. B.Sc Mathematics, 5 yrs JAMB prep" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create account" : "Save changes"}
        </Button>
      </div>
    </Form>
  );
}
