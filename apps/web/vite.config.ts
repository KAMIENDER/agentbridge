import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { z } from "zod";

const AgentBridgeApiOriginEnvSchema = z.object({
  AGENTBRIDGE_API_ORIGIN: z.string().url().optional(),
  FARFIELD_API_ORIGIN: z.string().url().optional(),
  REACT_COMPILER: z
    .enum(["0", "1", "true", "false"])
    .transform((value) => value === "1" || value === "true")
    .optional(),
  REACT_PROFILING: z
    .enum(["0", "1", "true", "false"])
    .transform((value) => value === "1" || value === "true")
    .optional(),
  PWA_ENABLED: z
    .enum(["0", "1", "true", "false"])
    .transform((value) => value === "1" || value === "true")
    .optional(),
  DISABLE_RATE_LIMITS: z
    .enum(["0", "1", "true", "false"])
    .transform((value) => value === "1" || value === "true")
    .optional(),
});
const parsedEnv = AgentBridgeApiOriginEnvSchema.safeParse({
  AGENTBRIDGE_API_ORIGIN: process.env["AGENTBRIDGE_API_ORIGIN"],
  FARFIELD_API_ORIGIN: process.env["FARFIELD_API_ORIGIN"],
  REACT_COMPILER: process.env["REACT_COMPILER"],
  REACT_PROFILING: process.env["REACT_PROFILING"],
  PWA_ENABLED: process.env["PWA_ENABLED"],
  DISABLE_RATE_LIMITS: process.env["DISABLE_RATE_LIMITS"],
});
if (!parsedEnv.success) {
  const issueDetails = parsedEnv.error.issues
    .map((issue) => {
      const key = issue.path.join(".") || "env";
      return `${key}: ${issue.message}`;
    })
    .join("; ");
  throw new Error(
    `Invalid environment configuration: ${issueDetails}`,
  );
}
const apiOrigin =
  parsedEnv.data.AGENTBRIDGE_API_ORIGIN ??
  parsedEnv.data.FARFIELD_API_ORIGIN ?? "http://127.0.0.1:4311";
const reactCompilerOverride = parsedEnv.data.REACT_COMPILER ?? null;
const reactProfilingEnabled = parsedEnv.data.REACT_PROFILING ?? false;
const pwaEnabled = parsedEnv.data.PWA_ENABLED ?? true;
const disableRateLimits = parsedEnv.data.DISABLE_RATE_LIMITS ?? false;

const resolveAlias: Record<string, string> = {
  "@": path.resolve(__dirname, "./src"),
};

if (reactProfilingEnabled) {
  resolveAlias["react-dom/client"] = "react-dom/profiling";
}

export default defineConfig(({ command }) => {
  const reactCompilerEnabled =
    reactCompilerOverride === null
      ? command === "build"
      : reactCompilerOverride;

  return {
    define: {
      __AGENTBRIDGE_DISABLE_RATE_LIMITS__: JSON.stringify(disableRateLimits),
    },
    plugins: [
      react(
        reactCompilerEnabled
          ? {
              babel: {
                plugins: ["babel-plugin-react-compiler"],
              },
            }
          : undefined,
      ),
      tailwindcss(),
      VitePWA({
        disable: !pwaEnabled,
        registerType: "autoUpdate",
        manifest: {
          name: "AgentBridge",
          short_name: "AgentBridge",
          start_url: "/",
          scope: "/",
          display: "standalone",
          theme_color: "#0a0a0b",
          background_color: "#0a0a0b",
          icons: [
            {
              src: "/pwa-192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "/pwa-512.png",
              sizes: "512x512",
              type: "image/png"
            },
            {
              src: "/maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"]
        }
      })
    ],
    resolve: {
      alias: resolveAlias,
    },
    server: {
      host: true,
      allowedHosts: true,
      port: 4312,
      proxy: {
        "/api": apiOrigin,
        "/events": apiOrigin,
      },
    },
    preview: {
      host: "127.0.0.1",
      port: 4312,
      proxy: {
        "/api": apiOrigin,
        "/events": apiOrigin,
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: [],
    },
  };
});
