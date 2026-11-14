import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Request, Response, NextFunction } from "express";
import { pool, type PersonRow } from "@workspace/db";
import { personRow } from "../lib/domain";

declare module "express-session" { interface SessionData { userId: string } }
declare global { namespace Express { interface Request { cpUser?: PersonRow } } }
const PgStore = connectPgSimple(session);
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required for secure sessions.");
export const sessionMiddleware = session({
  name: "careerpath.sid",
  secret: process.env.SESSION_SECRET,
  store: new PgStore({ pool, tableName: "cp_sessions", createTableIfMissing: false }),
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: "auto", maxAge: 7 * 86400000, path: "/" },
});
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) { res.status(401).json({ error: "Please sign in to continue." }); return; }
  try { req.cpUser = await personRow(req.session.userId); next(); } catch { res.status(401).json({ error: "Please sign in again." }); }
}
export async function setIdentity(req: Request, userId: string) {
  await new Promise<void>((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
  req.session.userId = userId;
  await new Promise<void>((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
}
