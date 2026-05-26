"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/context/SidebarContext";
import { Sidebar } from "../Sidebar";
import { TopBar } from "../Topbar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import {
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  ServerCog,
  Trash2,
  X,
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

export default function McpPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [scope, setScope] = useState<McpKeyScope>("personal");
  const [keys, setKeys] = useState<McpApiKey[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedMcpApiKey | null>(null);
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
    if (!window.confirm(`Delete ${key.name}? This cannot be undone.`)) return;
    try {
      await deleteMcpApiKey(key.id, key.scope);
      setKeys((prev) => prev.filter((item) => item.id !== key.id));
      addToast("success", "API key deleted");
    } catch (err) {
      addToast("error", getApiErrorMessage(err, "Failed to delete API key"));
    }
  };

  const keyForSnippets = createdKey?.key || "<MCP_API_KEY>";

  return (
    <AuthGuard requirePremium={true}>
      <SidebarProvider>
        <div className="flex h-screen bg-background font-sans text-text-primary">
          <Sidebar
            currentLabel="MCP"
            setLabel={() => {}}
            items={[]}
            profile={{
              name: user?.name ?? "User",
              email: user?.email ?? "",
              avatarUrl: user?.avatarUrl ?? "",
            }}
          />

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-interactive-hover/40 p-4 lg:p-6">
            <div className="bg-white rounded-2xl border border-border-light shadow-card flex flex-col grow overflow-hidden">
              <TopBar placeholder="Search MCP..." />

              <div className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-4xl mx-auto w-full custom-scrollbar">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                      <ServerCog size={24} className="text-brand" />
                      MCP
                    </h1>
                    <p className="text-sm font-medium text-text-secondary mt-1">
                      Create scoped API keys to connect SharaSpot to MCP-compatible clients like Claude, Cursor, and VS Code.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={loadData}
                      className="h-10 w-10 rounded-lg border border-border-light text-text-muted hover:text-text-primary hover:bg-interactive-hover flex items-center justify-center"
                      title="Refresh"
                    >
                      <RefreshCw size={17} />
                    </button>
                    <button
                      onClick={() => setShowCreate(true)}
                      disabled={scope === "organization" && (!org || !canManageOrgKeys)}
                      className="h-10 px-4 rounded-lg bg-brand text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      <Plus size={16} />
                      New Key
                    </button>
                  </div>
                </div>

                <section className="rounded-xl border border-border-light bg-white shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-border-light flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-sm font-bold">API Keys</h2>
                      <p className="text-xs text-text-muted mt-1">Raw keys are only shown immediately after creation.</p>
                    </div>
                    <div className="inline-flex rounded-lg border border-border-light p-1 bg-interactive-hover/50 w-fit">
                      {(["personal", "organization"] as McpKeyScope[]).map((item) => (
                        <button
                          key={item}
                          onClick={() => setScope(item)}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-bold capitalize",
                            scope === item ? "bg-white text-brand shadow-sm" : "text-text-muted"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {scope === "organization" && !org ? (
                    <EmptyState title="No active workspace" message="Switch to a workspace to view organization MCP keys." />
                  ) : loading ? (
                    <div className="p-8 flex justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
                    </div>
                  ) : keys.length === 0 ? (
                    <EmptyState title="No keys yet" message='Click "New Key" to create a scoped MCP API key.' />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-interactive-hover/40 text-xs text-text-muted">
                          <tr>
                            <th className="text-left font-bold p-4">Name</th>
                            <th className="text-left font-bold p-4">Permissions</th>
                            <th className="text-left font-bold p-4">Last used</th>
                            <th className="text-left font-bold p-4">Status</th>
                            <th className="text-right font-bold p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keys.map((key) => (
                            <tr key={key.id} className="border-t border-border-light">
                              <td className="p-4">
                                <p className="font-bold text-text-primary">{key.name}</p>
                                <p className="text-xs text-text-muted">{formatDate(key.createdAt)}</p>
                              </td>
                              <td className="p-4">
                                <p className="font-semibold capitalize">{key.permissions.access}</p>
                                <p className="text-xs text-text-muted">{key.permissions.areas.length} areas</p>
                              </td>
                              <td className="p-4 text-text-secondary">{key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "inline-flex px-2 py-1 rounded text-xs font-bold",
                                  key.isActive ? "bg-brand-light text-brand" : "bg-error-bg text-error-text"
                                )}>
                                  {key.isActive ? "Active" : "Revoked"}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex justify-end gap-2">
                                  <button
                                    disabled={!key.isActive}
                                    onClick={() => handleRevoke(key)}
                                    className="h-8 px-3 rounded-lg border border-border-light text-xs font-bold text-text-secondary disabled:opacity-50"
                                  >
                                    Revoke
                                  </button>
                                  <button
                                    onClick={() => handleDelete(key)}
                                    className="h-8 w-8 rounded-lg border border-border-light text-error-text flex items-center justify-center"
                                    title="Delete"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {createdKey && (
                  <section className="mt-4 rounded-xl border border-brand/30 bg-brand/5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-sm font-bold flex items-center gap-2">
                          <KeyRound size={16} className="text-brand" />
                          API Key Created
                        </h2>
                        <p className="text-xs text-text-muted mt-1">Store this value now. It will not be shown again.</p>
                      </div>
                      <button onClick={() => setCreatedKey(null)} className="text-text-muted hover:text-text-primary">
                        <X size={18} />
                      </button>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <code className="flex-1 min-w-0 rounded-lg bg-white border border-border-light px-3 py-2 text-xs font-mono break-all">
                        {createdKey.key}
                      </code>
                      <button
                        onClick={() => copyText(createdKey.key, "API key copied")}
                        className="h-10 w-10 rounded-lg bg-brand text-white flex items-center justify-center shrink-0"
                        title="Copy key"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </section>
                )}

                <section className="mt-6 rounded-xl border border-border-light bg-white shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-border-light">
                    <h2 className="text-sm font-bold">Setup</h2>
                    <p className="text-xs text-text-muted mt-1">
                      Configure your MCP client with the snippet below.
                    </p>
                  </div>
                  <SetupPanel endpoint={endpoint} apiKey={keyForSnippets} onCopy={copyText} />
                </section>
              </div>
            </div>
          </main>

          {showCreate && (
            <CreateKeyModal
              scope={scope}
              org={org}
              canManageOrgKeys={canManageOrgKeys}
              onClose={() => setShowCreate(false)}
              onCreated={handleCreated}
            />
          )}
        </div>
      </SidebarProvider>
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl" onClick={(event) => event.stopPropagation()}>
        <div className="p-5 border-b border-border-light flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Create MCP Key</h2>
            <p className="text-xs text-text-muted mt-1 capitalize">{scope} scope{scope === "organization" && org ? ` for ${org.name}` : ""}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <label className="block">
            <span className="text-xs font-bold text-text-muted uppercase tracking-[0.16em]">Name</span>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Claude desktop"
              className="mt-2 w-full h-11 rounded-lg border border-border-light px-3 text-sm outline-none focus:border-brand"
            />
          </label>

          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-[0.16em] mb-2">Permissions</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                ["read", "Read only"],
                ["selected", "Read/write selected"],
                ["full", "Full access"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setPreset(id as PermissionPreset)}
                  className={cn(
                    "h-10 rounded-lg border text-xs font-bold",
                    preset === id ? "border-brand bg-brand/10 text-brand" : "border-border-light text-text-secondary"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {preset === "selected" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AREAS.map((area) => (
                <label key={area.id} className="flex items-center gap-2 rounded-lg border border-border-light px-3 py-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={areas.includes(area.id)}
                    onChange={(event) => {
                      setAreas((prev) => event.target.checked
                        ? [...prev, area.id]
                        : prev.filter((item) => item !== area.id));
                    }}
                  />
                  {area.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border-light flex justify-end gap-3">
          <button onClick={onClose} className="h-10 px-4 text-sm font-semibold text-text-secondary">Cancel</button>
          <button
            onClick={submit}
            disabled={!name.trim() || saving || (preset === "selected" && areas.length === 0)}
            className="h-10 px-4 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-50"
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
      <div className="px-5 pt-5 pb-3 flex flex-wrap gap-2">
        {snippets.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold border",
              active === item.id ? "border-brand bg-brand/10 text-brand" : "border-border-light text-text-secondary"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="p-5 pt-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs font-bold text-text-muted">{snippet.path}</p>
          <button onClick={() => onCopy(snippet.value, "Snippet copied")} className="h-8 px-3 rounded-lg border border-border-light text-xs font-bold flex items-center gap-2">
            <Copy size={14} />
            Copy
          </button>
        </div>
        <pre className="max-h-[420px] overflow-auto rounded-lg bg-[#111827] p-4 text-xs text-white leading-relaxed">
          <code>{snippet.value}</code>
        </pre>
      </div>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-10 text-center">
      <KeyRound size={32} className="mx-auto text-text-muted mb-3" />
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="text-xs text-text-muted mt-1">{message}</p>
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
