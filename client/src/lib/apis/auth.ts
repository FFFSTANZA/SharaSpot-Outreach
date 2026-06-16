import api from "../axios";

const getAuthUrl = (path: string) => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
  return `${base}${path}`;
};

export const loginWithGoogle = async (idToken: string, inviteToken?: string) => {
  const url = getAuthUrl("/auth/google");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken, ...(inviteToken ? { inviteToken } : {}) }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || `Server responded with ${response.status}`);
    }
    return await response.json() as {
      accessToken: string;
      invite?: {
        accepted: boolean;
        reason?: string;
        organizationId?: string;
        organizationName?: string;
        role?: string;
      } | null;
      user: import("@/types").User;
    };
  } catch (err) {
    throw err;
  }
};

export const refreshAccessToken = async () => {
  const res = await api.post(getAuthUrl("/auth/refresh"));
  return res.data;
};

export const logout = async (): Promise<void> => {
  await api.post(getAuthUrl("/auth/logout"));
};

export const getUser = async (): Promise<import("@/types").User> => {
  const res = await api.get("/api/users");
  return res.data;
};

export const updateUserName = async (name: string): Promise<import("@/types").User> => {
  const res = await api.patch("/api/users/name", { name });
  return res.data;
};
