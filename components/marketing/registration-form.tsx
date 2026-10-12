"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/client-api";
import { publicRegistrationSchema, type PublicRegistrationInput } from "@/lib/validators/public";

type CourseOption = { id: string; name: string; code: string; mode: string };

export function RegistrationForm({ courses }: { courses: CourseOption[] }) {
  const router = useRouter();
  const form = useForm<PublicRegistrationInput>({
    resolver: zodResolver(publicRegistrationSchema) as Resolver<PublicRegistrationInput>,
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      courseIds: [],
      preferredSchedule: "",
      guardianName: "",
      guardianPhone: "",
      guardianRelationship: "",
      message: "",
    },
  });

  const selected = useWatch({ control: form.control, name: "courseIds" }) ?? [];

  function toggleCourse(id: string, checked: boolean) {
    const next = checked ? [...selected, id] : selected.filter((c) => c !== id);
    form.setValue("courseIds", next, { shouldValidate: true });
  }

  async function onSubmit(values: PublicRegistrationInput) {
    const result = await apiRequest("/api/public/register", { method: "POST", body: values });
    if (!result.ok) {
      toast.error(result.error ?? "Registration failed");
      return;
    }
    toast.success("Registration received! The office will contact you to confirm your seat.");
    form.reset();
    router.refresh();
  }

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input placeholder="+234…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (optional)</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preferredSchedule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred schedule</FormLabel>
              <FormControl>
                <Input placeholder="e.g. weekday evenings" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="courseIds"
        render={() => (
          <FormItem>
            <FormLabel>Courses of interest</FormLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {courses.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <Checkbox
                    checked={selected.includes(c.id)}
                    onCheckedChange={(v) => toggleCourse(c.id, v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {c.code} · {c.mode}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="guardianName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Guardian name (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="guardianRelationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship</FormLabel>
              <FormControl>
                <Input placeholder="e.g. parent" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="message"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Anything we should know? (optional)</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <p className="text-xs text-muted-foreground">
        Fees are paid offline at the centre — no online payment is taken on this site.
      </p>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Submitting…" : "Submit registration"}
      </Button>
    </Form>
  );
}
