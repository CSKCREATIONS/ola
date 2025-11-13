import React, { useState } from 'react';

export default function Calendar() {
  const [, setSelectedDate] = useState(null);

  return (
    <input
      type="date"
      onChange={(e) => setSelectedDate(e.target.value)}
      className="border rounded-md p-2 w-full"
    />
  );
}
