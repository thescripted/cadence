export type Habit = {
  id: number;
  name: string;
  type: "binary" | "counter";
  unit: string | null;
  targetType: "complete" | "at_least" | "at_most" | "exact";
  targetValue: number | null;
  displayOrder: number;
  isActive: boolean;
};

export type TodayHabit = {
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

export type TodayResponse = {
  date: string;
  note: string;
  habits: TodayHabit[];
};

export type WeekHabit = {
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

export type WeekRecap = {
  startDate: string;
  endDate: string;
  habits: WeekHabit[];
};

export type HabitForm = {
  name: string;
  type: "binary" | "counter";
  targetType: "complete" | "at_least" | "at_most" | "exact";
  targetValue: string;
  unit: string;
  displayOrder: string;
};
