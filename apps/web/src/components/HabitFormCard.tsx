import { Box, Button, Card, Flex, Heading, Select, Text, TextField } from "@radix-ui/themes";
import type { HabitForm } from "../types";

type HabitFormCardProps = {
  editingHabitId: number | null;
  form: HabitForm;
  isPending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onFormChange: (recipe: (current: HabitForm) => HabitForm) => void;
  onReset: () => void;
};

export function HabitFormCard({
  editingHabitId,
  form,
  isPending,
  onSubmit,
  onFormChange,
  onReset,
}: HabitFormCardProps) {
  return (
    <Card size="3">
      <form onSubmit={onSubmit}>
        <Flex direction="column" gap="3">
          <Heading size="4">{editingHabitId === null ? "Create habit" : `Edit habit #${editingHabitId}`}</Heading>
          <TextField.Root
            value={form.name}
            onChange={(event) => onFormChange((current) => ({ ...current, name: event.target.value }))}
            placeholder="Water intake"
          />
          <Flex gap="3" wrap="wrap">
            <Box className="field-block">
              <Text as="label" size="2">
                Type
              </Text>
              <Select.Root
                value={form.type}
                onValueChange={(value: "binary" | "counter") =>
                  onFormChange((current) => ({
                    ...current,
                    type: value,
                    targetType:
                      value === "binary"
                        ? "complete"
                        : current.targetType === "complete"
                          ? "at_least"
                          : current.targetType,
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
              <Text as="label" size="2">
                Target rule
              </Text>
              <Select.Root
                value={form.targetType}
                onValueChange={(value: "complete" | "at_least" | "at_most" | "exact") =>
                  onFormChange((current) => ({ ...current, targetType: value }))
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
              onChange={(event) => onFormChange((current) => ({ ...current, unit: event.target.value }))}
              placeholder="glass"
            />
            <TextField.Root
              value={form.displayOrder}
              onChange={(event) => onFormChange((current) => ({ ...current, displayOrder: event.target.value }))}
              placeholder="0"
            />
          </Flex>

          {form.type === "counter" ? (
            <TextField.Root
              value={form.targetValue}
              onChange={(event) => onFormChange((current) => ({ ...current, targetValue: event.target.value }))}
              placeholder="8"
            />
          ) : null}

          <Flex gap="2" wrap="wrap">
            <Button type="submit" disabled={isPending}>
              {editingHabitId === null ? "Create habit" : "Save habit"}
            </Button>
            {editingHabitId !== null ? (
              <Button type="button" variant="soft" onClick={onReset}>
                Cancel edit
              </Button>
            ) : null}
          </Flex>
        </Flex>
      </form>
    </Card>
  );
}
