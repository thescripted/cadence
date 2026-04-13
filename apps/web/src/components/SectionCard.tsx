import { Card, Flex, Heading, Separator } from "@radix-ui/themes";
import type { ReactNode } from "react";

type SectionCardProps = {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <Card size="3">
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center" gap="3">
          <Heading size="4">{title}</Heading>
          {action}
        </Flex>
        <Separator size="4" />
        {children}
      </Flex>
    </Card>
  );
}
