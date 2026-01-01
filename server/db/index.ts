import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/web";
import * as schema from "./schema";

// Initialize Turso database connection using environment variables
// The TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are provided at runtime
const turso = createClient({
  url: process.env.libsql://payment-livaiy.aws-ap-northeast-1.turso.io,
  authToken: process.env.eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3OTg3OTAxNjIsImlhdCI6MTc2NzI1NDE2MiwiaWQiOiJlMTVmNDgyYS0zOTY5LTQ0NGItYmVjMi0wOTc1NjVmODRmODciLCJyaWQiOiIyNWQ2NjU5Mi1lM2FhLTRjZGEtYTczNi04MmI2NWUwYjhhNTMifQ.xOTNTxQCBF2EN8dgSWWVfDzlEidR87Ht4Y1QgYDVShIX27F2ADhLBrZ2qncoeftJnOUcZtG5TJgX5x9K5rbVAA,
});

// Export the drizzle instance for use throughout the application
export const db = drizzle(turso, { schema });

export type Database = typeof db;
