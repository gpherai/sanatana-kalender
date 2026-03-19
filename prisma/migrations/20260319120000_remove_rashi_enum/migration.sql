-- Remove unused Rashi enum
-- The Rashi enum was defined in the schema but never referenced by any model field.
-- Zodiac sign data is stored as plain strings (e.g. currentRashi String?).

DROP TYPE IF EXISTS "Rashi";
