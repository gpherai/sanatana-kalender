-- Add count_size to sadhana_practices
-- Stores the number of names/mantras per counting unit (e.g. 32 for Durga Dvatrimshanamavali)
ALTER TABLE "sadhana_practices" ADD COLUMN "countSize" INTEGER;
