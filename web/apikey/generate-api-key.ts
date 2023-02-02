import { randomBytes, createHash } from "crypto";

function generateKey() {
  const buffer = randomBytes(32);
  return buffer.toString("hex");
}

function hash(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function main() {
  const apikey = generateKey();
  const hashedApiKey = hash(apikey);

  console.log({
    apikey,
    hashedApiKey,
  });
}

main();
