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
  const hashedApiKey = hash(
    "5febaebb7fd6c2659612eb1d6413f85fd7e2f20b13cf5ff9ddfaede4def7fcfa"
  );
  console.log({
    apikey,
    hashedApiKey,
  });
}

main();
