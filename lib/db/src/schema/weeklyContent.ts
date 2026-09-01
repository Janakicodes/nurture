import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const weeklyContentTable = pgTable("weekly_content", {
  id: serial("id").primaryKey(),
  week: integer("week").notNull().unique(),
  trimester: integer("trimester").notNull(),
  title: text("title").notNull(),
  babySizeComparison: text("baby_size_comparison").notNull(),
  babyLength: text("baby_length"),
  babyWeight: text("baby_weight"),
  developmentSummary: text("development_summary").notNull(),
  motherChanges: text("mother_changes").notNull(),
  weeklyActions: text("weekly_actions").array().notNull().default([]),
  nutritionTips: text("nutrition_tips").array().notNull().default([]),
  warningSymptoms: text("warning_symptoms").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWeeklyContentSchema = createInsertSchema(weeklyContentTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWeeklyContent = z.infer<typeof insertWeeklyContentSchema>;
export type WeeklyContent = typeof weeklyContentTable.$inferSelect;
