import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  type: text("type").notNull(),
  payload: text("payload").notNull(),
  at: integer("at", { mode: "number" }).notNull(),
});
