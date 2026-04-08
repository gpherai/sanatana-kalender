import { DateTime } from "luxon";
import ical from "ical-generator";

const timezone = "Europe/Amsterdam";
// Mock DB date
const dbDate = new Date("2026-04-20T00:00:00.000Z");

const occStartDate = DateTime.fromJSDate(dbDate, { zone: "utc" });
const start = DateTime.fromObject(
  {
    year: occStartDate.year,
    month: occStartDate.month,
    day: occStartDate.day,
  },
  { zone: timezone }
).toJSDate();

console.log("DB Date:", dbDate.toISOString());
console.log("Constructed Date for Europe/Amsterdam:", start.toISOString());
console.log("Server Local Date string:", start.toString());

const cal = ical({ name: "test" });
cal.createEvent({
  start: start,
  allDay: true,
  summary: "Test All Day",
});

console.log("\niCal output:");
console.log(cal.toString());
