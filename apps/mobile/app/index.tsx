import { useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Habit = {
  id: number;
  name: string;
  type: "binary" | "counter";
  unit: string | null;
  targetType: "complete" | "at_least" | "at_most" | "exact";
  targetValue: number | null;
  displayOrder: number;
  isActive: boolean;
};

type TodayHabit = {
  habitId: number;
  name: string;
  type: "binary" | "counter";
  targetType: "complete" | "at_least" | "at_most" | "exact";
  targetValue: number | null;
  currentValue: number;
  logStatus: "logged" | "skipped" | "not_logged";
  state: "successful" | "incomplete" | "skipped" | "missed";
};

type TodayResponse = {
  date: string;
  note: string;
  habits: TodayHabit[];
};

type WeekHabit = {
  habitId: number;
  name: string;
  successfulDays: number;
  incompleteDays: number;
  skippedDays: number;
  missedDays: number;
  totalValue: number;
};

type WeekRecap = {
  startDate: string;
  endDate: string;
  habits: WeekHabit[];
};

export default function Screen() {
  const [apiBaseUrl, setApiBaseUrl] = useState("http://127.0.0.1:8080");
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [habitType, setHabitType] = useState<"binary" | "counter">("binary");
  const [targetType, setTargetType] = useState<"complete" | "at_least" | "at_most" | "exact">("complete");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [dayNoteDraft, setDayNoteDraft] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [today, setToday] = useState<TodayResponse>({ date: "", note: "", habits: [] });
  const [weekRecap, setWeekRecap] = useState<WeekRecap>({ startDate: "", endDate: "", habits: [] });
  const [counterDrafts, setCounterDrafts] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    void refresh(apiBaseUrl, setHabits, setToday, setWeekRecap, setCounterDrafts, setDayNoteDraft, setMessage);
  }, [apiBaseUrl]);

  async function saveHabit() {
    setMessage("");
    const method = editingHabitId === null ? "POST" : "PATCH";
    const url = editingHabitId === null ? `${apiBaseUrl}/habits` : `${apiBaseUrl}/habits/${editingHabitId}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        type: habitType,
        targetType: habitType === "binary" ? "complete" : targetType,
        targetValue: habitType === "counter" ? Number(targetValue) : null,
        unit: unit || null,
        displayOrder: Number(displayOrder || 0),
      }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Save failed");
      return;
    }

    resetForm();
    setMessage(editingHabitId === null ? "Habit created." : "Habit updated.");
    await refresh(apiBaseUrl, setHabits, setToday, setWeekRecap, setCounterDrafts, setDayNoteDraft, setMessage);
  }

  async function archiveHabit(habitId: number) {
    const response = await fetch(`${apiBaseUrl}/habits/${habitId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isArchived: true }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Archive failed");
      return;
    }

    if (editingHabitId === habitId) {
      resetForm();
    }
    setMessage("Habit archived.");
    await refresh(apiBaseUrl, setHabits, setToday, setWeekRecap, setCounterDrafts, setDayNoteDraft, setMessage);
  }

  async function updateTodayLog(habitId: number, status: "logged" | "skipped", value?: number) {
    const response = await fetch(`${apiBaseUrl}/today/log`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ habitId, status, value: value ?? null }),
    });

    const data = (await response.json()) as TodayResponse & { error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Update failed");
      return;
    }

    setToday(data);
    setDayNoteDraft(data.note);
    syncCounterDrafts(data.habits, setCounterDrafts);
    await refreshWeek(apiBaseUrl, setWeekRecap, setMessage);
    setMessage("");
  }

  async function saveDayNote() {
    const response = await fetch(`${apiBaseUrl}/today/note`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note: dayNoteDraft }),
    });

    const data = (await response.json()) as TodayResponse & { error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Note save failed");
      return;
    }

    setToday(data);
    setDayNoteDraft(data.note);
    setMessage("Day note saved.");
  }

  function startEditHabit(habit: Habit) {
    setEditingHabitId(habit.id);
    setName(habit.name);
    setHabitType(habit.type);
    setTargetType(habit.targetType);
    setTargetValue(habit.targetValue === null ? "" : String(habit.targetValue));
    setUnit(habit.unit ?? "");
    setDisplayOrder(String(habit.displayOrder));
  }

  function resetForm() {
    setEditingHabitId(null);
    setName("");
    setHabitType("binary");
    setTargetType("complete");
    setTargetValue("");
    setUnit("");
    setDisplayOrder("0");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Habit Tracking MVP</Text>
          <Text style={styles.title}>Mobile management surface</Text>
          <Text style={styles.copy}>
            Logging, day notes, habit editing, archive, and a simple week recap.
          </Text>

          <TextInput
            value={apiBaseUrl}
            onChangeText={setApiBaseUrl}
            placeholder="http://127.0.0.1:8080"
            style={styles.input}
            autoCapitalize="none"
          />

          <TextInput value={name} onChangeText={setName} placeholder="Habit name" style={styles.input} />

          <View style={styles.row}>
            <Pressable
              style={[styles.chip, habitType === "binary" && styles.chipActive]}
              onPress={() => {
                setHabitType("binary");
                setTargetType("complete");
              }}
            >
              <Text style={styles.chipText}>Binary</Text>
            </Pressable>
            <Pressable
              style={[styles.chip, habitType === "counter" && styles.chipActive]}
              onPress={() => {
                setHabitType("counter");
                setTargetType("at_least");
              }}
            >
              <Text style={styles.chipText}>Counter</Text>
            </Pressable>
          </View>

          {habitType === "counter" ? (
            <>
              <View style={styles.row}>
                {(["at_least", "at_most", "exact"] as const).map((value) => (
                  <Pressable
                    key={value}
                    style={[styles.chip, targetType === value && styles.chipActive]}
                    onPress={() => setTargetType(value)}
                  >
                    <Text style={styles.chipText}>{value}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput value={targetValue} onChangeText={setTargetValue} placeholder="Target value" style={styles.input} keyboardType="number-pad" />
              <TextInput value={unit} onChangeText={setUnit} placeholder="Unit" style={styles.input} />
            </>
          ) : null}

          <TextInput value={displayOrder} onChangeText={setDisplayOrder} placeholder="Display order" style={styles.input} keyboardType="number-pad" />

          <View style={styles.row}>
            <Pressable style={styles.button} onPress={() => void saveHabit()}>
              <Text style={styles.buttonText}>{editingHabitId === null ? "Save habit" : "Update habit"}</Text>
            </Pressable>
            <Pressable
              style={styles.buttonSecondary}
              onPress={() => {
                resetForm();
                void refresh(apiBaseUrl, setHabits, setToday, setWeekRecap, setCounterDrafts, setDayNoteDraft, setMessage);
              }}
            >
              <Text style={styles.buttonSecondaryText}>Refresh</Text>
            </Pressable>
          </View>

          {editingHabitId !== null ? (
            <Pressable style={styles.buttonSecondary} onPress={resetForm}>
              <Text style={styles.buttonSecondaryText}>Cancel edit</Text>
            </Pressable>
          ) : null}

          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Habits</Text>
          {habits.map((habit) => (
            <View key={habit.id} style={styles.listRow}>
              <Text style={styles.listTitle}>{habit.name}</Text>
              <Text style={styles.listMeta}>{habit.type}</Text>
              <View style={styles.row}>
                <Pressable style={styles.buttonSecondary} onPress={() => startEditHabit(habit)}>
                  <Text style={styles.buttonSecondaryText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.buttonSecondary} onPress={() => void archiveHabit(habit.id)}>
                  <Text style={styles.buttonSecondaryText}>Archive</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {habits.length === 0 ? <Text style={styles.copy}>No habits yet.</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Today {today.date ? `• ${today.date}` : ""}</Text>
          <TextInput
            value={dayNoteDraft}
            onChangeText={setDayNoteDraft}
            placeholder="Short note about today"
            style={[styles.input, styles.noteInput]}
            multiline
          />
          <Pressable style={styles.buttonSecondary} onPress={() => void saveDayNote()}>
            <Text style={styles.buttonSecondaryText}>Save day note</Text>
          </Pressable>
          {today.habits.map((habit) => (
            <View key={habit.habitId} style={styles.todayCard}>
              <Text style={styles.listTitle}>{habit.name}</Text>
              <Text style={styles.listMeta}>
                {habit.state} • value {habit.currentValue}
              </Text>
              {habit.type === "binary" ? (
                <View style={styles.row}>
                  <Pressable
                    style={styles.button}
                    onPress={() => void updateTodayLog(habit.habitId, "logged", habit.currentValue >= 1 ? 0 : 1)}
                  >
                    <Text style={styles.buttonText}>
                      {habit.currentValue >= 1 ? "Mark incomplete" : "Mark complete"}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.buttonSecondary} onPress={() => void updateTodayLog(habit.habitId, "skipped", 0)}>
                    <Text style={styles.buttonSecondaryText}>Skip</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.row}>
                    <Pressable
                      style={styles.buttonSecondary}
                      onPress={() => void updateTodayLog(habit.habitId, "logged", Math.max(habit.currentValue - 1, 0))}
                    >
                      <Text style={styles.buttonSecondaryText}>-1</Text>
                    </Pressable>
                    <Pressable style={styles.button} onPress={() => void updateTodayLog(habit.habitId, "logged", habit.currentValue + 1)}>
                      <Text style={styles.buttonText}>+1</Text>
                    </Pressable>
                    <Pressable style={styles.buttonSecondary} onPress={() => void updateTodayLog(habit.habitId, "skipped", 0)}>
                      <Text style={styles.buttonSecondaryText}>Skip</Text>
                    </Pressable>
                  </View>
                  <View style={styles.row}>
                    <TextInput
                      value={counterDrafts[habit.habitId] ?? String(habit.currentValue)}
                      onChangeText={(value) =>
                        setCounterDrafts((current) => ({
                          ...current,
                          [habit.habitId]: value,
                        }))
                      }
                      style={[styles.input, styles.inlineInput]}
                      keyboardType="number-pad"
                    />
                    <Pressable
                      style={styles.button}
                      onPress={() => void updateTodayLog(habit.habitId, "logged", parseCounterDraft(counterDrafts[habit.habitId], habit.currentValue))}
                    >
                      <Text style={styles.buttonText}>Set value</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ))}
          {today.habits.length === 0 ? <Text style={styles.copy}>No active habits.</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Week recap</Text>
          <Text style={styles.listMeta}>
            {weekRecap.startDate} to {weekRecap.endDate}
          </Text>
          {weekRecap.habits.map((habit) => (
            <View key={habit.habitId} style={styles.listRow}>
              <Text style={styles.listTitle}>{habit.name}</Text>
              <Text style={styles.listMeta}>
                success {habit.successfulDays} • incomplete {habit.incompleteDays} • skipped {habit.skippedDays} • missed {habit.missedDays} • total {habit.totalValue}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

async function refresh(
  apiBaseUrl: string,
  setHabits: (value: Habit[]) => void,
  setToday: (value: TodayResponse) => void,
  setWeekRecap: (value: WeekRecap) => void,
  setCounterDrafts: (value: Record<number, string> | ((current: Record<number, string>) => Record<number, string>)) => void,
  setDayNoteDraft: (value: string) => void,
  setMessage: (value: string) => void,
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
      setMessage(habitsData.error ?? "Failed to load habits");
      return;
    }
    if (!todayResponse.ok) {
      setMessage(todayData.error ?? "Failed to load today");
      return;
    }
    if (!weekResponse.ok) {
      setMessage(weekData.error ?? "Failed to load recap");
      return;
    }

    setHabits(habitsData.habits ?? []);
    setToday(todayData);
    setWeekRecap(weekData);
    setDayNoteDraft(todayData.note);
    syncCounterDrafts(todayData.habits, setCounterDrafts);
    setMessage("");
  } catch (error) {
    setMessage(error instanceof Error ? error.message : "Request failed");
  }
}

async function refreshWeek(
  apiBaseUrl: string,
  setWeekRecap: (value: WeekRecap) => void,
  setMessage: (value: string) => void,
) {
  const response = await fetch(`${apiBaseUrl}/recap/week`);
  const data = (await response.json()) as WeekRecap & { error?: string };
  if (!response.ok) {
    setMessage(data.error ?? "Failed to load recap");
    return;
  }
  setWeekRecap(data);
}

function syncCounterDrafts(
  habits: TodayHabit[],
  setCounterDrafts: (value: Record<number, string> | ((current: Record<number, string>) => Record<number, string>)) => void,
) {
  setCounterDrafts(() =>
    Object.fromEntries(
      habits.filter((habit) => habit.type === "counter").map((habit) => [habit.habitId, String(habit.currentValue)]),
    ),
  );
}

function parseCounterDraft(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#efe5d6",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#fffaf2",
    gap: 12,
  },
  todayCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#efe5d6",
    gap: 10,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#7f5d2d",
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
    color: "#1c1f1b",
  },
  copy: {
    fontSize: 16,
    lineHeight: 24,
    color: "#3f413d",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9c7a8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  inlineInput: {
    minWidth: 110,
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#eadfc8",
  },
  chipActive: {
    backgroundColor: "#c8a45a",
  },
  chipText: {
    color: "#1c1f1b",
    textTransform: "capitalize",
  },
  button: {
    flexGrow: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#7f5d2d",
  },
  buttonSecondary: {
    flexGrow: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#eadfc8",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  buttonSecondaryText: {
    color: "#3f413d",
    fontWeight: "700",
  },
  message: {
    color: "#7f5d2d",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1c1f1b",
  },
  listRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#efe5d6",
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1c1f1b",
  },
  listMeta: {
    fontSize: 14,
    color: "#5d6059",
    marginTop: 2,
    textTransform: "capitalize",
  },
});
