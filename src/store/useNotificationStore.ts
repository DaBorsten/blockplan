import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationConfig } from "@/interfaces/notificationConfig";
import * as SQLite from "expo-sqlite";
import { scheduleWeeklyNotifications } from "@/utils/notifications";
import { ToastAndroid } from "react-native";

// Vollständiger State
interface NotificationState {
  notificationConfig: NotificationConfig;
  db: SQLite.SQLiteDatabase | null;
  setDb: (db: SQLite.SQLiteDatabase) => void;
  setNotificationConfig: (config: NotificationConfig) => void;
  rescheduleNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notificationConfig: {
        specialization: 1,
        weekId: null,
        notificationOffsetMinutes: 15,
        notificationsEnabled: false,
      },
      db: null,
      setDb: (db) => {
        set({ db });
      },
      setNotificationConfig: (config) => {
        const prevConfig = get().notificationConfig;

        const configChanged =
          prevConfig.specialization !== config.specialization ||
          prevConfig.weekId !== config.weekId ||
          prevConfig.notificationOffsetMinutes !==
            config.notificationOffsetMinutes ||
          prevConfig.notificationsEnabled !== config.notificationsEnabled;

        // Nur wenn es nicht der erste Load ist UND sich etwas geändert hat, neu planen
        if (configChanged) {
          // Config aktualisieren
          set({
            notificationConfig: config,
          });

          if (prevConfig.notificationsEnabled !== config.notificationsEnabled) {
            ToastAndroid.show(
              `Benachrichtigungen ${
                config.notificationsEnabled ? "aktiviert" : "deaktiviert"
              }`,
              ToastAndroid.SHORT,
            );
          }

          get().rescheduleNotifications();
        }
      },
      rescheduleNotifications: async () => {
        const config = get().notificationConfig;
        if (get().db !== null) {
          await scheduleWeeklyNotifications(get().db, config);
        }
      },
    }),
    {
      name: "notification-config-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notificationConfig: state.notificationConfig,
      }),
    },
  ),
);

// Hook für die explizite manuelle Neuplanung aller Benachrichtigungen
export const useRescheduleNotifications = () => {
  const rescheduleNotifications = useNotificationStore(
    (state) => state.rescheduleNotifications,
  );
  return rescheduleNotifications;
};
