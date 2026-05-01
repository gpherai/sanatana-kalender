import { memo } from "react";
import type { Routine, Goal, Practice } from "@/types/sadhana";
import { RoutinePanel } from "../RoutinePanel";
import { GoalPanel } from "../GoalPanel";
import { PracticesPanel } from "../PracticesPanel";

interface SettingsTabProps {
  routines: Routine[];
  goals: Goal[];
  allPractices: Practice[];
  loadAll: () => Promise<void>;
}

export const SettingsTab = memo(function SettingsTab({
  routines,
  goals,
  allPractices,
  loadAll,
}: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <RoutinePanel routines={routines} practices={allPractices} onChanged={loadAll} />
        <GoalPanel goals={goals} practices={allPractices} onChanged={loadAll} />
      </div>
      <PracticesPanel practices={allPractices} onChanged={loadAll} />
    </div>
  );
});
