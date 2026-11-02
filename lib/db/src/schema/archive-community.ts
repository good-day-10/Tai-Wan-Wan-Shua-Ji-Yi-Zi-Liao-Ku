import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const archiveReactionsTable = pgTable(
  "archive_reactions",
  {
    memoryId: text("memory_id").notNull(),
    visitorId: text("visitor_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.memoryId, table.visitorId] })],
);

export const archiveSubmissionsTable = pgTable("archive_submissions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  era: text("era").notNull(),
  story: text("story").notNull(),
    name: text("name"),
    gender: text("gender"),
  imagePath: text("image_path"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ArchiveSubmission = typeof archiveSubmissionsTable.$inferSelect;
