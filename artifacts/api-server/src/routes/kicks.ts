import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { kickSessionsTable, profilesTable } from "@workspace/db";
import {
  CreateKickSessionBody,
  UpdateKickSessionParams,
  UpdateKickSessionBody,
  UpdateKickSessionResponse,
  ListKickSessionsQueryParams,
  ListKickSessionsResponse,
  GetTodayKicksResponse,
} from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

async function getProfileId(): Promise<number | null> {
  const [p] = await db.select({ id: profilesTable.id }).from(profilesTable).limit(1);
  return p?.id ?? null;
}

router.get("/kicks", async (req, res): Promise<void> => {
  const profileId = await getProfileId();
  if (!profileId) { res.json([]); return; }

  const query = ListKickSessionsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 30) : 30;

  const rows = await db.select().from(kickSessionsTable)
    .where(eq(kickSessionsTable.profileId, profileId))
    .orderBy(desc(kickSessionsTable.sessionDate))
    .limit(limit);

  res.json(ListKickSessionsResponse.parse(rows));
});

router.get("/kicks/today", async (req, res): Promise<void> => {
  const profileId = await getProfileId();
  if (!profileId) { res.status(404).json({ error: "No profile found" }); return; }

  const today = new Date().toISOString().split("T")[0];

  const [row] = await db.select().from(kickSessionsTable)
    .where(and(
      eq(kickSessionsTable.profileId, profileId),
      eq(kickSessionsTable.sessionDate, today),
    ));

  if (!row) {
    res.status(404).json({ error: "No kick session today" });
    return;
  }

  res.json(GetTodayKicksResponse.parse(row));
});

router.post("/kicks", async (req, res): Promise<void> => {
  const profileId = await getProfileId();
  if (!profileId) { res.status(404).json({ error: "No profile found" }); return; }

  const parsed = CreateKickSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(kickSessionsTable)
    .values({ profileId, ...parsed.data })
    .returning();

  res.status(201).json(row);
});

router.patch("/kicks/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateKickSessionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateKickSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.update(kickSessionsTable)
    .set(parsed.data as Partial<typeof kickSessionsTable.$inferInsert>)
    .where(eq(kickSessionsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Kick session not found" });
    return;
  }

  res.json(UpdateKickSessionResponse.parse(row));
});

export default router;
