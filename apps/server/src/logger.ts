import pino from "pino";

const level = process.env["LOG_LEVEL"] ?? "warn";

export const logger = pino({
  name: "agentbridge-server",
  level,
});
