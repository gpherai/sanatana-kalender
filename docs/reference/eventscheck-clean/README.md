# Clean Event References

This folder contains human-readable cleaned Markdown copies of every file in `docs/reference/eventscheck`.

Use this folder for a DB/reference control script when you want predictable headings and fields without copied Drik Panchang UI noise.

Cleaning rules:

- Original files are not changed.
- Repeated copied title rows are deduplicated under `Names`.
- Icon paths, Panchang link labels, samvata headers, page notes, and navigation text are removed.
- Ekadashi variants such as Gauna, Vaishnava, Mahadwadashi, and Parana are preserved.
- Single-event pages keep related rows, marked with `Relation: related` or `Relation: context`.
- Each entry keeps `Source lines` so you can trace it back to the raw file.

See `INDEX.md` for the complete file list.
