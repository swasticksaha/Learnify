import React from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CalendarGrid = ({ currentDate, events }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date();

  const toDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const normalizeEventDate = (eventDate) => {
    if (eventDate instanceof Date) return toDateString(eventDate);
    if (typeof eventDate === "string" && eventDate.includes("T"))
      return eventDate.split("T")[0];
    return eventDate;
  };

  const cells = [];

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(year, month, i - startDayOfWeek + 1);
    const isInCurrentMonth = cellDate.getMonth() === month;
    const isToday = isSameDay(cellDate, today);
    const cellDateString = toDateString(cellDate);
    const dayEvents = events.filter(
      (event) =>
        event.date && normalizeEventDate(event.date) === cellDateString
    );

    cells.push(
      <div
        key={i}
        className={`
          min-h-[80px] p-1.5 border rounded-md transition-all text-sm
          flex flex-col justify-start overflow-hidden
          ${isToday
            ? "border-green-500 bg-green-50"
            : dayEvents.length > 0
            ? "border-green-300 bg-green-50 hover:bg-green-100"
            : "border-green-200 bg-white hover:bg-gray-50"}
          ${!isInCurrentMonth && "opacity-30"}
        `}
      >
        <div
          className={`text-xs font-semibold mb-1 ${
            isToday
              ? "text-blue-700"
              : !isInCurrentMonth
              ? "text-gray-400"
              : "text-gray-800"
          }`}
        >
          {cellDate.getDate()}
        </div>

        <div className="space-y-0.5">
          {dayEvents.slice(0, 2).map((event) => (
            <div
              key={event._id}
              className="bg-green-200 text-green-800 text-[11px] px-1 py-0.5 rounded-sm truncate"
              title={`${event.title} - ${event.classroomName} ${event.time ? `at ${event.time}` : ""}`}
            >
              {event.title}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-[10px] text-gray-500">+{dayEvents.length - 2} more</div>
          )}
        </div>
      </div>
    );
  }

  const rows = [];
  for (let i = 0; i < 6; i++) {
    rows.push(
      <div key={i} className="grid grid-cols-7 gap-1">
        {cells.slice(i * 7, i * 7 + 7)}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-[13px] font-semibold text-gray-600 mb-1">
        {DAYS.map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>
      {rows}
    </div>
  );
};

export default CalendarGrid;
