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
import { getNotes, LoadSpecificTimetables } from "@/utils/db"; // Du musst hier anpassen, falls du DB anders nutzt
import { useWeekIDStore } from "@/store/useWeekIDStore";
import { Lesson } from "@/types/timetableData";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useTeacherColorStore } from "@/store/useTeacherColorStore";
import { getTimesForTimetable } from "@/utils/times";
import { supabase } from "@/lib/supabaseClient";

type TimetableProps = {
  dbInitialized: boolean;
  timeTableData: any[];
  setTimeTableData: (data: any[]) => void;
  setActiveClickedLesson: (lesson: Lesson | null) => void;
  setActiveNotes: (notes: string | null) => void;
  setIsEditNotesModalOpen: (open: boolean) => void;
  notesUpdated: boolean;
};

export default function Timetable({
  dbInitialized,
  timeTableData,
  setTimeTableData,
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

  const colorScheme = "dark";

  // Für responsive cellWidth
  useEffect(() => {
    const updateWidth = () => {
      setCellWidth(window.innerWidth - 80);
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
  const setTimetableData = useCallback(
    async (specialization: Specialization) => {
      if (!weekID) return;

      const response = await LoadSpecificTimetables(
        supabase,
        /* db param fehlt hier ,*/ weekID,
        specialization,
      );
      setTimeTableData(response);
    },
    [weekID, setTimeTableData],
  );

  useEffect(() => {
    if (dbInitialized && weekID && specialization) {
      setTimetableData(specialization);
    }
  }, [dbInitialized, specialization, weekID, notesUpdated, setTimetableData]);

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

  // Notification config update
  const { notificationConfig, setNotificationConfig } = useNotificationStore();
  useEffect(() => {
    setNotificationConfig({
      ...notificationConfig,
      specialization,
      weekId: weekID,
    });
  }, [specialization, weekID]);

  return (
    <div style={{ paddingBottom: 84, flex: 1 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          height: "100%",
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
            return (
              <div
                key={hour}
                style={{
                  minHeight: 64,
                  padding: 4,
                  textAlign: "center",
                  borderBottom: isLast
                    ? "none"
                    : `1px solid ${Colors[colorScheme].textInputPlaceholder}`,
                }}
              >
                <div style={{ fontSize: 12, color: "#7f8c8d" }}>
                  {startTime || hourToTimeMap[hour]?.start}
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
                  {endTime || hourToTimeMap[hour]?.end}
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
            width: cellWidth,
            backgroundColor: Colors[colorScheme].timetableBackground,
            borderTopRightRadius: 12,
          }}
        >
          {allDays.map((day, index) => (
            <section
              key={day}
              style={{
                scrollSnapAlign: "start",
                flex: "0 0 auto",
                width: cellWidth,
                borderLeft: `1px solid ${Colors[colorScheme].textInputDisabled}`,
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
                if (hourData.lessons.length === 0) {
                  return (
                    <div
                      key={`${day}-${hourIndex}`}
                      style={{
                        minHeight: 64,
                        borderBottom: isLast
                          ? "none"
                          : `1px solid ${Colors[colorScheme].textInputDisabled}`,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: Colors[colorScheme].textInputPlaceholder,
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
                      minHeight: 64,
                      borderBottom: isLast
                        ? "none"
                        : `1px solid ${Colors[colorScheme].textInputDisabled}`,
                      padding: 4,
                      display: "flex",
                      gap: 4,
                      flexWrap: "nowrap",
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
                            const savedNotes = await getNotes(
                              /* Hier musst du DB anpassen  ,*/ lesson.id,
                            );
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
                            <LucideNotebookText color={textColor} />
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
