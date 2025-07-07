import AsyncStorage from "@react-native-async-storage/async-storage";

export async function clearAllData() {
  try {
    await AsyncStorage.clear();
    console.log("Alle Daten wurden erfolgreich gelöscht.");
  } catch (e) {
    console.error("Fehler beim Löschen der Daten:", e);
  }
}

export async function logAllAsyncStorageData() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(keys);

    console.log(`${keys.length} keys`);

    entries.forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  } catch (e) {
    console.error("Fehler beim Auslesen von AsyncStorage:", e);
  }
}
