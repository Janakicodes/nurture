import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const benefitsTable = pgTable("benefits", {
  id: serial("id").primaryKey(),
  schemeName: text("scheme_name").notNull(),
  schemeCode: text("scheme_code").notNull().unique(),
  description: text("description").notNull(),
  benefitAmount: text("benefit_amount"),
  eligibilityCriteria: text("eligibility_criteria").array().notNull().default([]),
  requiredDocuments: text("required_documents").array().notNull().default([]),
  applicationSteps: text("application_steps").array().notNull().default([]),
  officialUrl: text("official_url"),
  isActive: boolean("is_active").notNull().default(true),
  targetGroup: text("target_group").notNull().default("all"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBenefitSchema = createInsertSchema(benefitsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBenefit = z.infer<typeof insertBenefitSchema>;
export type Benefit = typeof benefitsTable.$inferSelect;
