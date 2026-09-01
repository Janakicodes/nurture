import { Router, type IRouter } from "express";
import { count, desc, gte, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { analyticsEventsTable } from "@workspace/db";
import { GetAdminAnalyticsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/analytics", async (_req, res): Promise<void> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalResult] = await db
    .select({ count: count() })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.occurredAt, thirtyDaysAgo));

  const groupedEvents = await db
    .select({
      eventType: analyticsEventsTable.eventType,
      count: count(),
    })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.occurredAt, thirtyDaysAgo))
    .groupBy(analyticsEventsTable.eventType)
    .orderBy(desc(count()));

  const eventDate = sql<string>`DATE(${analyticsEventsTable.occurredAt})`;
  const groupedDays = await db
    .select({
      date: eventDate,
      count: count(),
    })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.occurredAt, thirtyDaysAgo))
    .groupBy(eventDate)
    .orderBy(desc(eventDate));

  const distinctDays = await db
    .select({ date: eventDate })
    .from(analyticsEventsTable)
    .where(gte(analyticsEventsTable.occurredAt, thirtyDaysAgo))
    .groupBy(eventDate);

  res.json(
    GetAdminAnalyticsResponse.parse({
      totalEvents: Number(totalResult?.count ?? 0),
      activeDays: distinctDays.length,
      eventCounts: groupedEvents.map((event) => ({
        eventType: event.eventType,
        count: Number(event.count),
      })),
      dailyCounts: groupedDays.map((day) => ({
        date: day.date,
        count: Number(day.count),
      })),
    }),
  );
});

export default router;