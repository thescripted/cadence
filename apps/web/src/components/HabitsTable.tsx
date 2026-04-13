import { Button, Flex, Table, Text } from "@radix-ui/themes";
import { SectionCard } from "./SectionCard";
import { formatTarget } from "../lib/format";
import type { Habit } from "../types";

type HabitsTableProps = {
  habits: Habit[];
  onEdit: (habit: Habit) => void;
  onArchive: (habitId: number) => void;
};

export function HabitsTable({ habits, onEdit, onArchive }: HabitsTableProps) {
  return (
    <SectionCard title="Habits">
      <>
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
                    <Button variant="soft" onClick={() => onEdit(habit)}>
                      Edit
                    </Button>
                    <Button color="red" variant="soft" onClick={() => onArchive(habit.id)}>
                      Archive
                    </Button>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
        {habits.length === 0 ? <Text size="2">No habits yet.</Text> : null}
      </>
    </SectionCard>
  );
}
