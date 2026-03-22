export type LogLevel = "info" | "warn" | "error";

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function writeLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const parts = [`[${timestamp}]`, level.toUpperCase(), message];

  for (const [key, rawValue] of Object.entries(meta ?? {})) {
    const value = formatValue(rawValue);
    if (value === undefined) continue;
    parts.push(`${key}=${value}`);
  }

  const line = parts.join(" ");
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logInfo(message: string, meta?: Record<string, unknown>) {
  writeLog("info", message, meta);
}

export function logWarn(message: string, meta?: Record<string, unknown>) {
  writeLog("warn", message, meta);
}

export function logError(message: string, meta?: Record<string, unknown>) {
  writeLog("error", message, meta);
}
