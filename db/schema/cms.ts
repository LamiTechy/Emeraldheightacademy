import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./helpers";
import { eventStatusEnum } from "./enums";
import { users } from "./users";

export const news = pgTable(
  "news",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt"),
    body: text("body").notNull(),
    coverImageUrl: text("cover_image_url"),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    published: boolean("published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("news_published_idx").on(t.published, t.publishedAt)],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    coverImageUrl: text("cover_image_url"),
    location: text("location"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    status: eventStatusEnum("status").notNull().default("upcoming"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("events_starts_at_idx").on(t.startsAt)],
);

export const galleryItems = pgTable("gallery_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  caption: text("caption"),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull().default("general"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    program: text("program"),
    quote: text("quote").notNull(),
    photoUrl: text("photo_url"),
    rating: smallint("rating"),
    featured: boolean("featured").notNull().default(false),
    approved: boolean("approved").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("testimonials_approved_idx").on(t.approved, t.featured)],
);

export const faqs = pgTable(
  "faqs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    category: text("category").notNull().default("General"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("faqs_active_idx").on(t.active)],
);

export const newsRelations = relations(news, ({ one }) => ({
  author: one(users, {
    fields: [news.authorId],
    references: [users.id],
  }),
}));
