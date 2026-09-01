import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useListWeeklyContent } from "@workspace/api-client-react";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTheme, type ThemePreference } from "@/context/ThemeContext";
import { localStore, useLocalStore } from "@/lib/localStore";
import { getAnalyticsConsent, setAnalyticsConsent } from "@/lib/analytics";

function buildReportHtml(profile: any, summary: any, symptoms: any[], kicks: any[], appointments: any[]) {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const dueFormatted = profile?.dueDate
    ? new Date(profile.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const totalKicks = kicks.reduce((s: number, k: any) => s + (k.kickCount ?? 0), 0);
  const upcomingAppts = (appointments as any[]).filter((a: any) => a.status === "upcoming");

  const symMap: Record<string, number> = {};
  (symptoms as any[]).forEach((s: any) => { symMap[s.symptomType] = (symMap[s.symptomType] ?? 0) + 1; });
  const topSymptoms = Object.entries(symMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return `<!DOCTYPE html><html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Nurture Pregnancy Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #F5EFE6; color: #3A2E28; padding: 32px; }
  .page { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
  .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #E3D8CC; }
  .logo { font-size: 13px; font-weight: 600; color: #E76E50; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
  h1 { font-size: 28px; font-weight: 700; color: #3A2E28; margin-bottom: 4px; }
  .date-line { font-size: 13px; color: #6E5750; }
  .badge { display: inline-block; background: #E76E50; color: #fff; font-size: 13px; font-weight: 600; border-radius: 20px; padding: 4px 14px; margin-top: 10px; }
  section { margin-bottom: 28px; }
  h2 { font-size: 16px; font-weight: 700; color: #E76E50; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 1px solid #E3D8CC; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .stat-box { background: #F5EFE6; border-radius: 10px; padding: 14px; }
  .stat-label { font-size: 11px; color: #6E5750; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .stat-value { font-size: 22px; font-weight: 700; color: #3A2E28; }
  .stat-unit { font-size: 13px; font-weight: 400; color: #6E5750; }
  .sym-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ECE7DF; }
  .sym-row:last-child { border-bottom: none; }
  .sym-bar-wrap { flex: 1; margin: 0 12px; background: #ECE7DF; border-radius: 4px; height: 6px; }
  .sym-bar { background: #E76E50; border-radius: 4px; height: 6px; }
  .appt-row { padding: 10px 0; border-bottom: 1px solid #ECE7DF; }
  .appt-row:last-child { border-bottom: none; }
  .appt-title { font-size: 14px; font-weight: 600; }
  .appt-meta { font-size: 12px; color: #6E5750; margin-top: 2px; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #E3D8CC; text-align: center; font-size: 11px; color: #6E5750; }
  @media print { body { background: #fff; padding: 0; } .page { box-shadow: none; border-radius: 0; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">Nurture</div>
    <h1>${profile?.name ? `${profile.name}'s Journey` : "My Pregnancy Journey"}</h1>
    <div class="date-line">Report generated on ${today}</div>
    <div class="badge">Week ${profile?.currentWeek ?? "—"} • Trimester ${profile?.trimester ?? "—"}</div>
  </div>

  <section>
    <h2>Pregnancy Overview</h2>
    <div class="grid">
      <div class="stat-box">
        <div class="stat-label">Due Date</div>
        <div class="stat-value" style="font-size:16px">${dueFormatted}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Days to Go</div>
        <div class="stat-value">${summary?.daysUntilDue ?? "—"} <span class="stat-unit">days</span></div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Current Week</div>
        <div class="stat-value">${profile?.currentWeek ?? "—"} <span class="stat-unit">/ 40</span></div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Baby Size</div>
        <div class="stat-value" style="font-size:15px">${summary?.babySizeComparison ?? "—"}</div>
      </div>
    </div>
  </section>

  <section>
    <h2>Kick Activity</h2>
    <div class="grid">
      <div class="stat-box">
        <div class="stat-label">Total Kicks Recorded</div>
        <div class="stat-value">${totalKicks}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Sessions Logged</div>
        <div class="stat-value">${kicks.length}</div>
      </div>
    </div>
  </section>

  ${topSymptoms.length > 0 ? `
  <section>
    <h2>Top Symptoms</h2>
    ${topSymptoms.map(([type, count]) => {
      const pct = symptoms.length > 0 ? Math.round((count / symptoms.length) * 100) : 0;
      return `<div class="sym-row">
        <span style="font-size:13px;font-weight:500;width:140px">${type}</span>
        <div class="sym-bar-wrap"><div class="sym-bar" style="width:${Math.max(pct, 4)}%"></div></div>
        <span style="font-size:13px;font-weight:600;color:#E76E50;width:40px;text-align:right">${count}×</span>
      </div>`;
    }).join("")}
  </section>` : ""}

  ${upcomingAppts.length > 0 ? `
  <section>
    <h2>Upcoming Appointments</h2>
    ${upcomingAppts.slice(0, 5).map((a: any) => {
      const d = new Date(a.appointmentDate + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      return `<div class="appt-row">
        <div class="appt-title">${a.title}</div>
        <div class="appt-meta">${d}${a.doctorName ? ` · ${a.doctorName}` : ""}${a.location ? ` · ${a.location}` : ""}</div>
      </div>`;
    }).join("")}
  </section>` : ""}

  <div class="footer">
    Generated by Nurture — Your Pregnancy Companion &nbsp;·&nbsp; For medical decisions, always consult your doctor.
  </div>
</div>
</body>
</html>`;
}

type ThemeOption = { label: string; value: ThemePreference; icon: React.ComponentProps<typeof Feather>["name"] };
const THEME_OPTIONS: ThemeOption[] = [
  { label: "Light", value: "light", icon: "sun" },
  { label: "Dark", value: "dark", icon: "moon" },
  { label: "System", value: "system", icon: "monitor" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const { preference, setPreference } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analyticsConsent, setAnalyticsConsentState] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    dueDate: "",
    lmpDate: "",
    isFirstPregnancy: true,
    notificationsEnabled: true,
  });

  const { profile, kicks: kickData, symptoms: symptomData, appointments: appointmentData } = useLocalStore();
  const { data: weeklyContent } = useListWeeklyContent();
  const currentContent = weeklyContent?.find((content) => content.week === profile?.currentWeek);
  const summary = profile
    ? {
        daysUntilDue: Math.max(0, Math.ceil((new Date(`${profile.dueDate}T12:00:00`).getTime() - Date.now()) / 86400000)),
        babySizeComparison: currentContent?.babySizeComparison,
      }
    : null;

  const s = makeStyles(colors, insets);

  React.useEffect(() => {
    void getAnalyticsConsent().then(setAnalyticsConsentState);
  }, []);

  async function handleAnalyticsConsent(enabled: boolean) {
    setAnalyticsConsentState(enabled);
    await setAnalyticsConsent(enabled);
  }

  const profileName: string = (profile as any)?.name ?? "";
  const initials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join("") || "N";

  async function handleExport() {
    setExporting(true);
    try {
      const html = buildReportHtml(
        profile,
        summary,
        symptomData,
        kickData,
        appointmentData,
      );

      if (Platform.OS === "web") {
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
      }
    } catch {
      Alert.alert("Export failed", "Could not generate the report. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  function handleLogout() {
    Alert.alert(
      "Log out",
              "Nurture has no online account. Clearing local data removes your profile, tracking, and appointments from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          onPress: async () => {
            localStore.clearPrivateData();
            await AsyncStorage.removeItem("@nurture:admin_authed");
            router.replace("/onboarding");
          },
        },
      ],
    );
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Delete account",
      "This permanently erases your profile, symptoms, kicks, and appointments from this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              localStore.clearPrivateData();
              await AsyncStorage.removeItem("@nurture:admin_authed");
              router.replace("/onboarding");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <>
    <ScrollView
      style={[s.root, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Avatar & Name ── */}
      <View style={s.avatarSection}>
        <View style={[s.avatarCircle, { backgroundColor: colors.primary }]}>
          <Text style={s.avatarInitials}>{initials}</Text>
        </View>
        <Text style={[s.displayName, { color: colors.foreground }]}>
          {profileName || "Your Profile"}
        </Text>
        <View style={[s.weekBadge, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[s.weekBadgeText, { color: colors.primary }]}>
            Week {(profile as any)?.currentWeek ?? "—"} · Trimester {(profile as any)?.trimester ?? "—"}
          </Text>
        </View>
      </View>

      {/* ── Pregnancy Stats ── */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.cardTitle, { color: colors.foreground }]}>Pregnancy Summary</Text>
        <View style={s.statsGrid}>
          <StatCell
            label="Due date"
            value={
              (profile as any)?.dueDate
                ? new Date((profile as any).dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : "—"
            }
            color={colors.primary}
            colors={colors}
          />
          <StatCell
            label="Days to go"
            value={`${(summary as any)?.daysUntilDue ?? "—"}`}
            color={colors.secondary}
            colors={colors}
          />
          <StatCell
            label="Total kicks"
            value={`${((kickData as any[]) ?? []).reduce((s: number, k: any) => s + (k.kickCount ?? 0), 0)}`}
            color="#8B5CF6"
            colors={colors}
          />
          <StatCell
            label="Symptoms logged"
            value={`${((symptomData as any[]) ?? []).length}`}
            color="#F59E0B"
            colors={colors}
          />
        </View>
      </View>

      {/* ── Appearance ── */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.cardTitle, { color: colors.foreground }]}>Appearance</Text>
        <View style={[s.themeRow, { backgroundColor: colors.muted }]}>
          {THEME_OPTIONS.map((opt) => {
            const active = preference === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[s.themeBtn, active && { backgroundColor: colors.card, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 }]}
                onPress={() => setPreference(opt.value)}
              >
                <Feather name={opt.icon} size={16} color={active ? colors.primary : colors.mutedForeground} />
                <Text style={[s.themeBtnText, { color: active ? colors.primary : colors.mutedForeground }, active && { fontFamily: "Inter_600SemiBold" }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Privacy ── */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.cardTitle, { color: colors.foreground }]}>Privacy</Text>
        <View style={[s.switchRow, { borderColor: colors.border }]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[s.switchLabel, { color: colors.foreground }]}>Share anonymous usage</Text>
            <Text style={[s.switchSub, { color: colors.mutedForeground }]}>
              Optional app usage counts only. Your profile, pregnancy details, symptoms, kicks, appointments, and benefit answers are never included.
            </Text>
          </View>
          <Switch
            value={analyticsConsent}
            onValueChange={handleAnalyticsConsent}
            trackColor={{ false: colors.border, true: colors.primary + "80" }}
            thumbColor={analyticsConsent ? colors.primary : colors.mutedForeground}
          />
        </View>
      </View>

      {/* ── Actions ── */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.cardTitle, { color: colors.foreground }]}>Actions</Text>

        <ActionRow
          icon="edit-3"
          label="Edit profile"
          sublabel="Update due date, LMP, or name"
          iconBg={colors.primary + "15"}
          iconColor={colors.primary}
          onPress={() => {
            setEditForm({
              name: (profile as any)?.name ?? "",
              dueDate: (profile as any)?.dueDate ? (profile as any).dueDate.split("T")[0] : "",
              lmpDate: (profile as any)?.lmpDate ? (profile as any).lmpDate.split("T")[0] : "",
              isFirstPregnancy: (profile as any)?.isFirstPregnancy ?? true,
              notificationsEnabled: (profile as any)?.notificationsEnabled ?? true,
            });
            setShowEdit(true);
          }}
          colors={colors}
        />

        <View style={[s.divider, { backgroundColor: colors.border }]} />

        <ActionRow
          icon="file-text"
          label="Export health report"
          sublabel="Share a PDF summary with your doctor"
          iconBg={colors.secondary + "20"}
          iconColor={colors.secondary}
          onPress={handleExport}
          loading={exporting}
          colors={colors}
        />

        <View style={[s.divider, { backgroundColor: colors.border }]} />

        <ActionRow
          icon="log-out"
          label="Log out"
           sublabel="Clear all private data from this device"
          iconBg={colors.mutedForeground + "18"}
          iconColor={colors.mutedForeground}
          onPress={handleLogout}
          colors={colors}
        />

        <View style={[s.divider, { backgroundColor: colors.border }]} />

        <ActionRow
          icon="trash-2"
          label="Delete account"
          sublabel="Permanently erase all your data"
          iconBg={colors.destructive + "15"}
          iconColor={colors.destructive}
          onPress={handleDeleteAccount}
          loading={deleting}
          destructive
          colors={colors}
        />
      </View>

      <Text style={[s.versionText, { color: colors.mutedForeground }]}>
        Nurture · Privacy-first pregnancy companion
      </Text>
    </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEdit(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.formHeader, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowEdit(false)}>
              <Text style={[s.formCancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Text style={[s.formTitle, { color: colors.foreground }]}>Edit Profile</Text>
            <Pressable
              onPress={async () => {
                const payload: any = {};
                if (editForm.name.trim()) payload.name = editForm.name.trim();
                if (editForm.dueDate) payload.dueDate = editForm.dueDate;
                if (editForm.lmpDate) payload.lmpDate = editForm.lmpDate;
                payload.isFirstPregnancy = editForm.isFirstPregnancy;
                payload.notificationsEnabled = editForm.notificationsEnabled;
                try {
                  localStore.updateProfile(payload);
                  setShowEdit(false);
                } catch {
                  Alert.alert("Error", "Could not update profile. Please try again.");
                }
              }}
            >
               <Text style={[s.formSave, { color: colors.primary }]}>Save</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            <FF label="Name" colors={colors} s={s}>
              <TextInput style={s.input} placeholder="Your name" placeholderTextColor={colors.mutedForeground}
                value={editForm.name} onChangeText={(v) => setEditForm({ ...editForm, name: v })} />
            </FF>

            <FF label="Due date (YYYY-MM-DD)" colors={colors} s={s}>
              <TextInput style={s.input} placeholder="2026-09-25" placeholderTextColor={colors.mutedForeground}
                value={editForm.dueDate} onChangeText={(v) => setEditForm({ ...editForm, dueDate: v })} keyboardType="numbers-and-punctuation" />
            </FF>

            <FF label="Last menstrual period (YYYY-MM-DD)" colors={colors} s={s}>
              <TextInput style={s.input} placeholder="2025-12-19" placeholderTextColor={colors.mutedForeground}
                value={editForm.lmpDate} onChangeText={(v) => setEditForm({ ...editForm, lmpDate: v })} keyboardType="numbers-and-punctuation" />
            </FF>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[s.fieldLabel, { color: colors.foreground }]}>First pregnancy?</Text>
              <Switch value={editForm.isFirstPregnancy} onValueChange={(v) => setEditForm({ ...editForm, isFirstPregnancy: v })}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={editForm.isFirstPregnancy ? colors.primary : colors.mutedForeground} />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[s.fieldLabel, { color: colors.foreground }]}>Enable notifications</Text>
              <Switch value={editForm.notificationsEnabled} onValueChange={(v) => setEditForm({ ...editForm, notificationsEnabled: v })}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={editForm.notificationsEnabled ? colors.primary : colors.mutedForeground} />
            </View>

            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 8 }}>
               Tip: You can enter either a due date or LMP. Nurture calculates your current week and trimester on this device.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function FF({ label, children, colors, s, style }: { label: string; children: React.ReactNode; colors: ReturnType<typeof useColors>; s: any; style?: object }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={[s.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      {children}
    </View>
  );
}

function StatCell({ label, value, color, colors }: { label: string; value: string; color: string; colors: any }) {
  return (
    <View style={{ width: "48%", backgroundColor: color + "12", borderRadius: 12, padding: 14, marginBottom: 8 }}>
      <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color }}>{value}</Text>
    </View>
  );
}

function ActionRow({
  icon, label, sublabel, iconBg, iconColor, onPress, loading, destructive, colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  sublabel: string;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
  loading?: boolean;
  destructive?: boolean;
  colors: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", paddingVertical: 14, opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: iconBg, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Feather name={icon} size={18} color={iconColor} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: destructive ? colors.destructive : colors.foreground }}>{label}</Text>
        <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 1 }}>{sublabel}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { paddingTop: insets.top + 20, paddingHorizontal: 16, paddingBottom: insets.bottom + 100 },
    avatarSection: { alignItems: "center", marginBottom: 24 },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    avatarInitials: { fontSize: 30, fontFamily: "Inter_700Bold", color: "#fff" },
    displayName: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 8 },
    weekBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
    weekBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    card: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 16 },
    cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 14 },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    themeRow: { flexDirection: "row", borderRadius: 12, padding: 4 },
    themeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
    themeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
    switchLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    switchSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 3 },
    divider: { height: 1, marginVertical: 2 },
    versionText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8, marginBottom: 16 },
    formHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    formCancel: { fontSize: 16, fontFamily: "Inter_400Regular" },
    formTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    formSave: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    input: { fontSize: 15, fontFamily: "Inter_400Regular", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card },
    fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  });
}
