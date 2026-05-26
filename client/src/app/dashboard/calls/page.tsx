"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "../Sidebar";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { createCallTask, getCallQueue, getContactLists, submitCallDisposition } from "@/lib/apis";
import type { CallQueueItem } from "@/types";
import type { ContactList } from "@/lib/apis/contactLists";
import { CalendarClock, CheckCircle2, ClipboardList, ExternalLink, PhoneCall, Plus, Search, SkipForward, ChevronLeft, ChevronRight } from "lucide-react";
import AddContactModal from "./AddContactModal";
import Link from "next/link";

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

const DueBadge = ({ dueAt }: { dueAt: string }) => {
  const due = formatDueDate(dueAt);
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${due.isOverdue ? "border-red-200 text-red-600 bg-red-50" : "border-border-light text-text-secondary"}`}>
      <CalendarClock size={14} /> Due {due.label}, {due.time}
    </span>
  );
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

export default function CallsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [allTasks, setAllTasks] = useState<CallQueueItem[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilterId, setListFilterId] = useState<string | null>(null);
  const [lists, setLists] = useState<ContactList[]>([]);
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

  const fetchData = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await getCallQueue({
        status: "ALL",
        due: dueFilter,
        search: searchQuery || undefined,
        listId: listFilterId || undefined,
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
  }, [addToast, searchQuery, listFilterId, dueFilter]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setCurrentPage(1);
    fetchData(1);
  }, [searchQuery, listFilterId, dueFilter, fetchData]);

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
      const name = (selectedTask.contact.firstName || selectedTask.contact.lastName) ? `${selectedTask.contact.firstName || ""} ${selectedTask.contact.lastName || ""}`.trim() : selectedTask.contact.email;
      setOutcome("NO_ANSWER"); setNextAction("CALL_BACK"); setNote("");
      setNextCallDate(todayDate()); setNextCallTime(nowTime());
      addToast("success", `${outcome} logged for ${name}${isTerminal ? " — no further call tasks" : ""}`);
      await fetchData(currentPage);
    } catch (error: unknown) {
      addToast("error", getApiErrorMessage(error, "Failed to save call log"));
    } finally { setIsSaving(false); }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleQuickSchedule = async (task: CallQueueItem) => {
    try {
      const effectiveListId = listFilterId && listFilterId !== "__none" ? listFilterId : undefined;
      const result = await createCallTask({
        contactId: task.contactId,
        dueAt: `${quickSchedDate}T${quickSchedTime}`,
        contactListId: effectiveListId,
      });
      const name = (task.contact.firstName || task.contact.lastName) ? `${task.contact.firstName || ""} ${task.contact.lastName || ""}`.trim() : task.contact.email;
      const dueLabel = formatDueDate(`${quickSchedDate}T${quickSchedTime}`);
      addToast("success", `Follow-up for ${name} scheduled for ${dueLabel.label} at ${dueLabel.time}`);
      setQuickSchedId(null);
      await fetchData(currentPage);
      if (result?.id) setSelectedTaskId(result.id);
    } catch (error: unknown) {
      addToast("error", getApiErrorMessage(error, "Failed to schedule call"));
    }
  };

  const isTerminal = outcome === "NOT_A_FIT" || outcome === "DO_NOT_CALL";

  return (
    <AuthGuard>
      <ErrorBoundary>
        <SidebarProvider>
          <div className="flex h-screen bg-[#F8FAFC] font-sans">
            <Sidebar currentLabel="Calls" setLabel={() => {}} profile={{ name: user?.name ?? "Outreach Pro", email: user?.email ?? "", avatarUrl: user?.avatarUrl ?? "" }} />

            <main className="flex-1 min-w-0 overflow-hidden pt-4 px-4">
              <div className="bg-white rounded-2xl border border-border-light shadow-card flex flex-col h-full overflow-hidden">
                <div className="px-6 py-4 border-b border-border-light bg-white flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Calls</h1>
                    <p className="text-sm text-text-muted font-medium">Track call progress with a structured pipeline and clear follow-ups.</p>
                  </div>
                  <button onClick={() => setShowAddModal(true)} className="h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90 inline-flex items-center gap-2 shrink-0"><Plus size={15} /> Add Contact</button>
                </div>

                <div className="px-6 py-3 border-b border-border-light bg-background/50 flex flex-wrap items-center gap-2">
                  {PIPELINE_STAGES.map((stage) => (
                    <button key={stage} onClick={() => setStageFilter(stage)}
                      className={`h-8 px-3 rounded-lg border text-xs font-semibold ${stageFilter === stage ? "bg-brand text-white border-brand" : "bg-white border-border-light text-text-secondary"}`}>
                      {stageLabel[stage]} ({stageCounts[stage]})
                    </button>
                  ))}
                </div>

                <div className="px-6 py-3 border-b border-border-light bg-background/40 flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search contacts in queue..." value={searchQuery} onChange={handleSearchChange} aria-label="Search contacts" className="w-full pl-9 pr-3 h-9 bg-white border border-border-light rounded-lg text-sm outline-none focus:border-brand-muted transition-all" />
                  </div>
                  <select value={listFilterId || ""} onChange={(e) => setListFilterId(e.target.value || null)} className="h-9 rounded-lg border border-border-light px-3 text-sm">
                    <option value="">All Lists</option>
                    <option value="__none">No List</option>
                    {lists.map((list) => (
                      <option key={list.id} value={list.id}>{list.name}</option>
                    ))}
                  </select>
                  <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value as "all" | "today" | "overdue")} className="h-9 rounded-lg border border-border-light px-3 text-sm">
                    <option value="today">Due Today</option>
                    <option value="overdue">Overdue</option>
                    <option value="all">All Due Dates</option>
                  </select>
                </div>

                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center"><InlineLoader /></div>
                ) : (
                  <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3">
                    <div className="border-r border-border-light overflow-y-auto">
                      {tasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <ClipboardList className="text-text-muted mb-3" />
                          <p className="text-sm font-semibold text-text-secondary">
                            {stageFilter === "ALL" && dueFilter === "all" && "No call tasks yet. Add a contact to get started."}
                            {stageFilter === "ALL" && dueFilter === "today" && "No calls due today. Try 'All Due Dates'."}
                            {stageFilter === "ALL" && dueFilter === "overdue" && "No overdue calls. Great job!"}
                            {stageFilter !== "ALL" && `No tasks in ${stageLabel[stageFilter].toLowerCase()} stage.`}
                          </p>
                        </div>
                      ) : (
                        <>
                          {tasks.map((task) => {
                            const name = (task.contact.firstName || task.contact.lastName) ? `${task.contact.firstName || ""} ${task.contact.lastName || ""}`.trim() : task.contact.email;
                            const due = formatDueDate(task.dueAt);
                            return (
                              <div key={task.id} onClick={() => setSelectedTaskId(task.id)} role="button" tabIndex={0}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedTaskId(task.id); }}
                                className={`w-full text-left px-5 py-4 border-b border-border-light hover:bg-interactive-hover/40 ${selectedTaskId === task.id ? "bg-brand/5" : ""}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="text-sm font-bold text-text-primary truncate">{name}</div>
                                    <div className="text-xs text-text-muted truncate">{task.contact.company || "No company"}</div>
                                    <div className={`mt-1 flex items-center gap-2 text-[11px] ${due.isOverdue ? "text-red-500 font-semibold" : "text-text-secondary"}`}>
                                      <CalendarClock size={11} /> {due.isOverdue ? "Overdue — " : ""}Due {due.label}, {due.time}
                                    </div>
                                  </div>
                                  {task.status === "PENDING" && (
                                    <div className="relative shrink-0">
                                      <button onClick={(e) => { e.stopPropagation(); setQuickSchedId(quickSchedId === task.id ? null : task.id); setQuickSchedDate(todayDate()); setQuickSchedTime(nowTime()); }}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border-light text-xs font-semibold text-text-secondary hover:bg-brand/5 hover:text-brand hover:border-brand/30 transition-all">
                                        <CalendarClock size={13} /> Follow-up
                                      </button>
                                      {quickSchedId === task.id && (
                                        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border-light rounded-xl shadow-lg p-3 w-64" onClick={(e) => e.stopPropagation()}>
                                          <div className="text-xs font-bold text-text-primary mb-2">Schedule Follow-up</div>
                                          <div className="flex gap-2 mb-2">
                                            <input type="date" value={quickSchedDate} onChange={(e) => setQuickSchedDate(e.target.value)}
                                              className="flex-1 h-8 rounded-lg border border-border-light px-2 text-xs" />
                                            <input type="time" value={quickSchedTime} onChange={(e) => setQuickSchedTime(e.target.value)}
                                              className="flex-1 h-8 rounded-lg border border-border-light px-2 text-xs" />
                                          </div>
                                          <div className="flex gap-2">
                                            <button onClick={() => setQuickSchedId(null)}
                                              className="flex-1 h-8 rounded-lg border border-border-light text-xs font-semibold text-text-secondary hover:bg-gray-50">Cancel</button>
                                            <button onClick={() => handleQuickSchedule(task)}
                                              className="flex-1 h-8 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand/90">Schedule</button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <div className="px-4 py-3 flex items-center justify-between border-t border-border-light bg-gray-50/50">
                            <span className="text-xs text-text-muted">{tasks.length} of {totalTasks} tasks</span>
                            {totalPages > 1 && (
                              <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronLeft size={16} /></button>
                                <span className="px-2 text-xs font-semibold text-text-secondary">{currentPage} / {totalPages}</span>
                                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronRight size={16} /></button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="lg:col-span-2 overflow-y-auto p-6">
                      {!selectedTask ? (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm">
                          <ClipboardList size={32} className="text-gray-200 mb-3" />
                          Select a task to log its outcome
                        </div>
                      ) : (
                        <div className="space-y-5 max-w-2xl">
                          <div className="rounded-xl border border-border-light p-4 bg-background/40">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-lg font-bold text-text-primary">{(selectedTask.contact.firstName || selectedTask.contact.lastName) ? `${selectedTask.contact.firstName || ""} ${selectedTask.contact.lastName || ""}`.trim() : selectedTask.contact.email}</div>
                                <div className="text-sm text-text-secondary">{selectedTask.contact.company || "No company"}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Link href={`/dashboard/prm?search=${encodeURIComponent(selectedTask.contact.email)}`}
                                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase text-brand hover:bg-brand/5 border border-brand/20 transition-all">
                                  <ExternalLink size={12} /> Profile
                                </Link>
                                <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${selectedTask.status === "PENDING" ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"}`}>{selectedTask.status}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <a href={selectedTask.contact.phone ? `tel:${selectedTask.contact.phone}` : "#"} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border ${selectedTask.contact.phone ? "border-brand/30 text-brand hover:bg-brand/5" : "border-border-light text-text-muted pointer-events-none"}`}>
                                <PhoneCall size={14} /> {selectedTask.contact.phone || "No phone"}
                              </a>
                              <DueBadge dueAt={selectedTask.dueAt} />
                              {selectedTask.lastOutcome && (
                                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-border-light text-text-secondary">Last: {selectedTask.lastOutcome}</span>
                              )}
                            </div>
                          </div>

                          <div className="rounded-xl border border-border-light p-4 space-y-4">
                            <h2 className="font-bold text-text-primary">Log Call Outcome</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-text-muted uppercase">Outcome</label>
                                <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-border-light px-3 text-sm">
                                  {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-text-muted uppercase">Next Action</label>
                                <select value={nextAction} onChange={(e) => setNextAction(e.target.value)} disabled={isTerminal} className="mt-1 w-full h-10 rounded-lg border border-border-light px-3 text-sm disabled:bg-gray-100">
                                  {NEXT_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-text-muted uppercase">Next Call Date</label>
                                <input type="date" value={nextCallDate} onChange={(e) => setNextCallDate(e.target.value)} disabled={isTerminal} className="mt-1 w-full h-10 rounded-lg border border-border-light px-3 text-sm disabled:bg-gray-100" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-text-muted uppercase">Next Call Time</label>
                                <input type="time" value={nextCallTime} onChange={(e) => setNextCallTime(e.target.value)} disabled={isTerminal} className="mt-1 w-full h-10 rounded-lg border border-border-light px-3 text-sm disabled:bg-gray-100" />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-text-muted uppercase">Call Note</label>
                              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-border-light px-3 py-2 text-sm" placeholder="What happened on the call? objections, context, next commitment..." />
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={handleLogCall} disabled={isSaving} className="h-10 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90 disabled:opacity-60 inline-flex items-center gap-2"><CheckCircle2 size={14} /> Save Outcome</button>
                              {isTerminal && <span className="text-xs text-text-muted inline-flex items-center gap-1"><SkipForward size={12} /> This will close future call tasking for this contact.</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </main>

            {showAddModal && (
              <AddContactModal listFilterId={listFilterId} onClose={() => setShowAddModal(false)} onSuccess={() => fetchData()} />
            )}
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  );
}
