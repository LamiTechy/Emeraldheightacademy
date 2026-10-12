"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
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
import { loginSchema } from "@/lib/validators/auth";

type FieldErrors = Record<string, string[]>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", honeypot: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    setServerError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        fieldErrors?: FieldErrors;
        redirectTo?: string;
      };

      if (!response.ok || !data.ok) {
        if (data.fieldErrors) {
          for (const [field, messages] of Object.entries(data.fieldErrors)) {
            if (field === "_") continue;
            form.setError(field as keyof z.infer<typeof loginSchema>, {
              message: messages[0],
            });
          }
        }
        setServerError(data.error ?? "Something went wrong. Try again.");
        return;
      }

      const next = searchParams.get("next");
      const target =
        data.redirectTo ??
        (next && next.startsWith("/") && !next.startsWith("//") ? next : "/student");
      router.push(target);
      router.refresh();
    } catch {
      setServerError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {serverError ? (
        <Alert variant="destructive">
          <AlertTitle>Sign in failed</AlertTitle>
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
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input type="password" autoComplete="current-password" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Honeypot — hidden from real users */}
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
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <a href="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
          Forgot your password?
        </a>
      </div>
    </Form>
  );
}
