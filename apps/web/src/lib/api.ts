import type { Habit, TodayHabit, TodayResponse, WeekRecap } from "../types";

export async function refreshAll(
  apiBaseUrl: string,
  setHabits: (value: Habit[]) => void,
  setToday: (value: TodayResponse) => void,
  setWeekRecap: (value: WeekRecap) => void,
  setCounterDrafts: (value: Record<number, string> | ((current: Record<number, string>) => Record<number, string>)) => void,
  setDayNoteDraft: (value: string) => void,
  setErrorMessage?: (value: string) => void,
) {
  try {
    const [habitsResponse, todayResponse, weekResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/habits`),
      fetch(`${apiBaseUrl}/today`),
      fetch(`${apiBaseUrl}/recap/week`),
    ]);

    const habitsData = (await habitsResponse.json()) as { habits?: Habit[]; error?: string };
    const todayData = (await todayResponse.json()) as TodayResponse & { error?: string };
    const weekData = (await weekResponse.json()) as WeekRecap & { error?: string };

    if (!habitsResponse.ok) {
      setErrorMessage?.(habitsData.error ?? "Failed to load habits");
      return;
    }
    if (!todayResponse.ok) {
      setErrorMessage?.(todayData.error ?? "Failed to load today");
      return;
    }
    if (!weekResponse.ok) {
      setErrorMessage?.(weekData.error ?? "Failed to load recap");
      return;
    }

    setHabits(habitsData.habits ?? []);
    setToday(todayData);
    setWeekRecap(weekData);
    setDayNoteDraft(todayData.note ?? "");
    syncCounterDrafts(todayData.habits, setCounterDrafts);
    setErrorMessage?.("");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    setErrorMessage?.(message);
  }
}

export async function refreshWeek(
  apiBaseUrl: string,
  setWeekRecap: (value: WeekRecap) => void,
  setErrorMessage?: (value: string) => void,
) {
  const response = await fetch(`${apiBaseUrl}/recap/week`);
  const data = (await response.json()) as WeekRecap & { error?: string };
  if (!response.ok) {
    setErrorMessage?.(data.error ?? "Failed to load recap");
    return;
  }

  setWeekRecap(data);
}

export function syncCounterDrafts(
  habits: TodayHabit[],
  setCounterDrafts: (value: Record<number, string> | ((current: Record<number, string>) => Record<number, string>)) => void,
) {
  setCounterDrafts(() =>
    Object.fromEntries(
      habits
        .filter((habit) => habit.type === "counter")
        .map((habit) => [habit.habitId, String(habit.currentValue)]),
    ),
  );
}
