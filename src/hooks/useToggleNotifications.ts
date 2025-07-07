// useToggleNotifications.ts
import { useNotificationStore } from "@/store/useNotificationStore";
import { requestPermissionsAndSetupChannel } from "@/utils/notifications";
import { Linking } from "react-native";

export function useToggleNotifications() {
  const { notificationConfig, setNotificationConfig } = useNotificationStore();

  const toggle = async () => {
    if (!notificationConfig.notificationsEnabled) {
      const hasPermission = await requestPermissionsAndSetupChannel();

      if (!hasPermission) {
        await Linking.openSettings();
        return;
      } else {
        setNotificationConfig({
          ...notificationConfig,
          notificationsEnabled: true,
        });
        return;
      }
    }

    setNotificationConfig({
      ...notificationConfig,
      notificationsEnabled: false,
    });
  };

  return toggle;
}
