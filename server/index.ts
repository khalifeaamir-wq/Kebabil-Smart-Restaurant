import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import SQLiteStore from "connect-sqlite3";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { setupWebSocket } from "./websocket";
import { seedIfEmpty } from "./seed";
import { verifyDatabaseConnection } from "./verify-db";
import { createServer } from "http";
import crypto from "crypto";

const app = express();
const httpServer = createServer(app);
const isProduction = process.env.NODE_ENV === "production";
const allowedCorsOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (
        allowedCorsOrigins.length === 0 ||
        allowedCorsOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }

      try {
        if (/\.vercel\.app$/i.test(new URL(origin).hostname)) {
          callback(null, true);
          return;
        }
      } catch (_error) {
        // ignore malformed origin values
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    adminId: number;
    adminUsername: string;
    adminRole: string;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const SqliteStore = SQLiteStore(session);
const __dirname = require("path").resolve();
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
app.use(
  session({
    store: new SqliteStore({ db: 'sessions.db', dir: __dirname }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    },
  }),
);

app.get("/", (_req, res) => {
  res.send("Server running");
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await verifyDatabaseConnection();
  setupWebSocket(httpServer);
  await seedIfEmpty();
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "10000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
