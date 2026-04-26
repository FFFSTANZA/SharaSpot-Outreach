"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getUser } from "@/lib/apis";
import type { User } from "@/types";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        // Only fetch if we have an access token
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const userData = await getUser();
            setUser(userData);
        } catch (err) {
            console.error("[AuthContext] Fetch user failed:", err);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const logout = useCallback(() => {
        localStorage.removeItem("accessToken");
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, refreshUser: fetchUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
}
