"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { SearchSelect } from "@/components/forms/search-select";
import { apiRequest } from "@/lib/client-api";
import { createEnrollmentSchema } from "@/lib/validators/admin";
import type { z } from "zod";
import type { FormOptions } from "@/components/admin/types";

type FormValues = z.infer<typeof createEnrollmentSchema>;

export function EnrollForm({
  options,
  onDone,
}: {
  options: FormOptions;
  onDone: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createEnrollmentSchema) as Resolver<FormValues>,
    defaultValues: { studentUserId: "", batchId: "", notes: "" },
  });

  const studentOptions = options.students
    .filter((s) => s.status === "active")
    .map((s) => ({
      value: s.userId,
      label: s.name,
      hint: `${s.studentId} · ${s.email}`,
    }));

  const batchOptions = options.batches
    .filter((b) => b.status === "upcoming" || b.status === "active")
    .map((b) => ({
      value: b.id,
      label: `${b.name} (${b.code})`,
      hint: `${b.enrolled}/${b.capacity} enrolled · ${b.status}`,
      disabled: b.enrolled >= b.capacity,
    }));

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const result = await apiRequest("/api/admin/enrollments", {
        method: "POST",
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

      toast.success("Student enrolled");
      onDone();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form form={form} onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
      <FormField
        control={form.control}
        name="studentUserId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Student</FormLabel>
            <SearchSelect
              options={studentOptions}
              value={field.value || null}
              onChange={(v) => field.onChange(v ?? "")}
              placeholder="Search students…"
              searchPlaceholder="Search by name, ID or email…"
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="batchId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Batch</FormLabel>
            <SearchSelect
              options={batchOptions}
              value={field.value || null}
              onChange={(v) => field.onChange(v ?? "")}
              placeholder="Search batches…"
              searchPlaceholder="Search by batch name or code…"
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea rows={2} placeholder="Optional note about this enrollment" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Enroll student"}
        </Button>
      </div>
    </Form>
  );
}
