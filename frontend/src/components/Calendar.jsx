import React, { useState } from 'react';

export default function Calendar() {
  // Keep the selected date value in state (value + setter pair)
  const [selectedDate, setSelectedDate] = useState(null);

  return (
    <input
      type="date"
      value={selectedDate || ''}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="border rounded-md p-2 w-full"
      aria-label="Seleccionar fecha"
    />
  );
}
