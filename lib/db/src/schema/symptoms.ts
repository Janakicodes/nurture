import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const symptomLogsTable = pgTable("symptom_logs", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  symptomType: text("symptom_type").notNull(),
  severity: text("severity"),
  notes: text("notes"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSymptomLogSchema = createInsertSchema(symptomLogsTable).omit({ id: true, loggedAt: true });
export type InsertSymptomLog = z.infer<typeof insertSymptomLogSchema>;
export type SymptomLog = typeof symptomLogsTable.$inferSelect;
