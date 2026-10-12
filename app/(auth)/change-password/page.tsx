export const instant = false;

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requireUserAllowingPasswordChange, ROLE_HOME } from "@/lib/auth/session";

export const metadata = {
  title: "Change password",
};

export default async function ChangePasswordPage() {
  const user = await requireUserAllowingPasswordChange();

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-heading">
          {user.mustChangePassword ? "Set a new password" : "Change your password"}
        </CardTitle>
        <CardDescription>
          {user.mustChangePassword
            ? "Your account was created with a temporary password. Choose your own before continuing."
            : "Enter your current password, then choose a new one."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.mustChangePassword ? (
          <Alert>
            <AlertTitle>First-time sign in</AlertTitle>
            <AlertDescription>
              After updating, you&apos;ll continue straight to your dashboard.
            </AlertDescription>
          </Alert>
        ) : null}
        <ChangePasswordForm redirectTo={ROLE_HOME[user.role]} />
      </CardContent>
    </Card>
  );
}
