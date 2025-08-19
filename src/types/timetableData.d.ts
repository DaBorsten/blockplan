import { Specialization } from "@/types/specialization";

export type Lesson = {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  notes: string | null;
  hour: number;
  startTime: string;
  endTime: string;
  specialization: Specialization;
  week_id: string;
  day: string;
};

export type LessonForImport = {
  subject: string;
  teacher: string;
  room: string;
  specialization: Specialization;
};

export type HourForImport = LessonForImport[];

export type DayScheduleForImport = {
  "1"?: HourForImport;
  "2"?: HourForImport;
  "3"?: HourForImport;
  "4"?: HourForImport;
  "5"?: HourForImport;
  "6"?: HourForImport;
  "7"?: HourForImport;
  "8"?: HourForImport;
  "9"?: HourForImport;
  "10"?: HourForImport;
};

export type TimetableForClassForImport = {
  Montag: DayScheduleForImport;
  Dienstag: DayScheduleForImport;
  Mittwoch: DayScheduleForImport;
  Donnerstag: DayScheduleForImport;
  Freitag: DayScheduleForImport;
};

export type TimetableForImport = {
  class: string;
  timetable: TimetableForClassForImport;
};
