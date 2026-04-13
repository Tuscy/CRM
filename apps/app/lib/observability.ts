type StkyLogPayload = Record<string, string | number | boolean | undefined>;

export function logStky(event: string, data: StkyLogPayload = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    service: "stky-app",
    event,
    ...data,
  });
  console.log(line);
}
