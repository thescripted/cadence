import { Button, Card, Flex, Heading, Text, TextField } from "../primitives";

type ConnectionPanelProps = {
  apiBaseUrl: string;
  successMessage: string;
  errorMessage: string;
  onApiBaseUrlChange: (value: string) => void;
  onRefresh: () => void;
};

export function ConnectionPanel({
  apiBaseUrl,
  successMessage,
  errorMessage,
  onApiBaseUrlChange,
  onRefresh,
}: ConnectionPanelProps) {
  return (
    <Card size="3">
      <Flex direction="column" gap="4">
        <Heading size="4">API connection</Heading>
        <TextField.Root
          value={apiBaseUrl}
          onChange={(event) => onApiBaseUrlChange(event.target.value)}
          placeholder="http://127.0.0.1:8080"
        />
        <Button variant="soft" onClick={onRefresh}>
          Refresh all
        </Button>
        {successMessage ? <Text color="green">{successMessage}</Text> : null}
        {errorMessage ? <Text color="red">{errorMessage}</Text> : null}
      </Flex>
    </Card>
  );
}
