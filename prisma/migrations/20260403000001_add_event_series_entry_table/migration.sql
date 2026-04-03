-- CreateTable EventSeriesEntry (replaces the old Event.parentEventId approach)
CREATE TABLE "EventSeriesEntry" (
    "id"            TEXT NOT NULL,
    "parentEventId" TEXT NOT NULL,
    "childEventId"  TEXT NOT NULL,
    "dayNumber"     INTEGER,
    "sortOrder"     INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventSeriesEntry_pkey" PRIMARY KEY ("id")
);

-- Unique: each child can only appear once per parent
CREATE UNIQUE INDEX "EventSeriesEntry_parentEventId_childEventId_key"
  ON "EventSeriesEntry"("parentEventId", "childEventId");

-- Indexes for fast lookups
CREATE INDEX "EventSeriesEntry_parentEventId_idx" ON "EventSeriesEntry"("parentEventId");
CREATE INDEX "EventSeriesEntry_childEventId_idx"  ON "EventSeriesEntry"("childEventId");

-- Foreign keys
ALTER TABLE "EventSeriesEntry"
  ADD CONSTRAINT "EventSeriesEntry_parentEventId_fkey"
    FOREIGN KEY ("parentEventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventSeriesEntry"
  ADD CONSTRAINT "EventSeriesEntry_childEventId_fkey"
    FOREIGN KEY ("childEventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint on Event.namingKey (was missing from earlier migrations)
CREATE UNIQUE INDEX "Event_namingKey_key" ON "Event"("namingKey");
