export function formatTarget(targetType: string, targetValue: number | null, unit: string | null) {
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

export function parseCounterDraft(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export function badgeColor(state: string): "gray" | "green" | "amber" | "red" {
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
