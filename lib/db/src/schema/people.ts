import { pgTable, text, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const peopleTable = pgTable("cp_people", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  role: text("role").notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
  profile: jsonb("profile").notNull().default({}),
  path: jsonb("path"),
  completed: jsonb("completed").$type<Record<string, boolean>>().notNull().default({}),
  extraActions: jsonb("extra_actions").$type<string[]>().notNull().default([]),
  offsetDays: integer("offset_days").notNull().default(0),
});
export const insertPersonSchema = createInsertSchema(peopleTable);
export type PersonRow = typeof peopleTable.$inferSelect;
