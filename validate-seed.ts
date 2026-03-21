import fs from "fs";

const content = fs.readFileSync("src/scripts/seed.ts", "utf-8");

// A simple regex to find event objects in the STATIC_EVENTS array.
// This is a bit fragile but works for a quick check.
const nameRegex = /name:\s*"([^"]+)"/g;

let match;
let count = 0;
const missingInfo = [];

const blocks = content.split('name: "');

// skip the first block before the first name
for (let i = 1; i < blocks.length; i++) {
  const block = blocks[i];
  const name = block.substring(0, block.indexOf('"'));

  if (!block.includes("description:")) {
    missingInfo.push(`${name}: Missing description`);
  } else {
    // Check if description is too short
    const descMatch = block.match(/description:\s*"([^"]+)"/);
    if (descMatch && descMatch[1].length < 10) {
      missingInfo.push(`${name}: Description too short`);
    }
  }

  if (!block.includes("categoryName:")) {
    missingInfo.push(`${name}: Missing categoryName`);
  }

  count++;
}

console.log(`Checked ${count} events in seed.ts.`);
if (missingInfo.length > 0) {
  console.log("Issues found:");
  console.log(missingInfo.join("\n"));
} else {
  console.log("All events have descriptions and categories!");
}
