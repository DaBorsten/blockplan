import { Specialization } from "@/types/specialization";

export type TimetableDatabase = {
  id: string;
  week_id: string;
  specialization: Specialization;
  week: string;
  day: string;
  hour: number;
  class: string;
  subject: string;
  teacher: string;
  room: string;
  notes: string | null;
};
