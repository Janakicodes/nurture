import { useState } from "react";
import { format, parseISO, differenceInHours } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAppointments,
  useGetProfile,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  getListAppointmentsQueryKey,
  getGetUpcomingAppointmentsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus, Stethoscope, Scan, FlaskConical, Syringe, CalendarDays,
  Clock, Trash2, CheckCircle, AlertCircle, MapPin, User,
  MessageSquare, HelpCircle, Lightbulb, Pencil,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────
type AppointmentType = "checkup" | "ultrasound" | "lab_test" | "vaccination" | "other";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  checkup: <Stethoscope className="h-5 w-5" />,
  ultrasound: <Scan className="h-5 w-5" />,
  lab_test: <FlaskConical className="h-5 w-5" />,
  vaccination: <Syringe className="h-5 w-5" />,
  other: <CalendarDays className="h-5 w-5" />,
};

const TYPE_LABELS: Record<string, string> = {
  checkup: "Check-up",
  ultrasound: "Ultrasound",
  lab_test: "Lab Test",
  vaccination: "Vaccination",
  other: "Other",
};

const TYPE_COLORS: Record<string, string> = {
  checkup: "bg-primary/10 text-primary",
  ultrasound: "bg-secondary/10 text-secondary",
  lab_test: "bg-purple-100 text-purple-700",
  vaccination: "bg-orange-100 text-orange-700",
  other: "bg-muted text-muted-foreground",
};

// ── Suggested visits by week ───────────────────────────────────────────────
interface SuggestedVisit {
  title: string;
  type: AppointmentType;
  description: string;
  urgency: "routine" | "important" | "critical";
}

function getSuggestedVisits(week: number): SuggestedVisit[] {
  const suggestions: SuggestedVisit[] = [];

  if (week >= 6 && week <= 10) {
    suggestions.push({
      title: "First Prenatal Visit",
      type: "checkup",
      description: "Confirm pregnancy, blood group, Rh factor, CBC, urine test, and booking scan.",
      urgency: "important",
    });
  }
  if (week >= 11 && week <= 13) {
    suggestions.push({
      title: "NT Scan (Nuchal Translucency)",
      type: "ultrasound",
      description: "First trimester Down syndrome screening combined with blood markers (PAPP-A, beta-hCG).",
      urgency: "important",
    });
    suggestions.push({
      title: "Double Marker / NIPT",
      type: "lab_test",
      description: "Chromosomal screening blood test. NIPT is highly accurate and recommended.",
      urgency: "routine",
    });
  }
  if (week >= 14 && week <= 16) {
    suggestions.push({
      title: "Second Trimester Checkup",
      type: "checkup",
      description: "Review NT scan results, weight check, blood pressure, fundal height measurement.",
      urgency: "routine",
    });
  }
  if (week >= 15 && week <= 18) {
    suggestions.push({
      title: "Quadruple Marker Test",
      type: "lab_test",
      description: "Blood test for Down syndrome, Edwards syndrome, and neural tube defects screening.",
      urgency: "routine",
    });
  }
  if (week >= 18 && week <= 22) {
    suggestions.push({
      title: "Anomaly Scan / TIFFA",
      type: "ultrasound",
      description: "Detailed anatomy scan of the baby — checks all organs, spine, and amniotic fluid.",
      urgency: "critical",
    });
  }
  if (week >= 24 && week <= 28) {
    suggestions.push({
      title: "Glucose Challenge Test (GCT)",
      type: "lab_test",
      description: "Screen for gestational diabetes. Fasting may be required for the full GTT.",
      urgency: "important",
    });
    suggestions.push({
      title: "Routine Checkup — Trimester 2",
      type: "checkup",
      description: "Blood pressure, fundal height, baby's heartbeat, and anaemia check (Hb levels).",
      urgency: "routine",
    });
  }
  if (week >= 28 && week <= 32) {
    suggestions.push({
      title: "Growth Scan",
      type: "ultrasound",
      description: "Checks baby's growth, position, placenta location, and amniotic fluid levels.",
      urgency: "important",
    });
    suggestions.push({
      title: "Rh Factor & Antibody Check",
      type: "lab_test",
      description: "If Rh negative, anti-D injection is typically given around week 28.",
      urgency: "important",
    });
  }
  if (week >= 34 && week <= 36) {
    suggestions.push({
      title: "Group B Streptococcus (GBS) Test",
      type: "lab_test",
      description: "Vaginal/rectal swab test to check for GBS bacteria before delivery.",
      urgency: "important",
    });
    suggestions.push({
      title: "Well-Being Scan",
      type: "ultrasound",
      description: "Baby's position, estimated weight, and placental grading check.",
      urgency: "routine",
    });
  }
  if (week >= 36 && week <= 40) {
    suggestions.push({
      title: "Weekly Monitoring Visits",
      type: "checkup",
      description: "Weekly checkups for blood pressure, baby's heart rate, and labour readiness.",
      urgency: "critical",
    });
    suggestions.push({
      title: "Non-Stress Test (NST)",
      type: "lab_test",
      description: "Monitors baby's heart rate in response to its movements.",
      urgency: "important",
    });
  }

  return suggestions;
}

const URGENCY_STYLES: Record<string, string> = {
  routine: "bg-muted/50 border-border",
  important: "bg-yellow-50 border-yellow-200",
  critical: "bg-primary/5 border-primary/30",
};
const URGENCY_BADGE: Record<string, string> = {
  routine: "bg-muted text-muted-foreground",
  important: "bg-yellow-100 text-yellow-700",
  critical: "bg-primary/10 text-primary",
};

// ── Form type ──────────────────────────────────────────────────────────────
type FormData = {
  title: string;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  location: string;
  notes: string;
  doctorRemarks: string;
  patientQuestions: string;
  reminderEnabled: boolean;
};

type EditingAppointment = FormData & { id: number };

const defaultForm: FormData = {
  title: "",
  appointmentType: "checkup",
  appointmentDate: "",
  appointmentTime: "",
  doctorName: "",
  location: "",
  notes: "",
  doctorRemarks: "",
  patientQuestions: "",
  reminderEnabled: true,
};

// ── Component ──────────────────────────────────────────────────────────────
export default function Appointments() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: profile } = useGetProfile();
  const { data: appointments = [] } = useListAppointments();

  const createAppt = useCreateAppointment();
  const updateAppt = useUpdateAppointment();
  const deleteAppt = useDeleteAppointment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [activeTab, setActiveTab] = useState<"details" | "notes">("details");

  const currentWeek = profile?.currentWeek ?? 0;
  const suggestions = getSuggestedVisits(currentWeek);

  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const completed = appointments.filter((a) => a.status === "completed");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetUpcomingAppointmentsQueryKey() });
  };

  const openCreate = (prefill?: Partial<FormData>) => {
    setEditingId(null);
    setForm({ ...defaultForm, ...prefill });
    setActiveTab("details");
    setDialogOpen(true);
  };

  const openEdit = (appt: (typeof appointments)[0]) => {
    setEditingId(appt.id);
    setForm({
      title: appt.title,
      appointmentType: appt.appointmentType,
      appointmentDate: appt.appointmentDate,
      appointmentTime: appt.appointmentTime ?? "",
      doctorName: appt.doctorName ?? "",
      location: appt.location ?? "",
      notes: appt.notes ?? "",
      doctorRemarks: (appt as any).doctorRemarks ?? "",
      patientQuestions: (appt as any).patientQuestions ?? "",
      reminderEnabled: appt.reminderEnabled,
    });
    setActiveTab("details");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.appointmentDate) return;
    const payload = {
      title: form.title,
      appointmentType: form.appointmentType as any,
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime || null,
      doctorName: form.doctorName || null,
      location: form.location || null,
      notes: form.notes || null,
      doctorRemarks: form.doctorRemarks || null,
      patientQuestions: form.patientQuestions || null,
      reminderEnabled: form.reminderEnabled,
    } as any;

    if (editingId) {
      updateAppt.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            invalidate();
            setDialogOpen(false);
            toast({ description: "Appointment updated." });
          },
        }
      );
    } else {
      createAppt.mutate(
        { data: payload },
        {
          onSuccess: () => {
            invalidate();
            setDialogOpen(false);
            setForm(defaultForm);
            toast({ description: "Appointment saved." });
          },
        }
      );
    }
  };

  const handleComplete = (id: number) => {
    updateAppt.mutate({ id, data: { status: "completed" } }, { onSuccess: invalidate });
  };

  const handleDelete = (id: number) => {
    deleteAppt.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          setDeleteId(null);
          toast({ description: "Appointment deleted." });
        },
      }
    );
  };

  const isWithin24h = (dateStr: string, timeStr?: string | null) => {
    const dt = timeStr ? parseISO(`${dateStr}T${timeStr}`) : parseISO(`${dateStr}T00:00:00`);
    const h = differenceInHours(dt, new Date());
    return h >= 0 && h <= 24;
  };

  // ── App Card ──────────────────────────────────────────────────────────────
  const AppCard = ({ appt }: { appt: (typeof appointments)[0] }) => {
    const urgent = appt.status === "upcoming" && isWithin24h(appt.appointmentDate, appt.appointmentTime);
    const hasRemarks = !!(appt as any).doctorRemarks;
    const hasQuestions = !!(appt as any).patientQuestions;

    return (
      <Card className={`border-none shadow-md overflow-hidden ${urgent ? "border-l-4 border-l-orange-400" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${TYPE_COLORS[appt.appointmentType] || TYPE_COLORS.other}`}>
              {TYPE_ICONS[appt.appointmentType] || TYPE_ICONS.other}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground text-sm">{appt.title}</h4>
                {urgent && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs gap-1">
                    <AlertCircle className="h-3 w-3" /> Within 24h
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {format(parseISO(appt.appointmentDate), "MMM d, yyyy")}
                </span>
                {appt.appointmentTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {appt.appointmentTime}
                  </span>
                )}
              </div>
              {appt.doctorName && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <User className="h-3 w-3" /> Dr. {appt.doctorName}
                </p>
              )}
              {appt.location && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {appt.location}
                </p>
              )}
            </div>
            <button
              onClick={() => openEdit(appt)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          {/* Notes / remarks / questions expandable */}
          {(appt.notes || hasRemarks || hasQuestions) && (
            <Accordion type="single" collapsible className="mt-2">
              <AccordionItem value="notes" className="border-none">
                <AccordionTrigger className="text-xs text-muted-foreground py-1 hover:no-underline">
                  View notes & remarks
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {appt.notes && (
                    <div className="bg-muted/40 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-foreground mb-1">Notes</p>
                      <p className="text-xs text-muted-foreground">{appt.notes}</p>
                    </div>
                  )}
                  {hasRemarks && (
                    <div className="bg-secondary/10 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-secondary" /> Doctor's Remarks
                      </p>
                      <p className="text-xs text-muted-foreground">{(appt as any).doctorRemarks}</p>
                    </div>
                  )}
                  {hasQuestions && (
                    <div className="bg-primary/5 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                        <HelpCircle className="h-3 w-3 text-primary" /> My Questions
                      </p>
                      <p className="text-xs text-muted-foreground">{(appt as any).patientQuestions}</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {appt.status === "upcoming" && (
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-8"
                onClick={() => handleComplete(appt.id)}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Mark Done
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteId(appt.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {appt.status === "completed" && (
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setDeleteId(appt.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your doctor visits.</p>
        </div>
        <Button size="sm" onClick={() => openCreate()} className="gap-1">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </header>

      {/* ── Suggested Visits ────────────────────────────────────────────── */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Suggested for Week {currentWeek}</h2>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3 ${URGENCY_STYLES[s.urgency]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div className={`p-1.5 rounded-lg mt-0.5 ${TYPE_COLORS[s.type]}`}>
                      {TYPE_ICONS[s.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{s.title}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 ${URGENCY_BADGE[s.urgency]}`}>
                          {s.urgency}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0"
                    onClick={() => openCreate({ title: s.title, appointmentType: s.type })}
                  >
                    Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          Upcoming
          {upcoming.length > 0 && (
            <Badge variant="secondary" className="text-xs">{upcoming.length}</Badge>
          )}
        </h2>
        {upcoming.length === 0 ? (
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No upcoming appointments. Tap <strong>Add</strong> to schedule one.
            </CardContent>
          </Card>
        ) : (
          upcoming.map((a) => <AppCard key={a.id} appt={a} />)
        )}
      </div>

      {/* ── Completed ────────────────────────────────────────────────────── */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            Completed
            <Badge variant="outline" className="text-xs">{completed.length}</Badge>
          </h2>
          {completed.map((a) => (
            <div key={a.id} className="opacity-70">
              <AppCard appt={a} />
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditingId(null); } }}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Appointment" : "New Appointment"}</DialogTitle>
            <DialogDescription className="sr-only">Appointment form</DialogDescription>
          </DialogHeader>

          {/* Sub-tabs: Details | Notes & Questions */}
          <div className="flex rounded-lg border overflow-hidden text-sm">
            {(["details", "notes"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-2 font-medium transition-colors ${
                  activeTab === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {t === "details" ? "Details" : "Notes & Questions"}
              </button>
            ))}
          </div>

          {activeTab === "details" && (
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  placeholder="e.g. 20-week anomaly scan"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Type *</Label>
                <Select
                  value={form.appointmentType}
                  onValueChange={(v) => setForm({ ...form, appointmentType: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={form.appointmentDate}
                    onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={form.appointmentTime}
                    onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Doctor's Name</Label>
                <Input
                  placeholder="Dr. Sharma"
                  value={form.doctorName}
                  onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  placeholder="Hospital or clinic name"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <Label className="text-sm">Reminder</Label>
                  <p className="text-xs text-muted-foreground">24 hours before</p>
                </div>
                <Switch
                  checked={form.reminderEnabled}
                  onCheckedChange={(v) => setForm({ ...form, reminderEnabled: v })}
                />
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  My Questions for the Doctor
                </Label>
                <Textarea
                  placeholder="Write down any questions you want to ask..."
                  value={form.patientQuestions}
                  onChange={(e) => setForm({ ...form, patientQuestions: e.target.value })}
                  className="mt-1 resize-none text-sm"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">Add these before the visit so you don't forget.</p>
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-secondary" />
                  Doctor's Remarks
                </Label>
                <Textarea
                  placeholder="What did the doctor say? Key takeaways, instructions..."
                  value={form.doctorRemarks}
                  onChange={(e) => setForm({ ...form, doctorRemarks: e.target.value })}
                  className="mt-1 resize-none text-sm"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">Fill this in after the visit.</p>
              </div>
              <div>
                <Label>General Notes</Label>
                <Textarea
                  placeholder="Anything else to remember..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 resize-none text-sm"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingId(null); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={(createAppt.isPending || updateAppt.isPending) || !form.title || !form.appointmentDate}
            >
              {(createAppt.isPending || updateAppt.isPending) ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
