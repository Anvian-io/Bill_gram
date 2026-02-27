// Helper to format a Date object or string to YYYY-MM-DD for filenames
export const formatDateForFilename = (date) => {
  if (!date) return "unknown";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "unknown";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
