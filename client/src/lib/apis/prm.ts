import api from "../axios";

export interface PrmQualitySummary {
  totalContacts: number;
  duplicateContacts: number;
  missingRequiredFields: number;
  invalidEmails: number;
  launchBlocked: number;
}

export interface PrmCondition {
  field: "tags" | "stage" | "lastActivity" | "campaignStatus" | "replyState" | "openState";
  operator: "equals" | "notEquals" | "contains" | "inLastDays" | "is";
  value: string | string[] | number | boolean;
}

export interface PrmSegmentExpression {
  op: "AND" | "OR";
  conditions: PrmCondition[];
}

export interface PrmSegment {
  id: string;
  userId: string;
  name: string;
  expression: PrmSegmentExpression;
  isAdhoc: boolean;
  previewCount: number;
  createdAt: string;
  updatedAt: string;
}

export const getPrmQualitySummary = async (): Promise<PrmQualitySummary> => {
  const res = await api.get("/api/prm/quality-summary");
  return res.data;
};

export const dedupePrmContacts = async (mode: "dry-run" | "apply") => {
  const res = await api.post("/api/prm/dedupe", { mode });
  return res.data;
};

export const previewPrmSegment = async (expression: PrmSegmentExpression): Promise<{ previewCount: number; ids: string[] }> => {
  const res = await api.post("/api/prm/segments/preview", { expression });
  return res.data;
};

export const createPrmSegment = async (name: string, expression: PrmSegmentExpression, isAdhoc = false): Promise<PrmSegment> => {
  const res = await api.post("/api/prm/segments", { name, expression, isAdhoc });
  return res.data;
};

export const getPrmSegments = async (): Promise<PrmSegment[]> => {
  const res = await api.get("/api/prm/segments");
  return res.data;
};

export const runPrmBulkAction = async (payload: {
  actionType: "update_stage" | "add_tag" | "remove_tag" | "add_to_list";
  contactIds: string[];
  stage?: string;
  tagId?: string;
  listId?: string;
}): Promise<{ undoToken: string; affectedCount: number }> => {
  const res = await api.post("/api/prm/bulk-actions", payload);
  return res.data;
};

export const undoPrmBulkAction = async (undoToken: string) => {
  const res = await api.post(`/api/prm/bulk-actions/${undoToken}/undo`);
  return res.data;
};

export const getPrmLaunchGuardrails = async (segmentId: string, subject = "", body = "") => {
  const qs = new URLSearchParams({ segmentId, subject, body }).toString();
  const res = await api.get(`/api/prm/launch-guardrails?${qs}`);
  return res.data as {
    invalidContacts: number;
    unverifiedSenderWarning: boolean;
    emptySubjectWarning: boolean;
    emptyBodyWarning: boolean;
    recipientCount: number;
  };
};
