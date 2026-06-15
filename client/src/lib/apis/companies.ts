import api from "../axios";
import type { CompanyProfile } from "@/types";

export interface CompanyPayload {
  name?: string;
  website?: string;
  email?: string;
}

export const getCompanies = async (): Promise<CompanyProfile[]> => {
  const res = await api.get("/api/companies");
  return res.data;
};

export const createCompany = async (data: CompanyPayload): Promise<CompanyProfile> => {
  const res = await api.post("/api/companies", data);
  return res.data;
};

export const getCompanyById = async (id: string): Promise<CompanyProfile> => {
  const res = await api.get(`/api/companies/${id}`);
  return res.data;
};

export const refreshCompany = async (id: string): Promise<CompanyProfile> => {
  const res = await api.post(`/api/companies/${id}/refresh`);
  return res.data;
};
