declare module "connect-sqlite3" {
  import type session from "express-session";

  type SQLiteStoreFactory = (
    sessionLib: typeof session,
  ) => new (options?: Record<string, unknown>) => session.Store;

  const sqliteStoreFactory: SQLiteStoreFactory;
  export default sqliteStoreFactory;
}
