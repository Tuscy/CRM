/**
 * Python subprocess bridge for Google Ads write operations.
 * Reads use the Node.js google-ads-api client; writes (negatives, RSA) use Python.
 *
 * Pattern from CRM-INTEGRATION.md:
 *   python3 -m lib.services.<module> --json
 *   Context JSON is written to stdin, OperationResult JSON is parsed from stdout.
 */

import { execFile } from "child_process";
import type { PythonOperationResult } from "./types";

export function callPythonBridge(
  /** Python module path, e.g. "lib.services.negatives" */
  module: string,
  /** Serialisable context object passed via stdin */
  context: Record<string, unknown>
): Promise<PythonOperationResult> {
  return new Promise((resolve, reject) => {
    const bin = process.env.GOOGLE_ADS_PYTHON_BIN ?? "python3";
    const root = process.env.GOOGLE_ADS_SCRIPTS_ROOT;

    if (!root) {
      reject(
        new Error(
          "GOOGLE_ADS_SCRIPTS_ROOT is not configured. Set it in .env to enable write operations."
        )
      );
      return;
    }

    const child = execFile(
      bin,
      ["-m", module, "--json"],
      { cwd: root, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const raw = stdout.trim();
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as PythonOperationResult;
            if (!parsed.success) {
              reject(
                new Error(
                  parsed.errors?.join("; ") ||
                    `Python bridge (${module}) failed`
                )
              );
              return;
            }
            resolve(parsed);
            return;
          } catch {
            // fall through if stdout is not valid JSON
          }
        }

        if (err) {
          reject(
            new Error(
              `Python bridge error (${module}): ${stderr?.trim() || err.message}`
            )
          );
          return;
        }

        reject(new Error(`Python bridge (${module}) produced no output`));
      }
    );

    if (child.stdin) {
      child.stdin.write(JSON.stringify(context));
      child.stdin.end();
    }
  });
}
