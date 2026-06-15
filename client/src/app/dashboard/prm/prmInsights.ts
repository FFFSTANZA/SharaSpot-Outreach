import type { Contact } from "@/types";

export type PriorityLevel = "high" | "medium" | "low";
export type SmartView = "all" | "action_queue" | "overdue" | "unassigned" | "meetings" | "replied";
export type SortMode = "recent" | "priority" | "last_touched" | "engagement" | "company";

const LEGACY_STAGE_WEIGHTS: Record<string, number> = {
  COLD: 22,
  WARM: 58,
  HOT: 74,
  BOUNCED: 0,
};

const STAGE_WEIGHTS: Record<string, number> = {
  NEW: 26,
  CONTACTED: 44,
  REPLIED: 70,
  INTERESTED: 82,
  MEETING_BOOKED: 94,
  CONVERTED: 100,
  NOT_A_FIT: 0,
  ...LEGACY_STAGE_WEIGHTS,
};

const NEXT_ACTION_WEIGHTS: Record<string, number> = {
  FOLLOW_UP: 16,
  CALL: 18,
  BOOK_MEETING: 20,
  SEND_PROPOSAL: 15,
  WAIT: 6,
  NO_ACTION: 0,
};

const getDaysUntilDue = (dueAt?: string | null): number | null => {
  if (!dueAt) return null;
  const diff = new Date(dueAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getPriorityScore = (contact: Contact): number => {
  const stageScore = STAGE_WEIGHTS[contact.stage] ?? 30;
  const engagementScore = Math.min(24, Math.round((contact.engagementScore ?? 0) / 5));
  const actionScore = NEXT_ACTION_WEIGHTS[contact.nextAction || "NO_ACTION"] ?? 0;
  const dueDays = getDaysUntilDue(contact.nextActionDueAt);

  let dueScore = 0;
  if (dueDays !== null) {
    if (dueDays < 0) dueScore = 22;
    else if (dueDays === 0) dueScore = 18;
    else if (dueDays <= 3) dueScore = 12;
    else if (dueDays <= 7) dueScore = 8;
    else dueScore = 4;
  }

  const ownerScore = contact.assignedToId ? 0 : 8;
  const recentReplyBoost = contact._count?.emailsReplied ? 8 : 0;
  return Math.max(0, Math.min(100, stageScore + engagementScore + actionScore + dueScore + ownerScore + recentReplyBoost));
};

export const getPriorityLevel = (contact: Contact): PriorityLevel => {
  const score = getPriorityScore(contact);
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
};

export const matchesSmartView = (contact: Contact, smartView: SmartView): boolean => {
  const dueDays = getDaysUntilDue(contact.nextActionDueAt);
  switch (smartView) {
    case "action_queue":
      return !!contact.nextAction && contact.nextAction !== "NO_ACTION";
    case "overdue":
      return dueDays !== null && dueDays < 0;
    case "unassigned":
      return !contact.assignedToId;
    case "meetings":
      return contact.stage === "MEETING_BOOKED" || contact.nextAction === "BOOK_MEETING";
    case "replied":
      return contact.stage === "REPLIED" || (contact._count?.emailsReplied ?? 0) > 0;
    case "all":
    default:
      return true;
  }
};

export const sortContacts = (contacts: Contact[], sortMode: SortMode): Contact[] => {
  const sorted = [...contacts];
  sorted.sort((a, b) => {
    if (sortMode === "priority") return getPriorityScore(b) - getPriorityScore(a);
    if (sortMode === "engagement") return (b.engagementScore ?? 0) - (a.engagementScore ?? 0);
    if (sortMode === "last_touched") return new Date(b.lastContactedAt || 0).getTime() - new Date(a.lastContactedAt || 0).getTime();
    if (sortMode === "company") return (a.company || "No company").localeCompare(b.company || "No company") || a.email.localeCompare(b.email);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  return sorted;
};

export const getSmartViewCount = (contacts: Contact[], smartView: SmartView): number =>
  contacts.filter((contact) => matchesSmartView(contact, smartView)).length;
