import { useState } from "react";
import {
  useGetProfile,
  useGetDashboardSummary,
  useListAppointments,
  useListKickSessions,
  useListSymptoms,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, addDays, subDays } from "date-fns";
import {
  Baby, Calendar, ChevronRight, Stethoscope,
  FileText, CheckCircle2, CalendarDays, Heart, Activity,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  checkup: <Stethoscope className="h-4 w-4" />,
  ultrasound: <CalendarDays className="h-4 w-4" />,
  lab_test: <FileText className="h-4 w-4" />,
  vaccination: <Activity className="h-4 w-4" />,
  other: <Calendar className="h-4 w-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  checkup: "bg-primary/10 text-primary",
  ultrasound: "bg-secondary/10 text-secondary",
  lab_test: "bg-purple-100 text-purple-700",
  vaccination: "bg-orange-100 text-orange-700",
  other: "bg-muted text-muted-foreground",
};

function getTrimesterRange(dueDate: string): { start: Date; end: Date; label: string } {
  const due = parseISO(dueDate);
  const lmp = subDays(due, 280);
  // Trimester boundaries from LMP
  const t1End = addDays(lmp, 13 * 7);  // week 13
  const t2End = addDays(lmp, 26 * 7);  // week 26

  const now = new Date();
  if (now <= t1End) {
    return { start: lmp, end: t1End, label: "Trimester 1 (Weeks 1–13)" };
  } else if (now <= t2End) {
    return { start: addDays(t1End, 1), end: t2End, label: "Trimester 2 (Weeks 14–26)" };
  } else {
    return { start: addDays(t2End, 1), end: due, label: "Trimester 3 (Weeks 27–40)" };
  }
}

export default function Home() {
  const { data: profile } = useGetProfile();
  const { data: summary } = useGetDashboardSummary();
  const { data: appointments = [] } = useListAppointments();
  const { data: kickSessions = [] } = useListKickSessions({ limit: 60 });
  const { data: symptoms = [] } = useListSymptoms({ limit: 200 });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const trimesterRange = profile?.dueDate ? getTrimesterRange(profile.dueDate) : null;

  function filterByPeriod<T extends { appointmentDate?: string; sessionDate?: string; loggedAt?: string }>(
    items: T[],
    start: Date,
    end: Date,
    dateKey: keyof T
  ) {
    return items.filter((item) => {
      const raw = item[dateKey] as string | undefined;
      if (!raw) return false;
      const d = raw.includes("T") ? parseISO(raw) : parseISO(raw + "T00:00:00");
      return isWithinInterval(d, { start, end });
    });
  }

  const monthAppointments = filterByPeriod(appointments, monthStart, monthEnd, "appointmentDate");
  const monthKicks = filterByPeriod(kickSessions, monthStart, monthEnd, "sessionDate");
  const monthKickTotal = monthKicks.reduce((s, k) => s + k.kickCount, 0);
  const monthSymptoms = filterByPeriod(symptoms, monthStart, monthEnd, "loggedAt");

  const trimAppts = trimesterRange ? filterByPeriod(appointments, trimesterRange.start, trimesterRange.end, "appointmentDate") : [];
  const trimKicks = trimesterRange ? filterByPeriod(kickSessions, trimesterRange.start, trimesterRange.end, "sessionDate") : [];
  const trimKickTotal = trimKicks.reduce((s, k) => s + k.kickCount, 0);
  const trimSymptoms = trimesterRange ? filterByPeriod(symptoms, trimesterRange.start, trimesterRange.end, "loggedAt") : [];

  return (
    <div className="p-4 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Hello, {profile?.name || "Beautiful"}</h1>
          <p className="text-muted-foreground mt-1 font-medium">Week {profile?.currentWeek} • Trimester {profile?.trimester}</p>
        </div>
        <div className="w-9" />
      </header>

      {/* ── Baby size card ── */}
      {summary && (
        <div className="bg-primary/10 rounded-3xl p-6 relative overflow-hidden border border-primary/20">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Baby size={120} />
          </div>
          <h2 className="text-lg font-semibold text-foreground relative z-10">Your baby is the size of</h2>
          <p className="text-3xl font-bold text-primary mt-1 mb-3 relative z-10 font-serif">
            {summary.babySizeComparison}
          </p>
          {(summary.babyLength || summary.babyWeight) && (
            <div className="flex gap-4 text-sm font-medium text-foreground/80 mb-4 relative z-10">
              {summary.babyLength && <span>Length: {summary.babyLength}</span>}
              {summary.babyWeight && <span>Weight: {summary.babyWeight}</span>}
            </div>
          )}
          <div className="space-y-1.5 relative z-10">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Trimester {summary.trimester}</span>
              <span>{summary.daysUntilDue} days to go</span>
            </div>
            <Progress value={summary.trimesterProgress} className="h-2 bg-primary/20 [&>div]:bg-primary" />
          </div>
        </div>
      )}

      {/* ── Development Highlight ── */}
      {summary?.developmentHighlight && (
        <Card className="border-none shadow-md bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Baby className="h-5 w-5 text-secondary" />
              Development Highlight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{summary.developmentHighlight}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Today stats ── */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/track" className="block">
          <Card className="h-full border-none shadow-md bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="mb-2">
                <Activity className="h-6 w-6 text-secondary mb-2" />
                <h3 className="font-semibold text-foreground">Kicks</h3>
              </div>
              <div>
                <span className="text-2xl font-bold text-secondary">{summary?.todayKickCount || 0}</span>
                <span className="text-xs text-muted-foreground block mt-0.5 font-medium">Today</span>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/track" className="block">
          <Card className="h-full border-none shadow-md bg-accent hover:bg-accent/80 transition-colors cursor-pointer">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="mb-2">
                <FileText className="h-6 w-6 text-accent-foreground/70 mb-2" />
                <h3 className="font-semibold text-foreground">Symptoms</h3>
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">{summary?.symptomsLoggedToday || 0}</span>
                <span className="text-xs text-muted-foreground block mt-0.5 font-medium">Logged today</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Next Visit ── */}
      {summary?.nextAppointment && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">Next Visit</h3>
            <Link href="/appointments">
              <Button variant="link" size="sm" className="text-primary h-auto p-0 flex items-center">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <Card className="border-none shadow-md overflow-hidden border-l-4 border-l-primary">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{summary.nextAppointment.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(parseISO(summary.nextAppointment.appointmentDate), "MMM d, yyyy")}
                  {summary.nextAppointment.appointmentTime && ` at ${summary.nextAppointment.appointmentTime}`}
                </p>
                {summary.nextAppointment.doctorName && (
                  <p className="text-sm text-muted-foreground mt-0.5">Dr. {summary.nextAppointment.doctorName}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Weekly Checklist ── */}
      {summary?.weeklyActions && summary.weeklyActions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">This Week's Checklist</h3>
          <Card className="border-none shadow-md">
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {summary.weeklyActions.map((action, i) => (
                  <li key={i} className="p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground/30 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground/90">{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── My Journey — Monthly & Trimester View ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">My Journey</h3>
        </div>

        <Tabs defaultValue="month">
          <TabsList className="w-full">
            <TabsTrigger value="month" className="flex-1">This Month</TabsTrigger>
            <TabsTrigger value="trimester" className="flex-1">This Trimester</TabsTrigger>
          </TabsList>

          {/* ── Month Tab ── */}
          <TabsContent value="month" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground font-medium">{format(now, "MMMM yyyy")}</p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Visits", value: monthAppointments.length, color: "text-primary" },
                { label: "Kick Days", value: monthKicks.length, color: "text-secondary" },
                { label: "Symptoms", value: monthSymptoms.length, color: "text-purple-600" },
              ].map(({ label, value, color }) => (
                <Card key={label} className="border-none shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Kick total */}
            {monthKickTotal > 0 && (
              <div className="bg-secondary/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">Total kicks this month</span>
                <span className="text-lg font-bold text-secondary">{monthKickTotal}</span>
              </div>
            )}

            {/* Appointments list */}
            {monthAppointments.length > 0 ? (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-1 pt-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Appointments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {monthAppointments.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`p-1.5 rounded-lg ${TYPE_COLORS[a.appointmentType] || TYPE_COLORS.other}`}>
                          {TYPE_ICONS[a.appointmentType] || TYPE_ICONS.other}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(a.appointmentDate), "MMM d")}
                            {a.appointmentTime && ` · ${a.appointmentTime}`}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${a.status === "completed" ? "text-secondary border-secondary/30" : ""}`}
                        >
                          {a.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No appointments this month.</p>
            )}

            {/* Top symptoms this month */}
            {monthSymptoms.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-1 pt-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Symptoms logged</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(monthSymptoms.map((s) => s.symptomType)))
                      .slice(0, 8)
                      .map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type} ×{monthSymptoms.filter((s) => s.symptomType === type).length}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Trimester Tab ── */}
          <TabsContent value="trimester" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground font-medium">
              {trimesterRange?.label || `Trimester ${profile?.trimester}`}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Visits", value: trimAppts.length, color: "text-primary" },
                { label: "Kick Days", value: trimKicks.length, color: "text-secondary" },
                { label: "Symptoms", value: trimSymptoms.length, color: "text-purple-600" },
              ].map(({ label, value, color }) => (
                <Card key={label} className="border-none shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Kick total */}
            {trimKickTotal > 0 && (
              <div className="bg-secondary/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">Total kicks this trimester</span>
                <span className="text-lg font-bold text-secondary">{trimKickTotal}</span>
              </div>
            )}

            {/* Appointments list */}
            {trimAppts.length > 0 ? (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-1 pt-3">
                  <CardTitle className="text-sm font-semibold text-foreground">All Appointments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {trimAppts.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`p-1.5 rounded-lg ${TYPE_COLORS[a.appointmentType] || TYPE_COLORS.other}`}>
                          {TYPE_ICONS[a.appointmentType] || TYPE_ICONS.other}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(a.appointmentDate), "MMM d, yyyy")}
                            {a.appointmentTime && ` · ${a.appointmentTime}`}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${a.status === "completed" ? "text-secondary border-secondary/30" : ""}`}
                        >
                          {a.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No appointments this trimester yet.</p>
            )}

            {/* Top symptoms this trimester */}
            {trimSymptoms.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-1 pt-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Symptoms logged</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(trimSymptoms.map((s) => s.symptomType)))
                      .slice(0, 10)
                      .map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type} ×{trimSymptoms.filter((s) => s.symptomType === type).length}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
