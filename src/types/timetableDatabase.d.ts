import { Specialization } from "@/store/useSpecializationStore";

export type TimetableDatabase = {
  id: string;
  week_id: string;
  specialization: Specialization;
  week: string;
  day: string;
  hour: int;
  class: string;
  subject: string;
  teacher: string;
  room: string;
  notes: string | null;
};
