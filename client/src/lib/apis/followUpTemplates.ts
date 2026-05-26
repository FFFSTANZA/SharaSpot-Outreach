import api from "../axios";
import type { FollowUpTemplate, FollowUpTemplatePayload } from "@/types";

export const listFollowUpTemplates = async (): Promise<FollowUpTemplate[]> => {
  const res = await api.get("/api/follow-up-templates");
  return res.data;
};

export const getFollowUpTemplateById = async (id: string): Promise<FollowUpTemplate> => {
  const res = await api.get(`/api/follow-up-templates/${id}`);
  return res.data;
};

export const createFollowUpTemplate = async (data: FollowUpTemplatePayload): Promise<FollowUpTemplate> => {
  const res = await api.post("/api/follow-up-templates", data);
  return res.data;
};

export const updateFollowUpTemplate = async (id: string, data: FollowUpTemplatePayload): Promise<FollowUpTemplate> => {
  const res = await api.put(`/api/follow-up-templates/${id}`, data);
  return res.data;
};

export const upsertFollowUpTemplate = async (data: FollowUpTemplatePayload & { id?: string }): Promise<FollowUpTemplate> => {
  if (data.id) {
    const { id, ...payload } = data;
    return updateFollowUpTemplate(id, payload);
  }
  return createFollowUpTemplate(data);
};

export const deleteFollowUpTemplate = async (id: string): Promise<void> => {
  await api.delete(`/api/follow-up-templates/${id}`);
};
