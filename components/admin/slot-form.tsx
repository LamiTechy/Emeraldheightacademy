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
import { createSlotSchema, updateSlotSchema } from "@/lib/validators/admin";
import { DAY_NAMES, shortTime } from "@/lib/format";
import type { z } from "zod";
import type { FormOptions, SlotView } from "@/components/admin/types";

type CreateValues = z.infer<typeof createSlotSchema>;
type EditValues = z.infer<typeof updateSlotSchema>;
type FormValues = CreateValues & Partial<EditValues>;

export function SlotForm({
  mode,
  slot,
  options,
  onDone,
}: {
  mode: "create" | "edit";
  slot?: SlotView;
  options: FormOptions;
  onDone: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(
      mode === "create" ? createSlotSchema : updateSlotSchema,
    ) as Resolver<FormValues>,
    defaultValues:
      mode === "edit" && slot
        ? {
            batchId: slot.batchId,
            tutorId: slot.tutorRowId,
            dayOfWeek: slot.dayOfWeek,
            startTime: shortTime(slot.startTime),
            endTime: shortTime(slot.endTime),
            room: slot.room ?? "",
            validFrom: undefined,
            validTo: undefined,
          }
        : {
            batchId: "",
            tutorId: "",
            dayOfWeek: 1,
            startTime: "16:00",
            endTime: "18:00",
            room: "",
            validFrom: undefined,
            validTo: undefined,
          },
  });

  const batchOptions = options.batches
    .filter((b) => b.status !== "completed" && b.status !== "cancelled")
    .map((b) => ({
      value: b.id,
      label: `${b.name} (${b.code})`,
      hint: `${b.enrolled}/${b.capacity} enrolled`,
    }));

  const tutorOptions = options.tutors.map((t) => ({
    value: t.tutorRowId,
    label: t.name,
    hint: t.tutorId,
  }));

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await apiRequest("/api/admin/timetable", { method: "POST", body: values })
          : await apiRequest(`/api/admin/timetable/${slot!.id}`, {
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

      toast.success(mode === "create" ? "Session added" : "Session updated");
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
              options={batchOptions}
              value={field.value || null}
              onChange={(v) => field.onChange(v ?? "")}
              placeholder="Select batch…"
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tutorId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tutor</FormLabel>
            <SearchSelect
              options={tutorOptions}
              value={field.value || null}
              onChange={(v) => field.onChange(v ?? "")}
              placeholder="Select tutor…"
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="dayOfWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Day</FormLabel>
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DAY_NAMES.map((name, i) => (
                    <SelectItem key={name} value={String(i)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div />
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
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Add session" : "Save changes"}
        </Button>
      </div>
    </Form>
  );
}
