import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useNotificationStore } from "@/store/useNotificationStore";

export function useNotificationPermissionChecker() {
  const { notificationConfig, setNotificationConfig } = useNotificationStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const checkPermission = async () => {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("stundenplan", {
          name: "Stundenplan",
          importance: Notifications.AndroidImportance.DEFAULT,
        });

        const channel = await Notifications.getNotificationChannelAsync(
          "stundenplan",
        );
        const status = await Notifications.getPermissionsAsync();

        if (
          channel?.importance === Notifications.AndroidImportance.NONE ||
          status.status !== "granted"
        ) {
          if (notificationConfig.notificationsEnabled) {
            setNotificationConfig({
              ...notificationConfig,
              notificationsEnabled: false,
            });
          }
        }
      }
    };

    checkPermission();

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (appState.current === "background" && nextAppState === "active") {
          checkPermission();
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [notificationConfig, setNotificationConfig]);
}
