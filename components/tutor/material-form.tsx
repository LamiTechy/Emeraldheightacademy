"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
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
import type { CourseTreeNode, MaterialView } from "@/components/tutor/types";

const formSchema = z.object({
  courseId: z.string().min(1, "Select a course"),
  batchId: z.string().optional(),
  title: z.string().trim().min(3, "Title is too short").max(120),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(["note", "past_question", "video", "link", "other"]),
  url: z.string().trim().refine((v) => /^https?:\/\//.test(v), "Enter a valid URL"),
  fileName: z.string().trim().max(255).optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function MaterialForm({
  mode,
  material,
  courses,
  onDone,
}: {
  mode: "create" | "edit";
  material?: MaterialView;
  courses: CourseTreeNode[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues:
      mode === "edit" && material
        ? {
            courseId: material.courseId,
            batchId: material.batchId ?? undefined,
            title: material.title,
            description: material.description ?? "",
            type: material.type as FormValues["type"],
            url: material.url,
            fileName: material.fileName ?? "",
            tags: material.tags.join(", "),
          }
        : {
            courseId: courses[0]?.id ?? "",
            batchId: undefined,
            title: "",
            description: "",
            type: "note",
            url: "",
            fileName: "",
            tags: "",
          },
  });

  const watchedCourse = useWatch({ control: form.control, name: "courseId" });
  const course = courses.find((c) => c.id === watchedCourse) ?? null;

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const tags = (values.tags ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);
      const body = {
        courseId: values.courseId,
        batchId: values.batchId ? values.batchId : null,
        title: values.title,
        description: values.description?.trim() ? values.description.trim() : null,
        type: values.type,
        url: values.url,
        fileName: values.fileName?.trim() ? values.fileName.trim() : null,
        tags,
      };
      const result =
        mode === "create"
          ? await apiRequest("/api/tutor/materials", { method: "POST", body })
          : await apiRequest(`/api/tutor/materials/${material!.id}`, { method: "PATCH", body });

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            form.setError(key as never, { message: messages[0] });
          }
        }
        toast.error(result.error ?? "Something went wrong");
        return;
      }

      toast.success(mode === "create" ? "Material shared" : "Material updated");
      onDone();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const batchOptions = (course?.batches ?? []).map((b) => ({
    value: b.id,
    label: `${b.code} — ${b.name}`,
  }));

  return (
    <Form form={form} onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
      <FormField
        control={form.control}
        name="courseId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Course</FormLabel>
            <SearchSelect
              options={courses.map((c) => ({ value: c.id, label: c.name }))}
              value={field.value || null}
              onChange={(v) => {
                field.onChange(v ?? "");
                form.setValue("batchId", undefined);
              }}
              placeholder="Select a course…"
              searchPlaceholder="Search courses…"
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
            <FormLabel>Batch (optional)</FormLabel>
            <SearchSelect
              options={batchOptions}
              value={field.value || null}
              onChange={(v) => field.onChange(v ?? undefined)}
              placeholder="Whole course (all batches)"
              searchPlaceholder="Search batches…"
              allowClear
              clearLabel="Whole course"
              disabled={batchOptions.length === 0}
            />
            <FormDescription>Limit this material to a single batch.</FormDescription>
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
              <Input placeholder="e.g. Algebra cheat-sheet" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (optional)</FormLabel>
            <FormControl>
              <Textarea rows={2} {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="past_question">Past question</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fileName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File name (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. algebra-sheet.pdf" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL</FormLabel>
            <FormControl>
              <Input placeholder="https://…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags (optional)</FormLabel>
            <FormControl>
              <Input placeholder="algebra, week-3, revision" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormDescription>Comma-separated.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Share material" : "Save changes"}
        </Button>
      </div>
    </Form>
  );
}
