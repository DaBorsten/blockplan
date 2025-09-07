import { Group } from "@/types/group";

export type TimetableDatabase = {
  id: string;
  week_id: string;
  group: Group;
  week: string;
  day: string;
  hour: number;
  class: string;
  subject: string;
  teacher: string;
  room: string;
  notes: string | null;
};
