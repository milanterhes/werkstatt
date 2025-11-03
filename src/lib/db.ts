import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./db/";
const db = drizzle(process.env.DATABASE_URL!, {
  schema,
});

export default db;
