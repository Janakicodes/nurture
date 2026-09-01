import { useListWeeklyContent } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLocalStore } from "@/lib/localStore";

const TRIMESTER_LABELS = ["", "First", "Second", "Third"];
const WEEK_EMOJIS: Record<number, string> = {
  1: "🫧", 2: "🫧", 3: "🌱", 4: "🌱", 5: "🌱",
  6: "🫐", 7: "🫐", 8: "🫐", 9: "🍒", 10: "🍒",
  11: "🫚", 12: "🍋", 13: "🍋", 14: "🍋", 15: "🍊",
  16: "🍊", 17: "🍊", 18: "🥭", 19: "🥭", 20: "🍌",
  21: "🍌", 22: "🫑", 23: "🫑", 24: "🌽", 25: "🌽",
  26: "🥬", 27: "🥦", 28: "🥦", 29: "🍈", 30: "🍈",
  31: "🥥", 32: "🥥", 33: "🍍", 34: "🍍", 35: "🍍",
  36: "🎃", 37: "🎃", 38: "🎃", 39: "👶", 40: "👶",
};

const APPT_TYPE_COLORS: Record<string, string> = {
  checkup: "#E76E50",
  ultrasound: "#80B19A",
  lab_test: "#8B5CF6",
  vaccination: "#F59E0B",
  other: "#6B7280",
};

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function isWithinInterval(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

function getTrimesterRange(dueDate: string) {
  const due = new Date(dueDate + "T00:00:00");
  const lmp = new Date(due.getTime() - 280 * 86400000);
  const t1End = new Date(lmp.getTime() + 13 * 7 * 86400000);
  const t2End = new Date(lmp.getTime() + 26 * 7 * 86400000);
  const now = new Date();
  if (now <= t1End) return { start: lmp, end: t1End, label: "Trimester 1 (Weeks 1–13)" };
  if (now <= t2End) return { start: new Date(t1End.getTime() + 86400000), end: t2End, label: "Trimester 2 (Weeks 14–26)" };
  return { start: new Date(t2End.getTime() + 86400000), end: due, label: "Trimester 3 (Weeks 27–40)" };
}

function filterByDate<T>(items: T[], dateKey: keyof T, start: Date, end: Date): T[] {
  return items.filter((item) => {
    const raw = item[dateKey] as string | undefined;
    if (!raw) return false;
    const d = new Date(raw.includes("T") ? raw : raw + "T00:00:00");
    return isWithinInterval(d, start, end);
  });
}

function kickSessionCount(kicks: { sessionDate: string; kickCount: number }[], date: string) {
  return kicks.find((kick) => kick.sessionDate === date)?.kickCount ?? 0;
}

function StatCard({
  icon, label, value, color, colors,
}: {
  icon: string; label: string; value: string | number; color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[statSt.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[statSt.iconBox, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[statSt.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[statSt.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}
const statSt = StyleSheet.create({
  card: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 22, fontFamily: "Inter_700Bold" },
  label: { fontSize: 12, fontFamily: "Inter_500Medium" },
});

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [journeyTab, setJourneyTab] = useState<"month" | "trimester">("month");

  const { profile, appointments, kicks: kickSessions, symptoms } = useLocalStore();
  const { data: weeklyContent, isLoading: contentLoading, refetch: refetchContent, isRefetching } = useListWeeklyContent();

  const s = styles(colors);
  const week = profile?.currentWeek ?? 0;
  const trimester = profile?.trimester ?? 1;
  const daysLeft = profile?.dueDate
    ? Math.max(0, Math.ceil((new Date(`${profile.dueDate}T12:00:00`).getTime() - Date.now()) / 86400000))
    : 0;
  const weekContent = weeklyContent?.find((content) => content.week === week);
  const babySize = weekContent?.babySizeComparison ?? "growing";
  const babyLength = weekContent?.babyLength;
  const babyWeight = weekContent?.babyWeight;
  const today = new Date().toISOString().slice(0, 10);
  const kickCount = kickSessionCount(kickSessions, today);
  const symptomsToday = symptoms.filter((symptom) => symptom.loggedAt.slice(0, 10) === today).length;
  const nextAppt = appointments
    .filter((appointment) => appointment.status === "upcoming" && appointment.appointmentDate >= today)
    .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))[0];
  const weeklyActions: string[] = weekContent?.weeklyActions ?? [];
  const developmentHighlight: string | undefined = weekContent?.developmentSummary;
  const weekEmoji = WEEK_EMOJIS[week] ?? "👶";
  const trimesterProgress = week ? Math.min((week / 40) * 100, 100) : 0;

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 80);

  // Journey calculations
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const trimRange = (profile as any)?.dueDate ? getTrimesterRange((profile as any).dueDate) : null;

  const monthAppts = filterByDate(appointments as any[], "appointmentDate", monthStart, monthEnd);
  const monthKicks = filterByDate(kickSessions as any[], "sessionDate", monthStart, monthEnd);
  const monthSymptoms = filterByDate(symptoms as any[], "loggedAt", monthStart, monthEnd);
  const monthKickTotal = (monthKicks as any[]).reduce((s: number, k: any) => s + (k.kickCount ?? 0), 0);

  const trimAppts = trimRange ? filterByDate(appointments as any[], "appointmentDate", trimRange.start, trimRange.end) : [];
  const trimKicks = trimRange ? filterByDate(kickSessions as any[], "sessionDate", trimRange.start, trimRange.end) : [];
  const trimSymptoms = trimRange ? filterByDate(symptoms as any[], "loggedAt", trimRange.start, trimRange.end) : [];
  const trimKickTotal = (trimKicks as any[]).reduce((s: number, k: any) => s + (k.kickCount ?? 0), 0);

  const activeAppts = journeyTab === "month" ? monthAppts : trimAppts;
  const activeKicks = journeyTab === "month" ? monthKicks : trimKicks;
  const activeSymptoms = journeyTab === "month" ? monthSymptoms : trimSymptoms;
  const activeKickTotal = journeyTab === "month" ? monthKickTotal : trimKickTotal;
  const activePeriodLabel = journeyTab === "month"
    ? now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : trimRange?.label ?? `Trimester ${trimester}`;

  const symptomCounts: Record<string, number> = {};
  (activeSymptoms as any[]).forEach((s: any) => {
    symptomCounts[s.symptomType] = (symptomCounts[s.symptomType] ?? 0) + 1;
  });
  const topSymptoms = Object.entries(symptomCounts).slice(0, 8);

  if (!profile || !profile.createdAt) {
    return (
      <View style={[s.loading, { paddingTop: topPad }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchContent} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header gradient ── */}
      <LinearGradient
        colors={[colors.primary, "#C8542E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: topPad + 16 }]}
      >
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>Hello, {(profile as any)?.name || "Beautiful"}! 👋</Text>
            <Text style={s.headerSubtitle}>{TRIMESTER_LABELS[trimester] ?? ""} Trimester · Week {week}</Text>
          </View>
        </View>

        {/* Baby card */}
        <View style={s.babyCard}>
          <View style={s.babyLeft}>
            <Text style={s.weekLabel}>Week</Text>
            <Text style={s.weekNum}>{week}</Text>
            <Text style={s.babySize}>Size of {babySize}</Text>
            {babyLength || babyWeight ? (
              <Text style={s.babyStat}>{[babyLength, babyWeight].filter(Boolean).join(" · ")}</Text>
            ) : null}
          </View>
          <Text style={s.babyEmoji}>{weekEmoji}</Text>
        </View>

        {/* Progress */}
        <View style={s.progressSection}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${trimesterProgress}%` }]} />
          </View>
          <View style={s.progressLabels}>
            <Text style={s.progressText}>{week} weeks</Text>
            <Text style={s.progressText}>{daysLeft > 0 ? `${daysLeft} days to go` : "Due soon!"}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={s.body}>
        {/* ── Development Highlight ── */}
        {developmentHighlight ? (
          <View style={[s.highlightCard, { backgroundColor: colors.card, borderColor: colors.secondary + "40" }]}>
            <View style={s.highlightHeader}>
              <View style={[s.highlightIcon, { backgroundColor: colors.secondary + "20" }]}>
                <Feather name="star" size={16} color={colors.secondary} />
              </View>
              <Text style={[s.highlightTitle, { color: colors.foreground }]}>Development Highlight</Text>
            </View>
            <Text style={[s.highlightText, { color: colors.mutedForeground }]}>{developmentHighlight}</Text>
          </View>
        ) : null}

        {/* ── Today stats ── */}
        <Text style={s.sectionTitle}>Today</Text>
        <View style={s.statsRow}>
          <Pressable style={{ flex: 1 }} onPress={() => router.push("/(tabs)/track")}>
            <StatCard icon="heart" label="Kicks" value={kickCount} color={colors.primary} colors={colors} />
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => router.push("/(tabs)/track")}>
            <StatCard icon="thermometer" label="Symptoms" value={symptomsToday} color={colors.secondary} colors={colors} />
          </Pressable>
        </View>

        {/* ── Next Visit ── */}
        {nextAppt ? (
          <View>
            <Text style={s.sectionTitle}>Next Visit</Text>
            <Pressable
              style={({ pressed }) => [s.apptCard, { opacity: pressed ? 0.9 : 1 }]}
              onPress={() => router.push("/(tabs)/appointments")}
            >
              <View style={s.apptIconBox}>
                <Feather name="calendar" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.apptTitle}>{nextAppt.title}</Text>
                <Text style={s.apptDate}>
                  {formatShortDate(nextAppt.appointmentDate)}
                  {nextAppt.appointmentTime ? `  ·  ${nextAppt.appointmentTime}` : ""}
                </Text>
                {nextAppt.doctorName ? <Text style={s.apptDoctor}>Dr. {nextAppt.doctorName}</Text> : null}
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        ) : null}

        {/* ── Weekly Checklist ── */}
        {weeklyActions.length > 0 ? (
          <View>
            <Text style={s.sectionTitle}>This Week's Checklist</Text>
            <View style={[s.card]}>
              {weeklyActions.map((action, i) => (
                <View key={i} style={[s.actionRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Feather name="check-circle" size={16} color={colors.mutedForeground + "60"} />
                  <Text style={s.actionText}>{action}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── My Journey ── */}
        <View>
          <View style={s.journeyHeader}>
            <Feather name="heart" size={16} color={colors.primary} />
            <Text style={s.sectionTitle}>My Journey</Text>
          </View>

          {/* Tab switcher */}
          <View style={[s.journeyTabs, { backgroundColor: colors.muted }]}>
            {(["month", "trimester"] as const).map((t) => (
              <Pressable
                key={t}
                style={[s.journeyTab, journeyTab === t && { backgroundColor: colors.card }]}
                onPress={() => setJourneyTab(t)}
              >
                <Text style={[s.journeyTabText, journeyTab === t && { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {t === "month" ? "This Month" : "This Trimester"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[s.periodLabel, { color: colors.mutedForeground }]}>{activePeriodLabel}</Text>

          {/* Stats row */}
          <View style={s.journeyStats}>
            {[
              { label: "Visits", value: (activeAppts as any[]).length, color: colors.primary },
              { label: "Kick Days", value: (activeKicks as any[]).length, color: colors.secondary },
              { label: "Symptoms", value: (activeSymptoms as any[]).length, color: "#8B5CF6" },
            ].map(({ label, value, color }) => (
              <View key={label} style={[s.journeyStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.journeyStatVal, { color }]}>{value}</Text>
                <Text style={[s.journeyStatLabel, { color: colors.mutedForeground }]}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Kick total */}
          {activeKickTotal > 0 ? (
            <View style={[s.kickTotal, { backgroundColor: colors.secondary + "15" }]}>
              <Text style={[s.kickTotalLabel, { color: colors.foreground }]}>
                Total kicks {journeyTab === "month" ? "this month" : "this trimester"}
              </Text>
              <Text style={[s.kickTotalVal, { color: colors.secondary }]}>{activeKickTotal}</Text>
            </View>
          ) : null}

          {/* Appointments list */}
          {(activeAppts as any[]).length > 0 ? (
            <View style={[s.card, { marginTop: 8 }]}>
              <Text style={[s.miniSectionTitle, { color: colors.foreground }]}>Appointments</Text>
              {(activeAppts as any[]).map((a: any, i: number) => (
                <View key={a.id} style={[s.miniRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={[s.miniDot, { backgroundColor: APPT_TYPE_COLORS[a.appointmentType] ?? colors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.miniTitle, { color: colors.foreground }]} numberOfLines={1}>{a.title}</Text>
                    <Text style={[s.miniSub, { color: colors.mutedForeground }]}>
                      {formatShortDate(a.appointmentDate)}{a.appointmentTime ? ` · ${a.appointmentTime}` : ""}
                    </Text>
                  </View>
                  <View style={[s.statusPill, {
                    backgroundColor: a.status === "completed" ? colors.secondary + "20" : colors.primary + "15"
                  }]}>
                    <Text style={[s.statusPillText, {
                      color: a.status === "completed" ? colors.secondary : colors.primary
                    }]}>{a.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[s.emptyJourney, { color: colors.mutedForeground }]}>
              No appointments {journeyTab === "month" ? "this month" : "this trimester"}.
            </Text>
          )}

          {/* Top symptoms */}
          {topSymptoms.length > 0 ? (
            <View style={[s.card, { marginTop: 8 }]}>
              <Text style={[s.miniSectionTitle, { color: colors.foreground }]}>Symptoms Logged</Text>
              <View style={s.symptomChips}>
                {topSymptoms.map(([type, count]) => (
                  <View key={type} style={[s.symptomChip, { backgroundColor: colors.muted }]}>
                    <Text style={[s.symptomChipText, { color: colors.foreground }]}>
                      {type} ×{count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background },
    container: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: 20, paddingBottom: 24 },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
    greeting: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
    headerSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },

    babyCard: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 16, marginBottom: 16,
    },
    babyLeft: { gap: 2 },
    weekLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1 },
    weekNum: { fontSize: 48, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 56 },
    babySize: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.9)" },
    babyStat: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
    babyEmoji: { fontSize: 64 },
    progressSection: { gap: 6 },
    progressBar: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 3, backgroundColor: "#fff" },
    progressLabels: { flexDirection: "row", justifyContent: "space-between" },
    progressText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
    body: { padding: 20, gap: 16 },
    sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: c.foreground },
    highlightCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
    highlightHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    highlightIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    highlightTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    highlightText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
    statsRow: { flexDirection: "row", gap: 12 },
    apptCard: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14,
    },
    apptIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.primary + "15", alignItems: "center", justifyContent: "center" },
    apptTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: c.foreground },
    apptDate: { fontSize: 13, fontFamily: "Inter_400Regular", color: c.mutedForeground, marginTop: 2 },
    apptDoctor: { fontSize: 12, fontFamily: "Inter_400Regular", color: c.mutedForeground },
    card: { backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14 },
    actionRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10 },
    actionText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: c.foreground, lineHeight: 22 },
    journeyHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
    journeyTabs: { flexDirection: "row", borderRadius: 12, padding: 3, marginBottom: 10 },
    journeyTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
    journeyTabText: { fontSize: 13, fontFamily: "Inter_500Medium", color: c.mutedForeground },
    periodLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
    journeyStats: { flexDirection: "row", gap: 8, marginBottom: 8 },
    journeyStat: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
    journeyStatVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
    journeyStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
    kickTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
    kickTotalLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
    kickTotalVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
    miniSectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
    miniRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
    miniDot: { width: 8, height: 8, borderRadius: 4 },
    miniTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
    miniSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
    statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusPillText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    emptyJourney: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 12 },
    symptomChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    symptomChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
    symptomChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  });
