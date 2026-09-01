import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { weeklyContentTable } from "@workspace/db";
import {
  GetWeeklyContentParams,
  GetWeeklyContentResponse,
  ListWeeklyContentResponse,
  UpsertWeeklyContentParams,
  UpsertWeeklyContentBody,
  UpsertWeeklyContentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/weekly-content", async (_req, res): Promise<void> => {
  const rows = await db.select().from(weeklyContentTable).orderBy(weeklyContentTable.week);
  res.json(ListWeeklyContentResponse.parse(rows));
});

router.get("/weekly-content/:week", async (req, res): Promise<void> => {
  const params = GetWeeklyContentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.select().from(weeklyContentTable).where(eq(weeklyContentTable.week, params.data.week));
  if (!row) {
    res.status(404).json({ error: "Weekly content not found" });
    return;
  }

  res.json(GetWeeklyContentResponse.parse(row));
});

router.put("/weekly-content/:week", async (req, res): Promise<void> => {
  const params = UpsertWeeklyContentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpsertWeeklyContentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const week = params.data.week;
  const trimester = week <= 13 ? 1 : week <= 26 ? 2 : 3;

  const [row] = await db.insert(weeklyContentTable)
    .values({ week, trimester, ...body.data })
    .onConflictDoUpdate({
      target: weeklyContentTable.week,
      set: { ...body.data, trimester },
    })
    .returning();

  res.json(UpsertWeeklyContentResponse.parse(row));
});

export default router;
