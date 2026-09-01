import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  recordAnalyticsEvent,
  type AnalyticsEventInputEventType,
} from "@workspace/api-client-react";

const CONSENT_KEY = "@nurture:anonymous-analytics-consent";

export type AnalyticsEvent = AnalyticsEventInputEventType;

export async function getAnalyticsConsent(): Promise<boolean> {
  return (await AsyncStorage.getItem(CONSENT_KEY)) === "true";
}

export async function setAnalyticsConsent(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, enabled ? "true" : "false");
}

export async function trackAnonymousEvent(eventType: AnalyticsEvent): Promise<void> {
  if (!(await getAnalyticsConsent())) return;
  try {
    await recordAnalyticsEvent({ eventType });
  } catch {
    // Analytics must never affect the private journey or surface an error.
  }
}