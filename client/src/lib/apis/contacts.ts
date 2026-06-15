import api from "../axios";
import type { Contact, Note, Tag, PaginatedContacts } from "@/types";

export type ContactPayload = Partial<Omit<Contact, "tags">> & { tags?: string[] };

export const getContacts = async (params: {
  search?: string;
  stage?: string;
  tag?: string;
  listId?: string | null;
  segmentId?: string;
  invalidOnly?: boolean;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedContacts> => {
  const cleanParams: Record<string, string> = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== null && val !== undefined && val !== "") cleanParams[key] = String(val);
  }
  const qs = new URLSearchParams(cleanParams).toString();
  const res = await api.get(`/api/contacts?${qs}`);
  return res.data;
};

export const getContactById = async (id: string): Promise<Contact> => {
  const res = await api.get(`/api/contacts/${id}`);
  return res.data;
};

export const createContact = async (data: ContactPayload): Promise<Contact> => {
  const res = await api.post("/api/contacts", data);
  return res.data;
};

export const updateContact = async (id: string, data: ContactPayload): Promise<Contact> => {
  const res = await api.put(`/api/contacts/${id}`, data);
  return res.data;
};

export const deleteContact = async (id: string): Promise<void> => {
  await api.delete(`/api/contacts/${id}`);
};

export const bulkUpdateContacts = async (ids: string[], data: { stage?: string; tags?: string[] }): Promise<void> => {
  await api.post("/api/contacts/bulk-update", { ids, data });
};

export const bulkDeleteContacts = async (ids: string[]): Promise<void> => {
  await api.post("/api/contacts/bulk-delete", { ids });
};

export const exportContacts = async (params: {
  search?: string;
  stage?: string;
  tag?: string;
  listId?: string | null;
  segmentId?: string;
} = {}): Promise<void> => {
  const cleanParams: Record<string, string> = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== null && val !== undefined && val !== "") cleanParams[key] = String(val);
  }
  const qs = new URLSearchParams(cleanParams).toString();
  const res = await api.get(`/api/contacts/export?${qs}`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = `contacts-export-${Date.now()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const importContacts = async (
  file: File,
  mapping?: Record<string, string>
): Promise<{
  message?: string;
  count?: number;
  errors?: unknown[];
  headers?: string[];
  qualitySummary?: {
    duplicateContacts: number;
    invalidEmails: number;
    missingRequiredFields: number;
  };
  fixNowLinks?: {
    qualityCenter?: string;
  };
}> => {
  const formData = new FormData();
  formData.append("file", file);
  if (mapping && Object.keys(mapping).length > 0) {
    formData.append("mapping", JSON.stringify(mapping));
  }
  const res = await api.post("/api/contacts/import", formData);
  return res.data;
};

export const createNote = async (contactId: string, content: string): Promise<Note> => {
  const res = await api.post("/api/contacts/notes", { contactId, content });
  return res.data;
};

export const updateNote = async (id: string, content: string): Promise<Note> => {
  const res = await api.put(`/api/contacts/notes/${id}`, { content });
  return res.data;
};

export const deleteNote = async (id: string): Promise<void> => {
  await api.delete(`/api/contacts/notes/${id}`);
};

export const getTags = async (): Promise<Tag[]> => {
  const res = await api.get("/api/tags");
  return res.data;
};

export const createTag = async (name: string, color: string): Promise<Tag> => {
  const res = await api.post("/api/tags", { name, color });
  return res.data;
};
