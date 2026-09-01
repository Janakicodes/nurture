import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { localStore } from "@/lib/localStore";

type Step = "welcome" | "profile" | "date";
type DateMode = "lmp" | "due";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [isFirst, setIsFirst] = useState(true);
  const [dateMode, setDateMode] = useState<DateMode>("lmp");
  const [lmpDate, setLmpDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const s = styles(colors);

  const handleSubmit = async () => {
    setError("");
    const dateStr = dateMode === "lmp" ? lmpDate : dueDate;
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      setError("Please enter a valid date in YYYY-MM-DD format.");
      return;
    }
    try {
      setSaving(true);
      localStore.createProfile({
        name: name.trim() || undefined,
        isFirstPregnancy: isFirst,
        notificationsEnabled: true,
        ...(dateMode === "lmp" ? { lmpDate: dateStr } : { dueDate: dateStr }),
      });
      router.replace("/(tabs)");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      style={[
        s.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16),
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {step === "welcome" && (
          <View style={s.stepContainer}>
            <View style={s.logoCircle}>
              <Text style={s.logoEmoji}>🌸</Text>
            </View>
            <Text style={s.title}>Welcome to Nurture</Text>
            <Text style={s.subtitle}>
              Your trusted pregnancy companion for every week of your journey.
            </Text>
            <View style={s.featureList}>
              {[
                "Weekly baby development updates",
                "Kick counter & symptom tracker",
                "Appointment management",
                "India maternity benefits guide",
              ].map((f) => (
                <View key={f} style={s.featureRow}>
                  <View style={s.featureDot} />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [s.btn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("profile");
              }}
            >
              <Text style={s.btnText}>Get Started</Text>
            </Pressable>
          </View>
        )}

        {step === "profile" && (
          <View style={s.stepContainer}>
            <Text style={s.stepLabel}>Step 1 of 2</Text>
            <Text style={s.title}>About You</Text>
            <Text style={s.subtitle}>Tell us a little about yourself.</Text>

            <View style={s.field}>
              <Text style={s.label}>Your name (optional)</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Priya"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Is this your first pregnancy?</Text>
              <View style={s.toggleRow}>
                {([true, false] as boolean[]).map((val) => (
                  <Pressable
                    key={String(val)}
                    style={[s.toggleBtn, isFirst === val && s.toggleBtnActive]}
                    onPress={() => setIsFirst(val)}
                  >
                    <Text
                      style={[
                        s.toggleText,
                        isFirst === val && s.toggleTextActive,
                      ]}
                    >
                      {val ? "Yes" : "No"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [s.btn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("date");
              }}
            >
              <Text style={s.btnText}>Continue</Text>
            </Pressable>
          </View>
        )}

        {step === "date" && (
          <View style={s.stepContainer}>
            <Text style={s.stepLabel}>Step 2 of 2</Text>
            <Text style={s.title}>Your Dates</Text>
            <Text style={s.subtitle}>
              Enter your last period or due date to calculate your pregnancy
              week.
            </Text>

            <View style={s.toggleRow}>
              {(["lmp", "due"] as DateMode[]).map((m) => (
                <Pressable
                  key={m}
                  style={[s.toggleBtn, dateMode === m && s.toggleBtnActive]}
                  onPress={() => setDateMode(m)}
                >
                  <Text
                    style={[
                      s.toggleText,
                      dateMode === m && s.toggleTextActive,
                    ]}
                  >
                    {m === "lmp" ? "Last Period" : "Due Date"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={s.field}>
              <Text style={s.label}>
                {dateMode === "lmp"
                  ? "Last Menstrual Period (LMP)"
                  : "Expected Due Date"}
              </Text>
              <TextInput
                style={s.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                value={dateMode === "lmp" ? lmpDate : dueDate}
                onChangeText={dateMode === "lmp" ? setLmpDate : setDueDate}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
              />
              <Text style={s.hint}>Example: 2026-01-15</Text>
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                s.btn,
                 { opacity: pressed || saving ? 0.75 : 1 },
              ]}
              onPress={handleSubmit}
               disabled={saving}
            >
               {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>Start My Journey</Text>
              )}
            </Pressable>

            <Pressable style={s.backBtn} onPress={() => setStep("profile")}>
              <Text style={s.backText}>← Back</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
    stepContainer: { gap: 16 },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    logoEmoji: { fontSize: 40 },
    title: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      color: c.foreground,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: c.mutedForeground,
      lineHeight: 24,
    },
    featureList: { gap: 10, marginTop: 8 },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    featureDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primary,
    },
    featureText: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: c.foreground,
    },
    stepLabel: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: c.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    field: { gap: 6 },
    label: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: c.foreground,
    },
    input: {
      height: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingHorizontal: 16,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: c.foreground,
    },
    hint: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: c.mutedForeground,
    },
    toggleRow: { flexDirection: "row", gap: 10 },
    toggleBtn: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.card,
      alignItems: "center",
      justifyContent: "center",
    },
    toggleBtnActive: {
      borderColor: c.primary,
      backgroundColor: c.primary + "15",
    },
    toggleText: {
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      color: c.mutedForeground,
    },
    toggleTextActive: { color: c.primary },
    btn: {
      height: 52,
      borderRadius: 14,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    btnText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: "#fff",
    },
    backBtn: { alignItems: "center", paddingVertical: 12 },
    backText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: c.mutedForeground,
    },
    error: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: c.destructive,
      textAlign: "center",
    },
  });
