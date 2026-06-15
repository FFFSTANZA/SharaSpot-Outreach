export const RELATIONSHIP_STAGES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "REPLIED", label: "Replied" },
  { value: "INTERESTED", label: "Interested" },
  { value: "MEETING_BOOKED", label: "Meeting booked" },
  { value: "CONVERTED", label: "Converted" },
  { value: "NOT_A_FIT", label: "Not a fit" },
] as const;

export const LEGACY_STAGE_LABELS: Record<string, string> = {
  COLD: "New",
  WARM: "Interested",
  HOT: "Interested",
  BOUNCED: "Bounced",
};

export const NEXT_ACTIONS = [
  { value: "FOLLOW_UP", label: "Follow up" },
  { value: "CALL", label: "Call" },
  { value: "BOOK_MEETING", label: "Book meeting" },
  { value: "SEND_PROPOSAL", label: "Send proposal" },
  { value: "WAIT", label: "Wait" },
  { value: "NO_ACTION", label: "No action" },
] as const;

export const getStageLabel = (stage?: string | null) => {
  if (!stage) return "New";
  return RELATIONSHIP_STAGES.find((item) => item.value === stage)?.label ?? LEGACY_STAGE_LABELS[stage] ?? stage.replace(/_/g, " ").toLowerCase();
};

export const getNextActionLabel = (action?: string | null) => {
  if (!action) return "No action";
  return NEXT_ACTIONS.find((item) => item.value === action)?.label ?? action.replace(/_/g, " ").toLowerCase();
};
