"use client";

import { useMemo } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type SessionData,
  type Practice,
  type Routine,
  type DayInfoMap,
  apiFetch,
  formatDate,
  formatDuration,
  dayContextLabel,
  todayString,
} from "./types";
import { SessionForm } from "./SessionForm";
import { SessionCard } from "./SessionCard";

const MONTHS_NL_FULL = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTHS_NL_FULL[parseInt(m!, 10) - 1]} ${y}`;
}

function getMonthTotals(monthSessions: SessionData[]) {
  let malas = 0;
  let minutes = 0;
  for (const s of monthSessions) {
    malas += s.total_malas;
    minutes += s.duration_minutes ?? 0;
  }
  return { malas, minutes, count: monthSessions.length };
}

interface SessionsSectionProps {
  sessions: SessionData[];
  expandedMonths: Set<string>;
  toggleMonth: (month: string) => void;
  showAddSession: boolean;
  setShowAddSession: (v: boolean) => void;
  dayInfoMap: DayInfoMap;
  activePractices: Practice[];
  routines: Routine[];
  loadAll: () => void;
  showToast: (msg: string) => void;
  hideHeader?: boolean;
}

export function SessionsSection({
  sessions,
  expandedMonths,
  toggleMonth,
  showAddSession,
  setShowAddSession,
  dayInfoMap,
  activePractices,
  routines,
  loadAll,
  showToast,
  hideHeader = false,
}: SessionsSectionProps) {
  const sessionsByMonth = useMemo(() => {
    const map = new Map<string, SessionData[]>();
    for (const s of sessions) {
      const month = s.date.slice(0, 7);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(s);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [sessions]);

  return (
    <div className="space-y-3">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-theme-fg font-semibold">Sessies</h2>
          <button
            onClick={() => setShowAddSession(!showAddSession)}
            className="bg-theme-primary flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white shadow hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Toevoegen
          </button>
        </div>
      )}

      {showAddSession && (
        <div className="bg-theme-surface-raised rounded-2xl p-5 shadow-lg">
          <h3 className="text-theme-fg mb-4 font-semibold">Sessie toevoegen</h3>
          {activePractices.length === 0 ? (
            <p className="text-theme-warning text-sm">
              Voeg eerst een actieve beoefening toe onderaan de pagina.
            </p>
          ) : (
            <SessionForm
              practices={activePractices}
              routines={routines}
              submitLabel="Opslaan"
              onSubmit={async (data) => {
                await apiFetch("/sessions", {
                  method: "POST",
                  body: JSON.stringify({
                    date: data.date,
                    started_at: data.startedAt
                      ? new Date(`${data.date}T${data.startedAt}`).toISOString()
                      : null,
                    duration_minutes: data.duration ? parseInt(data.duration, 10) : null,
                    notes: data.notes.trim() || null,
                    items: data.items.map((it) => ({
                      practice_id: it.practice_id,
                      quantity: parseInt(it.quantity, 10),
                      unit: it.unit,
                    })),
                  }),
                });
                setShowAddSession(false);
                loadAll();
                showToast("Sessie opgeslagen");
              }}
              onCancel={() => setShowAddSession(false)}
            />
          )}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-theme-surface-raised rounded-2xl p-8 text-center shadow-lg">
          <div className="text-theme-fg-muted text-sm">Geen sessies gevonden.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {sessionsByMonth.map(([month, monthSessions]) => {
            const isOpen = expandedMonths.has(month);
            const { malas, minutes, count } = getMonthTotals(monthSessions);
            return (
              <div
                key={month}
                className="bg-theme-surface-raised overflow-hidden rounded-2xl shadow-lg"
              >
                <button
                  onClick={() => toggleMonth(month)}
                  className="hover:bg-theme-hover flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors"
                >
                  <ChevronRight
                    className={cn(
                      "text-theme-fg-muted h-4 w-4 shrink-0 transition-transform duration-200",
                      isOpen && "rotate-90"
                    )}
                  />
                  <span className="text-theme-fg flex-1 text-left font-semibold capitalize">
                    {formatMonthLabel(month)}
                  </span>
                  <div className="text-theme-fg-muted flex items-center gap-2 text-xs">
                    <span>{count} sessies</span>
                    <span className="text-theme-border">·</span>
                    <span>{Math.round(malas)} malas</span>
                    {minutes > 0 && (
                      <>
                        <span className="text-theme-border">·</span>
                        <span>{formatDuration(minutes)}</span>
                      </>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-theme-border space-y-4 border-t px-4 pt-4 pb-4">
                    {Object.entries(
                      monthSessions.reduce(
                        (acc, s) => {
                          (acc[s.date] ??= []).push(s);
                          return acc;
                        },
                        {} as Record<string, SessionData[]>
                      )
                    )
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([date, daySessions]) => {
                        const info = dayInfoMap.get(date);
                        const context = dayContextLabel(info);
                        const isToday = date === todayString();
                        return (
                          <div key={date} className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2 px-1">
                              <span className="text-theme-fg-secondary text-xs font-semibold">
                                {formatDate(date)}
                              </span>
                              {isToday && (
                                <span className="bg-theme-primary/15 text-theme-primary rounded-full px-2 py-0.5 text-xs font-medium">
                                  Vandaag
                                </span>
                              )}
                              {context && (
                                <span className="text-theme-fg-muted text-xs">
                                  {context}
                                </span>
                              )}
                            </div>
                            {daySessions.map((s) => (
                              <SessionCard
                                key={s.id}
                                session={s}
                                practices={activePractices}
                                onUpdated={() => {
                                  loadAll();
                                  showToast("Sessie opgeslagen");
                                }}
                                onDeleted={() => {
                                  loadAll();
                                  showToast("Sessie verwijderd");
                                }}
                              />
                            ))}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
