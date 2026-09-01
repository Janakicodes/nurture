import { Router, type IRouter } from "express";
import { eq, and, gte, desc, asc, count } from "drizzle-orm";
import { db } from "@workspace/db";
import { profilesTable, weeklyContentTable, symptomLogsTable, kickSessionsTable, appointmentsTable } from "@workspace/db";
import { GetDashboardSummaryResponse, GetRecentActivityResponse, GetRecentActivityQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function getProfileId(): Promise<number | null> {
  const [p] = await db.select({ id: profilesTable.id }).from(profilesTable).limit(1);
  return p?.id ?? null;
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [profile] = await db.select().from(profilesTable).limit(1);
  if (!profile || !profile.dueDate) {
    res.status(404).json({ error: "No profile found" });
    return;
  }

  const today = new Date();
  const dueDate = new Date(profile.dueDate);
  const daysUntilDue = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const [weekContent] = await db.select().from(weeklyContentTable)
    .where(eq(weeklyContentTable.week, profile.currentWeek));

  const todayStr = today.toISOString().split("T")[0];
  today.setHours(0, 0, 0, 0);

  const [todayKick] = await db.select().from(kickSessionsTable)
    .where(and(
      eq(kickSessionsTable.profileId, profile.id),
      eq(kickSessionsTable.sessionDate, todayStr),
    ));

  const [upcomingCount] = await db.select({ count: count() }).from(appointmentsTable)
    .where(and(
      eq(appointmentsTable.profileId, profile.id),
      eq(appointmentsTable.status, "upcoming"),
      gte(appointmentsTable.appointmentDate, todayStr),
    ));

  const [nextAppointment] = await db.select().from(appointmentsTable)
    .where(and(
      eq(appointmentsTable.profileId, profile.id),
      eq(appointmentsTable.status, "upcoming"),
      gte(appointmentsTable.appointmentDate, todayStr),
    ))
    .orderBy(asc(appointmentsTable.appointmentDate))
    .limit(1);

  const todaySymptoms = await db.select().from(symptomLogsTable)
    .where(and(
      eq(symptomLogsTable.profileId, profile.id),
      gte(symptomLogsTable.loggedAt, today),
    ));

  const trimesterStart = profile.trimester === 1 ? 1 : profile.trimester === 2 ? 14 : 27;
  const trimesterEnd = profile.trimester === 1 ? 13 : profile.trimester === 2 ? 26 : 40;
  const trimesterProgress = Math.min(100, ((profile.currentWeek - trimesterStart) / (trimesterEnd - trimesterStart)) * 100);

  const summary = {
    currentWeek: profile.currentWeek,
    trimester: profile.trimester,
    daysUntilDue,
    dueDate: profile.dueDate,
    babySizeComparison: weekContent?.babySizeComparison ?? "a little bean",
    babyLength: weekContent?.babyLength ?? null,
    babyWeight: weekContent?.babyWeight ?? null,
    developmentHighlight: weekContent?.developmentSummary ?? "Your baby is growing beautifully.",
    weeklyActions: weekContent?.weeklyActions ?? [],
    todayKickCount: todayKick?.kickCount ?? 0,
    upcomingAppointmentsCount: Number(upcomingCount?.count ?? 0),
    nextAppointment: nextAppointment ?? null,
    symptomsLoggedToday: todaySymptoms.length,
    trimesterProgress: Math.round(trimesterProgress),
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const profileId = await getProfileId();
  if (!profileId) { res.json([]); return; }

  const query = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 10) : 10;

  const symptoms = await db.select().from(symptomLogsTable)
    .where(eq(symptomLogsTable.profileId, profileId))
    .orderBy(desc(symptomLogsTable.loggedAt))
    .limit(limit);

  const kicks = await db.select().from(kickSessionsTable)
    .where(eq(kickSessionsTable.profileId, profileId))
    .orderBy(desc(kickSessionsTable.sessionDate))
    .limit(5);

  const appts = await db.select().from(appointmentsTable)
    .where(eq(appointmentsTable.profileId, profileId))
    .orderBy(desc(appointmentsTable.createdAt))
    .limit(5);

  const activities: Array<{ id: string; type: string; description: string; timestamp: Date }> = [
    ...symptoms.map(s => ({
      id: `symptom-${s.id}`,
      type: "symptom" as const,
      description: `Logged ${s.symptomType}${s.severity ? ` (${s.severity})` : ""}`,
      timestamp: s.loggedAt,
    })),
    ...kicks.map(k => ({
      id: `kick-${k.id}`,
      type: "kick" as const,
      description: `Recorded ${k.kickCount} kicks`,
      timestamp: k.startedAt ?? new Date(k.sessionDate),
    })),
    ...appts.map(a => ({
      id: `appt-${a.id}`,
      type: a.status === "completed" ? "appointment_completed" as const : "appointment_created" as const,
      description: a.status === "completed" ? `Completed: ${a.title}` : `Added appointment: ${a.title}`,
      timestamp: a.createdAt,
    })),
  ];

  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  res.json(GetRecentActivityResponse.parse(activities.slice(0, limit)));
});

export default router;
