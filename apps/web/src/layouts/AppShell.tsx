import { Box, Container, Flex, Theme } from "@radix-ui/themes";
import type { ReactNode } from "react";

type AppShellProps = {
  hero: ReactNode;
  topRow: ReactNode;
  middleRow: ReactNode;
  bottomRow: ReactNode;
};

export function AppShell({ hero, topRow, middleRow, bottomRow }: AppShellProps) {
  return (
    <Theme accentColor="amber" grayColor="sand" radius="large" scaling="105%">
      <Box className="page-shell">
        <Container size="4">
          <Flex direction="column" gap="6" className="stack">
            {hero}
            <Flex gap="4" wrap="wrap" className="grid-two">
              {topRow}
            </Flex>
            <Flex gap="4" wrap="wrap" className="grid-two">
              {middleRow}
            </Flex>
            {bottomRow}
          </Flex>
        </Container>
      </Box>
    </Theme>
  );
}
