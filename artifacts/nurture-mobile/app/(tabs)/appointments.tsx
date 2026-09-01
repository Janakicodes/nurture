import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { localStore, useLocalStore } from "@/lib/localStore";

type ApptType = "checkup" | "ultrasound" | "lab_test" | "vaccination" | "other";
type ApptStatus = "upcoming" | "completed" | "cancelled";

interface SuggestedVisit {
  title: string;
  type: ApptType;
  description: string;
  urgency: "routine" | "important" | "critical";
}

function getSuggestedVisits(week: number): SuggestedVisit[] {
  const s: SuggestedVisit[] = [];
  if (week >= 6 && week <= 10) s.push({ title: "First Prenatal Visit", type: "checkup", description: "Confirm pregnancy, blood group, Rh factor, CBC, urine test, and booking scan.", urgency: "important" });
  if (week >= 11 && week <= 13) {
    s.push({ title: "NT Scan (Nuchal Translucency)", type: "ultrasound", description: "First trimester Down syndrome screening combined with blood markers (PAPP-A, beta-hCG).", urgency: "important" });
    s.push({ title: "Double Marker / NIPT", type: "lab_test", description: "Chromosomal screening blood test. NIPT is highly accurate and recommended.", urgency: "routine" });
  }
  if (week >= 14 && week <= 16) s.push({ title: "Second Trimester Checkup", type: "checkup", description: "Review NT scan results, weight check, blood pressure, fundal height measurement.", urgency: "routine" });
  if (week >= 15 && week <= 18) s.push({ title: "Quadruple Marker Test", type: "lab_test", description: "Blood test for Down syndrome, Edwards syndrome, and neural tube defects screening.", urgency: "routine" });
  if (week >= 18 && week <= 22) s.push({ title: "Anomaly Scan / TIFFA", type: "ultrasound", description: "Detailed anatomy scan of the baby — checks all organs, spine, and amniotic fluid.", urgency: "critical" });
  if (week >= 24 && week <= 28) {
    s.push({ title: "Glucose Challenge Test (GCT)", type: "lab_test", description: "Screen for gestational diabetes. Fasting may be required for the full GTT.", urgency: "important" });
    s.push({ title: "Routine Checkup — Trimester 2", type: "checkup", description: "Blood pressure, fundal height, baby's heartbeat, and anaemia check (Hb levels).", urgency: "routine" });
  }
  if (week >= 28 && week <= 32) {
    s.push({ title: "Growth Scan", type: "ultrasound", description: "Checks baby's growth, position, placenta location, and amniotic fluid levels.", urgency: "important" });
    s.push({ title: "Rh Factor & Antibody Check", type: "lab_test", description: "If Rh negative, anti-D injection is typically given around week 28.", urgency: "important" });
  }
  if (week >= 34 && week <= 36) {
    s.push({ title: "Group B Streptococcus (GBS) Test", type: "lab_test", description: "Vaginal/rectal swab test to check for GBS bacteria before delivery.", urgency: "important" });
    s.push({ title: "Well-Being Scan", type: "ultrasound", description: "Baby's position, estimated weight, and placental grading check.", urgency: "routine" });
  }
  if (week >= 36 && week <= 40) {
    s.push({ title: "Weekly Monitoring Visits", type: "checkup", description: "Weekly checkups for blood pressure, baby's heart rate, and labour readiness.", urgency: "critical" });
    s.push({ title: "Non-Stress Test (NST)", type: "lab_test", description: "Monitors baby's heart rate in response to its movements.", urgency: "important" });
  }
  return s;
}

const URGENCY_COLORS = { routine: "#6B7280", important: "#F59E0B", critical: "#E76E50" };
const URGENCY_BG = { routine: "transparent", important: "#FEF3C720", critical: "#E76E5010" };
const URGENCY_BORDER = { routine: "#E3D8CC", important: "#FDE68A", critical: "#E76E5040" };

const TYPE_ICONS: Record<ApptType, string> = {
  checkup: "user", ultrasound: "monitor", lab_test: "droplet", vaccination: "shield", other: "calendar",
};
const TYPE_LABELS: Record<ApptType, string> = {
  checkup: "Check-up", ultrasound: "Ultrasound", lab_test: "Lab Test", vaccination: "Vaccination", other: "Other",
};
const TYPE_COLORS: Record<ApptType, string> = {
  checkup: "#E76E50", ultrasound: "#80B19A", lab_test: "#8B5CF6", vaccination: "#F59E0B", other: "#6B7280",
};

const STATUS_COLORS: Record<ApptStatus, string> = {
  upcoming: "#E76E50", completed: "#22C55E", cancelled: "#9CA3AF",
};

type FormData = {
  title: string; appointmentType: ApptType; appointmentDate: string; appointmentTime: string;
  doctorName: string; location: string; notes: string; doctorRemarks: string; patientQuestions: string;
  reminderEnabled: boolean;
};

const emptyForm: FormData = {
  title: "", appointmentType: "checkup", appointmentDate: "", appointmentTime: "",
  doctorName: "", location: "", notes: "", doctorRemarks: "", patientQuestions: "", reminderEnabled: true,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function isWithin24h(dateStr: string, timeStr?: string | null): boolean {
  const dt = timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(`${dateStr}T00:00:00`);
  const diffH = (dt.getTime() - Date.now()) / 3600000;
  return diffH >= 0 && diffH <= 24;
}

export default function AppointmentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, appointments } = useLocalStore();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formTab, setFormTab] = useState<"details" | "notes">("details");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 80);
  const s = styles(colors);

  const currentWeek = (profile as any)?.currentWeek ?? 0;
  const suggestions = getSuggestedVisits(currentWeek);
  const apptList = appointments;
  const upcoming = apptList.filter((a) => a.status === "upcoming");
  const completed = apptList.filter((a) => a.status !== "upcoming");

  const openAdd = (prefill?: Partial<FormData>) => {
    setEditId(null);
    setForm({ ...emptyForm, ...prefill });
    setFormTab("details");
    setShowForm(true);
    Haptics.selectionAsync();
  };

  const openEdit = (appt: any) => {
    setEditId(appt.id);
    setForm({
      title: appt.title ?? "", appointmentType: appt.appointmentType ?? "checkup",
      appointmentDate: appt.appointmentDate ?? "", appointmentTime: appt.appointmentTime ?? "",
      doctorName: appt.doctorName ?? "", location: appt.location ?? "", notes: appt.notes ?? "",
      doctorRemarks: appt.doctorRemarks ?? "", patientQuestions: appt.patientQuestions ?? "",
      reminderEnabled: appt.reminderEnabled ?? true,
    });
    setFormTab("details");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert("Title required"); return; }
    if (!form.appointmentDate) { Alert.alert("Date required (YYYY-MM-DD)"); return; }
    const payload: any = {
      title: form.title, appointmentType: form.appointmentType, appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime || null, doctorName: form.doctorName || null,
      location: form.location || null, notes: form.notes || null,
      doctorRemarks: form.doctorRemarks || null, patientQuestions: form.patientQuestions || null,
      reminderEnabled: form.reminderEnabled,
    };
    if (editId) {
      localStore.updateAppointment(editId, payload);
    } else {
      localStore.addAppointment(payload);
    }
    setShowForm(false);
  };

  const handleComplete = (id: number) => {
    localStore.updateAppointment(id, { status: "completed" });
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Appointment", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
       { text: "Delete", style: "destructive", onPress: () => localStore.deleteAppointment(id) },
    ]);
  };

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Appointments</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Manage your doctor visits.</Text>
        </View>
        <Pressable style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={() => openAdd()}>
          <Feather name="plus" size={20} color="#fff" />
          <Text style={s.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad, gap: 16 }}
        showsVerticalScrollIndicator={false}
         refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} tintColor={colors.primary} />}
      >
        {/* ── Suggested Visits ── */}
        {suggestions.length > 0 && (
          <View>
            <View style={s.suggestHeader}>
              <Feather name="zap" size={16} color={colors.primary} />
              <Text style={[s.suggestTitle, { color: colors.foreground }]}>Suggested for Week {currentWeek}</Text>
            </View>
            {suggestions.map((sv, i) => (
              <View
                key={i}
                style={[
                  s.suggestCard,
                  {
                    backgroundColor: URGENCY_BG[sv.urgency],
                    borderColor: URGENCY_BORDER[sv.urgency],
                    marginBottom: i < suggestions.length - 1 ? 8 : 0,
                  },
                ]}
              >
                <View style={s.suggestCardRow}>
                  <View style={[s.suggestIcon, { backgroundColor: TYPE_COLORS[sv.type] + "15" }]}>
                    <Feather name={TYPE_ICONS[sv.type] as any} size={16} color={TYPE_COLORS[sv.type]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Text style={[s.suggestName, { color: colors.foreground }]}>{sv.title}</Text>
                      <View style={[s.urgencyBadge, { backgroundColor: URGENCY_COLORS[sv.urgency] + "20" }]}>
                        <Text style={[s.urgencyBadgeText, { color: URGENCY_COLORS[sv.urgency] }]}>{sv.urgency}</Text>
                      </View>
                    </View>
                    <Text style={[s.suggestDesc, { color: colors.mutedForeground }]}>{sv.description}</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [s.scheduleBtn, { borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => openAdd({ title: sv.title, appointmentType: sv.type })}
                  >
                    <Text style={[s.scheduleBtnText, { color: colors.foreground }]}>Schedule</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

         <>
            {/* Upcoming */}
            <View>
              <View style={s.listHeader}>
                <Text style={[s.listTitle, { color: colors.foreground }]}>Upcoming</Text>
                {upcoming.length > 0 && (
                  <View style={[s.countBadge, { backgroundColor: colors.secondary + "20" }]}>
                    <Text style={[s.countBadgeText, { color: colors.secondary }]}>{upcoming.length}</Text>
                  </View>
                )}
              </View>
              {upcoming.length === 0 ? (
                <View style={[s.emptyCard, { backgroundColor: colors.muted }]}>
                  <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                    No upcoming appointments. Tap <Text style={{ fontFamily: "Inter_600SemiBold" }}>Add</Text> to schedule one.
                  </Text>
                </View>
              ) : (
                upcoming.map((a: any) => (
                  <ApptCard key={a.id} appt={a} colors={colors} s={s} expanded={expandedId === a.id}
                    onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    onEdit={() => openEdit(a)} onDelete={() => handleDelete(a.id)}
                    onComplete={() => handleComplete(a.id)} />
                ))
              )}
            </View>

            {/* Completed */}
            {completed.length > 0 && (
              <View>
                <View style={s.listHeader}>
                  <Text style={[s.listTitle, { color: colors.foreground }]}>Completed</Text>
                  <View style={[s.countBadge, { backgroundColor: colors.muted }]}>
                    <Text style={[s.countBadgeText, { color: colors.mutedForeground }]}>{completed.length}</Text>
                  </View>
                </View>
                {completed.map((a: any) => (
                  <View key={a.id} style={{ opacity: 0.7 }}>
                    <ApptCard appt={a} colors={colors} s={s} expanded={expandedId === a.id}
                      onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                      onEdit={() => openEdit(a)} onDelete={() => handleDelete(a.id)} onComplete={() => {}} />
                  </View>
                ))}
              </View>
            )}
         </>
      </ScrollView>

      {/* ── Form Modal ── */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={[s.formHeader, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowForm(false)}>
              <Text style={[s.formCancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Text style={[s.formTitle, { color: colors.foreground }]}>{editId ? "Edit Visit" : "New Visit"}</Text>
             <Pressable onPress={handleSave}>
               <Text style={[s.formSave, { color: colors.primary }]}>Save</Text>
            </Pressable>
          </View>

          {/* Form sub-tabs */}
          <View style={[s.formTabRow, { borderBottomColor: colors.border }]}>
            {(["details", "notes"] as const).map((t) => (
              <Pressable
                key={t}
                style={[s.formTabBtn, formTab === t && { backgroundColor: colors.primary }]}
                onPress={() => setFormTab(t)}
              >
                <Text style={[s.formTabText, { color: formTab === t ? "#fff" : colors.mutedForeground }]}>
                  {t === "details" ? "Details" : "Notes & Questions"}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            {formTab === "details" ? (
              <>
                <FF label="Title *" colors={colors} s={s}>
                  <TextInput style={s.input} placeholder="e.g. 20-week anomaly scan"
                    placeholderTextColor={colors.mutedForeground} value={form.title}
                    onChangeText={(v) => setForm({ ...form, title: v })} />
                </FF>

                <FF label="Type" colors={colors} s={s}>
                  <View style={s.typeRow}>
                    {(Object.keys(TYPE_LABELS) as ApptType[]).map((t) => (
                      <Pressable key={t} style={[s.typeBtn, form.appointmentType === t && { borderColor: colors.primary, backgroundColor: colors.primary + "10" }]}
                        onPress={() => setForm({ ...form, appointmentType: t })}>
                        <Feather name={TYPE_ICONS[t] as any} size={13} color={form.appointmentType === t ? colors.primary : colors.mutedForeground} />
                        <Text style={[s.typeBtnText, form.appointmentType === t && { color: colors.primary }]}>{TYPE_LABELS[t]}</Text>
                      </Pressable>
                    ))}
                  </View>
                </FF>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <FF label="Date (YYYY-MM-DD) *" colors={colors} s={s} style={{ flex: 1 }}>
                    <TextInput style={s.input} placeholder="2026-05-20"
                      placeholderTextColor={colors.mutedForeground} value={form.appointmentDate}
                      onChangeText={(v) => setForm({ ...form, appointmentDate: v })} keyboardType="numbers-and-punctuation" />
                  </FF>
                  <FF label="Time" colors={colors} s={s} style={{ flex: 1 }}>
                    <TextInput style={s.input} placeholder="10:30"
                      placeholderTextColor={colors.mutedForeground} value={form.appointmentTime}
                      onChangeText={(v) => setForm({ ...form, appointmentTime: v })} />
                  </FF>
                </View>

                <FF label="Doctor" colors={colors} s={s}>
                  <TextInput style={s.input} placeholder="Dr. Sharma"
                    placeholderTextColor={colors.mutedForeground} value={form.doctorName}
                    onChangeText={(v) => setForm({ ...form, doctorName: v })} />
                </FF>

                <FF label="Location" colors={colors} s={s}>
                  <TextInput style={s.input} placeholder="Apollo Hospital, Delhi"
                    placeholderTextColor={colors.mutedForeground} value={form.location}
                    onChangeText={(v) => setForm({ ...form, location: v })} />
                </FF>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={[s.fieldLabel, { color: colors.foreground }]}>Enable Reminder</Text>
                  <Switch value={form.reminderEnabled} onValueChange={(v) => setForm({ ...form, reminderEnabled: v })}
                    trackColor={{ false: colors.border, true: colors.primary + "80" }}
                    thumbColor={form.reminderEnabled ? colors.primary : colors.mutedForeground} />
                </View>
              </>
            ) : (
              <>
                <FF label="Notes" colors={colors} s={s}>
                  <TextInput style={[s.input, { height: 80, textAlignVertical: "top", paddingTop: 12 }]}
                    placeholder="General notes about this visit..."
                    placeholderTextColor={colors.mutedForeground} value={form.notes}
                    onChangeText={(v) => setForm({ ...form, notes: v })} multiline />
                </FF>
                <FF label="Doctor's Remarks" colors={colors} s={s}>
                  <TextInput style={[s.input, { height: 80, textAlignVertical: "top", paddingTop: 12 }]}
                    placeholder="What the doctor said..."
                    placeholderTextColor={colors.mutedForeground} value={form.doctorRemarks}
                    onChangeText={(v) => setForm({ ...form, doctorRemarks: v })} multiline />
                </FF>
                <FF label="My Questions to Ask" colors={colors} s={s}>
                  <TextInput style={[s.input, { height: 80, textAlignVertical: "top", paddingTop: 12 }]}
                    placeholder="Questions to discuss with the doctor..."
                    placeholderTextColor={colors.mutedForeground} value={form.patientQuestions}
                    onChangeText={(v) => setForm({ ...form, patientQuestions: v })} multiline />
                </FF>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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

function ApptCard({ appt, colors, s, expanded, onToggle, onEdit, onDelete, onComplete }: {
  appt: any; colors: ReturnType<typeof useColors>; s: any; expanded: boolean;
  onToggle: () => void; onEdit: () => void; onDelete: () => void; onComplete: () => void;
}) {
  const status = appt.status as ApptStatus;
  const type = appt.appointmentType as ApptType;
  const urgent = status === "upcoming" && isWithin24h(appt.appointmentDate, appt.appointmentTime);

  return (
    <Pressable style={[s.apptCard, { borderLeftColor: urgent ? "#F59E0B" : "transparent", borderLeftWidth: urgent ? 3 : 0, marginBottom: 10 }]} onPress={onToggle}>
      <View style={s.apptCardRow}>
        <View style={[s.apptIcon, { backgroundColor: TYPE_COLORS[type] + "15" }]}>
          <Feather name={TYPE_ICONS[type] as any} size={18} color={TYPE_COLORS[type]} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={[s.apptTitle, { color: colors.foreground }]}>{appt.title}</Text>
            {urgent && (
              <View style={[s.urgencyBadge, { backgroundColor: "#FDE68A" }]}>
                <Text style={[s.urgencyBadgeText, { color: "#92400E" }]}>Within 24h</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 3 }}>
            <Text style={[s.apptMeta, { color: colors.mutedForeground }]}>{formatDate(appt.appointmentDate)}</Text>
            {appt.appointmentTime ? <Text style={[s.apptMeta, { color: colors.mutedForeground }]}>· {appt.appointmentTime}</Text> : null}
          </View>
          {appt.doctorName ? <Text style={[s.apptMeta, { color: colors.mutedForeground }]}>Dr. {appt.doctorName}</Text> : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[status] + "20" }]}>
            <Text style={[s.statusText, { color: STATUS_COLORS[status] }]}>{status}</Text>
          </View>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
        </View>
      </View>

      {expanded && (
        <View style={[s.apptExpanded, { borderTopColor: colors.border }]}>
          {appt.location ? (
            <View style={s.detailRow}>
              <Feather name="map-pin" size={13} color={colors.mutedForeground} />
              <Text style={[s.detailText, { color: colors.mutedForeground }]}>{appt.location}</Text>
            </View>
          ) : null}
          {appt.notes ? (
            <View style={[s.detailBox, { backgroundColor: colors.muted }]}>
              <Text style={[s.detailBoxLabel, { color: colors.mutedForeground }]}>Notes</Text>
              <Text style={[s.detailBoxText, { color: colors.foreground }]}>{appt.notes}</Text>
            </View>
          ) : null}
          {appt.doctorRemarks ? (
            <View style={[s.detailBox, { backgroundColor: colors.secondary + "10", borderColor: colors.secondary + "30", borderWidth: 1 }]}>
              <Text style={[s.detailBoxLabel, { color: colors.secondary }]}>Doctor's Remarks</Text>
              <Text style={[s.detailBoxText, { color: colors.foreground }]}>{appt.doctorRemarks}</Text>
            </View>
          ) : null}
          {appt.patientQuestions ? (
            <View style={[s.detailBox, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "30", borderWidth: 1 }]}>
              <Text style={[s.detailBoxLabel, { color: colors.primary }]}>My Questions</Text>
              <Text style={[s.detailBoxText, { color: colors.foreground }]}>{appt.patientQuestions}</Text>
            </View>
          ) : null}

          <View style={s.apptActions}>
            {status === "upcoming" && (
              <Pressable style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.secondary + "15", opacity: pressed ? 0.8 : 1 }]} onPress={onComplete}>
                <Feather name="check" size={14} color={colors.secondary} />
                <Text style={[s.actionBtnText, { color: colors.secondary }]}>Mark Done</Text>
              </Pressable>
            )}
            <Pressable style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.8 : 1 }]} onPress={onEdit}>
              <Feather name="edit-2" size={14} color={colors.foreground} />
              <Text style={[s.actionBtnText, { color: colors.foreground }]}>Edit</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.destructive + "15", opacity: pressed ? 0.8 : 1 }]} onPress={onDelete}>
              <Feather name="trash-2" size={14} color={colors.destructive} />
            </Pressable>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
    headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: c.foreground },
    headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
    addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
    suggestHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
    suggestTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    suggestCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
    suggestCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    suggestIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    suggestName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    suggestDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 2 },
    urgencyBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    urgencyBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    scheduleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
    scheduleBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
    listHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    listTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    countBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    emptyCard: { borderRadius: 12, padding: 20, alignItems: "center" },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
    apptCard: { backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
    apptCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
    apptIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    apptTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    apptMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    apptExpanded: { borderTopWidth: 1, padding: 14, gap: 10 },
    detailRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
    detailText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
    detailBox: { borderRadius: 10, padding: 10, gap: 4 },
    detailBoxLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
    detailBoxText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
    apptActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    actionBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    formHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
    formCancel: { fontSize: 16, fontFamily: "Inter_400Regular" },
    formTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    formSave: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    formTabRow: { flexDirection: "row", borderRadius: 10, margin: 16, marginBottom: 0, overflow: "hidden", borderWidth: 1, borderColor: c.border },
    formTabBtn: { flex: 1, paddingVertical: 9, alignItems: "center" },
    formTabText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
    input: {
      height: 48, borderRadius: 12, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.card, paddingHorizontal: 14, fontSize: 15,
      fontFamily: "Inter_400Regular", color: c.foreground,
    },
    typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    typeBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: c.border },
    typeBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: c.mutedForeground },
  });
