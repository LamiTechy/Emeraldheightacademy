import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site";
import { listPublicCourses, listPublicTestimonials } from "@/lib/queries/public";
import { getSetting } from "@/lib/settings";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  MonitorSmartphoneIcon,
  QuoteIcon,
  SparklesIcon,
  StarIcon,
  TargetIcon,
  UsersIcon,
} from "lucide-react";

/** CMS content comes from the database — render on demand. */
export const instant = false;

const features = [
  {
    icon: TargetIcon,
    title: "Exam-focused prep",
    description:
      "Structured JAMB, WAEC and NECO tracks with past questions, timed mocks and detailed feedback.",
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
  },
  {
    icon: BookOpenIcon,
    title: "All ages & levels",
    description:
      "Primary enrichment, secondary exam prep, university-level support and adult learners welcome.",
    color: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    icon: MonitorSmartphoneIcon,
    title: "Physical & online",
    description:
      "Attend at Ikeja, join live online, or a hybrid of both — your schedule, your choice.",
    color: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  },
  {
    icon: CalendarCheckIcon,
    title: "Personal attention",
    description:
      "Small batches, tracked attendance and a portal where progress is visible to you.",
    color: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    icon: UsersIcon,
    title: "Proven centre",
    description:
      "Serving Lagos students since 2015 with consistent results and repeat families.",
    color: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  },
  {
    icon: SparklesIcon,
    title: "Modern facilities",
    description:
      "Comfortable classrooms, up-to-date materials and a supportive learning environment.",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
];

export default async function HomePage() {
  const [courses, testimonials, fees] = await Promise.all([
    listPublicCourses(),
    listPublicTestimonials(6),
    getSetting<{ title: string; body: string } | null>("fees_info", null),
  ]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background">
        {/* Hero photo (Unsplash, bundled locally: photo-1522202176988-66273c2fd55f) */}
        <div
          className="absolute inset-0 bg-cover bg-right bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero.jpg')" }}
          aria-hidden
        />
        {/* Scrim: solid behind the copy on the left, revealing the photo toward the right */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/85 md:via-background/90 md:to-background/25"
          aria-hidden
        />
        {/* Decorative accents */}
        <div
          aria-hidden
          className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-24 size-96 rounded-full bg-warn/10 blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:py-32 lg:py-44">
          <div className="max-w-3xl space-y-8">
            <Badge className="inline-flex items-center gap-1.5 border-primary/20 bg-card px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
              <span className="size-1.5 rounded-full bg-warn" />
              {siteConfig.city} · Physical · Online · Hybrid
            </Badge>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Where ambition meets
              <br />
              <span className="text-primary">exceptional teaching.</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
              JAMB/WAEC/NECO preparation and primary enrichment at{" "}
              <span className="font-semibold text-foreground">{siteConfig.name}</span> — with a
              live portal for students, tutors and the centre office.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-md">
                <Link href="/register">
                  Register now <ArrowRightIcon />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary/30 bg-card text-primary shadow-sm hover:bg-primary/5 hover:text-primary"
              >
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2Icon className="size-4 text-primary" /> Since 2015
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2Icon className="size-4 text-primary" /> Small batches
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2Icon className="size-4 text-primary" /> Progress tracked online
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
              Why us
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Why students choose us
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
              A focused centre with modern tools — built for results, not just hours in a
              classroom.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="card-hover rounded-2xl border-border shadow-sm"
              >
                <CardHeader className="pb-3">
                  <span
                    className={`flex size-12 items-center justify-center rounded-xl ${f.color}`}
                  >
                    <f.icon className="size-6" />
                  </span>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses ──────────────────────────────────────────────── */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
                Programs
              </p>
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Our courses
              </h2>
              <p className="mt-2 text-base text-muted-foreground">
                Exam prep and enrichment — pick what fits your goals.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/courses">
                View all <ArrowRightIcon />
              </Link>
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.length === 0 ? (
              <Card className="rounded-2xl border-border shadow-sm sm:col-span-2 lg:col-span-3">
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Course listings are being updated — call{" "}
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                    className="font-medium text-primary underline"
                  >
                    {siteConfig.phone}
                  </a>{" "}
                  for the current catalogue.
                </CardContent>
              </Card>
            ) : (
              courses.slice(0, 6).map((c) => (
                <Card
                  key={c.id}
                  className="card-hover flex flex-col rounded-2xl border-border shadow-sm"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className="bg-brand-soft text-primary border-none dark:bg-primary/20 dark:text-indigo-200">
                        {c.code}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {c.mode}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {c.category.replace("_", " ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {c.description}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      {testimonials.length > 0 ? (
        <section className="border-t border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
            <div className="mb-10 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
                Testimonials
              </p>
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                What families say
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.id} className="card-hover rounded-2xl border-border shadow-sm">
                  <CardContent className="space-y-4 pt-6">
                    <QuoteIcon className="size-6 text-primary/40" />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        {t.program ? (
                          <p className="text-xs text-muted-foreground">{t.program}</p>
                        ) : null}
                      </div>
                      {t.rating ? (
                        <span className="flex items-center gap-0.5 text-warn">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <StarIcon key={i} className="size-3.5 fill-current" />
                          ))}
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Fees CTA ─────────────────────────────────────────────── */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-md">
            <CardContent className="flex flex-wrap items-center justify-between gap-8 py-12">
              <div className="max-w-xl space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Admissions
                </p>
                <h2 className="font-heading text-3xl font-bold tracking-tight">
                  {fees?.title ?? "Fees & How to Pay"}
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  Fees are paid offline at the centre — no online payment required. Register
                  online, confirm your seat, then pay at the office or by bank transfer.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="shadow-md">
                  <Link href="/fees">
                    Fee guide <ArrowRightIcon />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                >
                  <Link href="/register">Start registration</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
