export const CALL_DISPOSITIONS = [
  "NO_ANSWER",
  "CONNECTED",
  "INTERESTED",
  "BOOKED_MEETING",
  "NOT_A_FIT",
  "DO_NOT_CALL",
] as const;

export type CallDisposition = (typeof CALL_DISPOSITIONS)[number];

export const TERMINAL_DISPOSITIONS = new Set<CallDisposition>(["NOT_A_FIT", "DO_NOT_CALL"]);

export const CALL_NEXT_ACTIONS = ["CALL_BACK", "EMAIL_FOLLOW_UP", "SEND_PROPOSAL", "BOOK_MEETING"] as const;

export const STAGE_BY_DISPOSITION: Partial<Record<CallDisposition, string>> = {
  CONNECTED: "WARM",
  INTERESTED: "HOT",
  BOOKED_MEETING: "CONVERTED",
};

export const normalizeCallDisposition = (value?: string): CallDisposition | null => {
  const normalized = value?.trim().toUpperCase() as CallDisposition | undefined;
  if (!normalized) return null;
  return (CALL_DISPOSITIONS as readonly string[]).includes(normalized) ? normalized : null;
};
