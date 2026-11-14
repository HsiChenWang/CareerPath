import { pgTable, text, integer, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { peopleTable } from "./people";

export const conversationsTable = pgTable("cp_conversations", {
  id: text("id").primaryKey(),
  pair: text("pair").notNull().unique(),
  firstId: text("first_id").notNull().references(() => peopleTable.id),
  secondId: text("second_id").notNull().references(() => peopleTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const messagesTable = pgTable("cp_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversationsTable.id),
  senderId: text("sender_id").notNull().references(() => peopleTable.id),
  text: text("text").notNull(),
  kind: text("kind").notNull().default("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const chatsTable = pgTable("cp_chats", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => peopleTable.id),
  alumniId: text("alumni_id").notNull().references(() => peopleTable.id),
  duration: integer("duration").notNull(),
  format: text("format").notNull(),
  times: jsonb("times").$type<string[]>().notNull().default([]),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("pending"),
  scheduledAt: text("scheduled_at").notNull().default(""),
  notes: text("notes").notNull().default(""),
  summary: text("summary").notNull().default(""),
  actionItems: jsonb("action_items").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const followupsTable = pgTable("cp_followups", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => peopleTable.id),
  personId: text("person_id").notNull().references(() => peopleTable.id),
  source: text("source").notNull(),
  kind: text("kind").notNull(),
  reason: text("reason").notNull(),
  draft: text("draft").notNull().default(""),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("pending"),
}, (t) => [uniqueIndex("cp_followup_source_unique").on(t.userId, t.source)]);
export const safetyTable = pgTable("cp_safety", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => peopleTable.id),
  personId: text("person_id").notNull().references(() => peopleTable.id),
  action: text("action").notNull(),
  reason: text("reason").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const sessionsTable = pgTable("cp_sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});
export const insertConversationSchema = createInsertSchema(conversationsTable);
export const insertMessageSchema = createInsertSchema(messagesTable);
export const insertChatSchema = createInsertSchema(chatsTable);
export const insertFollowupSchema = createInsertSchema(followupsTable);
export type ConversationRow = typeof conversationsTable.$inferSelect;
export type ChatRow = typeof chatsTable.$inferSelect;
export type FollowupRow = typeof followupsTable.$inferSelect;
