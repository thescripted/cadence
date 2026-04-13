import { Card, Flex, Heading, Text } from "../primitives";
import "./HeroCard.css";

export function HeroCard() {
  return (
    <Card size="4" className="hero-card">
      <Flex direction="column" gap="3">
        <Text size="1" weight="bold" className="eyebrow">
          Habit Tracking MVP
        </Text>
        <Heading size="8">Tracking, habit management, and recap</Heading>
        <Text size="3" className="hero-copy">
          The app now supports daily logging, editable habits, day notes, and a simple
          rolling week recap.
        </Text>
      </Flex>
    </Card>
  );
}
