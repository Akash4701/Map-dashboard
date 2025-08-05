// utils/Weather.ts

// Converts hour index (0-720) to date string
export const hourIndexToDate = (hourIndex: number): string => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 15); // 15 days before today
  startDate.setMinutes(0, 0, 0);

  const targetDate = new Date(startDate);
  targetDate.setHours(targetDate.getHours() + hourIndex);

  return targetDate.toISOString().split('T')[0];
};

// Converts hour index to hour of the day (0–23)
export const getHourOfDay = (hourIndex: number): number => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 15);
  startDate.setMinutes(0, 0, 0);

  const targetDate = new Date(startDate);
  targetDate.setHours(targetDate.getHours() + hourIndex);

  return targetDate.getHours();
};

// Converts slider hour index to absolute hour timestamp (epoch)
export const hourIndexToAbsoluteHour = (hourIndex: number): number => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 15);
  startDate.setMinutes(0, 0, 0);

  const targetDate = new Date(startDate);
  targetDate.setHours(targetDate.getHours() + hourIndex);

  return Math.floor(targetDate.getTime() / (1000 * 60 * 60)); // in hours
};

// Converts date string to slider hour index
export const dateToHourIndex = (dateString: string): number => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 15);
  startDate.setMinutes(0, 0, 0);

  const targetDate = new Date(dateString);
  const diffMs = targetDate.getTime() - startDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  return Math.max(0, Math.min(diffHours, 720));
};
