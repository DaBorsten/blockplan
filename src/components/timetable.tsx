import { useEffect, useState, useCallback, useRef } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { allDays } from "@/constants/allDays";
import { allHours } from "@/constants/allHours";
import { Colors } from "@/constants/Colors";
import { hourToTimeMap } from "@/constants/hourToTimeMap";
import { isColorDark } from "@/utils/colorDark";
import { Copy, LucideNotebookText, MapPin } from "lucide-react"; // lucide-react für Web
// nuqs hooks for query params
import { Lesson } from "@/types/timetableData";
import { useCurrentWeek } from "@/store/useWeekStore";
import { useCurrentGroup } from "@/store/useGroupStore";
import { useCurrentClass } from "@/store/useClassStore";
import { useTeacherColors } from "@/hooks/useTeacherColors";
import { getTimesForTimetable } from "@/utils/times";
import { useModeStore } from "@/store/useModeStore";
import { toast } from "sonner";

type TimetableProps = {
  setActiveClickedLesson: (lesson: Lesson | null) => void;
  setActiveNotes: (notes: string | null) => void;
  setIsEditNotesModalOpen: (open: boolean) => void;
};

export default function Timetable({
  setActiveClickedLesson,
  setActiveNotes,
  setIsEditNotesModalOpen,
}: TimetableProps) {
  const weekID = useCurrentWeek();
  const group = useCurrentGroup();
  const { mode } = useModeStore();
  const classId = useCurrentClass();
  const { getColor } = useTeacherColors(classId ?? undefined);

  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [timeTableData, setTimeTableData] = useState<Lesson[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [rowHeight, setRowHeight] = useState<number>(64); // px
  const [dayColWidth, setDayColWidth] = useState<number>(250);
  const [visibleDayCount, setVisibleDayCount] = useState<number>(5);
  const [activeSingleDayIndex, setActiveSingleDayIndex] = useState<number>(0);
  const didInitialScrollRef = useRef<boolean>(false);

  // layout constants
  const TIME_COL_PX = 64;
  const MIN_DAY_COL_PX = 250;

  const colorScheme = "dark";

  // Setze aktuellen Tag
  useEffect(() => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    const adjustedDayIndex = dayIndex >= 5 ? 0 : dayIndex;
    setCurrentDayIndex(adjustedDayIndex);
  }, []);

  // Lade Stundenplandaten wenn sich weekID, group oder classId ändert
  useEffect(() => {
    const loadTimetableData = async () => {
      if (!weekID || !group || !classId) {
        setTimeTableData([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/timetable/week?weekId=${weekID}&specialization=${group}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setTimeTableData(result.data || []);
      } catch (error) {
        console.error("Fehler beim Laden der Stundenplandaten:", error);
        toast.error("Stundenplandaten konnten nicht geladen werden");
        setTimeTableData([]);
      }
    };

    loadTimetableData();
  }, [weekID, group, classId]);

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

  // Helper: detect if day has a double lesson (3+4) for any specialization with same teacher, subject, room, specialization
  const isDoubleLesson3And4 = (dayIndex: number): boolean => {
    const hour3 = groupedByDay[dayIndex]?.hours.find((h) => h.hour === 3);
    const hour4 = groupedByDay[dayIndex]?.hours.find((h) => h.hour === 4);
    if (!hour3 || !hour4) return false;
    return hour3.lessons.some((l3) =>
      hour4.lessons.some(
        (l4) =>
          l3.specialization === l4.specialization &&
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
              <th
                className="bg-secondary w-16 px-1 py-2 text-center font-bold text-sm sticky left-0 top-0 z-30"
                style={{
                  boxShadow: `inset -1px 0 ${Colors[colorScheme].textInputDisabled}, inset 0 -1px ${Colors[colorScheme].textInputDisabled}`,
                }}
              >
                Stunde
              </th>
              {allDays.map((day) => (
                <th
                  key={day}
                  className="px-1 py-2 text-center font-bold text-sm sticky top-0 z-20 bg-background"
                  style={{
                    scrollSnapAlign: "start",
                    scrollSnapStop: "always",
                    width: dayColWidth,
                    transition: "width 200ms ease",
                    willChange: "width",
                    boxShadow: `inset 0 -1px ${Colors[colorScheme].textInputDisabled}`,
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
                    } min-h-16 text-xs border-b-[var(--hour-border)] sticky left-0 z-20`}
                    style={
                      {
                        "--hour-border": Colors[colorScheme].textInputDisabled,
                        boxShadow: `inset -1px 0 ${Colors[colorScheme].textInputDisabled}`,
                      } as React.CSSProperties
                    }
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
                          } min-h-16 border-b-[var(--empty-border)]`}
                          style={
                            {
                              "--empty-border":
                                Colors[colorScheme].textInputDisabled,
                            } as React.CSSProperties
                          }
                        >
                          <div className="h-full flex items-center justify-center text-muted-foreground">
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
                        } min-h-16 border-b-[var(--cell-border)]`}
                        style={
                          {
                            "--cell-border":
                              Colors[colorScheme].textInputDisabled,
                          } as React.CSSProperties
                        }
                      >
                        <div className="flex gap-1 flex-nowrap items-stretch h-full">

                          {hourData.lessons.map((lesson, idx) => {
                            const bgColor =
                              getColor(lesson.teacher) ||
                              Colors[colorScheme].textInputBackground;
                            const textColor = isColorDark(bgColor)
                              ? "white"
                              : "black";

                            return (
                              <button
                                key={idx}
                                onClick={async () => {
                                  if (mode === "notes") {
                                    const res = await fetch(
                                      `/api/week/notes?lessonId=${lesson.id}`,
                                    );
                                    const data = await res.json();
                                    const savedNotes = data.notes;
                                    setActiveNotes(savedNotes);
                                    setActiveClickedLesson(lesson);
                                    setIsEditNotesModalOpen(true);
                                  } else {
                                    if (!lesson.notes) return;
                                    // Zeige eine kurze Notification ("Notizen kopiert!") beim Kopieren
                                    try {
                                      await navigator.clipboard.writeText(
                                        `${lesson.subject}/${lesson.teacher}: ${
                                          lesson.notes ?? ""
                                        }`,
                                      );
                                      // Notification API (sonner) Beispiel:
                                      toast.success("Notizen kopiert!");
                                    } catch (e: unknown) {
                                      console.error(
                                        "Kopieren fehlgeschlagen",
                                        e,
                                      );
                                      toast.error("Kopieren fehlgeschlagen!");
                                    }
                                  }
                                }}
                                className="flex flex-1 h-full rounded px-1 py-1 items-center justify-between cursor-pointer border-0 text-xs"
                                style={
                                  {
                                    background: bgColor,
                                    color: textColor,
                                  } as React.CSSProperties
                                }
                              >
                                <div className="flex flex-col justify-between min-w-0 flex-1 text-left gap-0.5">
                                  <span className="font-bold text-xs truncate">
                                    {lesson.subject} / {lesson.teacher}
                                  </span>
                                  {lesson.room && (
                                    <span className="flex items-center gap-1 text-xs truncate">
                                      <MapPin size={14} color={textColor} />
                                      {lesson.room}
                                    </span>
                                  )}
                                </div>
                                {lesson.notes &&
                                  lesson.notes?.length > 0 &&
                                  (mode === "notes" ? (
                                    <LucideNotebookText
                                      color={textColor}
                                      size={20}
                                      className="self-center flex-shrink-0 ml-1"
                                    />
                                  ) : (
                                    <Copy
                                      color={textColor}
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
