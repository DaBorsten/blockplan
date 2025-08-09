import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { teacherColors as defaultTeacherColors } from "@/constants/teacherColors";
import { TeacherColorsType } from "@/types/teacherColors";

type teacherColor = {
  id: string;
  teacher: string | null;
  color: string | null;
};

type TeacherColorState = {
  teacherColors: teacherColor[] | null;
  getColor: (teacher: string) => string | null;
  addTeacher: () => void;
  updateTeacher: (oldTeacher: string, newTeacher: string) => void;
  updateColor: (id: string, color: string) => void;
  removeTeacher: (id: string) => void;
  resetToDefaults: () => void;
  alreadyExists: (teacherColor: TeacherColorsType) => boolean;
};

export const useTeacherColorStore = create(
  persist<TeacherColorState>(
    (set, get) => ({
      teacherColors: defaultTeacherColors,
      getColor: (teacher: string) => {
        return (
          get().teacherColors?.find((t) => t.teacher === teacher)?.color ?? null
        );
      },

      addTeacher: () => {
        set((state) => {
          const teacherColors = state.teacherColors ?? [];
          teacherColors.push({
            id: crypto.randomUUID(),
            teacher: null,
            color: null,
          });
          return { teacherColors: teacherColors };
        });
      },

      updateTeacher: (id, newTeacher) => {
        set((state) => {
          const teacherColors = state.teacherColors ?? [];
          const existingIndex = teacherColors.findIndex((t) => t.id === id);
          const updatedTeacherColors = [...teacherColors];

          if (existingIndex !== -1) {
            updatedTeacherColors[existingIndex] = {
              ...updatedTeacherColors[existingIndex],
              teacher: newTeacher.trim(),
            };
          }

          return { teacherColors: updatedTeacherColors };
        });
      },

      updateColor: (id, color) => {
        set((state) => {
          const teacherColors = state.teacherColors ?? [];
          const existingIndex = teacherColors.findIndex((t) => t.id === id);
          const updatedTeacherColors = [...teacherColors];

          if (existingIndex !== -1) {
            updatedTeacherColors[existingIndex] = {
              ...updatedTeacherColors[existingIndex],
              color: color,
            };
          }

          return { teacherColors: updatedTeacherColors };
        });
      },

      removeTeacher: (id) => {
        set((state) => ({
          teacherColors: state.teacherColors?.filter((t) => t.id !== id),
        }));
      },

      resetToDefaults: () => {
        set(() => {
          return { teacherColors: [...defaultTeacherColors] };
        });
      },

      alreadyExists: (teacherColor) => {
        const { teacherColors } = get();
        if (!teacherColors) return false;

        return teacherColors.some(
          (t) =>
            t.teacher?.trim() === teacherColor.teacher?.trim() &&
            t.id !== teacherColor.id,
        );
      },
    }),
    {
      name: "teacher-color-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
