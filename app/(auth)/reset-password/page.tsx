export const instant = false;

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Choose a new password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card className="border-border/60 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-heading">Invalid link</CardTitle>
          <CardDescription>
            This reset link is missing its token. Request a new one from the login page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/forgot-password"
            className="text-sm underline underline-offset-4 hover:text-foreground"
          >
            Request a new reset link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-heading">Choose a new password</CardTitle>
        <CardDescription>Pick something strong — you&apos;ll use it from now on</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResetPasswordForm token={token} />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
