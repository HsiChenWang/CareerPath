import { format } from "date-fns";
import { useGetSession } from "@workspace/api-client-react";
import type { Person } from "@workspace/api-client-react";

export function errMsg(e: unknown, fallback = "Something went sideways. Give it another try."): string {
  const d = (e as { data?: { error?: unknown } } | null)?.data;
  if (d && typeof d.error === "string") return d.error;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export function initials(name?: string): string {
  if (!name) return "T";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function fmtTime(s?: string): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return format(d, "EEE, MMM d · h:mm a");
}

export function fmtShort(s?: string): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return format(d, "MMM d");
}

export function useMe() {
  const q = useGetSession();
  return { user: q.data?.user ?? null, isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

export function homeFor(user: Person | null): string {
  if (!user) return "/";
  if (!isProfileComplete(user)) return "/profile?welcome=1";
  return user.role === "alumni" ? "/requests" : "/career-workflow";
}

export function isProfileComplete(user: {
  role?: string | null;
  school?: string | null;
  major?: string | null;
  level?: string | null;
  year?: string | null;
  gradYear?: number | null;
  currentRole?: string | null;
} | null | undefined): boolean {
  if (!user || !user.school?.trim() || !user.major?.trim()) return false;
  if (user.role === "alumni") return !!user.currentRole?.trim();
  return !!user.level?.trim() && (!!user.year?.trim() || !!user.gradYear);
}

export function roleLine(p: Person): string {
  if (p.currentRole) return p.company ? `${p.currentRole} at ${p.company}` : p.currentRole;
  return [p.year, p.major].filter(Boolean).join(" · ") || p.school;
}

export function percentOfRelatedAlumni(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

export const SCHOOLS = ["Marshall", "Viterbi", "Dornsife", "Annenberg", "Rossier", "Cinematic Arts", "Thornton", "Other"];
export const LEVELS = ["Undergrad", "Master's", "PhD"];

export const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
export const PATH_KEY = "careerpath:recent-path";
