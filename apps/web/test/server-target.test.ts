import { afterEach, describe, expect, it } from "vitest";
import {
  buildServerUrl,
  getDefaultServerBaseUrl,
  getDefaultServerBaseUrlForLocation,
  resolveServerAccessKeyForLocation,
  resolveServerBaseUrl,
  resolveServerBaseUrlForLocation,
} from "../src/lib/server-target";

const originalUrl = window.location.href;

afterEach(() => {
  window.history.replaceState(null, "", originalUrl);
  window.localStorage.clear();
});

describe("server target defaults", () => {
  it("uses the current Tailscale origin when the app is served over ts.net", () => {
    expect(
      getDefaultServerBaseUrlForLocation({
        hostname: "hejiadongmacbook-pro.tail1569ba.ts.net",
        origin: "https://hejiadongmacbook-pro.tail1569ba.ts.net",
        protocol: "https:",
      }),
    ).toBe("https://hejiadongmacbook-pro.tail1569ba.ts.net");
  });

  it("maps a saved local backend target to the current Tailscale origin", () => {
    expect(
      resolveServerBaseUrlForLocation(
        {
          version: 1,
          baseUrl: "http://127.0.0.1:4311",
        },
        {
          hostname: "hejiadongmacbook-pro.tail1569ba.ts.net",
          origin: "https://hejiadongmacbook-pro.tail1569ba.ts.net",
          protocol: "https:",
        },
      ),
    ).toBe("https://hejiadongmacbook-pro.tail1569ba.ts.net");
  });

  it("uses a local-backend access key for the current Tailscale origin", () => {
    expect(
      resolveServerAccessKeyForLocation(
        {
          "http://127.0.0.1:4311": "saved-key",
        },
        "https://hejiadongmacbook-pro.tail1569ba.ts.net",
        {
          hostname: "hejiadongmacbook-pro.tail1569ba.ts.net",
          origin: "https://hejiadongmacbook-pro.tail1569ba.ts.net",
          protocol: "https:",
        },
      ),
    ).toBe("saved-key");
  });

  it("keeps the local backend default for ordinary web origins", () => {
    expect(
      getDefaultServerBaseUrlForLocation({
        hostname: "127.0.0.1",
        origin: "http://127.0.0.1:4312",
        protocol: "http:",
      }),
    ).toBe("http://127.0.0.1:4311");
  });

  it("keeps existing URL builders on the local test origin", () => {
    expect(getDefaultServerBaseUrl()).toBe("http://127.0.0.1:4311");
    expect(resolveServerBaseUrl()).toBe("http://127.0.0.1:4311");
    expect(buildServerUrl("/api/auth/status")).toBe(
      "http://127.0.0.1:4311/api/auth/status",
    );
  });
});
