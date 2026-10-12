"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { SearchSelect } from "@/components/forms/search-select";
import { apiRequest } from "@/lib/client-api";
import type { AssignmentView, BatchOption } from "@/components/tutor/types";

const formSchema = z.object({
  batchId: z.string().min(1, "Select a batch"),
  title: z.string().trim().min(3, "Title is too short").max(120),
  instructions: z.string().trim().min(3, "Add the assignment instructions").max(5000),
  dueAt: z.string().min(1, "Pick a due date"),
  points: z.coerce.number().int().min(1, "Minimum 1 point").max(1000),
  attachmentUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Enter a valid URL")
    .optional(),
  status: z.enum(["draft", "published"]),
});

type FormValues = z.infer<typeof formSchema>;

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultDueAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(18, 0, 0, 0);
  return toLocalDatetimeValue(d);
}

export function AssignmentForm({
  mode,
  assignment,
  batches,
  onDone,
}: {
  mode: "create" | "edit";
  assignment?: AssignmentView;
  batches: BatchOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues:
      mode === "edit" && assignment
        ? {
            batchId: assignment.batchId,
            title: assignment.title,
            instructions: assignment.instructions,
            dueAt: toLocalDatetimeValue(new Date(assignment.dueAt)),
            points: assignment.points,
            attachmentUrl: assignment.attachmentUrl ?? "",
            status: assignment.status === "closed" ? "published" : (assignment.status as "draft" | "published"),
          }
        : {
            batchId: batches[0]?.id ?? "",
            title: "",
            instructions: "",
            dueAt: defaultDueAt(),
            points: 100,
            attachmentUrl: "",
            status: "published",
          },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const body = {
        batchId: values.batchId,
        title: values.title,
        instructions: values.instructions,
        dueAt: new Date(values.dueAt).toISOString(),
        points: values.points,
        attachmentUrl: values.attachmentUrl?.trim() ? values.attachmentUrl.trim() : null,
        attachmentName: values.attachmentUrl?.trim() ? values.title : null,
        status: values.status,
      };
      const result =
        mode === "create"
          ? await apiRequest("/api/tutor/assignments", { method: "POST", body })
          : await apiRequest(`/api/tutor/assignments/${assignment!.id}`, {
              method: "PATCH",
              body,
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

      toast.success(mode === "create" ? "Assignment created" : "Assignment updated");
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
        name="batchId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Batch</FormLabel>
            <SearchSelect
              options={batches.map((b) => ({ value: b.id, label: b.label, hint: b.courseName }))}
              value={field.value || null}
              onChange={field.onChange}
              placeholder="Select a batch…"
              searchPlaceholder="Search batches…"
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Quadratic equations worksheet" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="instructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Instructions</FormLabel>
            <FormControl>
              <Textarea rows={5} placeholder="What should students do?" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="dueAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due at</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Points</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={1000} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="attachmentUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Attachment URL (optional)</FormLabel>
            <FormControl>
              <Input placeholder="https://…" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormDescription>Link to a PDF, sheet or shared folder.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

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
                <SelectItem value="published">Published (visible to students)</SelectItem>
                <SelectItem value="draft">Draft (only you can see it)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create assignment" : "Save changes"}
        </Button>
      </div>
    </Form>
  );
}
