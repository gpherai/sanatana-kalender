-- Keep the database default aligned with DEFAULT_THEME_NAME in src/config/themes.ts.
ALTER TABLE "user_preferences" ALTER COLUMN "currentTheme" SET DEFAULT 'shri-ganesha';

-- Existing rows can only have the removed legacy default through older inserts.
UPDATE "user_preferences"
SET "currentTheme" = 'shri-ganesha'
WHERE "currentTheme" = 'spiritual-minimal';
