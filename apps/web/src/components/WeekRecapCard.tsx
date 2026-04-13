import { Badge, Table, Text } from "../primitives";
import { SectionCard } from "./SectionCard";
import type { WeekRecap } from "../types";

type WeekRecapCardProps = {
  weekRecap: WeekRecap;
};

export function WeekRecapCard({ weekRecap }: WeekRecapCardProps) {
  return (
    <SectionCard
      title="Week recap"
      action={
        <Badge variant="soft">
          {weekRecap.startDate} to {weekRecap.endDate}
        </Badge>
      }
    >
      <>
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
        {weekRecap.habits.length === 0 ? <Text size="2">No recap data yet.</Text> : null}
      </>
    </SectionCard>
  );
}
