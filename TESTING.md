# Tests für Blockplan

Dieses Projekt verwendet **Bun's integriertes Testing-Framework** für Unit-Tests.

## Test-Dateien

Tests befinden sich jeweils neben den zu testenden Dateien mit der Endung `.test.ts`:

### Utils Tests
- `src/utils/colorDark.test.ts` - Tests für die Farbhelligkeits-Erkennung
- `src/utils/groups.test.ts` - Tests für die Gruppen-Auflösungs-Logik
- `src/utils/withGray700Over40.test.ts` - Tests für Farbmischungs-Algorithmus
- `src/utils/times.test.ts` - Tests für Zeitberechnungen im Stundenplan

### Library Tests
- `src/lib/utils.test.ts` - Tests für allgemeine Utility-Funktionen (cn, classNames)

### Store Tests
- `src/store/useWeekStore.test.ts` - Tests für Week-Store
- `src/store/useClassStore.test.ts` - Tests für Class-Store mit Cross-Store-Interaktion

## Tests ausführen

```bash
# Alle Tests ausführen
bun test

# Tests im Watch-Modus (automatisch bei Änderungen)
bun test --watch

# Nur bestimmte Test-Datei ausführen
bun test src/utils/colorDark.test.ts

# Tests mit Coverage
bun test --coverage
```

## Test-Struktur

Alle Tests folgen einem einheitlichen Muster:

```typescript
import { describe, test, expect } from "bun:test";
import { functionToTest } from "./moduleToTest";

describe("functionToTest", () => {
  test("sollte erwartetes Verhalten zeigen", () => {
    const result = functionToTest(input);
    expect(result).toBe(expectedOutput);
  });
});
```

## Wichtige Funktionen

### Utils
- **`isColorDark(color: string)`** - Bestimmt ob eine Hex-Farbe dunkel ist
- **`resolveGroupIds(g: number)`** - Löst Gruppennummern zu Arrays auf
- **`withGray700Over40(bgHex: string)`** - Mischt Farben mit Gray-700 Overlay
- **`getTimeForHour(hour, lesson, allLessons)`** - Berechnet Zeiten mit Doppelstunden-Logik
- **`getTimesForTimetable(...)`** - Generiert formatierte Zeitangaben für Stundenplan

### Lib
- **`cn(...inputs)`** - Kombiniert und merged Tailwind CSS Klassen

### Stores
- **`useWeekStore`** - Zustand für aktuell ausgewählte Woche
- **`useClassStore`** - Zustand für aktuell ausgewählte Klasse (mit automatischem Week-Reset)

## Best Practices

1. **Reine Funktionen zuerst testen** - Utils und Hilfsfunktionen sind am einfachsten zu testen
2. **Edge Cases abdecken** - null, undefined, leere Strings, Grenzwerte
3. **Store-Interaktionen testen** - Besonders wichtig bei Cross-Store-Dependencies
4. **beforeEach für Store-Tests** - Immer Stores vor jedem Test zurücksetzen
5. **Test-Isolation sicherstellen** - Tests sollten keinen gemeinsamen State teilen und unabhängig voneinander laufen können
6. **Mocking strategisch einsetzen** - Externe Dependencies mocken (API-Calls, DB-Zugriffe); bei einfacher Business-Logic Integration-Tests bevorzugen
7. **Beschreibende Test-Namen** - Namen sollten Intent und erwartetes Verhalten klar kommunizieren (z.B. "sollte weekId zurücksetzen wenn classId sich ändert")

## Nächste Schritte

Potenzielle Bereiche für weitere Tests:

- [ ] Convex Queries/Mutations (mit Mocking)
- [ ] React Components (mit @testing-library/react)
- [ ] API Routes (mit Mocking)
- [ ] Integration Tests für komplette User-Flows
