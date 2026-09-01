import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { BarChart, BarData } from "@/components/charts/BarChart";
import { localStore, useLocalStore } from "@/lib/localStore";

// ─── Constants ───────────────────────────────────────────────────────────────

const SYMPTOMS = [
  "Nausea", "Vomiting", "Fatigue", "Headache", "Back pain",
  "Heartburn", "Swelling", "Cramping", "Spotting", "Insomnia",
  "Mood Changes", "Food Cravings", "Frequent Urination",
  "Round Ligament Pain", "Braxton Hicks",
];

const SEVERITIES = ["mild", "moderate", "severe"] as const;
type Severity = (typeof SEVERITIES)[number];

const SEVERITY_COLOR: Record<Severity, string> = {
  mild: "#22C55E",
  moderate: "#F59E0B",
  severe: "#EF4444",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Date helpers ────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function daysAgo(n: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}

function getTrimesterRange(dueDate: string): { start: Date; end: Date; label: string } {
  const due = new Date(dueDate + "T00:00:00");
  const lmp = new Date(due.getTime() - 280 * 86400000);
  const t1End = new Date(lmp.getTime() + 13 * 7 * 86400000);
  const t2End = new Date(lmp.getTime() + 26 * 7 * 86400000);
  const now = new Date();
  if (now <= t1End) return { start: lmp, end: t1End, label: "Trimester 1" };
  if (now <= t2End) return { start: new Date(t1End.getTime() + 86400000), end: t2End, label: "Trimester 2" };
  return { start: new Date(t2End.getTime() + 86400000), end: due, label: "Trimester 3" };
}

// ─── Kick chart data builders ────────────────────────────────────────────────

function buildWeekKickData(sessions: any[]): BarData[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i, today);
    const dateStr = toDateStr(d);
    const sess = sessions.find((s) => s.sessionDate === dateStr);
    return { label: DAY_NAMES[d.getDay()], value: sess?.kickCount ?? 0, highlighted: i === 6 };
  });
}

function buildMonthKickData(sessions: any[]): BarData[] {
  const today = new Date();
  return Array.from({ length: 4 }, (_, i) => {
    const end = endOfDay(daysAgo((3 - i) * 7, today));
    const start = startOfDay(daysAgo((3 - i) * 7 + 6, today));
    const total = sessions
      .filter((s) => {
        const d = new Date(s.sessionDate + "T12:00:00");
        return d >= start && d <= end;
      })
      .reduce((sum, s) => sum + (s.kickCount ?? 0), 0);
    const label = `${start.getDate()}/${start.getMonth() + 1}`;
    return { label, value: total, highlighted: i === 3 };
  });
}

function buildTrimesterKickData(sessions: any[], trimStart: Date): BarData[] {
  const today = new Date();
  const weeks: BarData[] = [];
  let ws = new Date(trimStart);
  let n = 1;
  while (ws <= today) {
    const we = endOfDay(new Date(ws.getTime() + 6 * 86400000));
    const total = sessions
      .filter((s) => {
        const d = new Date(s.sessionDate + "T12:00:00");
        return d >= ws && d <= we;
      })
      .reduce((sum, s) => sum + (s.kickCount ?? 0), 0);
    const isCurrent = today >= ws && today <= we;
    weeks.push({ label: `W${n}`, value: total, highlighted: isCurrent });
    ws = new Date(ws.getTime() + 7 * 86400000);
    n++;
  }
  if (weeks.length > 8) {
    const grouped: BarData[] = [];
    for (let i = 0; i < weeks.length; i += 2) {
      const pair = weeks.slice(i, i + 2);
      grouped.push({
        label: pair[0].label,
        value: pair.reduce((s, w) => s + w.value, 0),
        highlighted: pair.some((w) => w.highlighted),
      });
    }
    return grouped;
  }
  return weeks;
}

// ─── Symptom chart data builders ─────────────────────────────────────────────

function filterSymptoms(symptoms: any[], start: Date, end: Date) {
  return symptoms.filter((s) => {
    const d = new Date(s.loggedAt);
    return d >= start && d <= end;
  });
}

function symptomTypeCounts(symptoms: any[]): { type: string; count: number }[] {
  const map: Record<string, number> = {};
  symptoms.forEach((s) => { map[s.symptomType] = (map[s.symptomType] ?? 0) + 1; });
  return Object.entries(map)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

// ─── Root screen ─────────────────────────────────────────────────────────────

export default function TrackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"kicks" | "symptoms" | "charts">("kicks");

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 80);
  const s = styles(colors);

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Track</Text>
        <Text style={[s.headerSub, { color: colors.mutedForeground }]}>
          Log kicks, symptoms, and view trends.
        </Text>
        <View style={[s.tabSwitch, { backgroundColor: colors.muted }]}>
          {(["kicks", "symptoms", "charts"] as const).map((t) => (
            <Pressable
              key={t}
              style={[s.tabBtn, tab === t && s.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>
                {t === "kicks" ? "Kicks" : t === "symptoms" ? "Symptoms" : "Charts"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === "kicks" ? (
        <KickTab colors={colors} s={s} bottomPad={bottomPad} />
      ) : tab === "symptoms" ? (
        <SymptomsTab colors={colors} s={s} bottomPad={bottomPad} />
      ) : (
        <ChartsTab colors={colors} s={s} bottomPad={bottomPad} />
      )}
    </View>
  );
}

// ─── Kick Tab ─────────────────────────────────────────────────────────────────

function KickTab({
  colors, s, bottomPad,
}: { colors: ReturnType<typeof useColors>; s: any; bottomPad: number }) {
  const { kicks } = useLocalStore();

  const today = new Date().toISOString().split("T")[0];
  const todaySession = kicks.find((kick) => kick.sessionDate === today);
  const count = todaySession?.kickCount ?? 0;
  const GOAL = 10;
  const progress = Math.min(count / GOAL, 1);

  const handleKick = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    localStore.addKick();
  };

  const handleReset = () => {
    if (!todaySession) return;
    Alert.alert("Reset Session", "Reset today's kick count to zero?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => localStore.resetTodayKicks(),
      },
    ]);
  };

  const history = kicks;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: bottomPad, gap: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.kickCard, { backgroundColor: colors.secondary + "10", borderColor: colors.secondary + "30" }]}>
        <Text style={[s.kickGoalText, { color: colors.mutedForeground }]}>
          Today's kicks · Reference: {GOAL}
        </Text>
        <View style={s.kickCenter}>
          <Text style={[s.kickBigCount, { color: colors.secondary }]}>{count}</Text>
          <Text style={[s.kickGoalSub, { color: colors.mutedForeground }]}>A tracking reference, not a medical target</Text>
        </View>
        <View style={[s.kickProgressBar, { backgroundColor: colors.secondary + "30" }]}>
          <View style={[s.kickProgressFill, { width: `${progress * 100}%`, backgroundColor: colors.secondary }]} />
        </View>
        <Pressable
          style={({ pressed }) => [
            s.kickTapBtn,
            { backgroundColor: colors.secondary, transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
          onPress={handleKick}
        >
          <View style={{ alignItems: "center", gap: 4 }}>
            <Feather name="heart" size={36} color="#fff" />
            <Text style={s.kickTapText}>TAP</Text>
          </View>
        </Pressable>
        <Pressable style={s.resetBtn} onPress={handleReset}>
          <Text style={[s.resetText, { color: colors.mutedForeground }]}>Reset session</Text>
        </Pressable>
      </View>

      {history.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>7-Day History</Text>
          <View style={[s.card, { gap: 0 }]}>
            {history.slice(0, 7).map((session: any, i: number) => (
              <View
                key={session.id}
                style={[
                  s.historyRow,
                  i < history.slice(0, 7).length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Feather name="clock" size={14} color={colors.mutedForeground} />
                  <Text style={[s.historyDate, { color: colors.foreground }]}>
                    {formatDate(session.sessionDate)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[s.historyCount, { color: colors.secondary }]}>{session.kickCount}</Text>
                  <Text style={[s.historySub, { color: colors.mutedForeground }]}>kicks</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Symptoms Tab ─────────────────────────────────────────────────────────────

function SymptomsTab({
  colors, s, bottomPad,
}: { colors: ReturnType<typeof useColors>; s: any; bottomPad: number }) {
  const { symptoms } = useLocalStore();

  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Severity>("mild");
  const [notes, setNotes] = useState("");
  const [severityModalVisible, setSeverityModalVisible] = useState(false);

  const handleChipTap = (symptom: string) => {
    setSelectedSymptom(symptom);
    setSeverity("mild");
    setNotes("");
    setSeverityModalVisible(true);
    Haptics.selectionAsync();
  };

  const handleLog = async () => {
    if (!selectedSymptom) return;
    localStore.addSymptom({ symptomType: selectedSymptom, severity, notes: notes.trim() || null });
    setSeverityModalVisible(false);
    setSelectedSymptom(null);
    setNotes("");
  };

  const handleDelete = (id: number) => {
    Alert.alert("Remove", "Remove this symptom log?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => localStore.deleteSymptom(id),
      },
    ]);
  };

  const todayList = symptoms.filter((symptom) => symptom.loggedAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const todayIds = new Set(todayList.map((s: any) => s.id));
  const historyList = symptoms.filter((symptom) => !todayIds.has(symptom.id));

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: bottomPad, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={s.sectionTitle}>Log a Symptom</Text>
        <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>
          Tap to log what you're feeling.
        </Text>
        <View style={s.chipGrid}>
          {SYMPTOMS.map((symptom) => {
            const logged = todayList.some((t: any) => t.symptomType === symptom);
            return (
              <Pressable
                key={symptom}
                style={({ pressed }) => [
                  s.chip,
                  logged && { borderColor: colors.secondary, backgroundColor: colors.secondary + "15" },
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => handleChipTap(symptom)}
              >
                <Text style={[s.chipText, logged && { color: colors.secondary }]}>{symptom}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <Text style={s.sectionTitle}>Logged Today</Text>
        {todayList.length === 0 ? (
          <View style={[s.card, s.emptyState]}>
            <Feather name="thermometer" size={28} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No symptoms logged today</Text>
          </View>
        ) : (
          <View style={[s.card, { gap: 0 }]}>
            {todayList.map((log: any, i: number) => (
              <View
                key={log.id}
                style={[
                  s.historyRow,
                  i < todayList.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.historyDate, { color: colors.foreground, fontSize: 14 }]}>
                    {log.symptomType}
                  </Text>
                  {log.notes && (
                    <Text style={[s.historySub, { color: colors.mutedForeground }]}>{log.notes}</Text>
                  )}
                  {log.severity && (
                    <View style={[s.severityPill, { backgroundColor: SEVERITY_COLOR[log.severity as Severity] + "20" }]}>
                      <Text style={[s.severityPillText, { color: SEVERITY_COLOR[log.severity as Severity] }]}>
                        {log.severity}
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable onPress={() => handleDelete(log.id)} hitSlop={8}>
                  <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {historyList.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>Recent History</Text>
          <View style={[s.card, { gap: 0 }]}>
            {historyList.slice(0, 10).map((log: any, i: number) => (
              <View
                key={log.id}
                style={[
                  s.historyRow,
                  i < Math.min(historyList.length, 10) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.historyDate, { color: colors.foreground, fontSize: 14 }]}>
                    {log.symptomType}
                  </Text>
                  <Text style={[s.historySub, { color: colors.mutedForeground }]}>
                    {formatDateTime(log.loggedAt)}
                  </Text>
                </View>
                {log.severity && (
                  <View style={[s.severityPill, { backgroundColor: SEVERITY_COLOR[log.severity as Severity] + "20" }]}>
                    <Text style={[s.severityPillText, { color: SEVERITY_COLOR[log.severity as Severity] }]}>
                      {log.severity}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      <Modal
        visible={severityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSeverityModalVisible(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setSeverityModalVisible(false)}>
          <Pressable style={[s.modalSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Log: {selectedSymptom}</Text>
            <Text style={[s.modalLabel, { color: colors.mutedForeground }]}>Severity</Text>
            <View style={s.severityRow}>
              {SEVERITIES.map((sev) => (
                <Pressable
                  key={sev}
                  style={[
                    s.severityBtn,
                    {
                      borderColor: severity === sev ? SEVERITY_COLOR[sev] : colors.border,
                      backgroundColor: severity === sev ? SEVERITY_COLOR[sev] + "15" : colors.card,
                    },
                  ]}
                  onPress={() => setSeverity(sev)}
                >
                  <Text style={[s.severityBtnText, { color: severity === sev ? SEVERITY_COLOR[sev] : colors.mutedForeground }]}>
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[s.modalLabel, { color: colors.mutedForeground }]}>Notes (optional)</Text>
            <TextInput
              style={[s.notesInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
              placeholder="Any additional details..."
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Pressable
              style={({ pressed }) => [
                s.logBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleLog}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={s.logBtnText}>Log Symptom</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// ─── Charts Tab ───────────────────────────────────────────────────────────────

type Period = "week" | "month" | "trimester";
const PERIOD_LABELS: Record<Period, string> = {
  week: "Week",
  month: "Month",
  trimester: "Trimester",
};

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1, gap: 2 }}>
      <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color }}>{value}</Text>
      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#9CA3AF" }}>{label}</Text>
    </View>
  );
}

function ChartsTab({
  colors, s, bottomPad,
}: { colors: ReturnType<typeof useColors>; s: any; bottomPad: number }) {
  const [period, setPeriod] = useState<Period>("week");
  const [symPeriod, setSymPeriod] = useState<Period>("week");
  const { profile, kicks: kickSessions, symptoms: allSymptoms } = useLocalStore();

  const dueDate: string | undefined = (profile as any)?.dueDate;
  const trimRange = useMemo(() => (dueDate ? getTrimesterRange(dueDate) : null), [dueDate]);

  const sessions = useMemo(() => kickSessions, [kickSessions]);
  const symptoms = useMemo(() => allSymptoms, [allSymptoms]);

  // ── Kick period bounds
  const { periodStart, periodEnd } = useMemo(() => {
    const today = new Date();
    if (period === "week") return { periodStart: startOfDay(daysAgo(6)), periodEnd: endOfDay(today) };
    if (period === "month") return { periodStart: startOfDay(daysAgo(27)), periodEnd: endOfDay(today) };
    return { periodStart: trimRange?.start ?? startOfDay(daysAgo(90)), periodEnd: endOfDay(today) };
  }, [period, trimRange]);

  // ── Symptom period bounds (independent filter)
  const { symPeriodStart, symPeriodEnd } = useMemo(() => {
    const today = new Date();
    if (symPeriod === "week") return { symPeriodStart: startOfDay(daysAgo(6)), symPeriodEnd: endOfDay(today) };
    if (symPeriod === "month") return { symPeriodStart: startOfDay(daysAgo(27)), symPeriodEnd: endOfDay(today) };
    return { symPeriodStart: trimRange?.start ?? startOfDay(daysAgo(90)), symPeriodEnd: endOfDay(today) };
  }, [symPeriod, trimRange]);

  // ── Kick chart data
  const kickData = useMemo<BarData[]>(() => {
    if (period === "week") return buildWeekKickData(sessions);
    if (period === "month") return buildMonthKickData(sessions);
    return buildTrimesterKickData(sessions, trimRange?.start ?? daysAgo(90));
  }, [sessions, period, trimRange]);

  // ── Kick stats
  const kickStats = useMemo(() => {
    const inPeriod = sessions.filter((s) => {
      const d = new Date(s.sessionDate + "T12:00:00");
      return d >= periodStart && d <= periodEnd;
    });
    const total = inPeriod.reduce((sum, s) => sum + (s.kickCount ?? 0), 0);
    const days = inPeriod.length;
    const avg = days > 0 ? Math.round(total / days) : 0;
    const peak = Math.max(...inPeriod.map((s) => s.kickCount ?? 0), 0);
    return { total, avg, peak };
  }, [sessions, periodStart, periodEnd]);

  // ── Symptom stats (own period)
  const symptomStats = useMemo(() => {
    const inPeriod = filterSymptoms(symptoms, symPeriodStart, symPeriodEnd);
    const total = inPeriod.length;
    const typeCounts = symptomTypeCounts(inPeriod);
    const topType = typeCounts[0]?.type ?? "—";
    const uniqueDays = new Set(inPeriod.map((s) => new Date(s.loggedAt).toDateString())).size;
    return { total, topType, uniqueDays, typeCounts };
  }, [symptoms, symPeriodStart, symPeriodEnd]);

  const periodLabel = period === "trimester" && trimRange ? trimRange.label : PERIOD_LABELS[period];
  const symPeriodLabel = symPeriod === "trimester" && trimRange ? trimRange.label : PERIOD_LABELS[symPeriod];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: bottomPad, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Period filter */}
      <View style={{ gap: 8 }}>
        <Text style={s.sectionTitle}>Trends</Text>
        <View style={[s.periodFilter, { backgroundColor: colors.muted }]}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <Pressable
              key={p}
              style={[s.periodBtn, period === p && { backgroundColor: colors.card }]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[s.periodBtnText, period === p && { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {PERIOD_LABELS[p]}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[s.periodSubLabel, { color: colors.mutedForeground }]}>
          {periodLabel} · {period === "week" ? "Daily" : period === "month" ? "Weekly" : "By week"}
        </Text>
      </View>

      <>
          {/* ── Kick chart ── */}
          <View style={[s.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.chartHeader}>
              <View style={[s.chartIconBox, { backgroundColor: colors.secondary + "15" }]}>
                <Feather name="heart" size={16} color={colors.secondary} />
              </View>
              <View>
                <Text style={[s.chartTitle, { color: colors.foreground }]}>Kick Activity</Text>
                <Text style={[s.chartSub, { color: colors.mutedForeground }]}>kicks per {period === "week" ? "day" : "week"}</Text>
              </View>
            </View>

            {kickData.every((d) => d.value === 0) ? (
              <View style={s.chartEmpty}>
                <Feather name="bar-chart-2" size={24} color={colors.mutedForeground} />
                <Text style={[s.chartEmptyText, { color: colors.mutedForeground }]}>No kick data for this period</Text>
              </View>
            ) : (
              <View style={{ alignItems: "flex-start", marginTop: 8 }}>
                <BarChart data={kickData} color={colors.secondary} mutedColor={colors.secondary + "AA"} />
              </View>
            )}

            <View style={[s.statsRow, { borderTopColor: colors.border }]}>
              <StatPill label="Total" value={kickStats.total} color={colors.secondary} />
              <View style={[s.statDivider, { backgroundColor: colors.border }]} />
              <StatPill label="Avg / day" value={kickStats.avg} color={colors.foreground} />
              <View style={[s.statDivider, { backgroundColor: colors.border }]} />
              <StatPill label="Peak day" value={kickStats.peak} color={colors.primary} />
            </View>
          </View>

          {/* ── Most Frequent Symptoms (own filter) ── */}
          <View style={[s.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.chartHeader}>
              <View style={[s.chartIconBox, { backgroundColor: "#8B5CF620" }]}>
                <Feather name="list" size={16} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.chartTitle, { color: colors.foreground }]}>Most Frequent Symptoms</Text>
                <Text style={[s.chartSub, { color: colors.mutedForeground }]}>{symPeriodLabel}</Text>
              </View>
            </View>

            {/* Symptom-specific period filter */}
            <View style={[s.symFilterRow, { backgroundColor: colors.muted }]}>
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <Pressable
                  key={p}
                  style={[s.symFilterBtn, symPeriod === p && { backgroundColor: colors.card }]}
                  onPress={() => setSymPeriod(p)}
                >
                  <Text style={[s.symFilterText, symPeriod === p && { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    {p === "week" ? "7 days" : PERIOD_LABELS[p]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {symptomStats.typeCounts.length === 0 ? (
              <View style={s.chartEmpty}>
                <Feather name="thermometer" size={24} color={colors.mutedForeground} />
                <Text style={[s.chartEmptyText, { color: colors.mutedForeground }]}>
                  No symptoms logged {symPeriod === "week" ? "in the last 7 days" : `this ${symPeriod}`}
                </Text>
              </View>
            ) : (
              <>
                <View style={{ gap: 12, marginTop: 4 }}>
                  {symptomStats.typeCounts.map(({ type, count }, i) => {
                    const pct = symptomStats.total > 0 ? count / symptomStats.total : 0;
                    const BAR_COLORS = [colors.primary, colors.secondary, "#8B5CF6", "#F59E0B", "#EC4899", "#14B8A6"];
                    const barClr = BAR_COLORS[i % BAR_COLORS.length];
                    return (
                      <View key={type} style={{ gap: 6 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground }}>{type}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: barClr }}>{count}×</Text>
                            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
                              {Math.round(pct * 100)}%
                            </Text>
                          </View>
                        </View>
                        <View style={[s.hbarTrack, { backgroundColor: colors.muted }]}>
                          <View style={[s.hbarFill, { width: `${Math.max(pct * 100, 3)}%`, backgroundColor: barClr }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Summary row */}
                <View style={[s.statsRow, { borderTopColor: colors.border, marginTop: 8 }]}>
                  <StatPill label="Total logged" value={symptomStats.total} color={colors.primary} />
                  <View style={[s.statDivider, { backgroundColor: colors.border }]} />
                  <StatPill label="Days with symptoms" value={symptomStats.uniqueDays} color={colors.foreground} />
                </View>
              </>
            )}
          </View>
      </>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: 20, paddingBottom: 12, gap: 4 },
    headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: c.foreground },
    headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
    tabSwitch: { flexDirection: "row", borderRadius: 12, padding: 3 },
    tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
    tabBtnActive: { backgroundColor: c.card },
    tabBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: c.mutedForeground },
    tabBtnTextActive: { color: c.foreground, fontFamily: "Inter_600SemiBold" },
    sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: c.foreground, marginBottom: 8 },
    sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 12, marginTop: -4 },
    card: { backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14 },
    emptyState: { alignItems: "center", gap: 8, paddingVertical: 24 },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    // Kick
    kickCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", gap: 14 },
    kickGoalText: { fontSize: 13, fontFamily: "Inter_400Regular" },
    kickCenter: { alignItems: "center", gap: 4 },
    kickBigCount: { fontSize: 80, fontFamily: "Inter_700Bold", lineHeight: 88 },
    kickGoalSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
    kickProgressBar: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden" },
    kickProgressFill: { height: "100%", borderRadius: 4 },
    goalBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    goalBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    kickTapBtn: {
      width: 144, height: 144, borderRadius: 72, alignItems: "center",
      justifyContent: "center", shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
    },
    kickTapText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 2 },
    resetBtn: { paddingVertical: 4 },
    resetText: { fontSize: 13, fontFamily: "Inter_400Regular" },
    historyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
    historyDate: { fontSize: 13, fontFamily: "Inter_500Medium", color: c.mutedForeground },
    historyCount: { fontSize: 16, fontFamily: "Inter_700Bold" },
    historySub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
    // Symptoms
    chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card,
    },
    chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: c.foreground },
    severityPill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
    severityPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
    modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
    modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
    modalLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
    severityRow: { flexDirection: "row", gap: 8 },
    severityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
    severityBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    notesInput: {
      borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 72,
      fontSize: 14, fontFamily: "Inter_400Regular",
    },
    logBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, height: 52, borderRadius: 14,
    },
    logBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
    // Charts
    periodFilter: { flexDirection: "row", borderRadius: 12, padding: 3 },
    periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
    periodBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: c.mutedForeground },
    periodSubLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
    chartCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
    chartHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    chartIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    chartTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    chartSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
    chartEmpty: { alignItems: "center", gap: 8, paddingVertical: 20 },
    chartEmptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
    statsRow: {
      flexDirection: "row", paddingTop: 12, marginTop: 4,
      borderTopWidth: 1, alignItems: "center",
    },
    statDivider: { width: 1, height: 28 },
    hbarTrack: { height: 8, borderRadius: 4, overflow: "hidden", width: "100%" },
    hbarFill: { height: "100%", borderRadius: 4 },
    symFilterRow: { flexDirection: "row", borderRadius: 10, padding: 3 },
    symFilterBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
    symFilterText: { fontSize: 12, fontFamily: "Inter_500Medium", color: c.mutedForeground },
  });
