import { DateTime } from "luxon";
import ical from "ical-generator";

const timezone = "Europe/Amsterdam";
// Mock DB date
const dbDate = new Date("2026-04-20T00:00:00.000Z");

const occStartDate = DateTime.fromJSDate(dbDate, { zone: "utc" });
// Try using DateTime without time directly, or with timezone
const start = DateTime.fromObject(
  {
    year: occStartDate.year,
    month: occStartDate.month,
    day: occStartDate.day,
  },
  { zone: timezone }
);

const cal = ical({ name: "test" });
cal.createEvent({
  start: start,
  allDay: true,
  summary: "Test All Day Luxon",
});

console.log("\niCal output with Luxon DateTime:");
console.log(cal.toString());
