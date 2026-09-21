import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const archiveTable = pgTable("archive", {
  id: text("id").primaryKey(),
  introduction: text("introduction").notNull(),
  memories: jsonb("memories").notNull(),
  siteContent: jsonb("site_content"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type InsertArchive = typeof archiveTable.$inferInsert;
export type Archive = typeof archiveTable.$inferSelect;