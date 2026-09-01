import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function AdminLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#1A1A2E" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
        contentStyle: { backgroundColor: "#1A1A2E" },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Admin", headerShown: false }} />
      <Stack.Screen name="index" options={{ title: "Admin Dashboard" }} />
    </Stack>
  );
}
