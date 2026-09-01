import { Router, type IRouter } from "express";
import { eq, and, gte, asc, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { appointmentsTable, profilesTable } from "@workspace/db";
import {
  CreateAppointmentBody,
  UpdateAppointmentParams,
  UpdateAppointmentBody,
  UpdateAppointmentResponse,
  DeleteAppointmentParams,
  GetAppointmentParams,
  GetAppointmentResponse,
  ListAppointmentsQueryParams,
  ListAppointmentsResponse,
  GetUpcomingAppointmentsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getProfileId(): Promise<number | null> {
  const [p] = await db.select({ id: profilesTable.id }).from(profilesTable).limit(1);
  return p?.id ?? null;
}

router.get("/appointments", async (req, res): Promise<void> => {
  const profileId = await getProfileId();
  if (!profileId) { res.json([]); return; }

  const query = ListAppointmentsQueryParams.safeParse(req.query);
  const status = query.success ? (query.data.status ?? "all") : "all";

  let rows;
  if (status === "all") {
    rows = await db.select().from(appointmentsTable)
      .where(eq(appointmentsTable.profileId, profileId))
      .orderBy(asc(appointmentsTable.appointmentDate));
  } else {
    rows = await db.select().from(appointmentsTable)
      .where(and(
        eq(appointmentsTable.profileId, profileId),
        eq(appointmentsTable.status, status),
      ))
      .orderBy(asc(appointmentsTable.appointmentDate));
  }

  res.json(ListAppointmentsResponse.parse(rows));
});

router.get("/appointments/upcoming", async (req, res): Promise<void> => {
  const profileId = await getProfileId();
  if (!profileId) { res.json([]); return; }

  const today = new Date().toISOString().split("T")[0];

  const rows = await db.select().from(appointmentsTable)
    .where(and(
      eq(appointmentsTable.profileId, profileId),
      eq(appointmentsTable.status, "upcoming"),
      gte(appointmentsTable.appointmentDate, today),
    ))
    .orderBy(asc(appointmentsTable.appointmentDate))
    .limit(5);

  res.json(GetUpcomingAppointmentsResponse.parse(rows));
});

router.get("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(GetAppointmentResponse.parse(row));
});

router.post("/appointments", async (req, res): Promise<void> => {
  const profileId = await getProfileId();
  if (!profileId) { res.status(404).json({ error: "No profile found" }); return; }

  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(appointmentsTable)
    .values({ profileId, ...parsed.data as unknown as typeof appointmentsTable.$inferInsert, status: "upcoming" })
    .returning();

  res.status(201).json(row);
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.update(appointmentsTable)
    .set(parsed.data as unknown as Partial<typeof appointmentsTable.$inferInsert>)
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(UpdateAppointmentResponse.parse(row));
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(appointmentsTable).where(eq(appointmentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
