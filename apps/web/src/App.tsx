import { useEffect, useState, useTransition } from "react";
import { ConnectionPanel } from "./components/ConnectionPanel";
import { HabitFormCard } from "./components/HabitFormCard";
import { HabitsTable } from "./components/HabitsTable";
import { HeroCard } from "./components/HeroCard";
import { TodayCard } from "./components/TodayCard";
import { WeekRecapCard } from "./components/WeekRecapCard";
import { refreshAll, refreshWeek, syncCounterDrafts } from "./lib/api";
import { AppShell } from "./layouts/AppShell";
import type { Habit, HabitForm, TodayResponse, WeekRecap } from "./types";

const defaultForm: HabitForm = {
  name: "",
  type: "binary",
  targetType: "complete",
  targetValue: "",
  unit: "",
  displayOrder: "0",
};

export function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState("http://127.0.0.1:8080");
  const [form, setForm] = useState<HabitForm>(defaultForm);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [today, setToday] = useState<TodayResponse>({ date: "", note: "", habits: [] });
  const [weekRecap, setWeekRecap] = useState<WeekRecap>({ startDate: "", endDate: "", habits: [] });
  const [counterDrafts, setCounterDrafts] = useState<Record<number, string>>({});
  const [dayNoteDraft, setDayNoteDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void refreshAll(apiBaseUrl, setHabits, setToday, setWeekRecap, setCounterDrafts, setDayNoteDraft, setErrorMessage);
  }, [apiBaseUrl]);

  async function handleSaveHabit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      name: form.name.trim(),
      type: form.type,
      targetType: form.type === "binary" ? "complete" : form.targetType,
      targetValue: form.type === "counter" ? Number(form.targetValue) : null,
      unit: form.unit.trim() || null,
      displayOrder: Number(form.displayOrder || 0),
    };

    const url = editingHabitId === null ? `${apiBaseUrl}/habits` : `${apiBaseUrl}/habits/${editingHabitId}`;
    const method = editingHabitId === null ? "POST" : "PATCH";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setErrorMessage(data.error ?? "Request failed");
      return;
    }

    resetHabitForm();
    setSuccessMessage(editingHabitId === null ? "Habit created." : "Habit updated.");
    startTransition(() => {
      void refreshAll(apiBaseUrl, setHabits, setToday, setWeekRecap, setCounterDrafts, setDayNoteDraft, setErrorMessage);
    });
  }

  async function archiveHabit(habitId: number) {
    setErrorMessage("");
    const response = await fetch(`${apiBaseUrl}/habits/${habitId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isArchived: true }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setErrorMessage(data.error ?? "Archive failed");
      return;
    }

    if (editingHabitId === habitId) {
      resetHabitForm();
    }

    setSuccessMessage("Habit archived.");
    await refreshAll(apiBaseUrl, setHabits, setToday, setWeekRecap, setCounterDrafts, setDayNoteDraft, setErrorMessage);
  }

  async function updateTodayLog(habitId: number, status: "logged" | "skipped", value?: number) {
    setErrorMessage("");
    const response = await fetch(`${apiBaseUrl}/today/log`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ habitId, status, value: value ?? null }),
    });

    const data = (await response.json()) as TodayResponse & { error?: string };
    if (!response.ok) {
      setErrorMessage(data.error ?? "Log update failed");
      return;
    }

    setToday(data);
    setDayNoteDraft(data.note);
    syncCounterDrafts(data.habits, setCounterDrafts);
    await refreshWeek(apiBaseUrl, setWeekRecap, setErrorMessage);
  }

  async function saveDayNote() {
    setErrorMessage("");
    const response = await fetch(`${apiBaseUrl}/today/note`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note: dayNoteDraft }),
    });

    const data = (await response.json()) as TodayResponse & { error?: string };
    if (!response.ok) {
      setErrorMessage(data.error ?? "Day note save failed");
      return;
    }

    setToday(data);
    setDayNoteDraft(data.note);
    setSuccessMessage("Day note saved.");
  }

  function beginEditHabit(habit: Habit) {
    setEditingHabitId(habit.id);
    setForm({
      name: habit.name,
      type: habit.type,
      targetType: habit.targetType,
      targetValue: habit.targetValue === null ? "" : String(habit.targetValue),
      unit: habit.unit ?? "",
      displayOrder: String(habit.displayOrder),
    });
  }

  function resetHabitForm() {
    setEditingHabitId(null);
    setForm(defaultForm);
  }

  return (
    <AppShell
      hero={<HeroCard />}
      topRow={
        <>
          <ConnectionPanel
            apiBaseUrl={apiBaseUrl}
            successMessage={successMessage}
            errorMessage={errorMessage}
            onApiBaseUrlChange={setApiBaseUrl}
            onRefresh={() =>
              void refreshAll(
                apiBaseUrl,
                setHabits,
                setToday,
                setWeekRecap,
                setCounterDrafts,
                setDayNoteDraft,
                setErrorMessage,
              )
            }
          />
          <HabitFormCard
            editingHabitId={editingHabitId}
            form={form}
            isPending={isPending}
            onSubmit={(event) => void handleSaveHabit(event)}
            onFormChange={(recipe) => setForm((current) => recipe(current))}
            onReset={resetHabitForm}
          />
        </>
      }
      middleRow={
        <>
          <HabitsTable
            habits={habits}
            onEdit={beginEditHabit}
            onArchive={(habitId) => void archiveHabit(habitId)}
          />
          <TodayCard
            today={today}
            dayNoteDraft={dayNoteDraft}
            counterDrafts={counterDrafts}
            onDayNoteChange={setDayNoteDraft}
            onCounterDraftChange={(habitId, value) =>
              setCounterDrafts((current) => ({
                ...current,
                [habitId]: value,
              }))
            }
            onSaveDayNote={() => void saveDayNote()}
            onUpdateTodayLog={(habitId, status, value) => void updateTodayLog(habitId, status, value)}
          />
        </>
      }
      bottomRow={<WeekRecapCard weekRecap={weekRecap} />}
    />
  );
}
