import api from "../axios";
import type { TrackingDomainSettingResponse } from "@/types";

export interface TrackingDomainSettingsPayload {
  rootDomain: string;
  subdomain: string;
}

export interface TrackingDomainSettingsResult {
  trackingDomain: TrackingDomainSettingResponse | null;
  expectedCnameTarget: string;
  scope?: {
    organizationId: string | null;
    userId: string;
  };
  resolvedValues?: string[];
}

export const getTrackingDomainSettings = async (): Promise<TrackingDomainSettingsResult> => {
  const res = await api.get("/api/users/settings/tracking-domain");
  return res.data;
};

export const saveTrackingDomainSettings = async (
  data: TrackingDomainSettingsPayload,
): Promise<TrackingDomainSettingsResult> => {
  const res = await api.put("/api/users/settings/tracking-domain", data);
  return res.data;
};

export const verifyTrackingDomainSettings = async (): Promise<TrackingDomainSettingsResult> => {
  const res = await api.post("/api/users/settings/tracking-domain/verify");
  return res.data;
};
