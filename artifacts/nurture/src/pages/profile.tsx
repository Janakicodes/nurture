import { useState } from "react";
import {
  useGetProfile,
  useUpdateProfile,
  useGetDashboardSummary,
  useListKickSessions,
  useListSymptoms,
  useListAppointments,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  User, Calendar, Baby, Activity, FileText, LogOut, Trash2, ChevronRight,
  Stethoscope, Heart, Moon, Sun, Monitor,
} from "lucide-react";
import { useLocation } from "wouter";

export default function ProfilePage() {
  const { data: profile } = useGetProfile();
  const { data: summary } = useGetDashboardSummary();
  const { data: kickData } = useListKickSessions({ limit: 500 });
  const { data: symptomData } = useListSymptoms({ limit: 500 });
  const { data: appointmentData } = useListAppointments();
  const updateProfile = useUpdateProfile();
  const [, setLocation] = useLocation();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    dueDate: "",
    lmpDate: "",
    isFirstPregnancy: true,
    notificationsEnabled: true,
  });
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  const totalKicks = (kickData ?? []).reduce((s, k) => s + (k.kickCount ?? 0), 0);
  const upcomingAppts = (appointmentData ?? []).filter((a) => a.status === "upcoming");

  const openEdit = () => {
    setEditForm({
      name: profile?.name ?? "",
      dueDate: profile?.dueDate ? profile.dueDate.split("T")[0] : "",
      lmpDate: profile?.lmpDate ? profile.lmpDate.split("T")[0] : "",
      isFirstPregnancy: profile?.isFirstPregnancy ?? true,
      notificationsEnabled: profile?.notificationsEnabled ?? true,
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    const payload: any = {};
    if (editForm.name.trim()) payload.name = editForm.name.trim();
    if (editForm.dueDate) payload.dueDate = editForm.dueDate;
    if (editForm.lmpDate) payload.lmpDate = editForm.lmpDate;
    payload.isFirstPregnancy = editForm.isFirstPregnancy;
    payload.notificationsEnabled = editForm.notificationsEnabled;
    await updateProfile.mutateAsync({ data: payload });
    setEditOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("nurture-admin-authed");
    setLocation("/onboarding");
  };

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg">
            {profile?.name ? profile.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() : "N"}
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{profile?.name || "Your Profile"}</h1>
          <p className="text-sm text-muted-foreground">Week {profile?.currentWeek} · Trimester {profile?.trimester}</p>
        </div>
      </div>

      {/* Stats */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            Pregnancy Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Due date" value={profile?.dueDate ? new Date(profile.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"} color="text-primary" />
            <StatBox label="Days to go" value={`${summary?.daysUntilDue ?? "—"}`} color="text-secondary" />
            <StatBox label="Total kicks" value={`${totalKicks}`} color="text-purple-600" />
            <StatBox label="Symptoms" value={`${(symptomData ?? []).length}`} color="text-orange-500" />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 bg-muted rounded-xl p-1.5">
            {[
              { label: "Light", value: "light" as const, icon: Sun },
              { label: "Dark", value: "dark" as const, icon: Moon },
              { label: "System", value: "system" as const, icon: Monitor },
            ].map((opt) => {
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
                  }`}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <ActionRow icon={User} label="Edit profile" sublabel="Update due date, LMP, or name" onClick={openEdit} />
          <div className="h-px bg-border mx-4" />
          <ActionRow icon={FileText} label="Export health report" sublabel="Share a PDF summary with your doctor" onClick={() => {}} />
          <div className="h-px bg-border mx-4" />
          <ActionRow icon={LogOut} label="Log out" sublabel="Clear local session" onClick={handleLogout} />
          <div className="h-px bg-border mx-4" />
          <ActionRow icon={Trash2} label="Delete account" sublabel="Permanently erase all data" destructive onClick={() => {}} />
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">Nurture · Privacy-first pregnancy companion</p>

      {/* Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-5 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Due date (YYYY-MM-DD)</Label>
              <Input value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} placeholder="2026-09-25" type="text" />
            </div>
            <div className="space-y-2">
              <Label>Last menstrual period (YYYY-MM-DD)</Label>
              <Input value={editForm.lmpDate} onChange={(e) => setEditForm({ ...editForm, lmpDate: e.target.value })} placeholder="2025-12-19" type="text" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer">First pregnancy?</Label>
              <Switch checked={editForm.isFirstPregnancy} onCheckedChange={(v) => setEditForm({ ...editForm, isFirstPregnancy: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer">Enable notifications</Label>
              <Switch checked={editForm.notificationsEnabled} onCheckedChange={(v) => setEditForm({ ...editForm, notificationsEnabled: v })} />
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Enter either a due date or LMP. The server recalculates week and trimester automatically.
            </p>
          </div>
          <div className="pt-2 pb-safe">
            <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full">
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`bg-muted rounded-xl p-3 text-center`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ActionRow({
  icon: Icon,
  label,
  sublabel,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full px-4 py-3.5 hover:bg-muted/50 transition-colors"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 ${destructive ? "bg-red-50" : "bg-primary/10"}`}>
        <Icon className={`h-4 w-4 ${destructive ? "text-red-500" : "text-primary"}`} />
      </div>
      <div className="text-left flex-1">
        <p className={`text-sm font-semibold ${destructive ? "text-red-600" : "text-foreground"}`}>{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
