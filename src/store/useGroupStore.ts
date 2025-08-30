import { create } from "zustand";
import { persist } from "zustand/middleware";

// Group Store
type GroupState = {
  group: number; // 1=Alle, 2=A, 3=B
  setGroup: (g: number) => void;
  clearGroup: () => void;
};

export const useGroupStore = create<GroupState>()(
  persist(
    (set) => ({
      group: 1,
      setGroup: (g) => set({ group: g }),
      clearGroup: () => set({ group: 1 }),
    }),
    {
      name: "group-storage",
      version: 1,
    },
  ),
);

// Convenience hooks
export const useCurrentGroup = () => useGroupStore((s) => s.group);
export const useSetGroup = () => useGroupStore((s) => s.setGroup);
