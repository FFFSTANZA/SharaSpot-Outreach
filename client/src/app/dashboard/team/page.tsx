"use client";

import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { Users, UserMinus, X, UserPlus, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import {
  getCurrentOrganization,
  getOrganizations,
  createOrganization,
  inviteMember,
  getPendingInvites,
  revokeInvite,
  removeMember,
  updateMemberRole,
  leaveOrganization,
  updateOrganization,
} from "@/lib/apis";
import { useToast } from "@/context/ToastContext";
import type { Organization, OrganizationInvite, OrgMemberRole } from "@/types";

const MAX_TEAM_MEMBERS = 5;

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: unknown }).response === "object" &&
    (err as { response?: { data?: unknown } }).response?.data &&
    typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
  ) {
    return (err as { response?: { data?: { message: string } } }).response!.data!.message;
  }
  return fallback;
};

function storeAccessToken(data: { accessToken?: string } | null | undefined) {
  if (data?.accessToken && typeof window !== "undefined") {
    localStorage.setItem("accessToken", data.accessToken);
  }
}

export default function TeamPage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [userOwnsOrg, setUserOwnsOrg] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgMemberRole>("MEMBER");
  const [showInvite, setShowInvite] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<OrganizationInvite[]>([]);

  const fetchOrg = useCallback(async () => {
    try {
      const data = await getCurrentOrganization();
      setOrg(data);
      const allOrgs = await getOrganizations();
      setUserOwnsOrg(allOrgs.some(o => o.role === "OWNER"));
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  const fetchInvites = useCallback(async () => {
    try {
      const invites = await getPendingInvites();
      setPendingInvites(invites);
    } catch {}
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const result = await inviteMember(inviteEmail.trim(), inviteRole);
      if (result.type === "member") {
        setOrg(prev => prev ? { ...prev, members: [...prev.members, result.member] } : prev);
        addToast("success", `Invited ${result.member.email}`);
      } else {
        setPendingInvites(prev => [result.invite, ...prev]);
        try {
          await navigator.clipboard.writeText(result.invite.inviteLink || "");
          addToast("success", `Invite link copied for ${result.invite.email}`);
        } catch {
          addToast("success", `Invite created for ${result.invite.email}`);
        }
      }
      setInviteEmail("");
      setShowInvite(false);
    } catch (err: unknown) {
      addToast("error", getApiErrorMessage(err, "Failed to invite member"));
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember(memberId);
      setOrg(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId) } : prev);
      setShowDeleteConfirm(null);
      addToast("success", "Member removed");
    } catch (err: unknown) {
      addToast("error", getApiErrorMessage(err, "Failed to remove member"));
    }
  };

  const handleRoleChange = async (memberId: string, role: OrgMemberRole) => {
    try {
      await updateMemberRole(memberId, role);
      setOrg(prev => prev ? { ...prev, members: prev.members.map(m => m.id === memberId ? { ...m, role } : m) } : prev);
      addToast("success", "Role updated");
    } catch (err: unknown) {
      addToast("error", getApiErrorMessage(err, "Failed to update role"));
    }
  };

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return;
    try {
      const newOrg = await createOrganization(orgName.trim());
      storeAccessToken(newOrg);
      setOrg(newOrg);
      setShowCreate(false);
      setOrgName("");
      await refreshUser();
      addToast("success", "Organization created");
    } catch (err: unknown) {
      addToast("error", getApiErrorMessage(err, "Failed to create organization"));
    }
  };

  const handleLeave = async () => {
    try {
      const result = await leaveOrganization();
      storeAccessToken(result);
      setOrg(null);
      await refreshUser();
      addToast("success", "Left organization");
    } catch (err: unknown) {
      addToast("error", getApiErrorMessage(err, "Failed to leave organization"));
    }
  };

  const handleRename = async () => {
    if (!orgName.trim() || !org) return;
    try {
      await updateOrganization({ name: orgName.trim() });
      setOrg({ ...org, name: orgName.trim() });
      setShowCreate(false);
      addToast("success", "Organization renamed");
    } catch (err: unknown) {
      addToast("error", getApiErrorMessage(err, "Failed to rename"));
    }
  };

  const currentMember = org?.members.find(m => m.userId === user?.id);
  const isOwner = currentMember?.role === "OWNER";
  const isAdmin = currentMember?.role === "ADMIN" || isOwner;

  useEffect(() => {
    if (isAdmin && org) {
      fetchInvites();
    } else {
      setPendingInvites([]);
    }
  }, [isAdmin, org, fetchInvites]);

  return (
    <AuthGuard requirePremium={true}>
      <SidebarProvider>
        <div className="flex h-screen bg-background font-sans text-text-primary">
          <Sidebar
            currentLabel="Team"
            setLabel={() => { }}
            items={[]}
            profile={{
              name: user?.name ?? "User",
              email: user?.email ?? "",
              avatarUrl: user?.avatarUrl ?? "",
            }}
          />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-interactive-hover/40 p-4 lg:p-6">
            <div className="bg-white rounded-2xl border border-border-light shadow-card flex flex-col grow overflow-hidden">
              <TopBar placeholder="Search team..." />

              <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
                  </div>
                  ) : !org ? (
                  <div className="text-center py-20">
                    <Users size={48} className="mx-auto text-text-muted mb-4" />
                    <h2 className="text-xl font-bold mb-2">No Team Yet</h2>
                    <p className="text-text-secondary mb-6 max-w-md mx-auto">
                      {userOwnsOrg
                        ? "You already own a workspace. Switch to it from the sidebar to manage it here."
                        : "Create a workspace to collaborate with your team on campaigns, contacts, and more."}
                    </p>
                    {!userOwnsOrg && (
                      <div className="flex flex-col items-center gap-3">
                        <button
                          onClick={() => setShowCreate(true)}
                          className="px-6 py-2.5 bg-brand text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                          Create Workspace
                        </button>
                        <p className="text-xs text-text-muted max-w-sm">
                          You're currently using a shared workspace. If you create your own workspace, a subscription will be required to access premium features.
                        </p>
                      </div>
                    )}
                    {showCreate && (
                      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setShowCreate(false)}>
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                          <h3 className="text-lg font-bold mb-4">Create Workspace</h3>
                          <input
                            autoFocus
                            value={orgName}
                            onChange={e => setOrgName(e.target.value)}
                            placeholder="My Team"
                            className="w-full px-4 py-2.5 border border-border-light rounded-xl text-sm mb-4 outline-none focus:border-brand transition-colors"
                            onKeyDown={e => e.key === "Enter" && handleCreateOrg()}
                          />
                          <p className="text-xs text-text-muted mb-4 text-center">
                            A subscription is required to access premium features in your own workspace.
                          </p>
                          <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-semibold text-text-secondary">Cancel</button>
                            <button onClick={handleCreateOrg} disabled={!orgName.trim()} className="px-4 py-2 text-sm font-semibold bg-brand text-white rounded-xl disabled:opacity-50">Create</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                          <Users size={24} className="text-brand" />
                          {org.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm font-medium text-text-secondary">
                            {org.members.length} / {MAX_TEAM_MEMBERS} members
                          </p>
                          <div className="flex-1 h-1.5 w-24 bg-border-light rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                org.members.length >= MAX_TEAM_MEMBERS ? "bg-error-text" : "bg-brand"
                              )}
                              style={{ width: `${(org.members.length / MAX_TEAM_MEMBERS) * 100}%` }}
                            />
                          </div>
                          {isAdmin && (
                            <button onClick={() => { setOrgName(org.name); setShowCreate(true); }} className="text-brand hover:underline text-xs font-semibold">
                              Rename
                            </button>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setShowInvite(true)}
                          disabled={org.members.length >= MAX_TEAM_MEMBERS}
                          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <UserPlus size={16} />
                          {org.members.length >= MAX_TEAM_MEMBERS ? "Team Full" : "Invite"}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {org.members.map(member => {
                        const isCurrentUser = member.userId === user?.id;
                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border-light shadow-sm transition-all hover:shadow-card"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="h-10 w-10 rounded-full bg-interactive-hover flex items-center justify-center overflow-hidden shrink-0">
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt={member.name || ""} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-sm font-bold text-text-muted">
                                    {(member.name || member.email)[0].toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate flex items-center gap-2">
                                  {member.name || member.email}
                                  {isCurrentUser && <span className="text-xs text-text-muted font-medium">(you)</span>}
                                </p>
                                <p className="text-xs text-text-muted truncate">{member.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {member.role === "OWNER" ? (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                                  <Crown size={12} />
                                  Owner
                                </span>
                              ) : isOwner ? (
                                <select
                                  value={member.role}
                                  onChange={e => handleRoleChange(member.id, e.target.value as OrgMemberRole)}
                                  className="text-xs font-semibold border border-border-light rounded-lg px-2 py-1.5 outline-none focus:border-brand"
                                >
                                  <option value="ADMIN">Admin</option>
                                  <option value="MEMBER">Member</option>
                                  <option value="VIEWER">Viewer</option>
                                </select>
                              ) : (
                                <span className={cn(
                                  "text-xs font-semibold px-3 py-1.5 rounded-lg",
                                  member.role === "ADMIN" && "bg-blue-50 text-blue-600",
                                  member.role === "MEMBER" && "bg-gray-50 text-text-secondary",
                                  member.role === "VIEWER" && "bg-gray-50 text-text-muted",
                                )}>
                                  {member.role}
                                </span>
                              )}

                              {(isOwner && member.role !== "OWNER") && (
                                <button
                                  onClick={() => setShowDeleteConfirm(member.id)}
                                  className="p-2 text-text-muted hover:text-error-text hover:bg-error-bg rounded-lg transition-colors"
                                >
                                  <UserMinus size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {isAdmin && pendingInvites.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-sm font-bold text-text-primary mb-3">Pending Invites</h3>
                        <div className="space-y-2">
                          {pendingInvites.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between p-3 rounded-xl border border-border-light bg-white">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{invite.email}</p>
                                <p className="text-xs text-text-muted">
                                  {invite.role} • Expires {new Date(invite.expiresAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {invite.inviteLink && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(invite.inviteLink!);
                                        addToast("success", "Invite link copied");
                                      } catch {
                                        addToast("error", "Failed to copy invite link");
                                      }
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-light hover:bg-interactive-hover/40"
                                  >
                                    Copy Link
                                  </button>
                                )}
                                <button
                                  onClick={async () => {
                                    try {
                                      await revokeInvite(invite.id);
                                      setPendingInvites((prev) => prev.filter((x) => x.id !== invite.id));
                                      addToast("success", "Invite revoked");
                                    } catch (err: unknown) {
                                      addToast("error", getApiErrorMessage(err, "Failed to revoke invite"));
                                    }
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-light text-error-text hover:bg-error-bg"
                                >
                                  Revoke
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isOwner && (
                      <div className="mt-8 pt-6 border-t border-border-light">
                        <button
                          onClick={handleLeave}
                          className="text-sm font-semibold text-error-text hover:underline"
                        >
                          Leave organization
                        </button>
                      </div>
                    )}

                    {showCreate && (
                      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setShowCreate(false)}>
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                          <h3 className="text-lg font-bold mb-4">Rename Workspace</h3>
                          <input
                            autoFocus
                            value={orgName}
                            onChange={e => setOrgName(e.target.value)}
                            className="w-full px-4 py-2.5 border border-border-light rounded-xl text-sm mb-4 outline-none focus:border-brand transition-colors"
                            onKeyDown={e => e.key === "Enter" && handleRename()}
                          />
                          <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-semibold text-text-secondary">Cancel</button>
                            <button onClick={handleRename} disabled={!orgName.trim()} className="px-4 py-2 text-sm font-semibold bg-brand text-white rounded-xl disabled:opacity-50">Save</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {showInvite && (
                      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setShowInvite(false)}>
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Invite Member</h3>
                            <button onClick={() => setShowInvite(false)} className="p-1 text-text-muted hover:text-text-primary">
                              <X size={20} />
                            </button>
                          </div>
                          <input
                            autoFocus
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            type="email"
                            className="w-full px-4 py-2.5 border border-border-light rounded-xl text-sm mb-3 outline-none focus:border-brand transition-colors"
                            onKeyDown={e => e.key === "Enter" && handleInvite()}
                          />
                          <select
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value as OrgMemberRole)}
                            className="w-full px-4 py-2.5 border border-border-light rounded-xl text-sm mb-4 outline-none focus:border-brand transition-colors"
                          >
                            <option value="MEMBER">Member — can create and edit</option>
                            <option value="ADMIN">Admin — can manage members</option>
                            <option value="VIEWER">Viewer — read-only access</option>
                          </select>
                          <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm font-semibold text-text-secondary">Cancel</button>
                            <button
                              onClick={handleInvite}
                              disabled={!inviteEmail.trim() || inviting}
                              className="px-4 py-2 text-sm font-semibold bg-brand text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
                            >
                              {inviting ? "Inviting..." : "Invite"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {showDeleteConfirm && (
                      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setShowDeleteConfirm(null)}>
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                          <h3 className="text-lg font-bold mb-2">Remove Member</h3>
                          <p className="text-sm text-text-secondary mb-6">Are you sure? They will lose access to all shared resources.</p>
                          <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm font-semibold text-text-secondary">Cancel</button>
                            <button onClick={() => handleRemove(showDeleteConfirm)} className="px-4 py-2 text-sm font-semibold bg-error-text text-white rounded-xl">Remove</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
