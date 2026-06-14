import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Dev/preview server proxy for the Airship API.
 *
 * Why this exists: airship-actions is a browser-only Vite SPA, so a live API
 * token must NEVER be shipped to the client, and Airship will block cross-origin
 * browser calls anyway. This middleware keeps the token server-side and gives
 * the browser a same-origin endpoint — `/api/airship/*` → `${baseUrl}/*` with the
 * Authorization header attached here, out of the client's reach.
 *
 * Env (loaded via Vite's loadEnv in vite.config.ts; NOT exposed to the browser
 * because they aren't VITE_-prefixed):
 *   - AIRSHIP_API_TOKEN     the secret token (required to go live)
 *   - AIRSHIP_API_BASE_URL  optional, defaults to https://api.airship.co.uk/v1
 *
 * For production (static hosting) you'd re-implement this same `/api/airship`
 * route on your host/serverless platform — the client code doesn't change.
 */

const PREFIX = "/api/airship";

export function airshipProxy(env: Record<string, string>): Plugin {
  const token = env.AIRSHIP_API_TOKEN?.trim();
  const baseUrl = (env.AIRSHIP_API_BASE_URL || "https://api.airship.co.uk/v1").replace(/\/$/, "");

  const json = (res: ServerResponse, status: number, body: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };

  const handler = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void
  ) => {
    const url = req.url ?? "";
    if (!url.startsWith(PREFIX)) return next();

    const sub = url.slice(PREFIX.length) || "/";

    // Status probe — lets the client show "Live" honestly without exposing secrets.
    if (sub.startsWith("/__status")) {
      return json(res, 200, { configured: !!token, baseUrl });
    }

    if (!token) {
      return json(res, 503, {
        error:
          "AIRSHIP_API_TOKEN is not set on the server. Add it to .env.local and restart to enable live Airship data.",
      });
    }

    try {
      const upstream = await fetch(`${baseUrl}${sub}`, {
        method: req.method ?? "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const text = await upstream.text();
      res.statusCode = upstream.status;
      res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
      res.end(text);
    } catch (e) {
      json(res, 502, { error: "Airship upstream request failed", detail: String(e) });
    }
  };

  return {
    name: "airship-proxy",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
