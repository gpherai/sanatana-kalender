import type { Routine, Goal, Practice } from "../types";
import { RoutinePanel } from "../RoutinePanel";
import { GoalPanel } from "../GoalPanel";
import { PracticesPanel } from "../PracticesPanel";

interface InstellingenTabProps {
  routines: Routine[];
  goals: Goal[];
  allPractices: Practice[];
  loadAll: () => Promise<void>;
}

export function InstellingenTab({
  routines,
  goals,
  allPractices,
  loadAll,
}: InstellingenTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <RoutinePanel routines={routines} practices={allPractices} onChanged={loadAll} />
        <GoalPanel goals={goals} practices={allPractices} onChanged={loadAll} />
      </div>
      <PracticesPanel practices={allPractices} onChanged={loadAll} />
    </div>
  );
}
