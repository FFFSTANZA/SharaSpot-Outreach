import api from "../axios";
import type { UploadedAttachment } from "@/types";

export const uploadAttachments = async (files: File[]): Promise<UploadedAttachment[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const res = await api.post("/api/attachments/upload", formData);
  return res.data;
};

export const deleteAttachment = async (url: string): Promise<void> => {
  await api.delete("/api/attachments/delete", { data: { url } });
};
