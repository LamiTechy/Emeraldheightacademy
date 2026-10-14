import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";
import { listPublicFaqs, listPublicTestimonials } from "@/lib/queries/public";
import {
  ArrowRightIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  QuoteIcon,
  StarIcon,
} from "lucide-react";

export const metadata = { title: "About" };

/** FAQ/testimonial content comes from the database — render on demand. */
export const instant = false;

export default async function AboutPage() {
  const [faqs, testimonials] = await Promise.all([listPublicFaqs(), listPublicTestimonials(8)]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-12 max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          About {siteConfig.name}
        </h1>
        <p className="text-lg text-muted-foreground">{siteConfig.tagline}</p>
        <p className="leading-relaxed text-muted-foreground">
          Founded in {2015}, {siteConfig.name} has helped hundreds of Abeokuta students prepare for
          JAMB, WAEC and NECO — and discover a love of learning along the way. We combine small
          batches, experienced tutors and a modern student portal so families always know where
          progress stands. From primary enrichment to exam mastery, every class is designed around
          real outcomes.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild>
            <Link href="/register">
              Register now <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </div>

      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="font-heading text-3xl font-bold text-primary">2015</p>
            <p className="text-sm text-muted-foreground">Serving Abeokuta families since</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="font-heading text-3xl font-bold text-primary">In person</p>
            <p className="text-sm text-muted-foreground">Morning, evening &amp; weekend batches in Abeokuta</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="font-heading text-3xl font-bold text-primary">All ages</p>
            <p className="text-sm text-muted-foreground">Primary to university & adult learners</p>
          </CardContent>
        </Card>
      </div>

      {testimonials.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-6 font-heading text-2xl font-bold tracking-tight">Testimonials</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.map((t) => (
              <Card key={t.id}>
                <CardContent className="space-y-3 pt-6">
                  <QuoteIcon className="size-5 text-primary/60" />
                  <p className="text-sm leading-relaxed">“{t.quote}”</p>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      {t.program ? <p className="text-xs text-muted-foreground">{t.program}</p> : null}
                    </div>
                    {t.rating ? (
                      <span className="flex items-center gap-0.5 text-amber-500">
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
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <section>
          <h2 className="mb-6 font-heading text-2xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <Card key={f.id}>
                <CardContent className="pt-6">
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold">{f.question}</summary>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{f.answer}</p>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12 rounded-xl border bg-muted/40 p-6">
        <h2 className="font-heading text-xl font-bold">Visit the centre</h2>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon className="size-4" /> {siteConfig.address}
          </span>
          <a
            href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <PhoneIcon className="size-4" /> {siteConfig.phone}
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <MailIcon className="size-4" /> {siteConfig.email}
          </a>
        </div>
      </section>
    </div>
  );
}
