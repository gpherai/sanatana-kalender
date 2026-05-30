import { NextResponse } from "next/server";
import ical from "ical-generator";
import { DateTime } from "luxon";
import { getOccurrencesForIcalExport } from "@/services/event.service";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { logError } from "@/lib/utils";
import { dbTimeToStr } from "@/lib/timing-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const calendar = ical({ name: "Sanatana Kalender" });

    const timezone = DEFAULT_LOCATION.timezone;

    calendar.timezone({ name: timezone });

    const occurrences = await getOccurrencesForIcalExport();

    for (const occ of occurrences) {
      const { event, date, endDate: occEndDate, notes } = occ;
      const startTime = dbTimeToStr(occ.startTime);
      const endTime = dbTimeToStr(occ.endTime);

      let start: DateTime;
      let end: DateTime | undefined;
      let allDay = false;

      const occStartDate = DateTime.fromJSDate(date, { zone: "utc" });
      const occEndDateObj = occEndDate
        ? DateTime.fromJSDate(occEndDate, { zone: "utc" })
        : occStartDate;

      if (startTime || endTime) {
        if (startTime) {
          const [hours = 0, minutes = 0] = startTime.split(":").map(Number);
          start = DateTime.fromObject(
            {
              year: occStartDate.year,
              month: occStartDate.month,
              day: occStartDate.day,
              hour: hours,
              minute: minutes,
            },
            { zone: timezone }
          );
        } else {
          start = DateTime.fromObject(
            {
              year: occStartDate.year,
              month: occStartDate.month,
              day: occStartDate.day,
              hour: 0,
              minute: 0,
            },
            { zone: timezone }
          );
        }

        if (endTime) {
          const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);
          end = DateTime.fromObject(
            {
              year: occEndDateObj.year,
              month: occEndDateObj.month,
              day: occEndDateObj.day,
              hour: endHours,
              minute: endMinutes,
            },
            { zone: timezone }
          );

          if (!occEndDate && end.toMillis() < start.toMillis()) {
            end = end.plus({ days: 1 });
          }
        } else {
          end = start.plus({ hours: 1 });
        }
      } else {
        allDay = true;
        start = DateTime.fromObject(
          {
            year: occStartDate.year,
            month: occStartDate.month,
            day: occStartDate.day,
          },
          { zone: timezone }
        );

        end = DateTime.fromObject(
          {
            year: occEndDateObj.year,
            month: occEndDateObj.month,
            day: occEndDateObj.day,
          },
          { zone: timezone }
        ).plus({ days: 1 });
      }

      const descriptionLines = [];
      if (event.description) descriptionLines.push(event.description);
      if (notes) descriptionLines.push(`Notities: ${notes}`);

      // Extra info
      if (event.eventType) descriptionLines.push(`Type: ${event.eventType}`);
      if (event.tithi) descriptionLines.push(`Tithi: ${event.tithi}`);
      if (event.nakshatra) descriptionLines.push(`Nakshatra: ${event.nakshatra}`);
      if (event.maas) descriptionLines.push(`Maand: ${event.maas}`);
      if (event.sankranti) descriptionLines.push(`Sankranti: ${event.sankranti}`);
      if (event.timingType) descriptionLines.push(`Timing: ${event.timingType}`);

      const categoryNames = event.categories.map((c) => c.category.displayName);
      const categories = categoryNames.join(", ");
      if (categories) descriptionLines.push(`Categorieën: ${categories}`);
      if (event.tags && event.tags.length > 0)
        descriptionLines.push(`Tags: ${event.tags.join(", ")}`);

      calendar.createEvent({
        start,
        end,
        allDay,
        summary: event.name,
        description: descriptionLines.join("\n\n"),
        timezone: allDay ? undefined : timezone,
        categories: categoryNames.map((name) => ({ name })),
      });
    }

    return new NextResponse(calendar.toString(), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="sanatana-kalender.ics"',
      },
    });
  } catch (error) {
    logError("[API] GET /api/ical/export error:", error);
    return new NextResponse("Fout bij het genereren van de iCal export.", {
      status: 500,
    });
  }
}
