-- CreateTable
CREATE TABLE "sadhana_routines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sadhana_routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sadhana_routine_items" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" "SadhanaItemUnit" NOT NULL DEFAULT 'malas',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sadhana_routine_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sadhana_routine_items_routineId_idx" ON "sadhana_routine_items"("routineId");

-- AddForeignKey
ALTER TABLE "sadhana_routine_items" ADD CONSTRAINT "sadhana_routine_items_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "sadhana_routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sadhana_routine_items" ADD CONSTRAINT "sadhana_routine_items_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "sadhana_practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
