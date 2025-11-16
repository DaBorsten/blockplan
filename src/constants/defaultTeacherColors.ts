export const DEFAULT_TEACHER_COLORS = [
  { teacher: "BoTo", color: "#FFFF00" },
  { teacher: "BuMi", color: "#7030A0" },
  { teacher: "GeRo", color: "#92D050" },
  { teacher: "GrTh", color: "#FF66FF" },
  { teacher: "DeSt", color: "#D9D9D9" },
  { teacher: "KaRi", color: "#003300" },
  { teacher: "KlCh", color: "#BFBF00" },
  { teacher: "MaJo", color: "#833C0C" },
  { teacher: "MaMa", color: "#6D9B3B" },
  { teacher: "NeAd", color: "#808000" },
  { teacher: "PaMa", color: "#0070C0" },
  { teacher: "ReEv", color: "#0083B3" },
  { teacher: "ReRo", color: "#FF0000" },
  { teacher: "ScCh", color: "#FFC000" },
  { teacher: "WaFl", color: "#FCE4D6" },
  { teacher: "WaMa", color: "#00B0F0" },
  { teacher: "WeCh", color: "#203764" },
  { teacher: "HiSt", color: "#FFB2FF" },
  { teacher: "BaMa", color: "#BFDBEF" },
] as const satisfies ReadonlyArray<{ teacher: string; color: `#${string}` }>;

export type TeacherCode = (typeof DEFAULT_TEACHER_COLORS)[number]["teacher"];
export type TeacherColor = (typeof DEFAULT_TEACHER_COLORS)[number]["color"];
export const DEFAULT_TEACHER_COLORS_MAP = Object.freeze(
  DEFAULT_TEACHER_COLORS.reduce(
    (acc, { teacher, color }) => {
      acc[teacher] = color;
      return acc;
    },
    Object.create(null) as Record<TeacherCode, TeacherColor>,
  ),
) as Readonly<Record<TeacherCode, TeacherColor>>;
