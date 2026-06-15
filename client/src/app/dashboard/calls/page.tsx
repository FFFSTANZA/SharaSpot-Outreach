"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import { useToast } from "@/context/ToastContext";
import { createCallTask, getCallQueue, getContactLists, submitCallDisposition, updateCallTask } from "@/lib/apis";
import { getCurrentOrganization } from "@/lib/apis/organizations";
import type { CallQueueItem, OrgMember } from "@/types";
import type { ContactList } from "@/lib/apis/contactLists";
import { CalendarClock, CheckCircle2, ClipboardList, ExternalLink, PhoneCall, Plus, Search, SkipForward, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Menu, PhoneIncoming, PhoneOutgoing, ArrowDownUp, Building2 } from "lucide-react";
import AddContactModal from "./AddContactModal";
import Link from "next/link";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

const OUTCOMES = ["NO_ANSWER", "CONNECTED", "INTERESTED", "BOOKED_MEETING", "NOT_A_FIT", "DO_NOT_CALL"] as const;
const NEXT_ACTIONS = ["CALL_BACK", "EMAIL_FOLLOW_UP", "SEND_PROPOSAL", "BOOK_MEETING"] as const;
const PIPELINE_STAGES = ["ALL", "PENDING", "FOLLOW_UP_REQUIRED", "INTERESTED", "NOT_INTERESTED", "CONVERTED", "CLOSED"] as const;
type PipelineStage = (typeof PIPELINE_STAGES)[number];

const todayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const formatDueDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const isOverdue = d < today;
  const label = d.toDateString() === today.toDateString() ? "Today" :
    d.toDateString() === tomorrow.toDateString() ? "Tomorrow" : datePart;
  return { label, time: timePart, isOverdue };
};

const toPipelineStage = (task: CallQueueItem): PipelineStage => {
  const d = (task.lastDisposition || task.lastOutcome || "").toUpperCase();
  if (task.status === "SKIPPED" || d === "DO_NOT_CALL") return "CLOSED";
  if (d === "BOOKED_MEETING") return "CONVERTED";
  if (d === "INTERESTED") return "INTERESTED";
  if (d === "NOT_A_FIT") return "NOT_INTERESTED";
  if (d === "NO_ANSWER") return "PENDING";
  if (d || task.status === "COMPLETED") return "FOLLOW_UP_REQUIRED";
  return "PENDING";
};

const stageLabel: Record<PipelineStage, string> = {
  ALL: "All",
  PENDING: "Pending",
  FOLLOW_UP_REQUIRED: "Follow-up",
  INTERESTED: "Interested",
  NOT_INTERESTED: "Not Interested",
  CONVERTED: "Converted",
  CLOSED: "Closed",
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { data?: unknown } }).response?.data &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
  ) {
    return (error as { response?: { data?: { message: string } } }).response!.data!.message;
  }
  return fallback;
};

const getInitials = (task: CallQueueItem) => {
  const f = task.contact.firstName?.[0];
  const l = task.contact.lastName?.[0];
  if (f && l) return `${f}${l}`.toUpperCase();
  if (f) return f.toUpperCase();
  return (task.contact.email?.[0] || "?").toUpperCase();
};

const getDisplayName = (task: CallQueueItem) => {
  return (task.contact.firstName || task.contact.lastName)
    ? `${task.contact.firstName || ""} ${task.contact.lastName || ""}`.trim()
    : task.contact.email;
};

function CallsPageContent() {
  const { addToast } = useToast();
  const { toggle } = useSidebar();

  const [isLoading, setIsLoading] = useState(true);
  const [allTasks, setAllTasks] = useState<CallQueueItem[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilterId, setListFilterId] = useState<string | null>(null);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [assigneeFilterId, setAssigneeFilterId] = useState<string | null>(null);
  const [dueFilter, setDueFilter] = useState<"all" | "today" | "overdue">("all");
  const [stageFilter, setStageFilter] = useState<PipelineStage>("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [quickSchedId, setQuickSchedId] = useState<string | null>(null);
  const [quickSchedDate, setQuickSchedDate] = useState(todayDate());
  const [quickSchedTime, setQuickSchedTime] = useState(nowTime());

  const [outcome, setOutcome] = useState<string>("NO_ANSWER");
  const [nextAction, setNextAction] = useState<string>("CALL_BACK");
  const [note, setNote] = useState("");
  const [nextCallDate, setNextCallDate] = useState(todayDate());
  const [nextCallTime, setNextCallTime] = useState(nowTime());
  const [isSaving, setIsSaving] = useState(false);

  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);

  const fetchData = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await getCallQueue({
        status: "ALL",
        due: dueFilter,
        search: searchQuery || undefined,
        listId: listFilterId || undefined,
        assignedToId: assigneeFilterId || undefined,
        page,
        limit: 50,
      });
      setAllTasks(data.tasks);
      setTotalTasks(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (error: unknown) {
      addToast("error", getApiErrorMessage(error, "Failed to load call workspace"));
    } finally { setIsLoading(false); }
  }, [addToast, searchQuery, listFilterId, assigneeFilterId, dueFilter]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getContactLists();
        setLists(data);
      } catch {
        setLists([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const org = await getCurrentOrganization();
        setMembers(org?.members ?? []);
      } catch {
        setMembers([]);
      }
    })();
  }, []);

  const stageCounts = useMemo(() => {
    const base: Record<PipelineStage, number> = { ALL: allTasks.length, PENDING: 0, FOLLOW_UP_REQUIRED: 0, INTERESTED: 0, NOT_INTERESTED: 0, CONVERTED: 0, CLOSED: 0 };
    for (const t of allTasks) base[toPipelineStage(t)] += 1;
    return base;
  }, [allTasks]);

  const tasks = useMemo(() => {
    if (stageFilter === "ALL") return allTasks;
    return allTasks.filter((t) => toPipelineStage(t) === stageFilter);
  }, [allTasks, stageFilter]);

  useEffect(() => {
    if (tasks.length > 0 && !tasks.some((t) => t.id === selectedTaskId)) setSelectedTaskId(tasks[0].id);
    if (tasks.length === 0) setSelectedTaskId(null);
  }, [tasks, selectedTaskId]);

  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) || null, [tasks, selectedTaskId]);

  const handleLogCall = async () => {
    if (!selectedTask) return;
    const isTerminal = outcome === "NOT_A_FIT" || outcome === "DO_NOT_CALL";
    if (!isTerminal && !nextAction) { addToast("warning", "Next action is required"); return; }
    setIsSaving(true);
    try {
      await submitCallDisposition({
        contactId: selectedTask.contactId,
        taskId: selectedTask.id,
        outcome,
        note,
        nextAction: isTerminal ? undefined : nextAction,
        nextCallAt: isTerminal ? undefined : `${nextCallDate}T${nextCallTime}`,
      });
      const name = getDisplayName(selectedTask);
      setOutcome("NO_ANSWER"); setNextAction("CALL_BACK"); setNote("");
      setNextCallDate(todayDate()); setNextCallTime(nowTime());
      addToast("success", `${outcome} logged for ${name}${isTerminal ? " — no further call tasks" : ""}`);
      await fetchData(currentPage);
    } catch (error: unknown) {
      addToast("error", getApiErrorMessage(error, "Failed to save call log"));
    } finally { setIsSaving(false); }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    setSearchQuery(e.target.value);
  };

  const handleListFilterChange = (value: string) => {
    setCurrentPage(1);
    setListFilterId(value || null);
  };

  const handleAssigneeFilterChange = (value: string) => {
    setCurrentPage(1);
    setAssigneeFilterId(value || null);
  };

  const handleDueFilterChange = (value: "all" | "today" | "overdue") => {
    setCurrentPage(1);
    setDueFilter(value);
  };

  const handleQuickSchedule = async (task: CallQueueItem) => {
    try {
      const effectiveListId = listFilterId && listFilterId !== "__none" ? listFilterId : undefined;
      const result = await createCallTask({
        contactId: task.contactId,
        dueAt: `${quickSchedDate}T${quickSchedTime}`,
        contactListId: effectiveListId,
      });
      const name = getDisplayName(task);
      const dueLabel = formatDueDate(`${quickSchedDate}T${quickSchedTime}`);
      addToast("success", `Follow-up for ${name} scheduled for ${dueLabel.label} at ${dueLabel.time}`);
      setQuickSchedId(null);
      await fetchData(currentPage);
      if (result?.id) setSelectedTaskId(result.id);
    } catch (error: unknown) {
      addToast("error", getApiErrorMessage(error, "Failed to schedule call"));
    }
  };

  const handleAssigneeChange = async (task: CallQueueItem, assignedToId: string) => {
    try {
      const updated = await updateCallTask(task.id, { assignedToId: assignedToId || null });
      setAllTasks((current) => current.map((item) => item.id === task.id ? { ...item, ...updated } : item));
      addToast("success", assignedToId ? "Call owner updated" : "Call owner cleared");
    } catch (error: unknown) {
      addToast("error", getApiErrorMessage(error, "Failed to update call owner"));
    }
  };

  const isTerminal = outcome === "NOT_A_FIT" || outcome === "DO_NOT_CALL";

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
                    <AuthGuard requirePremium={true}>
      <ErrorBoundary>
        <div className="flex-1 flex min-w-0 overflow-hidden">
          <div className="mx-auto w-full max-w-[1600px] flex grow flex-col overflow-hidden rounded-lg border border-border-light bg-white">
              {/* Header */}
              <div className="shrink-0 border-b border-border-light px-4 py-3 sm:px-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggle}
                        aria-label="Open sidebar"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] lg:hidden"
                      >
                        <Menu size={14} />
                      </button>
                      <h1 className="text-base font-semibold text-text-primary">Calls</h1>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="flex h-7 items-center gap-1.5 rounded-md bg-brand px-2.5 text-xs font-medium text-white transition-all hover:bg-brand/90"
                      >
                        <Plus size={12} />
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Search + filter toggle */}
                  <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                      <input
                        type="text"
                        placeholder="Search contacts in queue..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        aria-label="Search contacts"
                        className="w-full rounded-lg border border-border-light bg-[#F8F9FA] py-1.5 pl-8 pr-2.5 text-sm outline-none transition-all focus:border-brand/30 focus:bg-white focus:ring-2 focus:ring-brand/10"
                      />
                    </div>
                    <button
                      onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                      className={cn("flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all", isFiltersCollapsed ? "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary" : "bg-brand-light text-brand")}
                    >
                      <ChevronDown size={12} className={cn("transition-transform", !isFiltersCollapsed && "rotate-180")} />
                      Filters
                    </button>
                  </div>

                  {/* Pipeline stages + expanded filters */}
                  {!isFiltersCollapsed && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Stage</span>
                        <div className="flex items-center gap-0.5">
                          {PIPELINE_STAGES.map((stage) => (
                            <button
                              key={stage}
                              onClick={() => setStageFilter(stage)}
                              className={cn("h-7 rounded-md px-2 font-medium transition-all", stageFilter === stage ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary")}
                            >
                              {stageLabel[stage]}
                              {stageCounts[stage] > 0 && (
                                <span className={cn("ml-1", stageFilter === stage ? "text-brand" : "text-text-muted")}>{stageCounts[stage]}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-4 w-px bg-border-light" />

                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">List</span>
                        <select
                          value={listFilterId || ""}
                          onChange={(e) => handleListFilterChange(e.target.value)}
                          className="h-7 rounded-md bg-[#F8F9FA] px-2 text-xs text-text-secondary outline-none"
                        >
                          <option value="">All Lists</option>
                          <option value="__none">No List</option>
                          {lists.map((list) => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Owner</span>
                        <select
                          value={assigneeFilterId || ""}
                          onChange={(e) => handleAssigneeFilterChange(e.target.value)}
                          className="h-7 rounded-md bg-[#F8F9FA] px-2 text-xs text-text-secondary outline-none"
                        >
                          <option value="">All Owners</option>
                          <option value="__unassigned">Unassigned</option>
                          {members.map((member) => (
                            <option key={member.userId} value={member.userId}>{member.name || member.email}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Due</span>
                        <div className="flex items-center gap-0.5">
                          {(["today", "overdue", "all"] as const).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleDueFilterChange(opt)}
                              className={cn("h-7 rounded-md px-2 font-medium transition-all", dueFilter === opt ? "bg-brand-light text-brand" : "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary")}
                            >
                              {opt === "today" ? "Today" : opt === "overdue" ? "Overdue" : "All"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Body: list + detail */}
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center"><InlineLoader /></div>
              ) : (
                <div className="flex-1 flex min-w-0 overflow-hidden">
                  {/* Task List */}
                  <div className={cn(
                    "overflow-y-auto border-r border-border-light bg-white",
                    selectedTask ? "hidden min-[1180px]:block min-[1180px]:w-[420px]" : "flex-1"
                  )}>
                    {tasks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <ClipboardList className="text-text-muted mb-3" size={24} />
                        <p className="text-sm font-semibold text-text-secondary">
                          {stageFilter === "ALL" && dueFilter === "all" && "No call tasks yet. Add a contact to get started."}
                          {stageFilter === "ALL" && dueFilter === "today" && "No calls due today. Try 'All Due Dates'."}
                          {stageFilter === "ALL" && dueFilter === "overdue" && "No overdue calls. Great job!"}
                          {stageFilter !== "ALL" && `No tasks in ${stageLabel[stageFilter].toLowerCase()} stage.`}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-light bg-white px-4 py-2.5 sm:px-6">
                          <span className="text-xs font-medium text-text-secondary">{tasks.length} task{tasks.length === 1 ? "" : "s"}</span>
                          <span className="text-xs text-text-muted">{totalTasks} total</span>
                        </div>
                        <div className="divide-y divide-border-light">
                          {tasks.map((task) => {
                            const name = getDisplayName(task);
                            const due = formatDueDate(task.dueAt);
                            return (
                              <div
                                key={task.id}
                                onClick={() => setSelectedTaskId(task.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedTaskId(task.id); }}
                                className={cn(
                                  "group flex items-center gap-2 border-l-2 bg-white px-4 py-2.5 transition-all sm:px-6",
                                  selectedTaskId === task.id
                                    ? "border-l-brand bg-brand-light/40"
                                    : "border-l-transparent hover:bg-[#F8F9FA]"
                                )}
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-muted/40 text-[11px] font-semibold text-brand">
                                  {getInitials(task)}
                                </div>
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <div className="min-w-0 flex-[3]">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate text-sm font-medium text-text-primary">{name}</span>
                                      {task.status === "PENDING" && (
                                        <span className="shrink-0 rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                                          {due.isOverdue ? "Overdue" : "Pending"}
                                        </span>
                                      )}
                                      {task.status !== "PENDING" && (
                                        <span className="shrink-0 rounded bg-brand-light px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                          Done
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
                                      <span className="truncate">{task.contact.company || "No company"}</span>
                                      <span className="shrink-0">·</span>
                                      <span className={cn("truncate", due.isOverdue ? "text-error-text font-medium" : "")}>
                                        Due {due.label}, {due.time}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {task.status === "PENDING" && (
                                      <div className="relative">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setQuickSchedId(quickSchedId === task.id ? null : task.id); setQuickSchedDate(todayDate()); setQuickSchedTime(nowTime()); }}
                                          className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] hover:text-brand"
                                          title="Schedule follow-up"
                                        >
                                          <CalendarClock size={11} />
                                        </button>
                                        {quickSchedId === task.id && (
                                          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border-light rounded-lg shadow-premium-md p-3 w-56" onClick={(e) => e.stopPropagation()}>
                                            <div className="text-xs font-semibold text-text-primary mb-2">Schedule Follow-up</div>
                                            <div className="flex flex-col gap-1.5 mb-2">
                                              <input type="date" value={quickSchedDate} onChange={(e) => setQuickSchedDate(e.target.value)}
                                                className="h-7 rounded-md border border-border-light px-2 text-xs" />
                                              <input type="time" value={quickSchedTime} onChange={(e) => setQuickSchedTime(e.target.value)}
                                                className="h-7 rounded-md border border-border-light px-2 text-xs" />
                                            </div>
                                            <div className="flex gap-1.5">
                                              <button onClick={() => setQuickSchedId(null)}
                                                className="flex-1 h-7 rounded-md border border-border-light text-xs font-medium text-text-secondary hover:bg-[#F0F1F3]">Cancel</button>
                                              <button onClick={() => handleQuickSchedule(task)}
                                                className="flex-1 h-7 rounded-md bg-brand text-white text-xs font-medium hover:bg-brand/90">Schedule</button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {task.assignedTo && (
                                      <span className="flex h-6 items-center px-1.5 text-[10px] text-text-muted">{task.assignedTo.name || task.assignedTo.email}</span>
                                    )}
                                  </div>

                                  <ChevronRight size={14} className="shrink-0 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between border-t border-border-light bg-white px-4 py-2 sm:px-6 shrink-0">
                            <span className="text-xs text-text-muted">{tasks.length} of {totalTasks} tasks</span>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => goToPage(1)}
                                disabled={currentPage <= 1}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronsLeft size={13} />
                              </button>
                              <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronLeft size={13} />
                              </button>
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                                const p = start + i;
                                if (p > totalPages) return null;
                                return (
                                  <button
                                    key={p}
                                    onClick={() => goToPage(p)}
                                    className={cn(
                                      "flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium",
                                      p === currentPage
                                        ? "bg-brand-light text-brand"
                                        : "text-text-muted hover:bg-[#F0F1F3] hover:text-text-secondary"
                                    )}
                                  >
                                    {p}
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronRight size={13} />
                              </button>
                              <button
                                onClick={() => goToPage(totalPages)}
                                disabled={currentPage >= totalPages}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronsRight size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Detail Panel */}
                  <div className={cn(
                    "flex-1 min-w-0 overflow-y-auto custom-scrollbar",
                    selectedTask ? "flex" : "hidden min-[1180px]:flex"
                  )}>
                    {!selectedTask ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-sm">
                        <PhoneCall size={32} className="text-text-muted mb-3" />
                        Select a task to log its outcome
                      </div>
                    ) : (
                      <div className="flex flex-col w-full">
                        {/* Detail Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border-light bg-white px-4 py-2.5 shrink-0">
                          <h2 className="text-sm font-semibold text-text-primary">Call</h2>
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/dashboard/prm?search=${encodeURIComponent(selectedTask.contact.email)}`}
                              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-secondary"
                            >
                              <ExternalLink size={12} />
                              Profile
                            </Link>
                            <button
                              onClick={() => setSelectedTaskId(null)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] min-[1180px]:hidden"
                              aria-label="Back to tasks"
                            >
                              <ChevronLeft size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Contact Card */}
                        <div className="border-b border-border-light p-4 sm:p-5">
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-muted/40 text-sm font-semibold text-brand">
                              {getInitials(selectedTask)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={cn(
                                  "rounded px-2 py-0.5 text-[11px] font-medium",
                                  selectedTask.status === "PENDING" ? "bg-[#F0F1F3] text-text-secondary" : selectedTask.status === "SKIPPED" ? "bg-error-bg text-error-text" : "bg-brand-light text-brand"
                                )}>
                                  {selectedTask.status === "PENDING" ? "Pending" : selectedTask.status === "SKIPPED" ? "Skipped" : "Completed"}
                                </span>
                              </div>
                              <div className="mt-2 flex items-start justify-between gap-3">
                                <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight text-text-primary">
                                  {getDisplayName(selectedTask)}
                                </h1>
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-text-muted">
                                <Building2 size={14} />
                                <span className="text-sm">{selectedTask.contact.company || "No company"}</span>
                              </div>
                              {selectedTask.contact.phone && (
                                <div className="mt-1 flex items-center gap-2 text-text-muted">
                                  <PhoneCall size={14} />
                                  <a href={`tel:${selectedTask.contact.phone}`} className="text-sm text-brand hover:underline">{selectedTask.contact.phone}</a>
                                </div>
                              )}
                              <div className="mt-3 grid gap-x-3 gap-y-2 sm:grid-cols-2">
                                <div>
                                  <div className="text-[11px] font-medium text-text-muted">Call owner</div>
                                  <select
                                    value={selectedTask.assignedToId || ""}
                                    onChange={(e) => handleAssigneeChange(selectedTask, e.target.value)}
                                    className="mt-0.5 h-7 w-full rounded-md bg-[#F8F9FA] px-2 text-sm font-medium text-text-primary outline-none"
                                  >
                                    <option value="">Unassigned</option>
                                    {members.map((member) => (
                                      <option key={member.userId} value={member.userId}>{member.name || member.email}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <div className="text-[11px] font-medium text-text-muted">Due</div>
                                  <div className={cn("mt-0.5 text-sm font-medium", selectedTask.dueAt && formatDueDate(selectedTask.dueAt).isOverdue ? "text-error-text" : "text-text-primary")}>
                                    {selectedTask.dueAt ? (() => {
                                      const due = formatDueDate(selectedTask.dueAt);
                                      return `${due.label}, ${due.time}`;
                                    })() : "No due date"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stats Strip */}
                        <div className="flex border-b border-border-light">
                          {[
                            { label: "Outcome", value: selectedTask.lastOutcome || "—", icon: PhoneIncoming },
                            { label: "Disposition", value: selectedTask.lastDisposition || "—", icon: ArrowDownUp },
                            { label: "Status", value: selectedTask.status === "PENDING" ? "Active" : "Done", icon: PhoneOutgoing },
                          ].map((stat) => (
                            <div key={stat.label} className="flex-1 border-r border-border-light last:border-r-0 py-3 text-center transition-colors hover:bg-[#F8F9FA]">
                              <div className="flex items-center justify-center gap-1 text-lg font-semibold text-text-primary">
                                <stat.icon size={13} className="text-text-muted" />
                                <span className="truncate max-w-[80px]">{String(stat.value)}</span>
                              </div>
                              <div className="text-[10px] font-medium text-text-muted mt-0.5">{stat.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Log Call Outcome */}
                        <div className="p-4 sm:p-5">
                          <div className="rounded-lg border border-border-light bg-white">
                            <div className="px-4 py-3 border-b border-border-light">
                              <h3 className="text-sm font-semibold text-text-primary">Log Call Outcome</h3>
                            </div>
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[11px] font-medium text-text-muted">Outcome</label>
                                  <select value={outcome} onChange={(e) => setOutcome(e.target.value)}
                                    className="mt-1 h-7 w-full rounded-md border border-border-light bg-[#F8F9FA] px-2 text-xs text-text-primary outline-none focus:border-brand/30 focus:bg-white">
                                    {OUTCOMES.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[11px] font-medium text-text-muted">Next action</label>
                                  <select value={nextAction} onChange={(e) => setNextAction(e.target.value)} disabled={isTerminal}
                                    className="mt-1 h-7 w-full rounded-md border border-border-light bg-[#F8F9FA] px-2 text-xs text-text-primary outline-none focus:border-brand/30 focus:bg-white disabled:opacity-50">
                                    {NEXT_ACTIONS.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
                                  </select>
                                </div>
                              </div>
                              {!isTerminal && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[11px] font-medium text-text-muted">Next call date</label>
                                    <input type="date" value={nextCallDate} onChange={(e) => setNextCallDate(e.target.value)}
                                      className="mt-1 h-7 w-full rounded-md border border-border-light bg-[#F8F9FA] px-2 text-xs outline-none focus:border-brand/30 focus:bg-white" />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-medium text-text-muted">Next call time</label>
                                    <input type="time" value={nextCallTime} onChange={(e) => setNextCallTime(e.target.value)}
                                      className="mt-1 h-7 w-full rounded-md border border-border-light bg-[#F8F9FA] px-2 text-xs outline-none focus:border-brand/30 focus:bg-white" />
                                  </div>
                                </div>
                              )}
                              <div>
                                <label className="text-[11px] font-medium text-text-muted">Call note</label>
                                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                                  className="mt-1 w-full rounded-md border border-border-light bg-[#F8F9FA] px-3 py-2 text-xs outline-none focus:border-brand/30 focus:bg-white focus:ring-2 focus:ring-brand/10"
                                  placeholder="What happened? objections, context, next commitment..."
                                />
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button onClick={handleLogCall} disabled={isSaving}
                                  className="h-7 px-3 rounded-md bg-brand text-white text-xs font-semibold hover:bg-brand/90 disabled:opacity-60 inline-flex items-center gap-1.5">
                                  <CheckCircle2 size={12} />
                                  Save Outcome
                                </button>
                                {isTerminal && (
                                  <span className="text-[11px] text-text-muted inline-flex items-center gap-1">
                                    <SkipForward size={11} />
                                    This will close future call tasking.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

          {showAddModal && (
            <AddContactModal listFilterId={listFilterId} onClose={() => setShowAddModal(false)} onSuccess={() => fetchData(currentPage)} />
          )}
      </ErrorBoundary>
    </AuthGuard>
  );
}

export default function CallsPage() {
  return <CallsPageContent />;
}
