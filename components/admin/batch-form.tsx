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
import { SearchSelect } from "@/components/forms/search-select";
import { apiRequest } from "@/lib/client-api";
import { createBatchSchema, updateBatchSchema } from "@/lib/validators/admin";
import { DAY_SHORT } from "@/lib/format";
import type { z } from "zod";
import type { BatchView, FormOptions } from "@/components/admin/types";

type CreateValues = z.infer<typeof createBatchSchema>;
type EditValues = z.infer<typeof updateBatchSchema>;
type FormValues = CreateValues & Partial<EditValues>;

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function BatchForm({
  mode,
  batch,
  options,
  onDone,
}: {
  mode: "create" | "edit";
  batch?: BatchView;
  options: FormOptions;
  onDone: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(
      mode === "create" ? createBatchSchema : updateBatchSchema,
    ) as Resolver<FormValues>,
    defaultValues:
      mode === "edit" && batch
        ? {
            courseId: batch.courseId,
            name: batch.name,
            code: batch.code,
            daysOfWeek: batch.daysOfWeek,
            startTime: batch.startTime.slice(0, 5),
            endTime: batch.endTime.slice(0, 5),
            mode: batch.mode as never,
            room: batch.room ?? "",
            meetingUrl: batch.meetingUrl ?? "",
            capacity: batch.capacity,
            startDate: batch.startDate,
            endDate: batch.endDate,
            status: batch.status as never,
            tutorIds: batch.tutors.map((t) => t.tutorRowId),
          }
        : {
            courseId: "",
            name: "",
            code: "",
            daysOfWeek: [1],
            startTime: "16:00",
            endTime: "18:00",
            mode: "physical",
            room: "",
            meetingUrl: "",
            capacity: 25,
            startDate: "",
            endDate: "",
            status: "upcoming",
            tutorIds: [],
          },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await apiRequest("/api/admin/batches", { method: "POST", body: values })
          : await apiRequest(`/api/admin/batches/${batch!.id}`, {
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

      toast.success(mode === "create" ? "Batch created" : "Batch updated");
      onDone();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const courseOptions = options.courses.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.code})`,
    hint: c.status !== "active" ? c.status : undefined,
    disabled: mode === "edit" ? false : c.status !== "active",
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
              options={courseOptions}
              value={field.value || null}
              onChange={(v) => field.onChange(v ?? "")}
              placeholder="Select a course…"
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. JAMB Morning Batch" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g. JAMB-MOR" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="daysOfWeek"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Days of week</FormLabel>
            <div className="flex flex-wrap gap-2">
              {DAY_ORDER.map((day) => {
                const checked = (field.value ?? []).includes(day);
                return (
                  <label
                    key={day}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors ${
                      checked
                        ? "border-primary bg-primary/10 text-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = v === true
                          ? [...(field.value ?? []), day]
                          : (field.value ?? []).filter((d) => d !== day);
                        field.onChange(next);
                      }}
                    />
                    {DAY_SHORT[day]}
                  </label>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
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
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value || 1))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="room"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Hall A" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="meetingUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meeting URL</FormLabel>
              <FormControl>
                <Input placeholder="https://…" {...field} value={field.value ?? ""} />
              </FormControl>
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
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="tutorIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assigned tutors</FormLabel>
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">
              {options.tutors.length === 0 ? (
                <p className="px-1 py-2 text-sm text-muted-foreground">No tutors yet.</p>
              ) : (
                options.tutors.map((t) => {
                  const checked = (field.value ?? []).includes(t.tutorRowId);
                  return (
                    <label
                      key={t.tutorRowId}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const next =
                            v === true
                              ? [...(field.value ?? []), t.tutorRowId]
                              : (field.value ?? []).filter((id) => id !== t.tutorRowId);
                          field.onChange(next);
                        }}
                      />
                      <span>{t.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{t.tutorId}</span>
                    </label>
                  );
                })
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create batch" : "Save changes"}
        </Button>
      </div>
    </Form>
  );
}
