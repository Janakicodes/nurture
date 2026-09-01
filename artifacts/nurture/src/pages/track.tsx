import { useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetTodayKicks,
  useListKickSessions,
  useCreateKickSession,
  useUpdateKickSession,
  getGetTodayKicksQueryKey,
  getListKickSessionsQueryKey,
  useGetTodaySymptoms,
  useListSymptoms,
  useCreateSymptomLog,
  useDeleteSymptomLog,
  getGetTodaySymptomsQueryKey,
  getListSymptomsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Baby, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SYMPTOMS = [
  "Nausea", "Vomiting", "Fatigue", "Headache", "Back pain",
  "Heartburn", "Swelling", "Cramping", "Spotting", "Insomnia",
];

const SEVERITY_OPTIONS = [
  { value: "mild", label: "Mild", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "moderate", label: "Moderate", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "severe", label: "Severe", color: "bg-red-100 text-red-700 border-red-200" },
] as const;

type Severity = "mild" | "moderate" | "severe";

function severityClass(s?: string | null) {
  if (s === "mild") return "bg-green-100 text-green-700";
  if (s === "moderate") return "bg-yellow-100 text-yellow-700";
  if (s === "severe") return "bg-red-100 text-red-700";
  return "bg-muted text-muted-foreground";
}

export default function Track() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  // ── Kicks ─────────────────────────────────────────────────────────────────
  const { data: todayKicks } = useGetTodayKicks();
  const { data: kickHistory } = useListKickSessions({ limit: 7 });
  const createKick = useCreateKickSession();
  const updateKick = useUpdateKickSession();

  const count = todayKicks?.kickCount ?? 0;
  const sessionId = todayKicks?.id;
  const KICK_GOAL = 10;

  const handleKick = () => {
    if (sessionId) {
      updateKick.mutate(
        { id: sessionId, data: { kickCount: count + 1 } },
        { onSuccess: () => qc.invalidateQueries({ queryKey: getGetTodayKicksQueryKey() }) }
      );
    } else {
      createKick.mutate(
        { data: { sessionDate: today, kickCount: 1 } },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getGetTodayKicksQueryKey() });
            qc.invalidateQueries({ queryKey: getListKickSessionsQueryKey() });
          },
        }
      );
    }
  };

  const handleResetKick = () => {
    if (!sessionId) return;
    updateKick.mutate(
      { id: sessionId, data: { kickCount: 0, endedAt: new Date().toISOString() } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getGetTodayKicksQueryKey() }) }
    );
  };

  // ── Symptoms ───────────────────────────────────────────────────────────────
  const { data: todaySymptoms } = useGetTodaySymptoms();
  const { data: symptomHistory } = useListSymptoms({ limit: 20 });
  const createSymptom = useCreateSymptomLog();
  const deleteSymptom = useDeleteSymptomLog();

  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Severity>("mild");
  const [notes, setNotes] = useState("");

  const handleLogSymptom = () => {
    if (!selectedSymptom) return;
    createSymptom.mutate(
      { data: { symptomType: selectedSymptom, severity, notes: notes || null } },
      {
        onSuccess: () => {
          setSelectedSymptom(null);
          setNotes("");
          setSeverity("mild");
          qc.invalidateQueries({ queryKey: getGetTodaySymptomsQueryKey() });
          qc.invalidateQueries({ queryKey: getListSymptomsQueryKey() });
          toast({ description: "Symptom logged." });
        },
      }
    );
  };

  const handleDeleteSymptom = (id: number) => {
    deleteSymptom.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetTodaySymptomsQueryKey() });
          qc.invalidateQueries({ queryKey: getListSymptomsQueryKey() });
        },
      }
    );
  };

  return (
    <div className="p-4 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-2xl font-bold text-foreground font-serif">Track</h1>
        <p className="text-muted-foreground text-sm mt-1">Log symptoms and baby kicks.</p>
      </header>

      <Tabs defaultValue="kicks">
        <TabsList className="w-full">
          <TabsTrigger value="kicks" className="flex-1">Kick Counter</TabsTrigger>
          <TabsTrigger value="symptoms" className="flex-1">Symptoms</TabsTrigger>
        </TabsList>

        {/* ── KICK COUNTER TAB ── */}
        <TabsContent value="kicks" className="space-y-4 mt-4">
          <Card className="border-none shadow-md bg-secondary/10">
            <CardContent className="pt-6 flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Today's kicks</p>
                <p className="text-7xl font-bold text-secondary tabular-nums">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">Goal: {KICK_GOAL} kicks</p>
              </div>

              {/* progress bar */}
              <div className="w-full bg-secondary/20 rounded-full h-2.5">
                <div
                  className="bg-secondary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((count / KICK_GOAL) * 100, 100)}%` }}
                />
              </div>
              {count >= KICK_GOAL && (
                <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                  🎉 Goal reached!
                </Badge>
              )}

              <button
                onClick={handleKick}
                disabled={createKick.isPending || updateKick.isPending}
                className="w-36 h-36 rounded-full bg-secondary flex items-center justify-center shadow-lg active:scale-95 transition-transform text-white"
              >
                <div className="text-center">
                  <Baby className="h-10 w-10 mx-auto mb-1" />
                  <span className="text-xs font-semibold">TAP</span>
                </div>
              </button>

              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleResetKick}>
                Reset session
              </Button>
            </CardContent>
          </Card>

          {/* 7-day history */}
          {kickHistory && kickHistory.length > 0 && (
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">7-Day History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {kickHistory.slice(0, 7).map((s) => (
                    <li key={s.id} className="px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {format(parseISO(s.sessionDate), "MMM d")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-secondary">{s.kickCount}</span>
                        <span className="text-xs text-muted-foreground">kicks</span>
                        {s.kickCount >= KICK_GOAL && <span className="text-xs">✅</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── SYMPTOM TRACKER TAB ── */}
        <TabsContent value="symptoms" className="space-y-4 mt-4">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Log a Symptom</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Select symptom</Label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSymptom(s === selectedSymptom ? null : s)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        selectedSymptom === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSymptom && (
                <>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Severity</Label>
                    <div className="flex gap-2">
                      {SEVERITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSeverity(opt.value)}
                          className={`flex-1 py-1.5 rounded-lg text-sm border font-medium transition-all ${
                            severity === opt.value ? opt.color + " border-current" : "border-border text-muted-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Notes (optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional details..."
                      className="resize-none text-sm"
                      rows={2}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleLogSymptom}
                    disabled={createSymptom.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createSymptom.isPending ? "Logging..." : "Log Symptom"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Today's symptoms */}
          {todaySymptoms && todaySymptoms.length > 0 && (
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Logged Today</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {todaySymptoms.map((s) => (
                    <li key={s.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.symptomType}</p>
                          {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.severity && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${severityClass(s.severity)}`}>
                            {s.severity}
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteSymptom(s.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recent history */}
          {symptomHistory && symptomHistory.filter(s => !todaySymptoms?.find(t => t.id === s.id)).length > 0 && (
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Recent History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {symptomHistory
                    .filter(s => !todaySymptoms?.find(t => t.id === s.id))
                    .slice(0, 10)
                    .map((s) => (
                      <li key={s.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.symptomType}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(s.loggedAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                        {s.severity && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${severityClass(s.severity)}`}>
                            {s.severity}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
