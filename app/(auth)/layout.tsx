import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.02_260),transparent_60%)]"
      />
      <Link href="/" className="relative z-10">
        <Logo />
      </Link>
      <div className="relative z-10 w-full max-w-md">{children}</div>
      <p className="relative z-10 text-center text-xs text-muted-foreground">
        Need help? Call the office or WhatsApp us — we reply during office hours.
      </p>
    </div>
  );
}
