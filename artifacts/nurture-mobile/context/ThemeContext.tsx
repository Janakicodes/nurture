import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  resolvedScheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: "system",
  setPreference: () => {},
  resolvedScheme: "light",
});

const STORAGE_KEY = "@nurture:theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? "light";
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === "light" || val === "dark" || val === "system") {
        setPreferenceState(val);
      }
    });
  }, []);

  function setPreference(p: ThemePreference) {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p);
  }

  const resolvedScheme: "light" | "dark" =
    preference === "system" ? systemScheme : preference;

  return (
    <ThemeContext.Provider value={{ preference, setPreference, resolvedScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
