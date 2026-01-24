import { describe, test, expect, beforeEach, beforeAll, afterAll } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { Window } from "happy-dom";
import { useClassStore, useCurrentClass, useSetClass } from "./useClassStore";
import { useWeekStore } from "./useWeekStore";
import type { Id } from "../../convex/_generated/dataModel";

// Setup DOM environment for React hooks
let happyWindow: Window;
let originalWindow: typeof globalThis.window;
let originalDocument: typeof globalThis.document;

beforeAll(() => {
  happyWindow = new Window();
  originalWindow = globalThis.window;
  originalDocument = globalThis.document;
  // @ts-expect-error - DOM setup for testing
  globalThis.window = happyWindow;
  // @ts-expect-error - DOM setup for testing
  globalThis.document = happyWindow.document;
});

afterAll(async () => {
  // Flush any pending React updates using act
  await act(async () => {
    // Wait for all pending timers and state updates
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  
  // Clean up DOM environment
  happyWindow.close();
  globalThis.window = originalWindow;
  globalThis.document = originalDocument;
});


describe("useClassStore", () => {
  // Reset stores vor jedem Test
  beforeEach(() => {
    useClassStore.setState({ classId: null });
    useWeekStore.setState({ weekId: null });
  });

  test("sollte initial null sein", () => {
    const state = useClassStore.getState();
    expect(state.classId).toBeNull();
  });

  test("sollte classId setzen können", () => {
    const store = useClassStore.getState();
    const testClassId = "class123" as Id<"classes">;

    store.setClass(testClassId);

    const state = useClassStore.getState();
    expect(state.classId).toBe(testClassId);
  });

  test("sollte classId überschreiben können", () => {
    const store = useClassStore.getState();
    const classId1 = "class1" as Id<"classes">;
    const classId2 = "class2" as Id<"classes">;

    store.setClass(classId1);
    expect(useClassStore.getState().classId).toBe(classId1);

    store.setClass(classId2);
    expect(useClassStore.getState().classId).toBe(classId2);
  });

  test("sollte null als classId akzeptieren", () => {
    const store = useClassStore.getState();
    const testClassId = "class123" as Id<"classes">;

    store.setClass(testClassId);
    expect(useClassStore.getState().classId).toBe(testClassId);

    store.setClass(null);
    expect(useClassStore.getState().classId).toBeNull();
  });

  test("sollte weekStore zurücksetzen wenn classId sich ändert", () => {
    const classStore = useClassStore.getState();
    const weekStore = useWeekStore.getState();
    const classId1 = "class1" as Id<"classes">;
    const classId2 = "class2" as Id<"classes">;

    // Setze eine Week
    weekStore.setWeek("week123" as Id<"weeks">);
    expect(useWeekStore.getState().weekId).toBe("week123" as Id<"weeks">);

    // Setze erste Klasse
    classStore.setClass(classId1);
    expect(useWeekStore.getState().weekId).toBeNull();

    // Setze Week wieder
    weekStore.setWeek("week456" as Id<"weeks">);
    expect(useWeekStore.getState().weekId).toBe("week456" as Id<"weeks">);

    // Ändere Klasse
    classStore.setClass(classId2);
    expect(useWeekStore.getState().weekId).toBeNull();
  });

  test("sollte weekStore NICHT zurücksetzen wenn classId gleich bleibt", () => {
    const classStore = useClassStore.getState();
    const weekStore = useWeekStore.getState();
    const classId = "class1" as Id<"classes">;

    // Setze Klasse und Week
    classStore.setClass(classId);
    weekStore.setWeek("week123" as Id<"weeks">);
    expect(useWeekStore.getState().weekId).toBe("week123" as Id<"weeks">);

    // Setze dieselbe Klasse nochmal
    classStore.setClass(classId);
    
    // Week sollte NICHT zurückgesetzt werden
    expect(useWeekStore.getState().weekId).toBe("week123" as Id<"weeks">);
  });

  test("sollte Class und Week mit clearClass zurücksetzen", () => {
    const classStore = useClassStore.getState();
    const weekStore = useWeekStore.getState();
    const testClassId = "class456" as Id<"classes">;

    classStore.setClass(testClassId);
    weekStore.setWeek("week789" as Id<"weeks">);

    expect(useClassStore.getState().classId).toBe(testClassId);
    expect(useWeekStore.getState().weekId).toBe("week789" as Id<"weeks">);

    classStore.clearClass();

    expect(useClassStore.getState().classId).toBeNull();
    expect(useWeekStore.getState().weekId).toBeNull();
  });

  test("sollte mehrere Operationen nacheinander verarbeiten", () => {
    const classStore = useClassStore.getState();
    const class1 = "class1" as Id<"classes">;
    const class2 = "class2" as Id<"classes">;

    classStore.setClass(class1);
    classStore.setClass(class2);
    classStore.clearClass();
    classStore.setClass(class1);

    expect(useClassStore.getState().classId).toBe(class1);
  });
});

describe("Convenience Hooks", () => {
  // Reset stores vor jedem Test für Isolation
  beforeEach(() => {
    useClassStore.setState({ classId: null });
    useWeekStore.setState({ weekId: null });
  });

  test("useCurrentClass sollte die aktuelle classId aus useClassStore zurückgeben", () => {
    // Setze eine Test-classId im Store
    const testClassId = "test-class-123" as Id<"classes">;
    useClassStore.setState({ classId: testClassId });

    // Rendere die Hook und prüfe den Rückgabewert
    const { result } = renderHook(() => useCurrentClass());
    expect(result.current).toBe(testClassId);
  });

  test("useCurrentClass sollte null zurückgeben wenn keine Klasse ausgewählt ist", () => {
    // Setze classId auf null
    useClassStore.setState({ classId: null });

    // Rendere die Hook und prüfe den Rückgabewert
    const { result } = renderHook(() => useCurrentClass());
    expect(result.current).toBeNull();
  });

  test("useSetClass sollte einen Setter zurückgeben der useClassStore.classId updated", () => {
    // Initial state: keine Klasse
    useClassStore.setState({ classId: null });
    useWeekStore.setState({ weekId: null });

    // Rendere die Hook um den Setter zu erhalten
    const { result } = renderHook(() => useSetClass());
    const setClass = result.current;

    // Verwende den Setter um eine Klasse zu setzen
    const newClassId = "new-class-456" as Id<"classes">;
    act(() => {
      setClass(newClassId);
    });

    // Prüfe dass der Store aktualisiert wurde
    expect(useClassStore.getState().classId).toBe(newClassId);
  });

  test("useSetClass sollte die weekId zurücksetzen wenn eine andere Klasse gesetzt wird", () => {
    // Setze initial eine Klasse und Woche
    const oldClassId = "old-class-789" as Id<"classes">;
    const weekId = "week-123" as Id<"weeks">;
    useClassStore.setState({ classId: oldClassId });
    useWeekStore.setState({ weekId });

    // Rendere die Hook um den Setter zu erhalten
    const { result } = renderHook(() => useSetClass());
    const setClass = result.current;

    // Setze eine neue Klasse
    const newClassId = "new-class-999" as Id<"classes">;
    act(() => {
      setClass(newClassId);
    });

    // Prüfe dass die weekId zurückgesetzt wurde
    expect(useWeekStore.getState().weekId).toBeNull();
  });
});
