"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { forgotPasswordSchema } from "@/lib/validators/auth";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "", honeypot: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setLoading(true);
    setServerError(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setServerError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setSent(true);
    } catch {
      setServerError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Alert>
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription>
          If that email is registered, a reset link is on its way. The link
          expires in 1 hour. Didn&apos;t get it? Check spam or call the office.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {serverError ? (
        <Alert variant="destructive">
          <AlertTitle>Request failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="honeypot"
        render={({ field }) => (
          <FormItem className="hidden" aria-hidden>
            <FormLabel>Leave this field empty</FormLabel>
            <FormControl>
              <Input tabIndex={-1} autoComplete="off" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
    </Form>
  );
}
