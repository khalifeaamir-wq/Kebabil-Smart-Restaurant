import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    path.resolve(currentDir, ".."),
    path.resolve(currentDir, "../public"),
  ];
  const distPath =
    candidatePaths.find((candidate) =>
      fs.existsSync(path.resolve(candidate, "index.html")),
    ) ?? "";

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory. Checked: ${candidatePaths.join(", ")}`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
