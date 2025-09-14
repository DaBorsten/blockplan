import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { allDays } from "@/constants/allDays";
import { allHours } from "@/constants/allHours";
import { hourToTimeMap } from "@/constants/hourToTimeMap";
import { isColorDark } from "@/utils/colorDark";
import { Copy, LucideNotebookText, MapPin } from "lucide-react"; // lucide-react für Web
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
// nuqs hooks for query params
import { Lesson } from "@/types/timetableData";
import { useCurrentWeek } from "@/store/useWeekStore";
import { useCurrentGroup } from "@/store/useGroupStore";
import { useCurrentClass } from "@/store/useClassStore";
import { useTeacherColors } from "@/hooks/useTeacherColors";
import { getTimesForTimetable } from "@/utils/times";
import { useModeStore } from "@/store/useModeStore";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import type { Id } from "@/../convex/_generated/dataModel";
// Note: path requires .js because convex generates ESM with extension
import { api } from "@/../convex/_generated/api.js";

type TimetableProps = {
  setActiveClickedLesson: (lesson: Lesson | null) => void;
  setActiveNotes: (notes: string | null) => void;
  setIsEditNotesModalOpen: (open: boolean) => void;
};

export function Timetable({
  setActiveClickedLesson,
  setActiveNotes,
  setIsEditNotesModalOpen,
}: TimetableProps) {
  const { resolvedTheme } = useTheme();
  const weekID = useCurrentWeek();
  const group = useCurrentGroup();
  const { mode } = useModeStore();
  const classId = useCurrentClass();
  const { getColor } = useTeacherColors(classId ?? undefined);

  const groupExpansionMap: Record<number, number[]> = {
    1: [1, 2, 3],
    2: [1, 2],
    3: [1, 3],
  };

  // Live timetable entries for selected week + group (single group filter)
  const groupExpansion = groupExpansionMap[group] ?? [group];
  const timetableRaw = useQuery(
    api.timetable.listTimetable,
    weekID && group
      ? { weekId: weekID as Id<"weeks">, groups: groupExpansion }
      : ("skip" as const),
  );

  interface TimetableEntry {
    _id: string;
    week_id: string;
    day: string;
    hour: number;
    startTime?: string;
    endTime?: string;
    subject?: string;
    teacher?: string;
    room?: string;
    notes?: string;
    groups?: number[];
  }

  const timeTableData = useMemo<Lesson[]>(() => {
    if (!timetableRaw) return [];
    return (timetableRaw as unknown as TimetableEntry[]).flatMap((entry) => {
      const groups: number[] = Array.isArray(entry.groups)
        ? (entry.groups as number[])
        : [];
      return groups.map((g) => ({
        id: String(entry._id),
        subject: String(entry.subject ?? ""),
        teacher: String(entry.teacher ?? ""),
        room: String(entry.room ?? ""),
        notes: entry.notes ? String(entry.notes) : null,
        hour: Number(entry.hour),
        startTime: String(entry.startTime ?? ""),
        endTime: String(entry.endTime ?? ""),
        group: g === 1 || g === 2 || g === 3 ? g : 1,
        week_id: String(entry.week_id),
        day: String(entry.day),
      }));
    });
  }, [timetableRaw]);

  // layout constants
  const TIME_COL_PX = 72;
  const MIN_DAY_COL_PX = 200;

  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [rowHeight, setRowHeight] = useState<number>(64); // px
  const [dayColWidth, setDayColWidth] = useState<number>(MIN_DAY_COL_PX);
  const [visibleDayCount, setVisibleDayCount] = useState<number>(5);
  const [activeSingleDayIndex, setActiveSingleDayIndex] = useState<number>(0);
  const didInitialScrollRef = useRef<boolean>(false);

  // Setze aktuellen Tag
  useEffect(() => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    const adjustedDayIndex = dayIndex >= 5 ? 0 : dayIndex;
    setCurrentDayIndex(adjustedDayIndex);
  }, []);

  // Dynamische Zeilenhöhe: alle Zeilen gleich hoch und füllen den Container
  const recomputeRowHeight = useCallback(() => {
    const container = containerRef.current;
    const thead = theadRef.current;
    if (!container || !thead) return;

    // Prefer the actual ScrollArea viewport height if available
    const viewportH = viewportRef.current?.clientHeight;
    // Verfügbare Höhe ist Viewport/Containerhöhe minus Kopfzeile
    const containerH = viewportH ?? container.clientHeight;
    const theadH = thead.getBoundingClientRect().height;
    const available = Math.max(0, containerH - theadH);
    const rows = allHours.length || 1;
    const minRow = 64; // entspricht min-h-16
    const equalRow = Math.floor(available / rows);
    setRowHeight(Math.max(minRow, equalRow));
  }, []);

  // Compute day column width so that an integer number of day columns fills the available width.
  const recomputeDayColumnWidth = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const fullW = viewport.clientWidth;
    const daysArea = Math.max(0, fullW - TIME_COL_PX);
    const visibleCount = Math.max(1, Math.floor(daysArea / MIN_DAY_COL_PX));
    const width = Math.max(MIN_DAY_COL_PX, Math.floor(daysArea / visibleCount));
    // Avoid state churn if width hasn't meaningfully changed
    setDayColWidth((prev) => (Math.abs(prev - width) >= 1 ? width : prev));
    setVisibleDayCount(visibleCount);
  }, []);

  useEffect(() => {
    recomputeRowHeight();
  }, [recomputeRowHeight, timeTableData, currentDayIndex]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    // Locate the ScrollArea viewport (rendered by our UI component)
    const vp = root.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLDivElement | null;
    if (!vp) return;
    viewportRef.current = vp;

    // Simple debounce to reduce update frequency during sidebar animation/resizes
    const debounce = (fn: () => void, wait: number) => {
      let t: number | undefined;
      return () => {
        if (t) window.clearTimeout(t);
        t = window.setTimeout(() => fn(), wait);
      };
    };

    // Observe height for row sizing
    const roHeight = new ResizeObserver(() => recomputeRowHeight());
    roHeight.observe(vp);

    // Throttled observers to limit update frequency
    const recomputeRowHeightDebounced = debounce(recomputeRowHeight, 200);
    const recomputeDayWidthDebounced = debounce(() => {
      recomputeDayColumnWidth();
      // row heights can change when header wraps; debounce as well
      recomputeRowHeightDebounced();
    }, 200);

    // Observe width for column sizing
    const roWidth = new ResizeObserver(() => {
      recomputeDayWidthDebounced();
    });
    roWidth.observe(vp);

    // Enable CSS-based snapping without JS handlers
    vp.style.scrollSnapType = "x mandatory";
    vp.style.scrollPaddingLeft = `${TIME_COL_PX}px`;

    // Fallback: Window-Resize triggers both recomputations
    const onResize = () => {
      recomputeDayWidthDebounced();
      recomputeRowHeightDebounced();
    };
    window.addEventListener("resize", onResize);

    // Initial compute
    recomputeRowHeight();
    recomputeDayColumnWidth();

    // Scroll once to today's column (Mon-Fri), after we know the viewport width.
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      const el = viewportRef.current;
      if (el) {
        const today = new Date().getDay();
        const dow = today === 0 ? 6 : today - 1; // 0..6 => Mon=0..Sun=6
        const initialIndex = dow >= 5 ? 0 : dow; // weekend -> Monday
        // Use the current computed column width for accurate alignment
        const targetLeft = dayColWidth * initialIndex;
        el.scrollTo({ left: targetLeft, behavior: "auto" });
      }
    }

    return () => {
      roHeight.disconnect();
      roWidth.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [recomputeRowHeight, recomputeDayColumnWidth, dayColWidth]);

  // Track scroll to know which day is currently in view in single-day mode
  useEffect(() => {
    if (visibleDayCount !== 1) return; // only needed in single-day view
    const vp = viewportRef.current;
    if (!vp) return;
    const onScroll = () => {
      const idx = Math.round(vp.scrollLeft / dayColWidth);
      setActiveSingleDayIndex(Math.min(Math.max(idx, 0), allDays.length - 1));
    };
    vp.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => vp.removeEventListener("scroll", onScroll);
  }, [visibleDayCount, dayColWidth]);

  // groupedByDay basiert nun direkt auf stableData (enthält nur die stabil angezeigte Woche)
  const groupedByDay = allDays.map((day) => {
    const dayData = timeTableData.filter(
      (item) => item.day === day && item.week_id === weekID,
    );
    return {
      day,
      hours: allHours.map((hour) => {
        const lessonsForHour: Lesson[] = dayData.filter(
          (item) => item.hour === hour,
        );
        return { day, hour, lessons: lessonsForHour };
      }),
    };
  });

  // Helper: detect if day has a double lesson (3+4) for any group with same teacher, subject, room, group
  const isDoubleLesson3And4 = (dayIndex: number): boolean => {
    const hour3 = groupedByDay[dayIndex]?.hours.find((h) => h.hour === 3);
    const hour4 = groupedByDay[dayIndex]?.hours.find((h) => h.hour === 4);
    if (!hour3 || !hour4) return false;
    return hour3.lessons.some((l3) =>
      hour4.lessons.some(
        (l4) =>
          l3.group === l4.group &&
          l3.subject === l4.subject &&
          l3.teacher === l4.teacher &&
          l3.room === l4.room,
      ),
    );
  };

  const singleDayMode = visibleDayCount === 1;

  return (
    <div className="h-full border border-solid border-border rounded-lg overflow-hidden relative">
      <ScrollArea ref={containerRef} className="h-full timetable-scroll">
        <table className="h-full border-collapse bg-background w-full table-fixed">
          <colgroup>
            <col style={{ width: TIME_COL_PX }} />
            {allDays.map((_, i) => (
              <col
                key={`day-col-${i}`}
                style={{ width: dayColWidth, transition: "width 200ms ease" }}
              />
            ))}
          </colgroup>
          <thead ref={theadRef}>
            <tr>
              <th className="bg-secondary w-16 px-1 py-2 text-center font-bold text-sm sticky left-0 top-0 z-30 shadow-[inset_-1px_0_theme(colors.gray.500),_inset_0_-1px_theme(colors.gray.500)] dark:shadow-[inset_-1px_0_theme(colors.gray.600),_inset_0_-1px_theme(colors.gray.600)]">
                Stunde
              </th>
              {allDays.map((day) => (
                <th
                  key={day}
                  className="px-1 py-2 text-center font-bold text-sm sticky top-0 z-20 bg-background shadow-[inset_0_-1px_theme(colors.gray.500)] dark:shadow-[inset_0_-1px_theme(colors.gray.600)]"
                  style={{
                    scrollSnapAlign: "start",
                    scrollSnapStop: "always",
                    width: dayColWidth,
                    transition: "width 200ms ease",
                    willChange: "width",
                  }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allHours.map((hour, hourIndex) => {
              const isLast = hourIndex === allHours.length - 1;
              let { startTime, endTime } = getTimesForTimetable(
                groupedByDay,
                currentDayIndex,
                hour,
              );
              if (hour === 3) {
                if (singleDayMode) {
                  const activeIdx = activeSingleDayIndex;
                  const isDouble = isDoubleLesson3And4(activeIdx);
                  // Override directly
                  startTime = isDouble ? "09:45" : "09:25";
                  endTime = isDouble ? "10:30" : "10:10";
                } else {
                  // Wide mode: show with duration / break info
                  startTime = "09:25 | 45"; // start | duration
                  endTime = "10:10 | 30"; // end | break
                }
              }
              return (
                <tr key={hour} style={{ height: rowHeight }}>
                  {/* Stunden Zelle */}
                  <td
                    className={`bg-secondary text-center box-border p-1 ${
                      isLast ? "" : "border-b"
                    } min-h-16 text-xs border-b border-gray-500 dark:border-gray-600 sticky left-0 z-20 shadow-[inset_-1px_0_theme(colors.gray.500)] dark:shadow-[inset_-1px_0_theme(colors.gray.600)]`}
                  >
                    <div className="flex flex-col justify-center h-full">
                      <div className="text-xs text-tertiary">
                        {startTime ||
                          hourToTimeMap[hour as keyof typeof hourToTimeMap]
                            ?.start}
                      </div>
                      <div className="font-bold text-sm">{hour}</div>
                      <div className="text-xs text-tertiary">
                        {endTime ||
                          hourToTimeMap[hour as keyof typeof hourToTimeMap]
                            ?.end}
                      </div>
                    </div>
                  </td>

                  {/* Tage Zellen */}
                  {allDays.map((day, dayIndex) => {
                    const hourData = groupedByDay[dayIndex].hours.find(
                      (h) => h.hour === hour,
                    );

                    if (!hourData || hourData.lessons.length === 0) {
                      return (
                        <td
                          key={`${day}-${hour}`}
                          className={`text-center box-border p-1 ${
                            isLast ? "" : "border-b"
                          } min-h-16 border-gray-500 dark:border-gray-600`}
                        >
                          <div
                            className="h-full flex items-center justify-center text-muted-foreground select-none"
                            aria-label="Keine Stunde"
                          >
                            -
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${day}-${hour}`}
                        className={`box-border p-1 ${
                          isLast ? "" : "border-b"
                        } min-h-16 border-gray-500 dark:border-gray-600`}
                      >
                        <div className="flex gap-1 flex-nowrap items-stretch h-full">
                          {hourData.lessons.map((lesson, idx) => {
                            const rawColor = getColor(lesson.teacher) || null;
                            const hasCustomColor = !!rawColor;
                            // Wenn es eine echte Farbdefinition (hex/rgb) gibt, nutzen wir inline style + Kontrastermittlung.
                            // Sonst Tailwind Fallback + Theme-basierte Textfarbe.
                            let inlineStyle: React.CSSProperties | undefined;
                            let textColorClass: string;
                            let iconColor: string | undefined;

                            if (hasCustomColor) {
                              const dark = isColorDark(rawColor!);
                              inlineStyle = { background: rawColor! };
                              textColorClass = dark
                                ? "text-white"
                                : "text-black";
                              iconColor = dark ? "white" : "black";
                            } else {
                              // Fallback: neutrale Oberfläche (bg-muted) und Text abhängig vom Theme für ausreichend Kontrast
                              const darkMode = resolvedTheme === "dark";
                              textColorClass = darkMode
                                ? "text-white"
                                : "text-black";
                              iconColor = darkMode ? "white" : "black";
                            }

                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (mode === "notes") {
                                    setActiveNotes(lesson.notes ?? null);
                                    setActiveClickedLesson(lesson);
                                    setIsEditNotesModalOpen(true);
                                    return;
                                  }
                                  if (!lesson.notes) return;
                                  const text = `${lesson.subject}/${lesson.teacher}: ${lesson.notes}`;
                                  if (!navigator.clipboard) {
                                    toast.error(
                                      "Clipboard API nicht verfügbar",
                                    );
                                    return;
                                  }
                                  navigator.clipboard
                                    .writeText(text)
                                    .then(() => {
                                      toast.success("Notizen kopiert!");
                                    })
                                    .catch((e) => {
                                      console.error(
                                        "Kopieren fehlgeschlagen:",
                                        e,
                                      );
                                      toast.error("Kopieren fehlgeschlagen!");
                                    });
                                }}
                                className={cn(
                                  "flex flex-1 h-full rounded px-1 py-1 items-center justify-between cursor-pointer text-xs transition-colors border border-gray-700/40",
                                  hasCustomColor
                                    ? undefined
                                    : "bg-neutral-400 dark:bg-neutral-600",
                                  textColorClass,
                                )}
                                style={inlineStyle}
                              >
                                <div className="flex flex-col justify-between min-w-0 flex-1 text-left gap-0.5">
                                  <span className="font-bold text-xs truncate">
                                    {lesson.subject} / {lesson.teacher}
                                  </span>
                                  {lesson.room && (
                                    <span className="flex items-center gap-1 text-xs truncate">
                                      <MapPin size={14} color={iconColor} />
                                      {lesson.room}
                                    </span>
                                  )}
                                </div>
                                {lesson.notes &&
                                  lesson.notes?.length > 0 &&
                                  (mode === "notes" ? (
                                    <LucideNotebookText
                                      color={iconColor}
                                      size={20}
                                      className="self-center flex-shrink-0 ml-1"
                                    />
                                  ) : (
                                    <Copy
                                      color={iconColor}
                                      size={20}
                                      className="self-center flex-shrink-0 ml-1"
                                    />
                                  ))}
                              </button>
                            );
                          })}

                          {/* Entfernte künstliche Platzhalter für fehlende Spezialisierungseinträge */}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <ScrollBar orientation="vertical" />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
