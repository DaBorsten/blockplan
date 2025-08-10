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
  const [timeTableData, setTimeTableData] = useState<any[]>([]);

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
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          height: "100%",
          width: "100%",
          flex: 1,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        {/* Stunden Spalte */}
        <div
          style={{
            width: 80,
            backgroundColor: Colors[colorScheme].secondary,
            borderRight: `1px solid ${Colors[colorScheme].textInputDisabled}`,
            borderTopLeftRadius: 12,
          }}
        >
          <div
            style={{
              padding: 10,
              textAlign: "center",
              fontWeight: "bold",
              fontSize: 16,
              borderBottom: "1px solid #ddd",
              color: Colors[colorScheme].text,
            }}
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
            // Einheitliche Zeilenhöhe für Stunden und Tageszellen
            const rowHeight = 64;
            return (
              <div
                key={hour}
                style={{
                  minHeight: rowHeight,
                  height: rowHeight,
                  padding: 4,
                  textAlign: "center",
                  borderBottom: isLast
                    ? "none"
                    : `1px solid ${Colors[colorScheme].textInputPlaceholder}`,
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#7f8c8d" }}>
                  {startTime ||
                    hourToTimeMap[hour as keyof typeof hourToTimeMap]?.start}
                </div>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: 16,
                    color: Colors[colorScheme].text,
                  }}
                >
                  {hour}
                </div>
                <div style={{ fontSize: 12, color: "#7f8c8d" }}>
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
          style={{
            overflowX: "auto",
            display: "flex",
            scrollSnapType: "x mandatory",
            width: "100%",
            height: "100%",
            backgroundColor: Colors[colorScheme].timetableBackground,
            borderTopRightRadius: 12,
            flex: 1,
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {allDays.map((day, index) => (
            <section
              key={day}
              style={{
                scrollSnapAlign: "start",
                flex: `0 0 ${cellWidth}px`,
                width: cellWidth,
                borderLeft: `1px solid ${Colors[colorScheme].textInputDisabled}`,
                minWidth: 0,
                minHeight: 0,
                height: "100%",
              }}
            >
              <div
                style={{
                  padding: 10,
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: 16,
                  borderBottom: "1px solid #ddd",
                  color: Colors[colorScheme].text,
                }}
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
                      style={{
                        minHeight: rowHeight,
                        height: rowHeight,
                        borderBottom: isLast
                          ? "none"
                          : `1px solid ${Colors[colorScheme].textInputDisabled}`,
                        padding: 4,
                        display: "flex",
                        gap: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        color: Colors[colorScheme].textInputPlaceholder,
                        boxSizing: "border-box",
                      }}
                    >
                      -
                    </div>
                  );
                }

                return (
                  <div
                    key={`${day}-${hourIndex}`}
                    style={{
                      minHeight: rowHeight,
                      height: rowHeight,
                      borderBottom: isLast
                        ? "none"
                        : `1px solid ${Colors[colorScheme].textInputDisabled}`,
                      padding: 4,
                      display: "flex",
                      gap: 4,
                      flexWrap: "nowrap",
                      boxSizing: "border-box",
                      alignItems: "stretch",
                    }}
                  >
                    {specialization === 1 &&
                      hourData.lessons.length === 1 &&
                      hourData.lessons[0].specialization === 3 && (
                        <div
                          style={{
                            margin: 4,
                            padding: 4,
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: Colors[colorScheme].textInputPlaceholder,
                          }}
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
                          style={{
                            backgroundColor: bgColor,
                            color: textColor,
                            flex: 1,
                            borderRadius: 4,
                            padding: "4px 8px",
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            border: "none",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ fontWeight: "bold", fontSize: 14 }}>
                              {lesson.subject} / {lesson.teacher}
                            </span>
                            {lesson.room && (
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 12,
                                }}
                              >
                                <MapPin size={12} color={textColor} />
                                {lesson.room}
                              </span>
                            )}
                          </div>
                          {lesson.notes && lesson.notes?.length > 0 && (
                            <LucideNotebookText
                              color={textColor}
                              style={{ alignSelf: "center" }}
                            />
                          )}
                        </button>
                      );
                    })}

                    {specialization === 1 &&
                      hourData.lessons.length === 1 &&
                      hourData.lessons[0].specialization === 2 && (
                        <div
                          style={{
                            padding: 4,
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: Colors[colorScheme].textInputPlaceholder,
                          }}
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
