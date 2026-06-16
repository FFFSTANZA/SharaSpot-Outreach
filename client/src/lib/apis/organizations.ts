import api from "../axios";
import type { Organization, OrganizationSummary, OrgMember, OrganizationInvite, OrgMemberRole } from "@/types";

export const getOrganizations = async (): Promise<OrganizationSummary[]> => {
  const res = await api.get("/api/organizations");
  return res.data;
};

export const getCurrentOrganization = async (): Promise<Organization | null> => {
  const res = await api.get("/api/organizations/current");
  return res.data;
};

export const createOrganization = async (name: string): Promise<Organization & { accessToken?: string }> => {
  const res = await api.post("/api/organizations", { name });
  return res.data;
};

export const updateOrganization = async (data: { name?: string }): Promise<{ id: string; name: string }> => {
  const res = await api.patch("/api/organizations/current", data);
  return res.data;
};

export const switchOrganization = async (organizationId: string): Promise<{ activeOrganizationId: string; accessToken: string }> => {
  const res = await api.post("/api/organizations/switch", { organizationId });
  return res.data;
};

export type InviteMemberResponse =
  | { type: "member"; member: OrgMember }
  | { type: "invite"; invite: OrganizationInvite };

export const inviteMember = async (email: string, role?: string): Promise<InviteMemberResponse> => {
  const res = await api.post("/api/organizations/current/invite", { email, role });
  return res.data;
};

export const getPendingInvites = async (): Promise<OrganizationInvite[]> => {
  const res = await api.get("/api/organizations/current/invites");
  return res.data;
};

export const revokeInvite = async (inviteId: string): Promise<void> => {
  await api.delete(`/api/organizations/current/invites/${inviteId}`);
};

export const getInvitePreview = async (token: string): Promise<{ state: string; organizationId: string; organizationName: string; email: string; role: OrgMemberRole; expiresAt: string }> => {
  const res = await api.get(`/api/organizations/invites/${encodeURIComponent(token)}`);
  return res.data;
};

export const acceptInvite = async (token: string): Promise<{ accepted: boolean; organizationId: string; organizationName: string; role: OrgMemberRole; accessToken: string }> => {
  const res = await api.post("/api/organizations/invites/accept", { token });
  return res.data;
};

export const removeMember = async (memberId: string): Promise<void> => {
  await api.delete(`/api/organizations/current/members/${memberId}`);
};

export const updateMemberRole = async (memberId: string, role: string): Promise<void> => {
  await api.patch(`/api/organizations/current/members/${memberId}`, { role });
};

export const leaveOrganization = async (): Promise<{ accessToken: string }> => {
  const res = await api.post("/api/organizations/current/leave");
  return res.data;
};

export const deleteOrganization = async (): Promise<{ accessToken: string; message: string }> => {
  const res = await api.delete("/api/organizations/current");
  return res.data;
};
