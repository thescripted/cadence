import { useEffect, useState, useTransition } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Select,
  Separator,
  Table,
  Text,
  TextArea,
  TextField,
  Theme,
} from "@radix-ui/themes";

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
  unit: string | null;
  targetType: "complete" | "at_least" | "at_most" | "exact";
  targetValue: number | null;
  displayOrder: number;
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
  type: "binary" | "counter";
  successfulDays: number;
  incompleteDays: number;
  skippedDays: number;
  missedDays: number;
  totalValue: number;
  targetType: string;
  targetValue: number | null;
};

type WeekRecap = {
  startDate: string;
  endDate: string;
  habits: WeekHabit[];
};

type HabitForm = {
  name: string;
  type: "binary" | "counter";
  targetType: "complete" | "at_least" | "at_most" | "exact";
  targetValue: string;
  unit: string;
  displayOrder: string;
};

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
    <Theme accentColor="amber" grayColor="sand" radius="large" scaling="105%">
      <Box className="page-shell">
        <Container size="4">
          <Flex direction="column" gap="6" className="stack">
            <Card size="4" className="hero-card">
              <Flex direction="column" gap="3">
                <Text size="1" weight="bold" className="eyebrow">
                  Habit Tracking MVP
                </Text>
                <Heading size="8">Tracking, habit management, and recap</Heading>
                <Text size="3" className="hero-copy">
                  The app now supports daily logging, editable habits, day notes,
                  and a simple rolling week recap.
                </Text>
              </Flex>
            </Card>

            <Flex gap="4" wrap="wrap" className="grid-two">
              <Card size="3">
                <Flex direction="column" gap="4">
                  <Heading size="4">API connection</Heading>
                  <TextField.Root
                    value={apiBaseUrl}
                    onChange={(event) => setApiBaseUrl(event.target.value)}
                    placeholder="http://127.0.0.1:8080"
                  />
                  <Button
                    variant="soft"
                    onClick={() =>
                      void refreshAll(apiBaseUrl, setHabits, setToday, setWeekRecap, setCounterDrafts, setDayNoteDraft, setErrorMessage)
                    }
                  >
                    Refresh all
                  </Button>
                  {successMessage ? <Text color="green">{successMessage}</Text> : null}
                  {errorMessage ? <Text color="red">{errorMessage}</Text> : null}
                </Flex>
              </Card>

              <Card size="3">
                <form onSubmit={(event) => void handleSaveHabit(event)}>
                  <Flex direction="column" gap="3">
                    <Heading size="4">{editingHabitId === null ? "Create habit" : `Edit habit #${editingHabitId}`}</Heading>
                    <TextField.Root
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Water intake"
                    />
                    <Flex gap="3" wrap="wrap">
                      <Box className="field-block">
                        <Text as="label" size="2">Type</Text>
                        <Select.Root
                          value={form.type}
                          onValueChange={(value: "binary" | "counter") =>
                            setForm((current) => ({
                              ...current,
                              type: value,
                              targetType: value === "binary" ? "complete" : current.targetType === "complete" ? "at_least" : current.targetType,
                              targetValue: value === "binary" ? "" : current.targetValue,
                            }))
                          }
                        >
                          <Select.Trigger />
                          <Select.Content>
                            <Select.Item value="binary">Binary</Select.Item>
                            <Select.Item value="counter">Counter</Select.Item>
                          </Select.Content>
                        </Select.Root>
                      </Box>
                      <Box className="field-block">
                        <Text as="label" size="2">Target rule</Text>
                        <Select.Root
                          value={form.targetType}
                          onValueChange={(value: "complete" | "at_least" | "at_most" | "exact") =>
                            setForm((current) => ({ ...current, targetType: value }))
                          }
                          disabled={form.type === "binary"}
                        >
                          <Select.Trigger />
                          <Select.Content>
                            <Select.Item value="complete">Complete</Select.Item>
                            <Select.Item value="at_least">At least</Select.Item>
                            <Select.Item value="at_most">At most</Select.Item>
                            <Select.Item value="exact">Exact</Select.Item>
                          </Select.Content>
                        </Select.Root>
                      </Box>
                    </Flex>
                    <Flex gap="3" wrap="wrap">
                      <TextField.Root
                        value={form.unit}
                        onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                        placeholder="glass"
                      />
                      <TextField.Root
                        value={form.displayOrder}
                        onChange={(event) => setForm((current) => ({ ...current, displayOrder: event.target.value }))}
                        placeholder="0"
                      />
                    </Flex>
                    {form.type === "counter" ? (
                      <TextField.Root
                        value={form.targetValue}
                        onChange={(event) => setForm((current) => ({ ...current, targetValue: event.target.value }))}
                        placeholder="8"
                      />
                    ) : null}
                    <Flex gap="2" wrap="wrap">
                      <Button type="submit" disabled={isPending}>
                        {editingHabitId === null ? "Create habit" : "Save habit"}
                      </Button>
                      {editingHabitId !== null ? (
                        <Button type="button" variant="soft" onClick={resetHabitForm}>
                          Cancel edit
                        </Button>
                      ) : null}
                    </Flex>
                  </Flex>
                </form>
              </Card>
            </Flex>

            <Flex gap="4" wrap="wrap" className="grid-two">
              <Card size="3">
                <Flex direction="column" gap="3">
                  <Heading size="4">Habits</Heading>
                  <Separator size="4" />
                  <Table.Root variant="surface">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Target</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {habits.map((habit) => (
                        <Table.Row key={habit.id}>
                          <Table.RowHeaderCell>{habit.name}</Table.RowHeaderCell>
                          <Table.Cell>{habit.type}</Table.Cell>
                          <Table.Cell>{formatTarget(habit.targetType, habit.targetValue, habit.unit)}</Table.Cell>
                          <Table.Cell>
                            <Flex gap="2" wrap="wrap">
                              <Button variant="soft" onClick={() => beginEditHabit(habit)}>
                                Edit
                              </Button>
                              <Button color="red" variant="soft" onClick={() => void archiveHabit(habit.id)}>
                                Archive
                              </Button>
                            </Flex>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                  {habits.length === 0 ? <Text size="2">No habits yet.</Text> : null}
                </Flex>
              </Card>

              <Card size="3">
                <Flex direction="column" gap="3">
                  <Flex justify="between" align="center">
                    <Heading size="4">Today</Heading>
                    <Badge color="amber" variant="soft">
                      {today.date || "No date"}
                    </Badge>
                  </Flex>
                  <TextArea
                    value={dayNoteDraft}
                    onChange={(event) => setDayNoteDraft(event.target.value)}
                    placeholder="Short note about today"
                  />
                  <Button variant="soft" onClick={() => void saveDayNote()}>
                    Save day note
                  </Button>
                  <Separator size="4" />
                  <Flex direction="column" gap="3">
                    {today.habits.map((habit) => (
                      <Card key={habit.habitId} variant="ghost">
                        <Flex direction="column" gap="3">
                          <Flex justify="between" align="start" gap="4">
                            <Box>
                              <Text weight="bold">{habit.name}</Text>
                              <Text as="div" size="2" color="gray">
                                {formatTarget(habit.targetType, habit.targetValue, habit.unit)}
                              </Text>
                            </Box>
                            <Flex direction="column" align="end" gap="2">
                              <Badge color={badgeColor(habit.state)}>{habit.state}</Badge>
                              <Text size="2">
                                value {habit.currentValue} • {habit.logStatus}
                              </Text>
                            </Flex>
                          </Flex>

                          {habit.type === "binary" ? (
                            <Flex gap="2" wrap="wrap">
                              <Button
                                onClick={() =>
                                  void updateTodayLog(habit.habitId, "logged", habit.currentValue >= 1 ? 0 : 1)
                                }
                              >
                                {habit.currentValue >= 1 ? "Mark incomplete" : "Mark complete"}
                              </Button>
                              <Button variant="soft" onClick={() => void updateTodayLog(habit.habitId, "skipped", 0)}>
                                Skip today
                              </Button>
                            </Flex>
                          ) : (
                            <Flex direction="column" gap="2">
                              <Flex gap="2" wrap="wrap" align="center">
                                <Button
                                  variant="soft"
                                  onClick={() =>
                                    void updateTodayLog(habit.habitId, "logged", Math.max(habit.currentValue - 1, 0))
                                  }
                                >
                                  -1
                                </Button>
                                <Button onClick={() => void updateTodayLog(habit.habitId, "logged", habit.currentValue + 1)}>
                                  +1
                                </Button>
                                <Button variant="soft" onClick={() => void updateTodayLog(habit.habitId, "skipped", 0)}>
                                  Skip today
                                </Button>
                              </Flex>
                              <Flex gap="2" wrap="wrap" align="center">
                                <TextField.Root
                                  className="counter-input"
                                  value={counterDrafts[habit.habitId] ?? String(habit.currentValue)}
                                  onChange={(event) =>
                                    setCounterDrafts((current) => ({
                                      ...current,
                                      [habit.habitId]: event.target.value,
                                    }))
                                  }
                                  placeholder="0"
                                />
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    void updateTodayLog(
                                      habit.habitId,
                                      "logged",
                                      parseCounterDraft(counterDrafts[habit.habitId], habit.currentValue),
                                    )
                                  }
                                >
                                  Set value
                                </Button>
                              </Flex>
                            </Flex>
                          )}
                        </Flex>
                      </Card>
                    ))}
                    {today.habits.length === 0 ? <Text size="2">No active habits.</Text> : null}
                  </Flex>
                </Flex>
              </Card>
            </Flex>

            <Card size="3">
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Heading size="4">Week recap</Heading>
                  <Badge variant="soft">
                    {weekRecap.startDate} to {weekRecap.endDate}
                  </Badge>
                </Flex>
                <Separator size="4" />
                <Table.Root variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Habit</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Success</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Incomplete</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Skipped</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Missed</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {weekRecap.habits.map((habit) => (
                      <Table.Row key={habit.habitId}>
                        <Table.RowHeaderCell>{habit.name}</Table.RowHeaderCell>
                        <Table.Cell>{habit.successfulDays}</Table.Cell>
                        <Table.Cell>{habit.incompleteDays}</Table.Cell>
                        <Table.Cell>{habit.skippedDays}</Table.Cell>
                        <Table.Cell>{habit.missedDays}</Table.Cell>
                        <Table.Cell>{habit.totalValue}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Flex>
            </Card>
          </Flex>
        </Container>
      </Box>
    </Theme>
  );
}

async function refreshAll(
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

async function refreshWeek(
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

function syncCounterDrafts(
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

function parseCounterDraft(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function formatTarget(targetType: string, targetValue: number | null, unit: string | null) {
  switch (targetType) {
    case "complete":
      return "Complete";
    case "at_least":
      return `At least ${targetValue ?? 0}${unit ? ` ${unit}` : ""}`;
    case "at_most":
      return `At most ${targetValue ?? 0}${unit ? ` ${unit}` : ""}`;
    case "exact":
      return `Exactly ${targetValue ?? 0}${unit ? ` ${unit}` : ""}`;
    default:
      return "Unknown";
  }
}

function badgeColor(state: string): "gray" | "green" | "amber" | "red" {
  switch (state) {
    case "successful":
      return "green";
    case "skipped":
      return "amber";
    case "incomplete":
      return "red";
    default:
      return "gray";
  }
}
