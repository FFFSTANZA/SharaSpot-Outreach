"use client";

import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Users, UserMinus, X, UserPlus, Crown, Menu } from "lucide-react";
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
import { useSidebar } from "@/hooks/useSidebar";
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

function TeamContent() {
  const { toggle } = useSidebar();
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
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

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
      setPendingInvites(prev => {
        const prevMap = new Map(prev.map(i => [i.id, i]));
        return invites.map(invite => ({
          ...invite,
          inviteLink: prevMap.get(invite.id)?.inviteLink || invite.inviteLink,
        }));
      });
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
          setInviteLink(result.invite.inviteLink || null);
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
    setRemovingMemberId(memberId);
    try {
      await removeMember(memberId);
      setOrg(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId) } : prev);
      setShowDeleteConfirm(null);
      addToast("success", "Member removed");
    } catch (err: unknown) {
      addToast("error", getApiErrorMessage(err, "Failed to remove member"));
    } finally {
      setRemovingMemberId(null);
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
    setCreating(true);
    try {
      const newOrg = await createOrganization(orgName.trim());
      storeAccessToken(newOrg);
      setOrg(newOrg);
      setShowCreate(false);
      setOrgName("");
      await refreshUser();
      await fetchOrg();
      addToast("success", "Organization created");
    } catch (err: unknown) {
      addToast("error", getApiErrorMessage(err, "Failed to create organization"));
    } finally {
      setCreating(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const result = await leaveOrganization();
      storeAccessToken(result);
      setOrg(null);
      await refreshUser();
      addToast("success", "Left organization");
    } catch (err: unknown) {
      addToast("error", getApiErrorMessage(err, "Failed to leave organization"));
    } finally {
      setLeaving(false);
    }
  };

  const handleRename = async () => {
    if (!orgName.trim() || !org) return;
    setRenaming(true);
    try {
      await updateOrganization({ name: orgName.trim() });
      setOrg({ ...org, name: orgName.trim() });
      setShowCreate(false);
      addToast("success", "Organization renamed");
    } catch (err: unknown) {
      addToast("error", getApiErrorMessage(err, "Failed to rename"));
    } finally {
      setRenaming(false);
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
    <>
      <div className="mx-auto w-full max-w-[1600px] flex flex-1 flex-col overflow-hidden rounded-lg border border-border-light bg-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-border-light px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggle}
                  aria-label="Open sidebar"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] lg:hidden"
                >
                  <Menu size={14} />
                </button>
                <h1 className="text-base font-semibold text-text-primary">Team</h1>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-4 sm:px-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
              </div>
            ) : !org ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-light mb-4">
                  <Users size={32} className="text-brand" />
                </div>
                <h2 className="text-base font-semibold text-text-primary mb-1">No Team Yet</h2>
                <p className="text-sm text-text-secondary max-w-md mb-6">
                  {userOwnsOrg
                    ? "You already own a workspace. Switch to it from the sidebar to manage it here."
                    : "Create a workspace to collaborate with your team on campaigns, contacts, and more."}
                </p>
                {!userOwnsOrg && (
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => setShowCreate(true)}
                      className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90"
                    >
                      Create Workspace
                    </button>
                    <p className="text-xs text-text-muted max-w-sm">
                      You're currently using a shared workspace. If you create your own workspace, a subscription will be required to access premium features.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="min-w-0">
                    <h1 className="text-base font-semibold text-text-primary flex items-center gap-2">
                      <Users size={16} className="text-brand" />
                      {org.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-text-secondary">
                        {org.members.length} / {MAX_TEAM_MEMBERS} members
                      </p>
                      <div className="h-1.5 w-24 rounded-full bg-border-light overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            org.members.length >= MAX_TEAM_MEMBERS ? "bg-error-text" : "bg-brand"
                          )}
                          style={{ width: `${(org.members.length / MAX_TEAM_MEMBERS) * 100}%` }}
                        />
                      </div>
                      {isAdmin && (
                        <button onClick={() => { setOrgName(org.name); setShowCreate(true); }} className="text-xs font-medium text-brand hover:underline">
                          Rename
                        </button>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowInvite(true)}
                      disabled={org.members.length >= MAX_TEAM_MEMBERS}
                      className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus size={12} />
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
                        className="flex items-center justify-between rounded-lg border border-border-light bg-white p-4 transition-all hover:shadow-premium-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0F1F3] overflow-hidden">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name || ""} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-text-muted">
                                {(member.name || member.email)[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate flex items-center gap-2">
                              {member.name || member.email}
                              {isCurrentUser && <span className="text-xs text-text-muted font-medium">(you)</span>}
                            </p>
                            <p className="text-xs text-text-muted truncate">{member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {member.role === "OWNER" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">
                              <Crown size={10} />
                              Owner
                            </span>
                          ) : isOwner ? (
                            <select
                              value={member.role}
                              onChange={e => handleRoleChange(member.id, e.target.value as OrgMemberRole)}
                              className="h-7 rounded-md border border-border-light bg-[#F8F9FA] px-2 text-xs font-medium text-text-primary outline-none focus:border-brand/30"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="MEMBER">Member</option>
                              <option value="VIEWER">Viewer</option>
                            </select>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-[#F8F9FA] px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                              {member.role}
                            </span>
                          )}

                          {(isOwner && member.role !== "OWNER") && (
                            <button
                              onClick={() => setShowDeleteConfirm(member.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-error-bg hover:text-error-text"
                            >
                              <UserMinus size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {inviteLink && (
                  <div className="mt-4 rounded-lg border border-brand/30 bg-brand-light p-3">
                    <p className="text-xs font-medium text-brand mb-1">Invite link (copy & share):</p>
                    <div className="flex items-center gap-2">
                      <input readOnly value={inviteLink} className="flex-1 rounded border border-border-light bg-white px-2 py-1 text-xs text-text-primary outline-none" onClick={e => e.currentTarget.select()} />
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(inviteLink);
                            addToast("success", "Link copied");
                          } catch {
                            addToast("error", "Failed to copy");
                          }
                        }}
                        className="flex h-7 items-center rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand/90"
                      >
                        Copy
                      </button>
                      <button onClick={() => setInviteLink(null)} className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-[#F0F1F3]"><X size={13} /></button>
                    </div>
                  </div>
                )}

                {isAdmin && pendingInvites.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xs font-semibold text-text-primary mb-3 uppercase tracking-wider">Pending Invites</h3>
                    <div className="space-y-2">
                      {pendingInvites.map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between rounded-lg border border-border-light bg-white p-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{invite.email}</p>
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
                                className="flex h-7 items-center rounded-md border border-border-light bg-white px-2 text-xs font-medium text-text-secondary transition-colors hover:bg-[#F0F1F3]"
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
                              className="flex h-7 items-center rounded-md border border-border-light bg-white px-2 text-xs font-medium text-error-text transition-colors hover:bg-error-bg"
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
                  <div className="mt-6 pt-4 border-t border-border-light">
                    <button
                      onClick={handleLeave}
                      disabled={leaving}
                      className="text-xs font-medium text-error-text hover:underline disabled:opacity-50"
                    >
                      {leaving ? "Leaving..." : "Leave organization"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      {/* Modal: Create / Rename */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-text-primary/10 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-premium-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-text-primary mb-4">{org ? "Rename Workspace" : "Create Workspace"}</h3>
            <input
              autoFocus
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="My Team"
              className="w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm text-text-primary outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10 placeholder:text-text-muted mb-4"
              onKeyDown={e => e.key === "Enter" && (org ? handleRename() : handleCreateOrg())}
            />
            {!org && (
              <p className="text-xs text-text-muted mb-4 text-center">
                A subscription is required to access premium features in your own workspace.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="flex h-8 items-center rounded-md px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-[#F0F1F3]">Cancel</button>
              <button onClick={org ? handleRename : handleCreateOrg} disabled={!orgName.trim() || (org ? renaming : creating)} className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50">
                {org ? (renaming ? "Saving..." : "Save") : (creating ? "Creating..." : "Create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Invite */}
      {showInvite && (
        <div className="fixed inset-0 z-50 bg-text-primary/10 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-premium-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text-primary">Invite Member</h3>
              <button onClick={() => setShowInvite(false)} className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3]">
                <X size={14} />
              </button>
            </div>
            <input
              autoFocus
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              type="email"
              className="w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm text-text-primary outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10 placeholder:text-text-muted mb-3"
              onKeyDown={e => e.key === "Enter" && handleInvite()}
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as OrgMemberRole)}
              className="w-full rounded-md border border-border-light bg-white px-3 py-2 text-sm text-text-primary outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10 mb-4"
            >
              <option value="MEMBER">Member — can create and edit</option>
              <option value="ADMIN">Admin — can manage members</option>
              <option value="VIEWER">Viewer — read-only access</option>
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowInvite(false)} className="flex h-8 items-center rounded-md px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-[#F0F1F3]">Cancel</button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviting}
                className="flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50"
              >
                {inviting ? "Inviting..." : "Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-text-primary/10 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 shadow-premium-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-text-primary mb-2">Remove Member</h3>
            <p className="text-sm text-text-secondary mb-5">Are you sure? They will lose access to all shared resources.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex h-8 items-center rounded-md px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-[#F0F1F3]">Cancel</button>
              <button onClick={() => handleRemove(showDeleteConfirm)} disabled={removingMemberId === showDeleteConfirm} className="flex h-8 items-center rounded-md bg-error-text px-3 text-xs font-medium text-white transition-all hover:bg-error-text/90 disabled:opacity-50">{removingMemberId === showDeleteConfirm ? "Removing..." : "Remove"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function TeamPage() {
  return (
    <AuthGuard>
      <ErrorBoundary>
        <TeamContent />
      </ErrorBoundary>
    </AuthGuard>
  );
}
