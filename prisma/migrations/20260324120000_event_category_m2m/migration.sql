-- CreateTable: EventCategory join table for Event ↔ Category M2M
CREATE TABLE "EventCategory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventCategory_eventId_categoryId_key" ON "EventCategory"("eventId", "categoryId");
CREATE INDEX "EventCategory_eventId_sortOrder_idx" ON "EventCategory"("eventId", "sortOrder");
CREATE INDEX "EventCategory_categoryId_idx" ON "EventCategory"("categoryId");

-- AddForeignKey
ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate existing categoryId → EventCategory (sortOrder=0 = primary)
INSERT INTO "EventCategory" ("id", "eventId", "categoryId", "sortOrder", "createdAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "categoryId",
    0,
    NOW()
FROM "Event"
WHERE "categoryId" IS NOT NULL;

-- AddColumn aliases to Event
ALTER TABLE "Event" ADD COLUMN "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- DropIndex on categoryId (before dropping column)
DROP INDEX IF EXISTS "Event_categoryId_idx";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT IF EXISTS "Event_categoryId_fkey";

-- DropColumn
ALTER TABLE "Event" DROP COLUMN "categoryId";
