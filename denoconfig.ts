// Copyright (C) 2020 Russell Clarey. All rights reserved. MIT license.

import { parse } from "https://deno.land/std@0.51.0/flags/mod.ts";
import { exists } from "https://deno.land/std@0.51.0/fs/exists.ts";
import { deepAssign } from "https://deno.land/std@0.51.0/_util/deep_assign.ts";

const VERSION = "0.1.0";
const USAGE = "USAGE:\n\tdenoconfig [OPTIONS]";

function print(lines: string[]): void {
  console.log(lines.join("\n"));
}

const args = parse(Deno.args, {
  alias: {
    help: "h",
    importmap: "i",
    version: "v",
  },
  boolean: ["help", "importmap", "version"],
  unknown(arg: string) {
    print([
      `error: Found argument '${arg}' which wasn't expected`,
      "",
      USAGE,
      "",
      "For more information try --help",
    ]);
    Deno.exit(1);
  },
});

if (args.help) {
  print([
    `denoconfig ${VERSION}`,
    "Generate tsconfig.json fields for deno",
    "",
    USAGE,
    "",
    "OPTIONS:",
    "\t-h, --help",
    "\t\tPrints help information",
    "",
    "\t-i, --importmap",
    "\t\tGenerate importmap related fields",
    "",
    "\t-v, --version",
    "\t\tPrints version information",
  ]);
  Deno.exit(0);
}

if (args.version) {
  console.log(`denoconfig ${VERSION}`);
  Deno.exit(0);
}

// Handle required permissions
const perms = await Promise.all([
  Deno.permissions.request({ name: "read", path: "./tsconfig.json" }),
  Deno.permissions.request({ name: "write", path: "./tsconfig.json" }),
]);

if (!perms.every((p) => p.state === "granted")) {
  console.error(
    "error: denoconfig requires read/write permissions for your project's tsconfig.json",
  );
  Deno.exit(1);
}

let config = {};
if (await exists("./tsconfig.json")) {
  try {
    config = JSON.parse(await Deno.readTextFile("./tsconfig.json"));
  } catch {}
}

let pluginConfig: { name: string; importmap?: string } = {
  name: "typescript-deno-plugin",
};
if (args.importmap) {
  pluginConfig.importmap = "importmap.json";
}

// Modified from https://github.com/denoland/deno/blob/v1.0.0/cli/js/compiler.ts#L139
deepAssign(config, {
  compilerOptions: {
    allowJs: false,
    allowNonTsExtensions: true,
    checkJs: false,
    esModuleInterop: true,
    jsx: "react",
    module: "esnext",
    resolveJsonModule: true,
    strict: true,
    removeComments: true,
    target: "esnext",
    plugins: [pluginConfig],
  },
});

try {
  await Deno.writeTextFile("./tsconfig.json", JSON.stringify(config, null, 2));
} catch (e) {
  console.error("error: failed to write to tsconfig.json");
  Deno.exit(1);
}

print([
  ">> Generated tsconfig.json!",
  ">> Now run 'npm install typescript-deno-plugin' to install the deno plugin for tsserver",
]);
