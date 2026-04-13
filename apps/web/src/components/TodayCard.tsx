import { badgeColor, formatTarget, parseCounterDraft } from "../lib/format";
import { Badge, Box, Button, Card, Flex, Text, TextArea, TextField } from "../primitives";
import { SectionCard } from "./SectionCard";
import type { TodayResponse } from "../types";
import "./TodayCard.css";

type TodayCardProps = {
  today: TodayResponse;
  dayNoteDraft: string;
  counterDrafts: Record<number, string>;
  onDayNoteChange: (value: string) => void;
  onCounterDraftChange: (habitId: number, value: string) => void;
  onSaveDayNote: () => void;
  onUpdateTodayLog: (habitId: number, status: "logged" | "skipped", value?: number) => void;
};

export function TodayCard({
  today,
  dayNoteDraft,
  counterDrafts,
  onDayNoteChange,
  onCounterDraftChange,
  onSaveDayNote,
  onUpdateTodayLog,
}: TodayCardProps) {
  return (
    <SectionCard
      title="Today"
      action={
        <Badge color="amber" variant="soft">
          {today.date || "No date"}
        </Badge>
      }
    >
      <>
        <TextArea
          value={dayNoteDraft}
          onChange={(event) => onDayNoteChange(event.target.value)}
          placeholder="Short note about today"
        />
        <Button variant="soft" onClick={onSaveDayNote}>
          Save day note
        </Button>
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
                        onUpdateTodayLog(habit.habitId, "logged", habit.currentValue >= 1 ? 0 : 1)
                      }
                    >
                      {habit.currentValue >= 1 ? "Mark incomplete" : "Mark complete"}
                    </Button>
                    <Button variant="soft" onClick={() => onUpdateTodayLog(habit.habitId, "skipped", 0)}>
                      Skip today
                    </Button>
                  </Flex>
                ) : (
                  <Flex direction="column" gap="2">
                    <Flex gap="2" wrap="wrap" align="center">
                      <Button
                        variant="soft"
                        onClick={() =>
                          onUpdateTodayLog(habit.habitId, "logged", Math.max(habit.currentValue - 1, 0))
                        }
                      >
                        -1
                      </Button>
                      <Button onClick={() => onUpdateTodayLog(habit.habitId, "logged", habit.currentValue + 1)}>
                        +1
                      </Button>
                      <Button variant="soft" onClick={() => onUpdateTodayLog(habit.habitId, "skipped", 0)}>
                        Skip today
                      </Button>
                    </Flex>
                    <Flex gap="2" wrap="wrap" align="center">
                      <TextField.Root
                        className="counter-input"
                        value={counterDrafts[habit.habitId] ?? String(habit.currentValue)}
                        onChange={(event) => onCounterDraftChange(habit.habitId, event.target.value)}
                        placeholder="0"
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          onUpdateTodayLog(
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
      </>
    </SectionCard>
  );
}
