import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { profilesTable, symptomLogsTable, kickSessionsTable, appointmentsTable } from "@workspace/db";
import { CreateProfileBody, UpdateProfileBody, GetProfileResponse, UpdateProfileResponse } from "@workspace/api-zod";
import { differenceInWeeks, addDays } from "date-fns";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function computeWeekAndTrimester(dueDate: Date): { currentWeek: number; trimester: number } {
  const conceptionDate = addDays(dueDate, -280);
  const now = new Date();
  const week = Math.max(1, Math.min(42, differenceInWeeks(now, conceptionDate) + 1));
  const trimester = week <= 13 ? 1 : week <= 26 ? 2 : 3;
  return { currentWeek: week, trimester };
}

router.get("/profile", async (req, res): Promise<void> => {
  const profiles = await db.select().from(profilesTable).limit(1);
  if (!profiles[0]) {
    res.status(404).json({ error: "No profile found" });
    return;
  }
  res.json(GetProfileResponse.parse(profiles[0]));
});

router.post("/profile", async (req, res): Promise<void> => {
  const parsed = CreateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { dueDate, lmpDate, ...rest } = parsed.data;

  let resolvedDueDate: string | undefined;
  if (dueDate) {
    resolvedDueDate = dueDate as unknown as string;
  } else if (lmpDate) {
    const lmp = new Date(lmpDate as unknown as string);
    const due = addDays(lmp, 280);
    resolvedDueDate = due.toISOString().split("T")[0];
  } else {
    res.status(400).json({ error: "Either dueDate or lmpDate is required" });
    return;
  }

  const { currentWeek, trimester } = computeWeekAndTrimester(new Date(resolvedDueDate));

  const [profile] = await db.insert(profilesTable).values({
    ...rest,
    dueDate: resolvedDueDate,
    lmpDate: lmpDate ? (lmpDate as unknown as string) : null,
    currentWeek,
    trimester,
  }).returning();

  res.status(201).json(GetProfileResponse.parse(profile));
});

router.put("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const profiles = await db.select().from(profilesTable).limit(1);
  if (!profiles[0]) {
    res.status(404).json({ error: "No profile found" });
    return;
  }

  const updates: Partial<typeof profilesTable.$inferInsert> = { ...parsed.data } as unknown as Partial<typeof profilesTable.$inferInsert>;

  const dueDateStr = (parsed.data.dueDate ?? profiles[0].dueDate) as string | null;
  if (dueDateStr) {
    const { currentWeek, trimester } = computeWeekAndTrimester(new Date(dueDateStr));
    (updates as Record<string, unknown>).currentWeek = currentWeek;
    (updates as Record<string, unknown>).trimester = trimester;
  }

  const [updated] = await db.update(profilesTable)
    .set(updates)
    .where(eq(profilesTable.id, profiles[0].id))
    .returning();

  res.json(UpdateProfileResponse.parse(updated));
});

router.delete("/profile", async (req, res): Promise<void> => {
  const profiles = await db.select().from(profilesTable).limit(1);
  if (!profiles[0]) {
    res.status(404).json({ error: "No profile found" });
    return;
  }

  const profileId = profiles[0].id;

  await db.delete(symptomLogsTable).where(eq(symptomLogsTable.profileId, profileId));
  await db.delete(kickSessionsTable).where(eq(kickSessionsTable.profileId, profileId));
  await db.delete(appointmentsTable).where(eq(appointmentsTable.profileId, profileId));
  await db.delete(profilesTable).where(eq(profilesTable.id, profileId));

  req.log.info({ profileId }, "Profile and all associated data deleted");
  res.status(204).send();
});

export default router;
