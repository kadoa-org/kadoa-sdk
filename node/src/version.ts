import { readFileSync } from "fs";
import { join } from "path";

let version: string;
try {
  const packageJson = JSON.parse(
    readFileSync(join(__dirname, "..", "package.json"), "utf8"),
  );
  version = packageJson.version;
} catch (e) {
  version = "0.0.0";
  console.warn("Failed to read package.json version:", e);
}

export const SDK_VERSION = `node-${version}`;
