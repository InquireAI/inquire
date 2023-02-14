export function setTimeoutAsync(time: number) {
  return new Promise((r) => setTimeout(r, time));
}
