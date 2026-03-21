import { EVENT_NAMING_CATALOG } from "./src/config/event-naming";
import { STATIC_EVENTS } from "./src/scripts/seed-helpers"; // Wait, seed.ts might not export STATIC_EVENTS

const missingInfo = [];

EVENT_NAMING_CATALOG.forEach((e) => {
  if (!e.description || e.description.length < 10)
    missingInfo.push(`${e.key}: Missing or very short description`);
  if (!e.tags || e.tags.length === 0) missingInfo.push(`${e.key}: Missing tags`);
  if (!e.category) missingInfo.push(`${e.key}: Missing category`);
  // Check if general category is overused for specific deity days
  if (
    e.category === "general" &&
    (e.name.toLowerCase().includes("jayanti") || e.name.toLowerCase().includes("puja"))
  ) {
    missingInfo.push(
      `${e.key}: Marked as 'general' but might belong to a deity (Jayanti/Puja)`
    );
  }
});

console.log("EVENT_NAMING_CATALOG Issues:");
console.log(missingInfo.length > 0 ? missingInfo.join("\n") : "All good!");
