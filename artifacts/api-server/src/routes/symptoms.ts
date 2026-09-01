import { Router, type IRouter } from "express";
import { eq, and, gte, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { symptomLogsTable, profilesTable } from "@workspace/db";
import {
  CreateSymptomLogBody,
  DeleteSymptomLogParams,
  ListSymptomsQueryParams,
  ListSymptomsResponse,
  GetTodaySymptomsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getProfileId(): Promise<number | null> {
  const [p] = await db.select({ id: profilesTable.id }).from(profilesTable).limit(1);
  return p?.id ?? null;
}

router.get("/symptoms", async (req, res): Promise<void> => {
  const profileId = await getProfileId();
  if (!profileId) { res.json([]); return; }

  const query = ListSymptomsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 50) : 50;
  const offset = query.success ? (query.data.offset ?? 0) : 0;

  const rows = await db.select().from(symptomLogsTable)
    .where(eq(symptomLogsTable.profileId, profileId))
    .orderBy(desc(symptomLogsTable.loggedAt))
    .limit(limit)
    .offset(offset);

  res.json(ListSymptomsResponse.parse(rows));
});

router.get("/symptoms/today", async (req, res): Promise<void> => {
  const profileId = await getProfileId();
  if (!profileId) { res.json([]); return; }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await db.select().from(symptomLogsTable)
    .where(and(
      eq(symptomLogsTable.profileId, profileId),
      gte(symptomLogsTable.loggedAt, today),
    ))
    .orderBy(desc(symptomLogsTable.loggedAt));

  res.json(GetTodaySymptomsResponse.parse(rows));
});

router.post("/symptoms", async (req, res): Promise<void> => {
  const profileId = await getProfileId();
  if (!profileId) { res.status(404).json({ error: "No profile found" }); return; }

  const parsed = CreateSymptomLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(symptomLogsTable)
    .values({ profileId, ...parsed.data })
    .returning();

  res.status(201).json(row);
});

router.delete("/symptoms/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteSymptomLogParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(symptomLogsTable).where(eq(symptomLogsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
