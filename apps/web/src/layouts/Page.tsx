import type { ReactNode } from "react";
import { Box, Container, Flex, Theme } from "../primitives";
import "./Page.css";

type PageProps = {
  hero: ReactNode;
  topRow: ReactNode;
  middleRow: ReactNode;
  bottomRow: ReactNode;
};

export function Page({ hero, topRow, middleRow, bottomRow }: PageProps) {
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
