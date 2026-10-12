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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchSelect } from "@/components/forms/search-select";
import { apiRequest } from "@/lib/client-api";
import type { TestView } from "@/components/tutor/test-types";
import type { CourseTreeNode } from "@/components/tutor/types";

const formSchema = z
  .object({
    courseId: z.string().min(1, "Select a course"),
    batchId: z.string().optional(),
    title: z.string().trim().min(3, "Title is too short").max(120),
    description: z.string().trim().max(2000).optional(),
    durationMinutes: z.coerce.number().int().min(1).max(480),
    attemptsAllowed: z.coerce.number().int().min(1).max(10),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    shuffleQuestions: z.boolean(),
    shuffleOptions: z.boolean(),
    showAnswersAfter: z.boolean(),
  })
  .refine((d) => !d.startsAt || !d.endsAt || d.startsAt < d.endsAt, {
    message: "End must be after start",
    path: ["endsAt"],
  });

type FormValues = z.infer<typeof formSchema>;

function toLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TestForm({
  mode,
  test,
  courses,
  onDone,
}: {
  mode: "create" | "edit";
  test?: TestView;
  courses: CourseTreeNode[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues:
      mode === "edit" && test
        ? {
            courseId: test.courseId,
            batchId: test.batchId ?? undefined,
            title: test.title,
            description: test.description ?? "",
            durationMinutes: test.durationMinutes,
            attemptsAllowed: test.attemptsAllowed,
            startsAt: toLocalValue(test.startsAt),
            endsAt: toLocalValue(test.endsAt),
            shuffleQuestions: true,
            shuffleOptions: true,
            showAnswersAfter: true,
          }
        : {
            courseId: courses[0]?.id ?? "",
            batchId: undefined,
            title: "",
            description: "",
            durationMinutes: 30,
            attemptsAllowed: 1,
            startsAt: "",
            endsAt: "",
            shuffleQuestions: true,
            shuffleOptions: true,
            showAnswersAfter: true,
          },
  });

  const watchedCourse = useWatch({ control: form.control, name: "courseId" });
  const course = courses.find((c) => c.id === watchedCourse) ?? null;

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const body = {
        courseId: values.courseId,
        batchId: values.batchId ? values.batchId : null,
        title: values.title,
        description: values.description?.trim() ? values.description.trim() : null,
        durationMinutes: values.durationMinutes,
        attemptsAllowed: values.attemptsAllowed,
        startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
        endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
        shuffleQuestions: values.shuffleQuestions,
        shuffleOptions: values.shuffleOptions,
        showAnswersAfter: values.showAnswersAfter,
      };
      const result =
        mode === "create"
          ? await apiRequest("/api/tutor/tests", { method: "POST", body })
          : await apiRequest(`/api/tutor/tests/${test!.id}`, { method: "PATCH", body });

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            form.setError(key as never, { message: messages[0] });
          }
        }
        toast.error(result.error ?? "Something went wrong");
        return;
      }

      toast.success(mode === "create" ? "Test created — add questions next" : "Test updated");
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
              placeholder="Open to all batches of the course"
              allowClear
              clearLabel="Open to whole course"
              disabled={batchOptions.length === 0}
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
              <Input placeholder="e.g. Week 4 quiz — Algebra" {...field} />
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
          name="durationMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={480} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="attemptsAllowed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attempts allowed</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={10} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startsAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opens (optional)</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endsAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Closes (optional)</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
        <FormField
          control={form.control}
          name="shuffleQuestions"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Shuffle question order per student</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shuffleOptions"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Shuffle MCQ options</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="showAnswersAfter"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Show answers after grading</FormLabel>
            </FormItem>
          )}
        />
        <p className="text-muted-foreground text-xs">Shuffling uses a stable per-attempt seed.</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create test" : "Save changes"}
        </Button>
      </div>
    </Form>
  );
}
