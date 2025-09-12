export function getFilterDates(
  filter?: string,
  customStartDateStr?: string,
  customEndDateStr?: string
) {
  let startDate = new Date();
  let endDate = new Date();
  const today = new Date();
  let actualFilter = filter || "thisMonth";

  switch (actualFilter) {
    case "today":
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "thisWeek":
      const currentDayOfWeek = today.getDay();
      const firstDay = new Date(today);
      firstDay.setDate(
        today.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1)
      );
      firstDay.setHours(0, 0, 0, 0);
      startDate = firstDay;
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "thisYear":
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case "custom":
      if (customStartDateStr && customEndDateStr) {
        startDate = new Date(customStartDateStr);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEndDateStr);
        endDate.setHours(23, 59, 59, 999);
      } else {
        actualFilter = "thisMonth";
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
      }
      break;
    case "thisMonth":
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
  }

  return {
    startDate,
    endDate,
    filter: actualFilter,
    displayStartDate: startDate.toLocaleDateString("en-KE", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    displayEndDate: endDate.toLocaleDateString("en-KE", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
  };
}
