import { useState } from "react";
import { useGetAdminAnalytics, useListWeeklyContent, useUpsertWeeklyContent, getListWeeklyContentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, Activity, CalendarDays, Pencil, BarChart3, LogOut } from "lucide-react";
import { adminLogout } from "@/hooks/use-admin-auth";

type WeeklyContentForm = {
  week: number;
  title: string;
  babyDevelopment: string;
  motherChanges: string;
  weeklyActions: string;
  nutritionTips: string;
  warningSymptoms: string;
  babySizeComparison: string;
  babyLength: string;
  babyWeight: string;
};

const emptyForm = (week = 1): WeeklyContentForm => ({
  week,
  title: "",
  babyDevelopment: "",
  motherChanges: "",
  weeklyActions: "",
  nutritionTips: "",
  warningSymptoms: "",
  babySizeComparison: "",
  babyLength: "",
  babyWeight: "",
});

function parseLines(s: string) {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: analytics } = useGetAdminAnalytics();
  const { data: weeklyContent = [] } = useListWeeklyContent();
  const upsertContent = useUpsertWeeklyContent();

  const [editDialog, setEditDialog] = useState(false);
  const [form, setForm] = useState<WeeklyContentForm>(emptyForm());

  const openEdit = (content?: (typeof weeklyContent)[0], week?: number) => {
    if (content) {
      setForm({
        week: content.week,
        title: content.title || "",
        babyDevelopment: (content as any).developmentSummary || "",
        motherChanges: (Array.isArray(content.motherChanges) ? content.motherChanges : []).join("\n"),
        weeklyActions: (Array.isArray(content.weeklyActions) ? content.weeklyActions : []).join("\n"),
        nutritionTips: (Array.isArray(content.nutritionTips) ? content.nutritionTips : []).join("\n"),
        warningSymptoms: (Array.isArray(content.warningSymptoms) ? content.warningSymptoms : []).join("\n"),
        babySizeComparison: content.babySizeComparison || "",
        babyLength: content.babyLength || "",
        babyWeight: content.babyWeight || "",
      });
    } else {
      setForm(emptyForm(week || 1));
    }
    setEditDialog(true);
  };

  const handleSave = () => {
    upsertContent.mutate(
      {
        week: form.week,
        data: {
          title: form.title,
          developmentSummary: form.babyDevelopment,
          motherChanges: form.motherChanges,
          weeklyActions: parseLines(form.weeklyActions),
          nutritionTips: parseLines(form.nutritionTips),
          warningSymptoms: parseLines(form.warningSymptoms),
          babySizeComparison: form.babySizeComparison,
          babyLength: form.babyLength || undefined,
          babyWeight: form.babyWeight || undefined,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListWeeklyContentQueryKey() });
          setEditDialog(false);
          toast({ description: `Week ${form.week} content saved.` });
        },
      }
    );
  };

  const statCards = analytics ? [
    { label: "Events (30 days)", value: analytics.totalEvents, icon: Activity, color: "text-primary" },
    { label: "Active days", value: analytics.activeDays, icon: CalendarDays, color: "text-secondary" },
    { label: "Event types", value: analytics.eventCounts.length, icon: BarChart3, color: "text-purple-600" },
  ] : [];

  // All 40 weeks overview
  const weeksWithContent = new Set(weeklyContent.map((w) => w.week));

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto shadow-2xl">
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground font-serif">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">Analytics & content management</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-destructive"
            onClick={() => { adminLogout(); setLocation("/"); }}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-10">
        <Tabs defaultValue="analytics">
          <TabsList className="w-full">
            <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
            <TabsTrigger value="content" className="flex-1">Weekly Content</TabsTrigger>
          </TabsList>

          {/* ── ANALYTICS TAB ── */}
          <TabsContent value="analytics" className="space-y-4 mt-4">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {statCards.map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className="border-none shadow-md">
                      <CardContent className="p-4">
                        <Icon className={`h-5 w-5 ${color} mb-2`} />
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Anonymous usage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Only coarse event names are collected from people who opt in. No profile, pregnancy, health, appointment, or eligibility data is included.
                    </p>
                    {analytics.eventCounts.length > 0 ? analytics.eventCounts.map((event) => (
                      <div key={event.eventType} className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground flex-1 truncate">{event.eventType.replaceAll("_", " ")}</span>
                        <span className="font-semibold text-foreground">{event.count}</span>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">No opted-in events yet.</p>
                    )}
                  </CardContent>
                </Card>

                {analytics.dailyCounts.length > 0 && (
                  <Card className="border-none shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Events by day</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analytics.dailyCounts.slice(0, 7).map((day) => (
                        <div key={day.date} className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground w-24 shrink-0">{day.date}</span>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${Math.min((day.count / Math.max(...analytics.dailyCounts.map((x) => x.count))) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground w-8 text-right">{day.count}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── CONTENT TAB ── */}
          <TabsContent value="content" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">
              {weeksWithContent.size} of 40 weeks have content. Tap any week to edit.
            </p>

            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 40 }, (_, i) => i + 1).map((w) => {
                const hasContent = weeksWithContent.has(w);
                const content = weeklyContent.find((c) => c.week === w);
                return (
                  <button
                    key={w}
                    onClick={() => openEdit(content, w)}
                    className={`rounded-xl py-3 text-sm font-semibold flex flex-col items-center transition-all ${
                      hasContent
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span>{w}</span>
                    {hasContent && <span className="text-[8px] mt-0.5">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Recent entries list */}
            {weeklyContent.length > 0 && (
              <Card className="border-none shadow-md mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Content Entries</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {[...weeklyContent].sort((a, b) => a.week - b.week).map((c) => (
                      <li key={c.week} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Week {c.week}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.title}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Week {form.week} Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>Week Number</Label>
                <Input
                  type="number"
                  min={1} max={42}
                  value={form.week}
                  onChange={(e) => setForm({ ...form, week: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Baby size (e.g. a mango)</Label>
                <Input
                  value={form.babySizeComparison}
                  onChange={(e) => setForm({ ...form, babySizeComparison: e.target.value })}
                  className="mt-1"
                  placeholder="a mango"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Baby Length</Label>
                <Input value={form.babyLength} onChange={(e) => setForm({ ...form, babyLength: e.target.value })} className="mt-1" placeholder="25 cm" />
              </div>
              <div>
                <Label>Baby Weight</Label>
                <Input value={form.babyWeight} onChange={(e) => setForm({ ...form, babyWeight: e.target.value })} className="mt-1" placeholder="300g" />
              </div>
            </div>
            <div>
              <Label>Title / Headline</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Baby Development</Label>
              <Textarea value={form.babyDevelopment} onChange={(e) => setForm({ ...form, babyDevelopment: e.target.value })} className="mt-1 resize-none text-sm" rows={3} />
            </div>
            {[
              { key: "motherChanges", label: "Mother Changes (one per line)" },
              { key: "weeklyActions", label: "Weekly Actions (one per line)" },
              { key: "nutritionTips", label: "Nutrition Tips (one per line)" },
              { key: "warningSymptoms", label: "Warning Symptoms (one per line)" },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <Textarea
                  value={form[key as keyof WeeklyContentForm] as string}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1 resize-none text-sm"
                  rows={3}
                  placeholder="One item per line"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsertContent.isPending}>
              {upsertContent.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
