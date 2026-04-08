import ical from "ical-generator";
import { DateTime } from "luxon";

const cal = ical({ name: "test" });
cal.createEvent({
  start: DateTime.now(),
  end: DateTime.now().plus({ hours: 1 }),
  summary: "Test Categories",
  categories: [{ name: "FESTIVAL" }, { name: "PUJA" }],
});

console.log(cal.toString());
