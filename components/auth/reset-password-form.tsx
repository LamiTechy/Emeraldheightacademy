"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { resetPasswordSchema } from "@/lib/validators/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    setLoading(true);
    setServerError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setServerError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      router.push("/login?reset=1");
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
          <AlertTitle>Reset failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>New password</FormLabel>
            <FormControl>
              <Input type="password" autoComplete="new-password" {...field} />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              At least 8 characters with an uppercase letter, lowercase letter and number.
            </p>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Confirm new password</FormLabel>
            <FormControl>
              <Input type="password" autoComplete="new-password" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Updating…" : "Update password"}
      </Button>
    </Form>
  );
}
