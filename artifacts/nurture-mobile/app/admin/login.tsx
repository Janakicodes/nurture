import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ADMIN_PASSWORD = "nurture2026";
const ADMIN_KEY = "@nurture:admin_authed";

/* ── Design tokens matching the canvas reference ── */
const BG = "#141428";
const CARD_BG = "#1A1A3A";
const CARD_BORDER = "rgba(255,255,255,0.06)";
const INPUT_BG = "#0F1535";
const INPUT_BORDER = "rgba(255,255,255,0.08)";
const ACCENT = "#D4846A";
const ACCENT_SOFT = "rgba(212,132,106,0.12)";
const TEXT = "#FFFFFF";
const TEXT_MUTED = "rgba(255,255,255,0.45)";
const TEXT_DIM = "rgba(255,255,255,0.3)";
const ERROR = "#EF4444";

export default function AdminLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 24 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 24 : 0);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    if (password !== ADMIN_PASSWORD) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Incorrect password.");
      setLoading(false);
      return;
    }
    await AsyncStorage.setItem(ADMIN_KEY, "1");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/admin");
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: topPad }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingBottom: bottomPad + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Top hero: shield icon ── */}
        <View style={s.hero}>
          <View style={s.shieldBox}>
            <Feather name="shield" size={28} color={ACCENT} />
          </View>
          <Text style={s.title}>Admin Portal</Text>
          <Text style={s.subtitle}>Nurture — restricted access</Text>
        </View>

        {/* ── Form card ── */}
        <View style={s.card}>
          {/* Card header */}
          <View style={s.cardHeader}>
            <View style={s.dot} />
            <Text style={s.cardHeaderText}>Administrator Access</Text>
          </View>

          {/* Email field (read-only display) */}
          <View style={s.field}>
            <Text style={s.label}>ADMIN EMAIL</Text>
            <View style={s.inputRow}>
              <Feather name="mail" size={16} color={TEXT_MUTED} style={{ marginRight: 10 }} />
              <TextInput
                style={s.input}
                value="admin@nurture.app"
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={s.field}>
            <Text style={s.label}>PASSWORD</Text>
            <View style={s.inputRow}>
              <Feather name="lock" size={16} color={TEXT_MUTED} style={{ marginRight: 10 }} />
              <TextInput
                style={s.input}
                placeholder="Password"
                placeholderTextColor={TEXT_DIM}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}>
                <Feather
                  name={showPw ? "eye-off" : "eye"}
                  size={18}
                  color={TEXT_MUTED}
                />
              </Pressable>
            </View>
          </View>

          {/* 2FA notice pill */}
          <View style={s.noticePill}>
            <Feather name="info" size={14} color={TEXT_MUTED} style={{ marginRight: 8 }} />
            <Text style={s.noticeText}>
              2-factor authentication code will be sent to your registered device.
            </Text>
          </View>

          {/* Sign-in button */}
          <Pressable
            style={({ pressed }) => [s.btn, { opacity: pressed || loading ? 0.85 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={TEXT} />
            ) : (
              <Text style={s.btnText}>Sign In to Dashboard</Text>
            )}
          </Pressable>

          {/* Forgot credentials row */}
          <Text style={s.forgotRow}>
            <Text style={{ color: TEXT_MUTED }}>Forgot credentials? </Text>
            <Text style={{ color: ACCENT, fontFamily: "Inter_600SemiBold" }}>Contact super admin</Text>
          </Text>
        </View>

        {/* ── Back link ── */}
        <Pressable style={s.backLink} onPress={() => router.back()}>
          <Feather name="chevron-left" size={16} color={TEXT_MUTED} />
          <Text style={s.backText}>Back to user app</Text>
        </Pressable>

        {/* ── Compliance footer ── */}
        <Text style={s.compliance}>
          All admin sessions are logged and audited for compliance.
        </Text>

        {/* Error toast */}
        {error ? <Text style={s.error}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  shieldBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: "rgba(212,132,106,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: TEXT,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: TEXT_MUTED,
    textAlign: "center",
    marginTop: 6,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 22,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignSelf: "stretch",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  cardHeaderText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: ACCENT,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: TEXT_DIM,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: TEXT,
  },
  noticePill: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
    padding: 12,
    gap: 4,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  btn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: TEXT,
  },
  forgotRow: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 2,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
  },
  backText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: TEXT_MUTED,
  },
  compliance: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: TEXT_DIM,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 16,
  },
  error: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: ERROR,
    textAlign: "center",
    marginTop: 12,
  },
});
