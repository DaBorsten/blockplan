import { useEffect, useState, useCallback, useRef } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { allDays } from "@/constants/allDays";
import { allHours } from "@/constants/allHours";
import { Colors } from "@/constants/Colors";
import { hourToTimeMap } from "@/constants/hourToTimeMap";
import {
  Specialization,
  useSpecializationStore,
} from "@/store/useSpecializationStore";
import { isColorDark } from "@/utils/colorDark";
import { LucideNotebookText, MapPin } from "lucide-react"; // lucide-react für Web
import { useWeekIDStore } from "@/store/useWeekIDStore";
import { Lesson } from "@/types/timetableData";
import { useTeacherColorStore } from "@/store/useTeacherColorStore";
import { getTimesForTimetable } from "@/utils/times";

type TimetableProps = {
  setActiveClickedLesson: (lesson: Lesson | null) => void;
  setActiveNotes: (notes: string | null) => void;
  setIsEditNotesModalOpen: (open: boolean) => void;
  notesUpdated: boolean;
};

export default function Timetable({
  setActiveClickedLesson,
  setActiveNotes,
  setIsEditNotesModalOpen,
  notesUpdated,
}: TimetableProps) {
  const { weekID } = useWeekIDStore();
  const { specialization } = useSpecializationStore();
  const { getColor } = useTeacherColorStore();

  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [timeTableData, setTimeTableData] = useState<Lesson[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [rowHeight, setRowHeight] = useState<number>(64); // px

  const colorScheme = "dark";

  // Setze aktuellen Tag
  useEffect(() => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    const adjustedDayIndex = dayIndex >= 5 ? 0 : dayIndex;
    setCurrentDayIndex(adjustedDayIndex);
  }, []);

  // Lade Stundenplan-Daten (hier musst du DB-Logik anpassen!)
  const setTimetableData2 = useCallback(
    async (specialization: Specialization) => {
      if (!weekID) return;

      const res = await fetch(
        `/api/timetable/week?weekId=${weekID}&specialization=${specialization}`,
      );
      const data = await res.json();
      const response = data.data;

      setTimeTableData(response);
    },
    [weekID, setTimeTableData],
  );

  useEffect(() => {
    if (weekID && specialization) {
      setTimetableData2(specialization);
    }
  }, [specialization, weekID, notesUpdated, setTimetableData2]);

  // Dynamische Zeilenhöhe: alle Zeilen gleich hoch und füllen den Container
  const recomputeRowHeight = useCallback(() => {
    const container = containerRef.current;
    const thead = theadRef.current;
    if (!container || !thead) return;

    // Verfügbare Höhe ist Containerhöhe minus Kopfzeile
    const containerH = container.clientHeight;
    const theadH = thead.getBoundingClientRect().height;
    const available = Math.max(0, containerH - theadH);
    const rows = allHours.length || 1;
    const minRow = 64; // entspricht min-h-16
    const equalRow = Math.floor(available / rows);
    setRowHeight(Math.max(minRow, equalRow));
  }, []);

  useEffect(() => {
    recomputeRowHeight();
  }, [recomputeRowHeight, timeTableData, currentDayIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Beobachte Größenänderungen (auch Zoom triggert oft Resize)
    const ro = new ResizeObserver(() => recomputeRowHeight());
    ro.observe(container);
    // Fallback: Window-Resize
    const onResize = () => recomputeRowHeight();
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [recomputeRowHeight]);

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

  return (
    <div className="h-full border border-solid border-border rounded-lg overflow-hidden">
      <ScrollArea ref={containerRef} className="h-full">
        <table className="h-full border-collapse bg-background w-full table-fixed ">
          <colgroup>
            <col style={{ width: 64 }} />
            {allDays.map((_, i) => (
              <col key={`day-col-${i}`} style={{ width: 250 }} />
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
                  className="px-1 py-2 text-center font-bold text-sm sticky top-0 z-20 bg-background w-[250px]"
                  style={{
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
              const { startTime, endTime } = getTimesForTimetable(
                groupedByDay,
                currentDayIndex,
                hour,
              );
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
                          } min-h-16 text-[var(--empty-text)] border-b-[var(--empty-border)]`}
                          style={
                            {
                              "--empty-border":
                                Colors[colorScheme].textInputDisabled,
                              "--empty-text":
                                Colors[colorScheme].textInputPlaceholder,
                            } as React.CSSProperties
                          }
                        >
                          -
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
                          {specialization === 1 &&
                            hourData.lessons.length === 1 &&
                            hourData.lessons[0].specialization === 3 && (
                              <div
                                className="flex-1 flex items-center justify-center m-1 p-1 h-full text-[var(--spec3-text)]"
                                style={
                                  {
                                    "--spec3-text":
                                      Colors[colorScheme].textInputPlaceholder,
                                  } as React.CSSProperties
                                }
                              >
                                -
                              </div>
                            )}

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
                                  const res = await fetch(
                                    `/api/week/notes?lessonId=${lesson.id}`,
                                  );
                                  const data = await res.json();
                                  const savedNotes = data.notes;
                                  setActiveNotes(savedNotes);
                                  setActiveClickedLesson(lesson);
                                  setIsEditNotesModalOpen(true);
                                }}
                                className="flex flex-1 h-full rounded px-1 py-1 items-center justify-between cursor-pointer border-0 text-xs"
                                style={
                                  {
                                    background: bgColor,
                                    color: textColor,
                                  } as React.CSSProperties
                                }
                              >
                                <div className="flex flex-col justify-between min-w-0 flex-1 text-left">
                                  <span className="font-bold text-xs truncate">
                                    {lesson.subject} / {lesson.teacher}
                                  </span>
                                  {lesson.room && (
                                    <span className="flex items-center gap-1 text-xs truncate">
                                      <MapPin size={10} color={textColor} />
                                      {lesson.room}
                                    </span>
                                  )}
                                </div>
                                {lesson.notes && lesson.notes?.length > 0 && (
                                  <LucideNotebookText
                                    color={textColor}
                                    size={20}
                                    className="self-center flex-shrink-0 ml-1"
                                  />
                                )}
                              </button>
                            );
                          })}

                          {specialization === 1 &&
                            hourData.lessons.length === 1 &&
                            hourData.lessons[0].specialization === 2 && (
                              <div
                                className="flex-1 flex items-center justify-center p-1 h-full text-[var(--spec2-text)]"
                                style={
                                  {
                                    "--spec2-text":
                                      Colors[colorScheme].textInputPlaceholder,
                                  } as React.CSSProperties
                                }
                              >
                                -
                              </div>
                            )}
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
