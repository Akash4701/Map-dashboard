// utils/fetchWeather.ts

export const fetchTemperature = async (
  lat: number, 
  lng: number, 
  dataSource: string,
  startDate?:any,
  endDate?: any,
  extendedHours: number = 24 // default to next 24 hours if not provided
): Promise<number | null> => {
  console.log('input:', startDate, 'endDate:', endDate, 'extend:', extendedHours);

  function convertDateToHour(dateStr: string): number {
    const date = new Date(dateStr);
    const millisecondsSinceEpoch = date.getTime();
    const hoursSinceEpoch = Math.floor(millisecondsSinceEpoch / (1000 * 60 * 60));
    return hoursSinceEpoch;
  }

  const now = new Date();
  const currentHour = Math.floor(now.getTime() / (1000 * 60 * 60)); // hours since epoch

  const finalStartHour = startDate
    ? convertDateToHour(startDate)
    : currentHour;

  const finalEndHour = endDate
    ? convertDateToHour(endDate)
    : finalStartHour + extendedHours;

  console.log('finalStartHour:', finalStartHour, 'finalEndHour:', finalEndHour);

  // Convert hour-based timestamp back to date string (YYYY-MM-DD) for API
  const hourToDate = (hour: number) => {
    const date = new Date(hour * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  };

  const startDateStr = hourToDate(finalStartHour);
  const endDateStr = hourToDate(finalEndHour);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&start_date=${startDateStr}&end_date=${endDateStr}&hourly=${dataSource}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const values: number[] = data?.hourly?.[dataSource];
    if (!values || values.length === 0) return null;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return parseFloat(avg.toFixed(1));
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
};
