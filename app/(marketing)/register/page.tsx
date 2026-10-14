import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistrationForm } from "@/components/marketing/registration-form";
import { listPublicCourses } from "@/lib/queries/public";

export const metadata = { title: "Register" };

/** Course options come from the database — render on demand. */
export const instant = false;

export default async function RegisterPage() {
  const courses = await listPublicCourses();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Register for a course
        </h1>
        <p className="text-muted-foreground">
          Fill in the form below — the office will contact you to confirm your batch and seat.
          Fees are paid offline at the centre.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration form</CardTitle>
          <CardDescription>Fields marked required help us place you correctly.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm
            courses={courses.map((c) => ({
              id: c.id,
              name: c.name,
              code: c.code,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
