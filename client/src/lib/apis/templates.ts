import api from "../axios";
import type { EmailTemplate, CreateTemplatePayload, UpdateTemplatePayload } from "@/types";

export const getTemplates = async (): Promise<EmailTemplate[]> => {
  const res = await api.get("/api/templates");
  return res.data;
};

export const createTemplate = async (data: CreateTemplatePayload): Promise<EmailTemplate> => {
  const res = await api.post("/api/templates", data);
  return res.data;
};

export const updateTemplate = async (id: string, data: UpdateTemplatePayload): Promise<EmailTemplate> => {
  const res = await api.put(`/api/templates/${id}`, data);
  return res.data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/api/templates/${id}`);
};
