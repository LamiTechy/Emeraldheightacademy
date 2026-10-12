export const instant = false;

import { asc, desc } from "drizzle-orm";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/db";
import { events, faqs, galleryItems, news, testimonials } from "@/db/schema";
import { getSetting } from "@/lib/settings";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewsManager } from "@/components/admin/cms/news-manager";
import { EventsManager } from "@/components/admin/cms/events-manager";
import { GalleryManager } from "@/components/admin/cms/gallery-manager";
import { TestimonialsManager } from "@/components/admin/cms/testimonials-manager";
import { FaqsManager } from "@/components/admin/cms/faqs-manager";
import { FeesEditor } from "@/components/admin/cms/fees-editor";

type FeesInfo = { title: string; body: string; lastUpdated: string | null };

export default async function ContentPage() {
  await requireUser("admin");

  const [newsRows, eventRows, gallery, testimonialRows, faqRows, fees] = await Promise.all([
    db.select().from(news).orderBy(desc(news.createdAt)),
    db.select().from(events).orderBy(asc(events.startsAt)),
    db.select().from(galleryItems).orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt)),
    db.select().from(testimonials).orderBy(desc(testimonials.createdAt)),
    db.select().from(faqs).orderBy(asc(faqs.sortOrder), asc(faqs.createdAt)),
    getSetting<FeesInfo | null>("fees_info", null),
  ]);

  return (
    <>
      <PageHeader
        title="Site Content"
        description="Manage the public website — news, events, gallery, testimonials, FAQs and fee information."
      >
        <Badge variant="outline">Public site</Badge>
      </PageHeader>

      <Tabs defaultValue="news" className="space-y-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="fees">Fees page</TabsTrigger>
        </TabsList>

        <TabsContent value="news">
          <NewsManager
            items={newsRows.map((n) => ({
              id: n.id,
              title: n.title,
              slug: n.slug,
              excerpt: n.excerpt,
              body: n.body,
              coverImageUrl: n.coverImageUrl,
              published: n.published,
              publishedAt: n.publishedAt,
              createdAt: n.createdAt,
            }))}
          />
        </TabsContent>

        <TabsContent value="events">
          <EventsManager
            items={eventRows.map((e) => ({
              id: e.id,
              title: e.title,
              slug: e.slug,
              description: e.description,
              coverImageUrl: e.coverImageUrl,
              location: e.location,
              startsAt: e.startsAt,
              endsAt: e.endsAt,
              status: e.status,
            }))}
          />
        </TabsContent>

        <TabsContent value="gallery">
          <GalleryManager
            items={gallery.map((g) => ({
              id: g.id,
              title: g.title,
              caption: g.caption,
              imageUrl: g.imageUrl,
              category: g.category,
              sortOrder: g.sortOrder,
            }))}
          />
        </TabsContent>

        <TabsContent value="testimonials">
          <TestimonialsManager
            items={testimonialRows.map((t) => ({
              id: t.id,
              name: t.name,
              program: t.program,
              quote: t.quote,
              rating: t.rating,
              featured: t.featured,
              approved: t.approved,
              sortOrder: t.sortOrder,
            }))}
          />
        </TabsContent>

        <TabsContent value="faqs">
          <FaqsManager
            items={faqRows.map((f) => ({
              id: f.id,
              question: f.question,
              answer: f.answer,
              category: f.category,
              sortOrder: f.sortOrder,
              active: f.active,
            }))}
          />
        </TabsContent>

        <TabsContent value="fees">
          <FeesEditor
            initial={
              fees ?? {
                title: "Fees & How to Pay",
                body: "Fees are paid offline at the centre. Call or WhatsApp the office for the current fee schedule.",
                lastUpdated: null,
              }
            }
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
