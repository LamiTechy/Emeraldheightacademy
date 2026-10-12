import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, events, faqs, galleryItems, news, testimonials } from "@/db/schema";

type Course = typeof courses.$inferSelect;
type News = typeof news.$inferSelect;
type Event = typeof events.$inferSelect;
type GalleryItem = typeof galleryItems.$inferSelect;
type Testimonial = typeof testimonials.$inferSelect;
type Faq = typeof faqs.$inferSelect;

/**
 * Public-site queries never throw — a missing/unreachable database must not
 * 500 the marketing pages. Callers get an empty list / null and render their
 * empty-state UI instead.
 */

async function safe<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn("[public-queries] database unavailable, serving fallback:", error);
    return fallback;
  }
}

/** Active courses for the public catalogue. */
export function listPublicCourses(): Promise<Course[]> {
  return safe<Course[]>([], () =>
    db
      .select()
      .from(courses)
      .where(eq(courses.status, "active"))
      .orderBy(sql`${courses.name} asc`),
  );
}

/** Published news, newest first. */
export function listPublicNews(limit = 12): Promise<News[]> {
  return safe<News[]>([], () =>
    db
      .select()
      .from(news)
      .where(and(eq(news.published, true), sql`${news.publishedAt} <= now()`))
      .orderBy(desc(news.publishedAt))
      .limit(limit),
  );
}

/** One news article by slug. */
export function getPublicNewsBySlug(slug: string): Promise<(News & { author: { name: string } | null }) | undefined> {
  return safe<(News & { author: { name: string } | null }) | undefined>(undefined, () =>
    db.query.news.findFirst({
      where: and(eq(news.slug, slug), eq(news.published, true)),
      with: { author: { columns: { name: true } } },
    }),
  );
}

/** Upcoming / ongoing events. */
export function listPublicEvents(limit = 8): Promise<Event[]> {
  return safe<Event[]>([], () =>
    db
      .select()
      .from(events)
      .where(sql`${events.startsAt} >= now() - interval '1 day'`)
      .orderBy(events.startsAt)
      .limit(limit),
  );
}

/** Gallery items ordered for display. */
export function listPublicGallery(limit = 24): Promise<GalleryItem[]> {
  return safe<GalleryItem[]>([], () =>
    db
      .select()
      .from(galleryItems)
      .orderBy(galleryItems.sortOrder, desc(galleryItems.createdAt))
      .limit(limit),
  );
}

/** Approved testimonials, featured first. */
export function listPublicTestimonials(limit = 12): Promise<Testimonial[]> {
  return safe<Testimonial[]>([], () =>
    db
      .select()
      .from(testimonials)
      .where(eq(testimonials.approved, true))
      .orderBy(desc(testimonials.featured), testimonials.sortOrder, desc(testimonials.createdAt))
      .limit(limit),
  );
}

/** Active FAQs ordered by sort. */
export function listPublicFaqs(): Promise<Faq[]> {
  return safe<Faq[]>([], () =>
    db
      .select()
      .from(faqs)
      .where(eq(faqs.active, true))
      .orderBy(faqs.sortOrder, faqs.createdAt),
  );
}
