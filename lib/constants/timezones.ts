export interface TimezoneOption {
  value: string; // IANA timezone identifier
  label: string; // Human-readable label
  offset: string; // UTC offset
}

export const timezones: TimezoneOption[] = [
  { value: "Pacific/Honolulu", label: "Hawaii", offset: "UTC-10:00" },
  { value: "America/Anchorage", label: "Alaska", offset: "UTC-09:00" },
  { value: "America/Los_Angeles", label: "Pacific Time", offset: "UTC-08:00" },
  {
    value: "America/Phoenix",
    label: "Mountain Time (no DST)",
    offset: "UTC-07:00",
  },
  { value: "America/Denver", label: "Mountain Time", offset: "UTC-07:00" },
  { value: "America/Chicago", label: "Central Time", offset: "UTC-06:00" },
  { value: "America/New_York", label: "Eastern Time", offset: "UTC-05:00" },
  {
    value: "America/Toronto",
    label: "Eastern Time - Toronto",
    offset: "UTC-05:00",
  },
  { value: "America/Halifax", label: "Atlantic Time", offset: "UTC-04:00" },
  {
    value: "America/St_Johns",
    label: "Newfoundland Time",
    offset: "UTC-03:30",
  },
  { value: "America/Sao_Paulo", label: "Sao Paulo", offset: "UTC-03:00" },
  { value: "Europe/London", label: "London", offset: "UTC+00:00" },
  {
    value: "Europe/Berlin",
    label: "Central European Time",
    offset: "UTC+01:00",
  },
  { value: "Europe/Paris", label: "Paris", offset: "UTC+01:00" },
  { value: "Europe/Rome", label: "Rome", offset: "UTC+01:00" },
  { value: "Europe/Madrid", label: "Madrid", offset: "UTC+01:00" },
  { value: "Europe/Athens", label: "Athens", offset: "UTC+02:00" },
  { value: "Europe/Moscow", label: "Moscow", offset: "UTC+03:00" },
  { value: "Asia/Dubai", label: "Dubai", offset: "UTC+04:00" },
  { value: "Asia/Kolkata", label: "India", offset: "UTC+05:30" },
  { value: "Asia/Bangkok", label: "Bangkok", offset: "UTC+07:00" },
  { value: "Asia/Singapore", label: "Singapore", offset: "UTC+08:00" },
  { value: "Asia/Shanghai", label: "China", offset: "UTC+08:00" },
  { value: "Asia/Tokyo", label: "Tokyo", offset: "UTC+09:00" },
  { value: "Australia/Sydney", label: "Sydney", offset: "UTC+10:00" },
  { value: "Pacific/Auckland", label: "Auckland", offset: "UTC+12:00" },
];

export const getTimezoneByValue = (
  value: string,
): TimezoneOption | undefined => {
  return timezones.find((timezone) => timezone.value === value);
};

export const getTimezoneByLabel = (
  label: string,
): TimezoneOption | undefined => {
  return timezones.find(
    (timezone) => timezone.label.toLowerCase() === label.toLowerCase(),
  );
};
