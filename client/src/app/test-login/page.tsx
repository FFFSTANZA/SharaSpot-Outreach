"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function TestLogin() {
  const router = useRouter();
  useEffect(() => {
    localStorage.setItem("accessToken", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbzV5MWR3eTAwMDBuenh5OGhoOWQ5cWYiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NzY2MTM4ODgsImV4cCI6MTc3NjYxNDc4OH0.QtyPs-f7g-UGEQuMlKJa3b1KK5pf0m131VZydaM7J50");
    router.push("/dashboard/prm");
  }, [router]);
  return <div>Logging in...</div>;
}
