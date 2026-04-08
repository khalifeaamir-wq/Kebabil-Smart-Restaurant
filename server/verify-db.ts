import { Client } from "pg";

export async function verifyDatabaseConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("DATABASE_URL not set. Running with local SQLite storage.");
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query("SELECT 1");
    console.log("DB connected");
  } finally {
    await client.end();
  }
}
