"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
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
import { createCourseSchema, updateCourseSchema } from "@/lib/validators/admin";
import type { z } from "zod";
import type { CourseView } from "@/components/admin/types";

type CreateValues = z.infer<typeof createCourseSchema>;
type EditValues = z.infer<typeof updateCourseSchema>;
type FormValues = CreateValues & Partial<EditValues>;

export function CourseForm({
  mode,
  course,
  onDone,
}: {
  mode: "create" | "edit";
  course?: CourseView;
  onDone: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(
      mode === "create" ? createCourseSchema : updateCourseSchema,
    ) as Resolver<FormValues>,
    defaultValues:
      mode === "edit" && course
        ? {
            code: course.code,
            name: course.name,
            category: course.category as never,
            description: course.description,
            longDescription: course.longDescription ?? "",
            durationWeeks: course.durationWeeks ?? undefined,
            scheduleSummary: course.scheduleSummary ?? "",
            mode: course.mode as never,
            status: course.status as never,
            featured: course.featured,
            sortOrder: course.sortOrder,
          }
        : {
            code: "",
            name: "",
            category: "exam_prep",
            description: "",
            longDescription: "",
            durationWeeks: undefined,
            scheduleSummary: "",
            mode: "hybrid",
            status: "active",
            featured: false,
            sortOrder: 0,
          },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await apiRequest("/api/admin/courses", { method: "POST", body: values })
          : await apiRequest(`/api/admin/courses/${course!.id}`, {
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

      toast.success(mode === "create" ? "Course created" : "Course updated");
      onDone();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form form={form} onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g. JAMB-MATH" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. JAMB Mathematics Intensive" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="exam_prep">Exam prep</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="languages">Languages</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mode</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Short description</FormLabel>
            <FormControl>
              <Textarea rows={2} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="longDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Long description</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="durationWeeks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (weeks)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value || 0))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="scheduleSummary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Schedule summary</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Mon/Wed/Fri evenings" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
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
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-8">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Featured on the website</FormLabel>
            </FormItem>
          )}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        The public URL slug is generated from the name when the course is created.
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create course" : "Save changes"}
        </Button>
      </div>
    </Form>
  );
}
