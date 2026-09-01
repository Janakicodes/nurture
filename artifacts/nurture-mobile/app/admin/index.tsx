import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetAdminAnalytics } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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

const ADMIN_KEY = "@nurture:admin_authed";

interface StatItemProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

function StatItem({ label, value, icon, color }: StatItemProps) {
  return (
    <View style={[s.statCard, { borderColor: color + "30" }]}>
      <View style={[s.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const { data: analytics, isLoading, refetch, isRefetching } = useGetAdminAnalytics();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  useEffect(() => {
    AsyncStorage.getItem(ADMIN_KEY).then((val) => {
      if (val !== "1") {
        router.replace("/admin/login");
      } else {
        setAuthChecked(true);
      }
    });
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem(ADMIN_KEY);
    router.replace("/admin/login");
  };

  if (!authChecked) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#E76E50" />
      </View>
    );
  }

  const a = analytics as any;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: bottomPad, gap: 20 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#E76E50" />
      }
      showsVerticalScrollIndicator={false}
    >
      {isLoading ? (
        <ActivityIndicator color="#E76E50" style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Stats Grid */}
          <View>
            <Text style={s.sectionTitle}>Overview</Text>
            <View style={s.statsGrid}>
              <StatItem label="Total Users" value={a?.totalUsers ?? 0} icon="users" color="#E76E50" />
              <StatItem label="Active (7d)" value={a?.activeUsersThisWeek ?? 0} icon="trending-up" color="#80B19A" />
              <StatItem label="Symptom Logs" value={a?.totalSymptomLogs ?? 0} icon="thermometer" color="#F59E0B" />
              <StatItem label="Kick Sessions" value={a?.totalKickSessions ?? 0} icon="heart" color="#3B82F6" />
              <StatItem label="Appointments" value={a?.totalAppointments ?? 0} icon="calendar" color="#EC4899" />
              <StatItem label="Benefits Checks" value={a?.benefitsChecksThisMonth ?? 0} icon="shield" color="#8B5CF6" />
            </View>
          </View>

          {/* Appointment Completion */}
          {a?.appointmentCompletionRate !== undefined && (
            <View>
              <Text style={s.sectionTitle}>Appointment Completion</Text>
              <View style={s.progressCard}>
                <View style={s.progressHeader}>
                  <Text style={s.progressLabel}>Completion Rate</Text>
                  <Text style={s.progressPct}>
                    {Math.round(a.appointmentCompletionRate * 100)}%
                  </Text>
                </View>
                <View style={s.progressBar}>
                  <View
                    style={[
                      s.progressFill,
                      { width: `${a.appointmentCompletionRate * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Week Distribution */}
          {a?.weekDistribution && Object.keys(a.weekDistribution).length > 0 && (
            <View>
              <Text style={s.sectionTitle}>Users by Trimester</Text>
              <View style={s.distCard}>
                {Object.entries(a.weekDistribution as Record<string, number>).map(
                  ([key, val]) => (
                    <View key={key} style={s.distRow}>
                      <Text style={s.distKey}>
                        {key.replace(/_/g, " ")}
                      </Text>
                      <View style={s.distBarRow}>
                        <View
                          style={[
                            s.distBar,
                            {
                              width: `${Math.min((val / Math.max(...Object.values(a.weekDistribution as Record<string, number>))) * 100, 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={s.distVal}>{val}</Text>
                    </View>
                  )
                )}
              </View>
            </View>
          )}

          {/* Logout */}
          <Pressable
            style={({ pressed }) => [s.logoutBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={16} color="#EF4444" />
            <Text style={s.logoutText}>Sign Out</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1A1A2E" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1A1A2E" },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  progressCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#fff",
  },
  progressPct: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#80B19A",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#80B19A",
  },
  distCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  distKey: {
    width: 100,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    textTransform: "capitalize",
  },
  distBarRow: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  distBar: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#E76E50",
  },
  distVal: {
    width: 30,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    textAlign: "right",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EF444440",
    backgroundColor: "#EF444415",
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#EF4444",
  },
});
