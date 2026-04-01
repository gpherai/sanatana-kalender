# Gemini AI Instructions for Sanatana Kalender Project

These are the foundational mandates and workflows specifically for this project based on the user's preferences and lessons learned during development.

## 1. Event Occurrences Date Range
- **MANDATE:** Whenever generating events or running the occurrences generation script, **always** use the date range **from 01-01-2026 to 31-12-2029**.
- Do not generate events for 2025 or 2030 unless explicitly requested. The correct command for occurrences generation is:
  ```bash
  npm run db:occurrences -- --start 2026-01-01 --end 2029-12-31 --replace
  ```

## 2. Updating Event Descriptions & Tags
When tasked with reviewing or updating an event description, follow these exact steps:

1. **Research Phase:**
   - Always start by doing extensive online research on the event using the `google_web_search` tool.
   - Look for the meaning, background, celebration details, and specific rituals associated with the event.
2. **Drafting the Description:**
   - The updated description should be comprehensive and informative (not too short, but not an entire book).
   - Ensure the description covers the core symbolism, the deity involved, the specific moon phase/month (if applicable), and key rituals (e.g., fasting, offerings, recitation of specific texts/mantras).
3. **Tags (Strict Formatting):**
   - Add relevant, detailed tags to the event configuration based on your research.
   - **CRITICAL:** All tags MUST be in **strict alphabetical order**.

## 3. Updating the Source of Truth
- Update the specific event entry in `src/config/event-naming.ts`, as this file acts as the single source of truth for all auto-generated events.
- **CRITICAL FILE EDITING RULE:** Do **NOT** make multiple parallel `replace` tool calls on `src/config/event-naming.ts` in a single turn. Doing so causes race conditions and corrupts the file (e.g., duplicated/truncated lines at the bottom). To update multiple events:
  - Perform the edits sequentially across multiple conversational turns.
  - Or, use a specialized Node.js/TypeScript script to perform multiple precise replacements in one go safely.

## 4. Database Synchronization
After modifying `event-naming.ts`, **always** run the following commands to sync the database and regenerate the occurrences within the preferred date range:
```bash
npm run db:events
npm run db:occurrences -- --start 2026-01-01 --end 2029-12-31 --replace
```
