import React from "react";

const CalendarHeader = ({ currentDate, onPrevMonth, onNextMonth }) => {
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  return (
    <div className="flex justify-between items-center mb-4 px-2">
      {/* Previous Button */}
      <button
        onClick={onPrevMonth}
        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-full transition"
        title="Previous month"
      >
        &larr;
      </button>

      {/* Month & Year */}
      <div className="text-xl font-bold text-green-800">
        {monthName} {year}
      </div>

      {/* Next Button */}
      <button
        onClick={onNextMonth}
        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-full transition"
        title="Next month"
      >
        &rarr;
      </button>
    </div>
  );
};

export default CalendarHeader;
