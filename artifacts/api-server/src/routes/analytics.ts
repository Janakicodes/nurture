import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { analyticsEventsTable } from "@workspace/db";
import { RecordAnalyticsEventBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/analytics/events", async (req, res): Promise<void> => {
  const parsed = RecordAnalyticsEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Unsupported analytics event" });
    return;
  }

  await db.insert(analyticsEventsTable).values({
    eventType: parsed.data.eventType,
  });

  res.status(202).json({ accepted: true });
});

export default router;