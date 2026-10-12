import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-heading">Reset your password</CardTitle>
        <CardDescription>
          Enter the email registered with the centre and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForgotPasswordForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
