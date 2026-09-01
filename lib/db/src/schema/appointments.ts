import { pgTable, serial, integer, text, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  title: text("title").notNull(),
  appointmentType: text("appointment_type").notNull().default("checkup"),
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: text("appointment_time"),
  doctorName: text("doctor_name"),
  location: text("location"),
  notes: text("notes"),
  doctorRemarks: text("doctor_remarks"),
  patientQuestions: text("patient_questions"),
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
  status: text("status").notNull().default("upcoming"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
