import { create } from "zustand";
import type { ComposeFormData, SequenceStepInput } from "@/types";

interface Signature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

const initialData: ComposeFormData = {
  from: "",
  selectedSenderIds: [],
  to: [],
  cc: [],
  bcc: [],
  replyTo: "",
  subject: "",
  body: "",
  delayBetweenEmails: 30,
  hourlyLimit: 50,
  selectedRecipients: new Set(),
  attachments: [],
  scheduleDate: null,
};

interface ComposeStore {
  data: ComposeFormData;
  signatures: Signature[];
  selectedSignatureId: string;
  editingSignature: Signature | null;
  trackOpens: boolean;
  trackClicks: boolean;
  priorityEnabled: boolean;
  recipientColumnData: Record<string, Record<string, string>>;
  sequenceSteps: SequenceStepInput[];
  errors: Record<string, string>;
  submitError: string | null;
  csvMessage: string | null;
  csvError: string | null;

  setData: (data: ComposeFormData) => void;
  patchData: (partial: Partial<ComposeFormData>) => void;
  updateData: (fn: (prev: ComposeFormData) => ComposeFormData) => void;
  setSignatures: (signatures: Signature[]) => void;
  setSelectedSignatureId: (id: string) => void;
  setEditingSignature: (sig: Signature | null) => void;
  setTrackOpens: (v: boolean) => void;
  setTrackClicks: (v: boolean) => void;
  setPriorityEnabled: (v: boolean) => void;
  setRecipientColumnData: (data: Record<string, Record<string, string>>) => void;
  setSequenceSteps: (steps: SequenceStepInput[]) => void;
  setErrors: (errors: Record<string, string>) => void;
  updateErrors: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  setSubmitError: (error: string | null) => void;
  setCsvMessage: (msg: string | null) => void;
  setCsvError: (msg: string | null) => void;
  reset: () => void;
}

export const useComposeStore = create<ComposeStore>()((set) => ({
  data: { ...initialData },
  signatures: [{ id: "default", name: "Default", content: "", isDefault: true }],
  selectedSignatureId: "default",
  editingSignature: null,
  trackOpens: true,
  trackClicks: true,
  priorityEnabled: false,
  recipientColumnData: {},
  sequenceSteps: [],
  errors: {},
  submitError: null,
  csvMessage: null,
  csvError: null,

  setData: (data) => set({ data }),
  patchData: (partial) => set((state) => ({ data: { ...state.data, ...partial } })),
  updateData: (fn) => set((state) => ({ data: fn(state.data) })),
  setSignatures: (signatures) => set({ signatures }),
  setSelectedSignatureId: (id) => set({ selectedSignatureId: id }),
  setEditingSignature: (sig) => set({ editingSignature: sig }),
  setTrackOpens: (v) => set({ trackOpens: v }),
  setTrackClicks: (v) => set({ trackClicks: v }),
  setPriorityEnabled: (v) => set({ priorityEnabled: v }),
  setRecipientColumnData: (data) => set({ recipientColumnData: data }),
  setSequenceSteps: (steps) => set({ sequenceSteps: steps }),
  setErrors: (errors) => set({ errors }),
  updateErrors: (fn) => set((state) => ({ errors: fn(state.errors) })),
  setSubmitError: (error) => set({ submitError: error }),
  setCsvMessage: (msg) => set({ csvMessage: msg }),
  setCsvError: (msg) => set({ csvError: msg }),
  reset: () =>
    set({
      data: { ...initialData },
      errors: {},
      submitError: null,
      csvMessage: null,
      csvError: null,
    }),
}));
