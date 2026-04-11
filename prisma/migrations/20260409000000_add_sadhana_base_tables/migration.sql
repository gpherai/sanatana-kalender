-- CreateEnum
CREATE TYPE "SadhanaPracticeType" AS ENUM ('mantra_japa', 'parayana', 'other');

-- CreateEnum
CREATE TYPE "SadhanaItemUnit" AS ENUM ('malas', 'count');

-- CreateEnum
CREATE TYPE "SadhanaGoalType" AS ENUM ('daily', 'weekly', 'lifetime');

-- CreateTable
CREATE TABLE "sadhana_practices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SadhanaPracticeType" NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sadhana_practices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sadhana_sessions" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sadhana_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sadhana_sessions_date_idx" ON "sadhana_sessions"("date");

-- CreateTable
CREATE TABLE "sadhana_session_items" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" "SadhanaItemUnit" NOT NULL DEFAULT 'malas',
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sadhana_session_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sadhana_session_items_sessionId_idx" ON "sadhana_session_items"("sessionId");

-- AddForeignKey
ALTER TABLE "sadhana_session_items" ADD CONSTRAINT "sadhana_session_items_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "sadhana_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sadhana_session_items" ADD CONSTRAINT "sadhana_session_items_practiceId_fkey"
    FOREIGN KEY ("practiceId") REFERENCES "sadhana_practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "sadhana_goals" (
    "id" TEXT NOT NULL,
    "type" "SadhanaGoalType" NOT NULL,
    "name" TEXT,
    "targetMalas" INTEGER NOT NULL,
    "targetMinutes" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sadhana_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SadhanaGoalToSadhanaPractice" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SadhanaGoalToSadhanaPractice_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SadhanaGoalToSadhanaPractice_B_index" ON "_SadhanaGoalToSadhanaPractice"("B");

-- AddForeignKey
ALTER TABLE "_SadhanaGoalToSadhanaPractice" ADD CONSTRAINT "_SadhanaGoalToSadhanaPractice_A_fkey"
    FOREIGN KEY ("A") REFERENCES "sadhana_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SadhanaGoalToSadhanaPractice" ADD CONSTRAINT "_SadhanaGoalToSadhanaPractice_B_fkey"
    FOREIGN KEY ("B") REFERENCES "sadhana_practices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
