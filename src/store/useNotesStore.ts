import { create } from "zustand";

type NotesState = {
  notesUpdated: boolean;
  toggleNotesUpdated: () => void;
};

export const useNotesStore = create<NotesState>((set) => ({
  notesUpdated: false,
  toggleNotesUpdated: () => {
    set((state) => ({
      notesUpdated: !state.notesUpdated,
    }));
  },
}));
