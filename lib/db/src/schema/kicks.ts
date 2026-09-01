import { pgTable, serial, integer, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const kickSessionsTable = pgTable("kick_sessions", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  kickCount: integer("kick_count").notNull().default(0),
  sessionDate: date("session_date").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  notes: text("notes"),
});

export const insertKickSessionSchema = createInsertSchema(kickSessionsTable).omit({ id: true });
export type InsertKickSession = z.infer<typeof insertKickSessionSchema>;
export type KickSession = typeof kickSessionsTable.$inferSelect;
