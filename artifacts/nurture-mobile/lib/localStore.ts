import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type Appointment,
  type CreateAppointmentBody,
  type CreateProfileBody,
  type CreateSymptomLogBody,
  type KickSession,
  type Profile,
  type SymptomLog,
  type UpdateAppointmentBody,
  type UpdateProfileBody,
} from "@workspace/api-client-react";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "@nurture:private-health-data";

export type LocalState = {
  profile: Profile | null;
  kicks: KickSession[];
  symptoms: SymptomLog[];
  appointments: Appointment[];
  hydrated: boolean;
};

const EMPTY_STATE: LocalState = {
  profile: null,
  kicks: [],
  symptoms: [],
  appointments: [],
  hydrated: false,
};

let state: LocalState = EMPTY_STATE;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function persist() {
  const { hydrated: _hydrated, ...data } = state;
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function update(next: Partial<LocalState>) {
  state = { ...state, ...next };
  persist();
  notify();
}

function nextId(items: Array<{ id: number }>) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function dateOnly(date: Date) {
  return date.toISOString().split("T")[0];
}

function computePregnancyDates(dueDate: string) {
  const due = new Date(`${dueDate}T12:00:00`);
  const lmp = new Date(due.getTime() - 280 * 86400000);
  const now = new Date();
  const currentWeek = Math.max(
    1,
    Math.min(42, Math.floor((now.getTime() - lmp.getTime()) / (7 * 86400000)) + 1),
  );
  return {
    dueDate,
    lmpDate: dateOnly(lmp),
    currentWeek,
    trimester: currentWeek <= 13 ? 1 : currentWeek <= 26 ? 2 : 3,
  };
}

export async function hydrateLocalStore() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Omit<LocalState, "hydrated">;
      state = {
        profile: parsed.profile ?? null,
        kicks: parsed.kicks ?? [],
        symptoms: parsed.symptoms ?? [],
        appointments: parsed.appointments ?? [],
        hydrated: true,
      };
    } else {
      state = { ...EMPTY_STATE, hydrated: true };
    }
  } catch {
    state = { ...EMPTY_STATE, hydrated: true };
  }
  notify();
}

export function useLocalStore() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}

export const localStore = {
  createProfile(data: CreateProfileBody) {
    const dueDate = data.dueDate ?? (
      data.lmpDate
        ? dateOnly(new Date(new Date(`${data.lmpDate}T12:00:00`).getTime() + 280 * 86400000))
        : undefined
    );
    if (!dueDate) throw new Error("Either due date or last period date is required");
    const dates = computePregnancyDates(dueDate);
    const profile: Profile = {
      id: 1,
      name: data.name,
      dueDate: dates.dueDate,
      lmpDate: data.lmpDate ?? dates.lmpDate,
      currentWeek: dates.currentWeek,
      trimester: dates.trimester,
      isFirstPregnancy: data.isFirstPregnancy,
      notificationsEnabled: data.notificationsEnabled,
      createdAt: new Date().toISOString(),
    };
    update({ profile });
    return profile;
  },

  updateProfile(data: UpdateProfileBody) {
    if (!state.profile) throw new Error("No local profile found");
    const dueDate = data.dueDate ?? state.profile.dueDate;
    const dates = computePregnancyDates(dueDate);
    const profile: Profile = {
      ...state.profile,
      ...data,
      ...dates,
      lmpDate: data.lmpDate ?? state.profile.lmpDate,
    };
    update({ profile });
    return profile;
  },

  addKick() {
    const today = dateOnly(new Date());
    const existing = state.kicks.find((kick) => kick.sessionDate === today);
    if (existing) {
      const kicks = state.kicks.map((kick) =>
        kick.id === existing.id ? { ...kick, kickCount: kick.kickCount + 1, endedAt: null } : kick,
      );
      update({ kicks });
      return kicks.find((kick) => kick.id === existing.id);
    }
    const kick: KickSession = {
      id: nextId(state.kicks),
      sessionDate: today,
      kickCount: 1,
      startedAt: new Date().toISOString(),
      endedAt: null,
      notes: null,
    };
    update({ kicks: [kick, ...state.kicks] });
    return kick;
  },

  resetTodayKicks() {
    const today = dateOnly(new Date());
    update({
      kicks: state.kicks.map((kick) =>
        kick.sessionDate === today
          ? { ...kick, kickCount: 0, endedAt: new Date().toISOString() }
          : kick,
      ),
    });
  },

  addSymptom(data: CreateSymptomLogBody) {
    const symptom: SymptomLog = {
      id: nextId(state.symptoms),
      symptomType: data.symptomType,
      severity: data.severity ?? null,
      notes: data.notes ?? null,
      loggedAt: new Date().toISOString(),
    };
    update({ symptoms: [symptom, ...state.symptoms] });
    return symptom;
  },

  deleteSymptom(id: number) {
    update({ symptoms: state.symptoms.filter((symptom) => symptom.id !== id) });
  },

  addAppointment(data: CreateAppointmentBody) {
    const appointment: Appointment = {
      id: nextId(state.appointments),
      ...data,
      appointmentTime: data.appointmentTime ?? null,
      doctorName: data.doctorName ?? null,
      location: data.location ?? null,
      notes: data.notes ?? null,
      doctorRemarks: data.doctorRemarks ?? null,
      patientQuestions: data.patientQuestions ?? null,
      status: "upcoming",
      createdAt: new Date().toISOString(),
    };
    update({ appointments: [...state.appointments, appointment] });
    return appointment;
  },

  updateAppointment(id: number, data: UpdateAppointmentBody) {
    const appointments = state.appointments.map((appointment) =>
      appointment.id === id ? { ...appointment, ...data } : appointment,
    );
    update({ appointments });
  },

  deleteAppointment(id: number) {
    update({ appointments: state.appointments.filter((appointment) => appointment.id !== id) });
  },

  clearPrivateData() {
    state = { ...EMPTY_STATE, hydrated: true };
    persist();
    notify();
  },
};