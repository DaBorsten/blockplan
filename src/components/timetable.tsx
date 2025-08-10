import { useEffect, useState, useRef, useCallback } from "react";
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [cellWidth, setCellWidth] = useState(0);
  const [timeTableData, setTimeTableData] = useState<Lesson[]>([]);

  const colorScheme = "dark";

  // Für responsive cellWidth
  useEffect(() => {
    const updateWidth = () => {
      // Mache die Tage schmaler, z.B. max 320px oder 1/2 der Breite
      const maxDayWidth = 320;
      const minDayWidth = 180;
      const available = window.innerWidth - 80;
      const dayWidth = Math.max(
        minDayWidth,
        Math.min(maxDayWidth, Math.floor(available / allDays.length)),
      );
      setCellWidth(dayWidth);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Setze aktuellen Tag (wie in React Native)
  useEffect(() => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    const adjustedDayIndex = dayIndex >= 5 ? 0 : dayIndex;
    setCurrentDayIndex(adjustedDayIndex);

    if (scrollRef.current) {
      scrollRef.current.scrollLeft = adjustedDayIndex * cellWidth;
    }
  }, [cellWidth]);

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const newIndex = Math.round(scrollLeft / cellWidth);
    if (
      newIndex !== currentDayIndex &&
      newIndex >= 0 &&
      newIndex < allDays.length
    ) {
      setCurrentDayIndex(newIndex);
    }
  };

  return (
    <div className="h-full w-full flex flex-1 min-h-0 min-w-0 overflow-auto">
      <div className="flex flex-row overflow-hidden h-full w-full flex-1 min-h-0 min-w-0">
        {/* Stunden Spalte */}
        <div
          className="border-r border-solid rounded-tl-xl bg-[var(--sidebar-bg)]"
          style={{
            width: 80,
            // Dynamische Farbe als CSS-Variable setzen
            '--sidebar-bg': Colors[colorScheme].secondary,
            '--sidebar-border': Colors[colorScheme].textInputDisabled,
          } as React.CSSProperties}
        >
          <div className="px-2.5 py-2 text-center font-bold text-base border-b border-gray-300 text-[var(--sidebar-text)]"
            style={{ '--sidebar-text': Colors[colorScheme].text } as React.CSSProperties }
          >
            Stunde
          </div>
          {allHours.map((hour, idx) => {
            const isLast = idx === allHours.length - 1;
            const { startTime, endTime } = getTimesForTimetable(
              groupedByDay,
              currentDayIndex,
              hour,
            );
            const rowHeight = 64;
            return (
              <div
                key={hour}
                className={`flex flex-col justify-center text-center box-border p-1 ${isLast ? '' : 'border-b'} h-16 min-h-16 text-[var(--hour-text)] border-b-[var(--hour-border)]`}
                style={{
                  '--hour-border': Colors[colorScheme].textInputPlaceholder,
                  '--hour-text': Colors[colorScheme].text,
                } as React.CSSProperties}
              >
                <div className="text-xs text-gray-500">
                  {startTime ||
                    hourToTimeMap[hour as keyof typeof hourToTimeMap]?.start}
                </div>
                <div className="font-bold text-base" style={{ color: Colors[colorScheme].text }}>
                  {hour}
                </div>
                <div className="text-xs text-gray-500">
                  {endTime ||
                    hourToTimeMap[hour as keyof typeof hourToTimeMap]?.end}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollbarer Bereich für Tage */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto h-full w-full flex-1 min-h-0 min-w-0 rounded-tr-xl bg-[var(--tt-bg)]"
          style={{
            scrollSnapType: "x mandatory",
            '--tt-bg': Colors[colorScheme].timetableBackground,
          } as React.CSSProperties}
        >
          {allDays.map((day, index) => (
            <section
              key={day}
              className="min-w-0 min-h-0 h-full border-l border-solid border-l-[var(--day-border)]"
              style={{
                scrollSnapAlign: "start",
                flex: `0 0 ${cellWidth}px`,
                width: cellWidth,
                '--day-border': Colors[colorScheme].textInputDisabled,
              } as React.CSSProperties}
            >
              <div
                className="px-2.5 py-2 text-center font-bold text-base border-b border-gray-300 text-[var(--day-text)]"
                style={{ '--day-text': Colors[colorScheme].text } as React.CSSProperties }
              >
                {day}
              </div>

              {groupedByDay[index].hours.map((hourData, hourIndex) => {
                const isLast =
                  hourIndex === groupedByDay[index].hours.length - 1;
                const rowHeight = 64;
                if (hourData.lessons.length === 0) {
                  return (
                    <div
                      key={`${day}-${hourIndex}`}
                      className={`flex gap-1 justify-center items-center box-border p-1 ${isLast ? '' : 'border-b'} h-16 min-h-16 text-[var(--empty-text)] border-b-[var(--empty-border)]`}
                      style={{
                        '--empty-border': Colors[colorScheme].textInputDisabled,
                        '--empty-text': Colors[colorScheme].textInputPlaceholder,
                      } as React.CSSProperties}
                    >
                      -
                    </div>
                  );
                }

                return (
                  <div
                    key={`${day}-${hourIndex}`}
                    className={`flex gap-1 flex-nowrap box-border p-1 items-stretch ${isLast ? '' : 'border-b'} h-16 min-h-16 border-b-[var(--cell-border)]`}
                    style={{
                      '--cell-border': Colors[colorScheme].textInputDisabled,
                    } as React.CSSProperties}
                  >
                    {specialization === 1 &&
                      hourData.lessons.length === 1 &&
                      hourData.lessons[0].specialization === 3 && (
                        <div
                          className="flex-1 flex items-center justify-center m-1 p-1 text-[var(--spec3-text)]"
                          style={{ '--spec3-text': Colors[colorScheme].textInputPlaceholder } as React.CSSProperties }
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
                          className="flex flex-1 rounded px-2 py-1 items-center justify-between cursor-pointer border-0"
                          style={{
                            background: bgColor,
                            color: textColor,
                          } as React.CSSProperties}
                        >
                          <div className="flex flex-col justify-between">
                            <span className="font-bold text-sm">
                              {lesson.subject} / {lesson.teacher}
                            </span>
                            {lesson.room && (
                              <span className="flex items-center gap-1 text-xs">
                                <MapPin size={12} color={textColor} />
                                {lesson.room}
                              </span>
                            )}
                          </div>
                          {lesson.notes && lesson.notes?.length > 0 && (
                            <LucideNotebookText color={textColor} className="self-center" />
                          )}
                        </button>
                      );
                    })}

                    {specialization === 1 &&
                      hourData.lessons.length === 1 &&
                      hourData.lessons[0].specialization === 2 && (
                        <div
                          className="flex-1 flex items-center justify-center p-1 text-[var(--spec2-text)]"
                          style={{ '--spec2-text': Colors[colorScheme].textInputPlaceholder } as React.CSSProperties }
                        >
                          -
                        </div>
                      )}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
