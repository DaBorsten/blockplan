import { NotificationConfig } from "@/interfaces/notificationConfig";
import * as Notifications from "expo-notifications";
import * as SQLite from "expo-sqlite";
import { Linking, Platform } from "react-native";
import { hourToTimeMap } from "@/constants/hourToTimeMap";

// Map der deutschen Wochentage zu ihren numerischen Äquivalenten für JavaScript Date
const dayMap = {
  Montag: 1,
  Dienstag: 2,
  Mittwoch: 3,
  Donnerstag: 4,
  Freitag: 5,
  Samstag: 6,
  Sonntag: 0,
};

// Map der numerischen Wochentage zu deutschen Namen
const dayNumberToNameMap = {
  0: "Sonntag",
  1: "Montag",
  2: "Dienstag",
  3: "Mittwoch",
  4: "Donnerstag",
  5: "Freitag",
  6: "Samstag",
};

/**
 * Plant Benachrichtigungen für alle Stunden des ausgewählten Stundenplans
 * @param {string} notificationConfig - Die ID des ausgewählten Stundenplans
 * @param {Object} db - SQLite Datenbank-Objekt
 */
export async function scheduleWeeklyNotifications(
  db: SQLite.SQLiteDatabase,
  notificationConfig: NotificationConfig,
) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (
      !notificationConfig.notificationsEnabled ||
      !notificationConfig.weekId
    ) {
      console.log("Deaktiviert oder keine Woche ausgewählt");
      return;
    }

    const permissionStatus = await requestPermissionsAndSetupChannel();

    if (!permissionStatus) {
      await Linking.openSettings();
      console.log(
        "Benachrichtigungen konnten nicht aktiviert werden: Keine Berechtigung",
      );
      return;
    }

    const now = new Date();
    const entries = await loadEntries(db, notificationConfig);

    if (entries.length === 0) {
      return;
    }

    const currentDayOfWeek = now.getDay();
    const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6;

    for (const entry of entries) {
      const target = getNotificationTime(
        entry,
        now,
        currentDayOfWeek,
        isWeekend,
        notificationConfig.notificationOffsetMinutes,
      );

      if (target) {
        await scheduleNotification(
          entry,
          target.notificationDate,
          target.targetDate,
          target.immediate, // NEU!
        );
      }
    }

    console.log("Alle Benachrichtigungen wurden geplant.");
  } catch (error) {
    console.error("Fehler beim Planen der Benachrichtigungen:", error);
  }
}

async function loadEntries(
  db: SQLite.SQLiteDatabase,
  config: NotificationConfig,
): Promise<any[]> {
  try {
    // Relevante Spezialisierungen je nach Konfiguration
    let specializationIds: number[];
    if (config.specialization === 1) {
      specializationIds = [1, 2, 3];
    } else if (config.specialization === 2) {
      specializationIds = [1, 2];
    } else if (config.specialization === 3) {
      specializationIds = [1, 3];
    } else {
      specializationIds = [config.specialization];
    }

    const placeholders = specializationIds.map(() => "?").join(",");

    const result = await db.getAllAsync(
      `
      SELECT t.*, ts.specialization, tw.class
      FROM timetable t
      JOIN timetable_specialization ts ON t.id = ts.timetable_id
      JOIN timetable_week tw ON t.week_id = tw.id
      WHERE t.week_id = ? AND ts.specialization IN (${placeholders})
      ORDER BY t.day, t.hour
      `,
      [config.weekId, ...specializationIds],
    );

    return Array.isArray(result)
      ? result
      : result?.rows?._array ?? result?._array ?? result?.rows ?? [];
  } catch (error) {
    console.error("Fehler beim Laden der Stundenplan-Einträge:", error);
    return [];
  }
}

function getNotificationTime(
  entry: any,
  now: Date,
  currentDayOfWeek: number,
  isWeekend: boolean,
  offsetMinutes: number,
): { targetDate: Date; notificationDate: Date; immediate: boolean } | null {
  const { day, hour, startTime } = entry;
  const dayNumber = dayMap[day];

  if (dayNumber === undefined || !startTime) {
    console.warn(`Ungültiger Eintrag – Tag: ${day}, Stunde: ${hour}`);
    return null;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  let daysUntil = dayNumber - currentDayOfWeek;
  const targetDate = new Date(now);

  if (isWeekend) {
    if (daysUntil <= 0) daysUntil += 7;
  } else {
    const tempDate = new Date(now);
    tempDate.setDate(now.getDate() + daysUntil);
    tempDate.setHours(startHour, startMinute, 0, 0);

    if (daysUntil < 0 || (daysUntil === 0 && tempDate <= now)) {
      return null;
    }
  }

  targetDate.setDate(now.getDate() + daysUntil);
  targetDate.setHours(startHour, startMinute, 0, 0);

  const notificationDate = new Date(targetDate.getTime());
  notificationDate.setMinutes(notificationDate.getMinutes() - offsetMinutes);

  const immediate = notificationDate <= now && now < targetDate; // aktueller Zeitpunkt liegt im Benachrichtigungszeitraum

  if (immediate || notificationDate > now) {
    return { targetDate, notificationDate, immediate };
  }

  return null;
}

async function scheduleNotification(
  entry: any,
  notificationDate: Date,
  targetDate: Date,
  immediate: boolean,
): Promise<boolean> {
  const {
    subject,
    room,
    teacher,
    class: className,
    hour,
    startTime,
    endTime,
  } = entry;

  const formattedDay = dayNumberToNameMap[targetDate.getDay()];
  const notificationId = `${entry.day}-${hour}-${subject}-${room}`;

  try {
    const notificationContent = {
      title: `📚 ${subject} / ${teacher}  |  Raum: ${room}`,
      body: `🗓️ ${formattedDay}: ${startTime} - ${endTime}\n🕗 ${hour}. Stunde`,
      data: {
        subject,
        room,
        teacher,
        className,
        hour,
        startTime,
        endTime,
        day: formattedDay,
      },
    };

    // Für sofortige Benachrichtigungen
    if (immediate) {
      // Bei sofortigen Benachrichtigungen ein leeres Objekt als Trigger verwenden
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: notificationContent,
        trigger: null,
      });
    } else {
      // Für geplante Benachrichtigungen
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: notificationContent,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate,
        },
      });
    }

    console.log(
      immediate
        ? `📢 Sofortige Benachrichtigung gesendet für ${formattedDay}, ${subject} (${startTime})`
        : `⏰ Benachrichtigung geplant für ${formattedDay}, ${subject} (${startTime}) um ${notificationDate.toLocaleTimeString(
            "de-DE",
            { timeStyle: "short" },
          )}`,
    );

    return true;
  } catch (err) {
    console.error(
      `Fehler beim Planen der Benachrichtigung für ${subject}:`,
      err,
    );
    return false;
  }
}

/**
 * Funktion zum Abbrechen aller geplanten Benachrichtigungen
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log("Alle geplanten Benachrichtigungen wurden gelöscht.");
}

/**
 * Optional: Funktion zum Anzeigen aller aktuell geplanten Benachrichtigungen (für Debug-Zwecke)
 */
export async function listScheduledNotifications() {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();

  // Sortieren nach Datum (trigger.value ist in Millisekunden)
  notifications.sort((a, b) => a.trigger.value - b.trigger.value);

  console.log(`Anzahl geplanter Benachrichtigungen: ${notifications.length}`);

  // Gruppieren nach Datum (nur Tag, ohne Uhrzeit)
  const grouped: Record<string, typeof notifications> = {};
  notifications.forEach((notification) => {
    const day = new Date(notification.trigger.value).toLocaleDateString(
      "de-DE",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(notification);
  });

  // Ausgabe
  Object.entries(grouped).forEach(([day, notifications]) => {
    console.log(`\n📅 ${day}`);
    notifications.forEach((notification, index) => {
      const time = new Date(notification.trigger.value).toLocaleTimeString(
        "de-DE",
      );
      console.log(`  ${index + 1}. ${notification.content.title} um ${time}`);
    });
  });

  return notifications;
}

export async function requestPermissionsAndSetupChannel() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("stundenplan", {
        name: "Stundenplan",
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      const channel = await Notifications.getNotificationChannelAsync(
        "stundenplan",
      );

      const { status } = await Notifications.requestPermissionsAsync();

      if (
        (channel &&
          channel.importance === Notifications.AndroidImportance.NONE) ||
        status !== "granted"
      ) {
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error(err);
  }
}
