export const instant = false;

import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { getSession, ROLE_HOME } from "@/lib/auth/session";

export const metadata = {
  title: "Portal login",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(ROLE_HOME[session.role]);
  }

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-heading">Welcome back</CardTitle>
        <CardDescription>
          Sign in with the email the office registered for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
