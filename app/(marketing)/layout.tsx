import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarIcon,
  GraduationCapIcon,
  ImagesIcon,
  InfoIcon,
  MailIcon,
  MegaphoneIcon,
  PhoneIcon,
} from "lucide-react";

const year = new Date().getFullYear();

const navLinks = [
  { href: "/courses", label: "Courses", icon: BookOpenIcon },
  { href: "/news", label: "News", icon: MegaphoneIcon },
  { href: "/events", label: "Events", icon: CalendarIcon },
  { href: "/gallery", label: "Gallery", icon: ImagesIcon },
  { href: "/about", label: "About", icon: InfoIcon },
  { href: "/contact", label: "Contact", icon: MailIcon },
];

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>
                <PhoneIcon /> {siteConfig.phone}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/register">Register</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">
                Portal login <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo />
            <p className="text-sm text-muted-foreground">{siteConfig.description}</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Explore</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Get started</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/register" className="transition-colors hover:text-foreground">
                  Register for a course
                </Link>
              </li>
              <li>
                <Link href="/fees" className="transition-colors hover:text-foreground">
                  Fees & how to pay
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-foreground">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-foreground">
                  Student / Tutor portal
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Visit us</p>
            <address className="space-y-2 text-sm not-italic text-muted-foreground">
              <p>{siteConfig.address}</p>
              <p>
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-foreground"
                >
                  {siteConfig.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="transition-colors hover:text-foreground"
                >
                  {siteConfig.email}
                </a>
              </p>
            </address>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {year} {siteConfig.name}. All rights reserved.
            </span>
            <span className="inline-flex items-center gap-1">
              <GraduationCapIcon className="size-3.5 text-primary" /> {siteConfig.tagline}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
