"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "../Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import {
  Copy,
  FileCode,
  KeyRound,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Menu,
  ExternalLink,
  Check,
  Terminal,
} from "lucide-react";
import {
  createMcpApiKey,
  deleteMcpApiKey,
  getCurrentOrganization,
  getMcpApiKeys,
  revokeMcpApiKey,
  type CreatedMcpApiKey,
  type McpApiKey,
  type McpKeyPermissions,
  type McpKeyScope,
  type McpToolCategory,
} from "@/lib/apis";
import type { Organization } from "@/types";
const AREAS: Array<{ id: McpToolCategory; label: string }> = [
  { id: "contacts", label: "Contacts" },
  { id: "contactLists", label: "Contact lists" },
  { id: "campaigns", label: "Campaigns" },
  { id: "senders", label: "Senders" },
  { id: "templates", label: "Templates" },
  { id: "analytics", label: "Analytics" },
  { id: "inbox", label: "Inbox" },
  { id: "prm", label: "PRM" },
  { id: "validation", label: "Validation" },
  { id: "calls", label: "Calls" },
  { id: "settings", label: "Settings" },
];

const ALL_AREAS = AREAS.map((area) => area.id);

type PermissionPreset = "read" | "selected" | "full";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: unknown }).response === "object" &&
    (err as { response?: { data?: { message?: unknown } } }).response?.data &&
    typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
  ) {
    return (err as { response: { data: { message: string } } }).response.data.message;
  }
  return fallback;
}

export default function McpPageWrapper() {
  return <McpPage />;
}

function McpPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [scope, setScope] = useState<McpKeyScope>("personal");
  const [keys, setKeys] = useState<McpApiKey[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedMcpApiKey | null>(null);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<McpApiKey | null>(null);
  const loadRequestIdRef = useRef(0);

  const currentMember = org?.members.find((member) => member.userId === user?.id);
  const canManageOrgKeys = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
  const endpoint = useMemo(() => {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");
    if (backend) return `${backend}/api/mcp`;
    if (typeof window !== "undefined") return `${window.location.origin}/api/mcp`;
    return "/api/mcp";
  }, []);

  const loadData = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    setLoading(true);
    try {
      const orgData = await getCurrentOrganization().catch(() => null);
      if (requestId !== loadRequestIdRef.current) return;
      setOrg(orgData);

      if (scope === "organization" && !orgData) {
        setKeys([]);
      } else {
        const keyData = await getMcpApiKeys(scope);
        if (requestId !== loadRequestIdRef.current) return;
        setKeys(keyData);
      }
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) return;
      addToast("error", getApiErrorMessage(err, "Failed to load MCP settings"));
    } finally {
      if (requestId !== loadRequestIdRef.current) return;
      setLoading(false);
    }
  }, [addToast, scope]);

  useEffect(() => {
    setCreatedKey(null);
    loadData();
  }, [loadData]);

  const copyText = async (text: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      addToast("success", label);
    } catch {
      addToast("error", "Copy failed");
    }
  };

  const handleCreated = (key: CreatedMcpApiKey) => {
    setCreatedKey(key);
    setKeys((prev) => [key, ...prev]);
    setShowCreate(false);
  };

  const handleRevoke = async (key: McpApiKey) => {
    try {
      await revokeMcpApiKey(key.id, key.scope);
      setKeys((prev) => prev.map((item) => item.id === key.id ? { ...item, isActive: false } : item));
      addToast("success", "API key revoked");
    } catch (err) {
      addToast("error", getApiErrorMessage(err, "Failed to revoke API key"));
    }
  };

  const handleDelete = async (key: McpApiKey) => {
    try {
      await deleteMcpApiKey(key.id, key.scope);
      setKeys((prev) => prev.filter((item) => item.id !== key.id));
      setDeleteConfirmKey(null);
      addToast("success", "API key deleted");
    } catch (err) {
      setDeleteConfirmKey(null);
      addToast("error", getApiErrorMessage(err, "Failed to delete API key"));
    }
  };

  const confirmDelete = (key: McpApiKey) => {
    setDeleteConfirmKey(key);
  };

  const keyForSnippets = createdKey?.key || "<MCP_API_KEY>";

  return (
    <AuthGuard requirePremium={true}>
      <>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-text-primary/10 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <aside className="absolute inset-y-0 left-0 w-[min(320px,calc(100vw-1rem))] border-r border-border-light bg-white shadow-premium-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
                <p className="text-sm font-bold text-text-primary">Menu</p>
                <button onClick={() => setIsMobileMenuOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3]">
                  <X size={14} />
                </button>
              </div>
              <div className="h-[calc(100%-65px)] overflow-y-auto">
                <Sidebar />
              </div>
            </aside>
          </div>
        )}

        <div className="flex-1 flex min-w-0 overflow-hidden">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col rounded-lg border border-border-light bg-white">
            <div className="shrink-0 border-b border-border-light px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    aria-label="Open sidebar"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] lg:hidden"
                  >
                    <Menu size={14} />
                  </button>
                  <h1 className="text-base font-semibold text-text-primary">MCP</h1>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={loadData}
                    className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-secondary"
                    title="Refresh"
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowCreate(true)}
                    disabled={scope === "organization" && (!org || !canManageOrgKeys)}
                    className="flex h-7 items-center gap-1.5 rounded-md bg-brand px-2.5 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50"
                  >
                    <Plus size={12} />
                    New Key
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Create scoped API keys to connect SharaSpot to MCP-compatible clients like Claude, Cursor, and VS Code.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 border-b border-border-light px-4 py-2.5 sm:px-6">
                <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Scope
                </span>
                <div className="flex items-center gap-0.5">
                  {(["personal", "organization"] as McpKeyScope[]).map((item) => (
                    <button
                      key={item}
                      onClick={() => setScope(item)}
                      className={cn(
                        "h-7 rounded-md px-2 text-xs font-medium transition-all",
                        scope === item ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {scope === "organization" && !org ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
                    <KeyRound size={20} className="text-text-muted" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-text-primary">No active workspace</p>
                  <p className="mt-1 text-xs text-text-muted">Switch to a workspace to view organization MCP keys.</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                </div>
              ) : keys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
                    <KeyRound size={20} className="text-text-muted" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-text-primary">No keys yet</p>
                  <p className="mt-1 text-xs text-text-muted">Click &ldquo;New Key&rdquo; to create a scoped MCP API key.</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    disabled={scope === "organization" && (!org || !canManageOrgKeys)}
                    className="mt-4 flex h-7 items-center gap-1.5 rounded-md bg-brand px-2.5 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50"
                  >
                    <Plus size={12} />
                    New Key
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-muted sm:px-6">Name</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-muted">Permissions</th>
                      <th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold text-text-muted sm:table-cell">Last used</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-muted">Status</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((key) => (
                      <tr key={key.id} className="border-b border-border-light transition-colors hover:bg-[#F8F9FA]">
                        <td className="px-4 py-3 sm:px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#F8F9FA]">
                              <KeyRound size={12} className="text-text-muted" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{key.name}</p>
                              <p className="text-xs text-text-muted">{formatDate(key.createdAt)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-[#F0F1F3] px-1.5 py-0.5 text-[10px] font-medium capitalize text-text-secondary">
                            {key.permissions.access}
                          </span>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {key.permissions.areas.length === ALL_AREAS.length
                              ? "All areas"
                              : `${key.permissions.areas.length} area${key.permissions.areas.length === 1 ? "" : "s"}`}
                          </p>
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-text-secondary sm:table-cell">
                          {key.lastUsedAt ? formatDate(key.lastUsedAt) : <span className="text-text-muted">Never</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            key.isActive ? "bg-brand-light text-brand" : "bg-[#F0F1F3] text-text-muted"
                          )}>
                            {key.isActive ? "Active" : "Revoked"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              disabled={!key.isActive}
                              onClick={() => handleRevoke(key)}
                              className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-text-secondary transition-all hover:bg-[#F0F1F3] hover:text-text-primary disabled:opacity-30"
                            >
                              Revoke
                            </button>
                            <button
                              onClick={() => confirmDelete(key)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] hover:text-error-text"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {createdKey && (
                <div className="mx-4 mb-4 mt-4 rounded-lg border border-brand/20 bg-brand-light px-4 py-3 sm:mx-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/10">
                        <Check size={12} className="text-brand" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">API Key Created</p>
                        <p className="text-[11px] text-text-muted">Store this value now. It will not be shown again.</p>
                      </div>
                    </div>
                    <button onClick={() => setCreatedKey(null)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-brand/10">
                      <X size={12} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md border border-border-light bg-white px-3 py-2 text-xs font-mono text-text-primary">
                      {createdKey.key}
                    </code>
                    <button
                      onClick={() => copyText(createdKey.key, "API key copied")}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-white transition-all hover:bg-brand/90"
                      title="Copy key"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-border-light">
                <div className="border-b border-border-light px-4 py-3 sm:px-6">
                  <h2 className="text-sm font-semibold text-text-primary">Setup</h2>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Add this configuration to your MCP client.
                  </p>
                </div>
                <SetupPanel endpoint={endpoint} apiKey={keyForSnippets} onCopy={copyText} />
            </div>
          </div>
        </div>
        </div>

        {deleteConfirmKey && (
          <div className="fixed inset-0 z-50 bg-text-primary/10 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteConfirmKey(null)}>
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-premium-lg" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-text-primary mb-2">Delete API Key</h3>
              <p className="text-sm text-text-secondary mb-5">
                Delete &ldquo;{deleteConfirmKey.name}&rdquo;? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmKey(null)} className="flex-1 flex h-9 items-center justify-center rounded-md border border-border-light bg-white px-4 text-xs font-medium text-text-secondary transition-colors hover:bg-[#F0F1F3]">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirmKey)} className="flex-1 flex h-9 items-center justify-center rounded-md bg-error-text px-4 text-xs font-medium text-white transition-all hover:bg-error-text/90">Delete</button>
              </div>
            </div>
          </div>
        )}

        {showCreate && (
          <CreateKeyModal
            scope={scope}
            org={org}
            canManageOrgKeys={canManageOrgKeys}
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
          />
        )}
      </>
    </AuthGuard>
  );
}

function CreateKeyModal({
  scope,
  org,
  canManageOrgKeys,
  onClose,
  onCreated,
}: {
  scope: McpKeyScope;
  org: Organization | null;
  canManageOrgKeys: boolean;
  onClose: () => void;
  onCreated: (key: CreatedMcpApiKey) => void;
}) {
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [preset, setPreset] = useState<PermissionPreset>("read");
  const [areas, setAreas] = useState<McpToolCategory[]>(["contacts", "campaigns", "analytics"]);
  const [saving, setSaving] = useState(false);

  const permissions: McpKeyPermissions = useMemo(() => {
    if (preset === "read") return { access: "read", areas: ALL_AREAS };
    if (preset === "full") return { access: "write", areas: ALL_AREAS };
    return { access: "write", areas };
  }, [areas, preset]);

  const submit = async () => {
    if (!name.trim()) return;
    if (scope === "organization" && (!org || !canManageOrgKeys)) {
      addToast("error", "Only workspace owners and admins can create organization MCP keys");
      return;
    }
    setSaving(true);
    try {
      const key = await createMcpApiKey({ name: name.trim(), scope, permissions });
      onCreated(key);
      addToast("success", "MCP API key created");
    } catch (err) {
      addToast("error", getApiErrorMessage(err, "Failed to create MCP API key"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/10 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-lg bg-white shadow-premium-lg" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border-light px-6 py-4">
          <h2 className="text-sm font-semibold text-text-primary">Create MCP Key</h2>
          <p className="mt-0.5 text-xs text-text-muted capitalize">{scope} scope{scope === "organization" && org ? ` for ${org.name}` : ""}</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Claude desktop"
              className="w-full rounded-lg border border-border-light bg-white px-3 py-2 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted">Permissions</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["read", "Read only"],
                ["selected", "Read/write selected"],
                ["full", "Full access"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setPreset(id as PermissionPreset)}
                  className={cn(
                    "h-9 rounded-md text-xs font-medium transition-all",
                    preset === id
                      ? "border-brand/20 bg-brand/10 text-brand"
                      : "border border-border-light bg-[#F8F9FA] text-text-secondary hover:border-brand/20 hover:bg-white"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {preset === "selected" && (
            <div className="grid grid-cols-2 gap-2">
              {AREAS.map((area) => (
                <label key={area.id} className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                  areas.includes(area.id)
                    ? "border-brand/20 bg-brand/5 text-brand"
                    : "border-border-light bg-[#F8F9FA] text-text-secondary hover:border-brand/20 hover:bg-white"
                )}>
                  <input
                    type="checkbox"
                    checked={areas.includes(area.id)}
                    onChange={(e) => {
                      setAreas((prev) => e.target.checked
                        ? [...prev, area.id]
                        : prev.filter((item) => item !== area.id));
                    }}
                    className="h-3.5 w-3.5 rounded border-border-light text-brand focus:ring-brand"
                  />
                  {area.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border-light px-6 py-4">
          <button onClick={onClose} className="flex h-8 items-center rounded-md px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-[#F0F1F3]">Cancel</button>
          <button
            onClick={submit}
            disabled={!name.trim() || saving || (preset === "selected" && areas.length === 0)}
            className="flex h-8 items-center rounded-md bg-brand px-3 text-xs font-medium text-white transition-all hover:bg-brand/90 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Key"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SetupPanel({
  endpoint,
  apiKey,
  onCopy,
}: {
  endpoint: string;
  apiKey: string;
  onCopy: (text: string, label?: string) => void;
}) {
  const snippets = useMemo(() => buildSnippets(endpoint, apiKey), [endpoint, apiKey]);
  const [active, setActive] = useState(snippets[0].id);
  const snippet = snippets.find((item) => item.id === active) || snippets[0];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border-light px-4 py-2.5 sm:px-6">
        {snippets.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={cn(
              "h-7 rounded-md px-2 text-xs font-medium transition-all",
              active === item.id ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 sm:px-6">
        <div className="rounded-lg border border-border-light overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border-light bg-[#F8F9FA] px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode size={12} className="shrink-0 text-text-muted" />
              <span className="truncate text-[11px] font-medium text-text-secondary">{snippet.path}</span>
            </div>
            <button
              onClick={() => onCopy(snippet.value, "Snippet copied")}
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-secondary transition-all hover:bg-white hover:text-brand"
            >
              <Copy size={11} />
              Copy
            </button>
          </div>
          <div className="overflow-x-auto">
            <pre className="bg-[#111827] p-4 text-xs leading-relaxed">
              <code className="text-white/90 font-mono whitespace-pre">{snippet.value}</code>
            </pre>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <Terminal size={11} className="text-text-muted" />
          <p className="text-[11px] text-text-muted">
            Paste this into your MCP client configuration file
          </p>
          {active === "vscode" && (
            <a
              href="https://code.visualstudio.com/docs/copilot/mcp-servers"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-brand hover:underline"
            >
              VS Code guide
              <ExternalLink size={10} />
            </a>
          )}
          {active === "claude" && (
            <a
              href="https://docs.anthropic.com/en/docs/claude-code/mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-brand hover:underline"
            >
              Claude guide
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function buildSnippets(endpoint: string, apiKey: string) {
  const headers = { Authorization: `Bearer ${apiKey}` };
  return [
    {
      id: "claude",
      label: "Claude",
      path: "Claude Code config",
      value: JSON.stringify({
        mcpServers: {
          sharaspot: {
            type: "http",
            url: endpoint,
            headers,
          },
        },
      }, null, 2),
    },
    {
      id: "cursor",
      label: "Cursor",
      path: ".cursor/mcp.json or ~/.cursor/mcp.json",
      value: JSON.stringify({
        mcpServers: {
          sharaspot: {
            type: "http",
            url: endpoint,
            headers,
          },
        },
      }, null, 2),
    },
    {
      id: "windsurf",
      label: "Windsurf",
      path: "~/.codeium/windsurf/mcp_config.json",
      value: JSON.stringify({
        mcpServers: {
          sharaspot: {
            serverUrl: endpoint,
            headers,
          },
        },
      }, null, 2),
    },
    {
      id: "vscode",
      label: "VS Code",
      path: ".vscode/mcp.json",
      value: JSON.stringify({
        inputs: [
          {
            type: "promptString",
            id: "sharaspot-mcp-key",
            description: "SharaSpot MCP API key",
            password: true,
          },
        ],
        servers: {
          sharaspot: {
            type: "http",
            url: endpoint,
            headers: {
              Authorization: "Bearer ${input:sharaspot-mcp-key}",
            },
          },
        },
      }, null, 2),
    },
    {
      id: "generic",
      label: "HTTP",
      path: "JSON-RPC over HTTP",
      value: [
        `POST ${endpoint}`,
        `Authorization: Bearer ${apiKey}`,
        "",
        JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: { tools: true }, clientInfo: { name: "sharaspot-dashboard", version: "1.0.0" } } }, null, 2),
        "",
        JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }, null, 2),
        "",
        JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "contact_list", arguments: { limit: 10 } } }, null, 2),
      ].join("\n"),
    },
  ];
}
