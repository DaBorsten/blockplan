import { describe, test, expect, beforeEach, beforeAll, afterAll } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { Window } from "happy-dom";
import { useWeekStore, useCurrentWeek, useSetWeek } from "./useWeekStore";

// Setup DOM environment for React hooks
let happyWindow: Window;
let originalWindow: typeof globalThis.window;
let originalDocument: typeof globalThis.document;

beforeAll(() => {
  happyWindow = new Window();
  originalWindow = globalThis.window;
  originalDocument = globalThis.document;
  globalThis.window = happyWindow as unknown as typeof globalThis.window;
  globalThis.document = happyWindow.document as unknown as typeof globalThis.document;
});

afterAll(async () => {
  // Flush any pending React updates using act
  await act(async () => {
    // Wait for all pending timers and state updates
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  
  // Clean up DOM environment
  globalThis.window = originalWindow;
  globalThis.document = originalDocument;
  happyWindow.close();
});

describe("useWeekStore", () => {
  // Reset store vor jedem Test
  beforeEach(() => {
    useWeekStore.setState({ weekId: null });
  });

  test("sollte initial null sein", () => {
    const state = useWeekStore.getState();
    expect(state.weekId).toBeNull();
  });

  test("sollte weekId setzen können", () => {
    const store = useWeekStore.getState();
    const testWeekId = "week123";

    store.setWeek(testWeekId);

    const state = useWeekStore.getState();
    expect(state.weekId).toBe(testWeekId);
  });

  test("sollte weekId überschreiben können", () => {
    const store = useWeekStore.getState();

    store.setWeek("week1");
    expect(useWeekStore.getState().weekId).toBe("week1");

    store.setWeek("week2");
    expect(useWeekStore.getState().weekId).toBe("week2");
  });

  test("sollte null als weekId akzeptieren", () => {
    const store = useWeekStore.getState();

    store.setWeek("week123");
    expect(useWeekStore.getState().weekId).toBe("week123");

    store.setWeek(null);
    expect(useWeekStore.getState().weekId).toBeNull();
  });

  test("sollte Week mit clearWeek zurücksetzen", () => {
    const store = useWeekStore.getState();

    store.setWeek("week456");
    expect(useWeekStore.getState().weekId).toBe("week456");

    store.clearWeek();
    expect(useWeekStore.getState().weekId).toBeNull();
  });

  test("sollte mehrere Operationen nacheinander verarbeiten", () => {
    const store = useWeekStore.getState();

    store.setWeek("week1");
    store.setWeek("week2");
    store.clearWeek();
    store.setWeek("week3");

    expect(useWeekStore.getState().weekId).toBe("week3");
  });
});

describe("Convenience Hooks", () => {
  beforeEach(() => {
    useWeekStore.setState({ weekId: null });
  });

  test("useCurrentWeek sollte initial null zurückgeben", () => {
    const { result } = renderHook(() => useCurrentWeek());
    expect(result.current).toBeNull();
  });

  test("useCurrentWeek sollte gesetztes weekId zurückgeben", () => {
    const testWeekId = "week123";
    useWeekStore.setState({ weekId: testWeekId });

    const { result } = renderHook(() => useCurrentWeek());
    expect(result.current).toBe(testWeekId);
  });

  test("useSetWeek sollte eine Funktion zurückgeben", () => {
    const { result } = renderHook(() => useSetWeek());
    expect(typeof result.current).toBe("function");
  });

  test("useSetWeek sollte weekId im Store aktualisieren", () => {
    const { result } = renderHook(() => useSetWeek());
    const testWeekId = "week456";

    act(() => {
      result.current(testWeekId);
    });

    expect(useWeekStore.getState().weekId).toBe(testWeekId);
  });

  test("useSetWeek sollte weekId auf null setzen können", () => {
    useWeekStore.setState({ weekId: "week123" });

    const { result } = renderHook(() => useSetWeek());

    act(() => {
      result.current(null);
    });

    expect(useWeekStore.getState().weekId).toBeNull();
  });

  test("useCurrentWeek sollte auf State-Änderungen reagieren", () => {
    const { result } = renderHook(() => useCurrentWeek());
    
    expect(result.current).toBeNull();

    act(() => {
      useWeekStore.getState().setWeek("week789");
    });

    // Hook sollte automatisch re-rendern da es via useWeekStore(selector) subscribes
    expect(result.current).toBe("week789");
  });

  test("useSetWeek und useCurrentWeek sollten zusammen funktionieren", () => {
    const { result: currentWeek } = renderHook(() => useCurrentWeek());
    const { result: setWeek } = renderHook(() => useSetWeek());

    expect(currentWeek.current).toBeNull();

    act(() => {
      setWeek.current("weekABC");
    });

    // Verifiziere dass die ursprüngliche Hook-Instanz automatisch aktualisiert wird
    expect(currentWeek.current).toBe("weekABC");
  });
});
