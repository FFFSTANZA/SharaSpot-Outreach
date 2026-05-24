// ─── Backend Response Types ───
// These match the exact shapes returned by the backend API endpoints.

// GET /users response — the authenticated user's profile
export interface User {
  id: string;
  googleId?: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isPremium: boolean;
  callingEnabled?: boolean;
  activeOrganizationId?: string | null;
  createdAt: string;
}

// GET /senders response — sender account (appPassword excluded by backend)
export interface SenderResponse {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  isVerified: boolean;
  dailyLimit: number;
  currentDailyCount?: number;
  smtpHost: string;
  smtpPort: number;
  providerKey?: "gmail" | "outlook" | "zoho" | "yahoo" | "custom";
  replyTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

// POST /senders request body — payload for creating a new sender
export interface CreateSenderPayload {
  name: string;
  email: string;
  appPassword: string;
  smtpHost?: string;
  smtpPort?: number;
  providerKey?: "gmail" | "outlook" | "zoho" | "yahoo" | "custom";
  replyTo?: string;
  skipWarmup?: boolean;
}

// POST /campaigns request body — payload for creating a new campaign
export interface CreateCampaignPayload {
  senderIds?: string[];
  senderId?: string;
  subject: string;
  body: string;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  emails: (string | { email: string; columnData?: Record<string, string> })[];
  ccEmails?: string[];
  bccEmails?: string[];
  replyTo?: string;
  attachments?: UploadedAttachment[];
  steps?: SequenceStepInputForApi[];
  trackOpens?: boolean;
  trackClicks?: boolean;
  timezone?: string;
  businessStartHour?: number | null;
  businessEndHour?: number | null;
  isPriority?: boolean;
}

// Serialized version of SequenceStepInput for API requests (condition as string, not object)
export interface SequenceStepInputForApi {
  subject: string;
  body: string;
  waitDays: number;
  condition?: SequenceConditionType;
}

// POST /attachments/upload response item — metadata for an uploaded file
export interface UploadedAttachment {
  url: string;        // Cloudflare R2 public URL
  filename: string;   // Original filename
  size: number;       // File size in bytes
  mimeType: string;   // MIME type (e.g., "application/pdf")
}

// GET /campaigns response item — campaign with nested sender info
export interface Campaign {
  id: string;
  subject: string;
  body: string;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  totalRecipients: number;
  status: "SCHEDULED" | "SENDING" | "PAUSED" | "CANCELLED" | "COMPLETED";
  pauseReason?: string | null;
  timezone: string;
  businessStartHour: number | null;
  businessEndHour: number | null;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    name: string | null;
    isVerified: boolean;
  };
  emailCounts?: {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
    cancelled: number;
  };
}

// Campaign detail with email jobs and status counts
export interface CampaignDetail extends Campaign {
  emails: (EmailJob & { sender?: { id: string; email: string; name: string | null } })[];
  senderPool: CampaignSenderType[];
  senderStats: SenderStat[];
  _count: {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
    cancelled: number;
  };
}

// EmailJob shape — matches the Prisma EmailJob model with SENDING status
export interface EmailJob {
  id: string;
  campaignId: string;
  toEmail: string;
  senderId: string | null;
  scheduledAt: string;
  sentAt: string | null;
  status: "PENDING" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";
  error: string | null;
  isStarred: boolean | null;
  isReplied: boolean;
  sequenceStepId: string | null;
  messageId: string | null;
  inReplyTo: string | null;
  references: string | null;
  createdAt: string;
}

// GET /users/emails response item — nested email + campaign data
export interface UserEmailItem {
  email: EmailJob;
  campaign: {
    subject: string;
    body: string;
  };
}

// ─── Component Prop Types ───

// ComposeFormData — internal form state for the compose page
// Note: attachments are managed separately via uploadedAttachments (UploadedAttachment[])
// in the parent ComposePage, not in this form data object.
export interface ComposeFormData {
  from: string;                  // Legacy: kept for backward compat
  selectedSenderIds: string[];   // New: multi-sender selection (sender IDs)
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo?: string;
  subject: string;
  body: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
  selectedRecipients: Set<string>;  // For bulk operations
  attachments: UploadedAttachment[];
  scheduleDate: Date | null;
}

// EmailRow component props — receives destructured email + campaign
export interface EmailRowProps {
  email?: EmailJob;
  campaign?: {
    id?: string;
    subject?: string;
    body?: string;
  };
  onToggleStar?: (emailId: string) => void;
  searchQuery?: string;
}

// EmailList component props
export interface EmailListProps {
  emails?: EmailRowProps[];
  onToggleStar?: (emailId: string) => void;
}

// CampaignRow component props — for dashboard campaign list
export interface CampaignRowProps {
  campaign?: Campaign & {
    emailCounts?: {
      pending: number;
      sending: number;
      sent: number;
      failed: number;
      cancelled: number;
    };
  };
  searchQuery?: string;
}

// CampaignList component props
export interface CampaignListProps {
  campaigns?: CampaignRowProps[];
}

// ComposeForm component props — receives lifted state from parent
export interface ComposeFormProps {
  scheduledAt: Date | null;
  uploadedAttachments: UploadedAttachment[];
  onSubmit: (data: CreateCampaignPayload) => Promise<void>;
  submitTrigger?: number;
}

// ComposeHeader component props — lifted state + callbacks
export interface ComposeHeaderProps {
  onBack?: () => void;
  scheduledAt: Date | null;
  setScheduledAt: (date: Date | null) => void;
  uploadedAttachments: UploadedAttachment[];
  onFilesSelected: (files: File[]) => void;
  onRemoveAttachment: (url: string) => void;
  isUploading: boolean;
  onSend: () => void;
  isSubmitting: boolean;
  customTrigger?: React.ReactNode;
}

// SenderModal component props
export interface SenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sender: SenderResponse) => void;
  // When set, the modal is in "verify" mode for an existing unverified sender
  existingSender?: SenderResponse | null;
}

// AuthGuard component props
export interface AuthGuardProps {
  children: React.ReactNode;
  requirePremium?: boolean;
}

// Sidebar component props
export interface SidebarProps {
  currentLabel?: string;
  setLabel: React.Dispatch<React.SetStateAction<string>>;
  onItemClick?: (label: string) => void;
  profile: {
    name: string;
    email: string;
    avatarUrl: string;
  };
  items?: {
    label: string;
    count?: number;
    icon?: React.ReactNode;
  }[];
  groups?: {
    title: string;
    links: {
      label: string;
      href?: string;
      count?: number;
      icon?: React.ReactNode;
      isActive?: boolean;
      onClick?: () => void;
    }[];
  }[];
}


// ─── Email Template Types ───

// GET /templates response item — email template
export interface EmailTemplate {
  id: string;
  userId: string | null;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  isSystem?: boolean;
}

// POST /templates request body
export interface CreateTemplatePayload {
  name: string;
  subject: string;
  body: string;
}

// PUT /templates/:id request body
export interface UpdateTemplatePayload {
  name?: string;
  subject?: string;
  body?: string;
}

// Enhanced recipient type for campaign creation with variable data
export interface RecipientWithData {
  email: string;
  columnData: Record<string, string>;
}


// ─── Sequence Types ───

export interface SequenceStepType {
  id: string;
  campaignId: string;
  stepNumber: number;
  subject: string;
  body: string;
  waitDays: number;
  condition?: string;
}

export interface StepStatusType {
  stepNumber: number;
  status: "PENDING" | "SCHEDULED" | "SENT" | "FAILED" | "SKIPPED";
  sentAt: string | null;
  error: string | null;
  emailJobId: string | null;
}

export interface RecipientSequenceStateType {
  id: string;
  campaignId: string;
  recipientEmail: string;
  currentStep: number;
  paused: boolean;
  replied: boolean;
  completed: boolean;
  stepStatuses: StepStatusType[];
  createdAt: string;
  updatedAt: string;
}

export interface SequenceResponse {
  steps: SequenceStepType[];
  recipients: RecipientSequenceStateType[];
  hasSequence: boolean;
  stepAnalytics?: StepAnalyticsType[];
}

export interface StepAnalyticsType {
  stepNumber: number;
  subject: string;
  sentCount: number;
  repliedCount: number;
  replyRate: number;
}

// Sequence step input for campaign creation
export interface SequenceStepInput {
  subject: string;
  body: string;
  waitDays: number;
  condition?: SequenceCondition;
}

export type SequenceConditionType = "opened" | "clicked" | "replied" | "none";

export interface SequenceCondition {
  type: SequenceConditionType;
  waitHours?: number;
}


// ─── Priority Mail Types ─────────────────────────────────────────────────────

export interface PriorityStatus {
  congestionScore: number;
  estimatedSendTime: string | null;
  statusMessage: string;
}

export interface PriorityQuota {
  used: number;
  limit: number;
  remaining: number;
  resetTime: string;
}

export interface PriorityCampaignStatus {
  campaignId: string;
  isPriority: boolean;
  priorityJobs: {
    id: string;
    emailJobId: string;
    status: string;
    statusMessage: string | null;
    scheduledAt: string;
    sentAt: string | null;
    emailJob: {
      id: string;
      toEmail: string;
      status: string;
      scheduledAt: string;
      sentAt: string | null;
    };
  }[];
  statusCounts: {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
  };
}


// ─── Sender Rotation Types ───

// CampaignSenderType — a sender in a campaign's sender pool with rotation metadata
export interface CampaignSenderType {
  senderId: string;
  email: string;
  name: string | null;
  dailyLimit: number;
  rotationOrder: number;
}

// SenderStat — per-sender email count breakdown for campaign detail
export interface SenderStat {
  senderId: string;
  email: string;
  name: string | null;
  dailyLimit: number;
  sent: number;
  failed: number;
  pending: number;
}


// ─── Toast Notification Types ───

// Toast severity types
export type ToastType = "success" | "error" | "warning" | "info";

// Toast data structure
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration: number;
  createdAt: number;
  isPaused: boolean;
  remainingTime: number;
  isExiting: boolean;
}

// Hook return type
export interface UseToastReturn {
  addToast: (type: ToastType, message: string, options?: { duration?: number; title?: string }) => string;
  dismissToast: (id: string) => void;
}

// Reducer actions
export type ToastAction =
  | { type: "ADD_TOAST"; payload: Toast }
  | { type: "DISMISS_TOAST"; payload: { id: string } }
  | { type: "REMOVE_TOAST"; payload: { id: string } }
  | { type: "PAUSE_TOAST"; payload: { id: string } }
  | { type: "RESUME_TOAST"; payload: { id: string; remainingTime: number } }
  | { type: "START_EXIT"; payload: { id: string } };

// Toast queue state
export interface ToastState {
  toasts: Toast[];
}

// Default auto-dismiss durations per toast type (in milliseconds)
export type DefaultDurations = Record<ToastType, number>;

// Color scheme per toast type (Tailwind CSS classes)
export interface ToastColorScheme {
  bg: string;
  border: string;
  icon: string;
  text: string;
  progress: string;
}

export type ToastColors = Record<ToastType, ToastColorScheme>;


// ─── Email Tracking Types ───

export interface TrackingMetrics {
  campaignId: string;
  totalSent: number;
  repliedCount: number;
  uniqueOpens: number;
  uniqueClicks: number;
  notOpened: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  trackOpens: boolean;
  trackClicks: boolean;
}

export interface TrackingEmailDetail {
  emailJobId: string;
  toEmail: string;
  openCount: number;
  clickCount: number;
  lastOpenAt: string | null;
  lastClickAt: string | null;
}

export interface TrackingLinkDetail {
  url: string;
  clickCount: number;
}

export interface LinkEmailDetail {
  emailJobId: string;
  toEmail: string;
  clickedAt: string;
}

export interface LinkAnalyticsDetail {
  url: string;
  totalClicks: number;
  uniqueEmails: number;
  emails: LinkEmailDetail[];
}


// ─── Reply Tracking Types ───

export interface ReplyMetrics {
  campaignId: string;
  totalSent: number;
  repliedCount: number;
  replyRate: number;
  replies: {
    emailJobId: string;
    toEmail: string;
    repliedAt: string;
    sentAt: string | null;
  }[];
}

export interface RepliedEmailDetail {
  emailJobId: string;
  toEmail: string;
  sentAt: string | null;
  sender: { email: string; name: string | null } | null;
  repliedAt: string | null;
  replyCount: number;
}

export interface UnrepliedEmailDetail {
  emailJobId: string;
  toEmail: string;
  sentAt: string | null;
  sender: { email: string; name: string | null } | null;
}


// ─── Analytics Types ───

export interface DailySeriesPoint {
  date: string;
  opens: number;
  clicks: number;
  replies: number;
}

export interface HourlySeriesPoint {
  hour: number;
  opens: number;
  clicks: number;
}

export interface TopCampaign {
  id: string;
  subject: string;
  sent: number;
  opens: number;
  clicks: number;
  replied: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  createdAt: string | null;
}

export interface AnalyticsOverview {
  totalCampaigns: number;
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  uniqueOpens: number;
  uniqueClicks: number;
  totalReplied: number;
  totalBounced: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  dailySeries: DailySeriesPoint[];
  hourlySeries: HourlySeriesPoint[];
  topCampaigns: TopCampaign[];
  platformBreakdown?: PlatformBreakdown[];
  deviceBreakdown?: DeviceBreakdown[];
  engagementScore?: number;
}

export interface PlatformBreakdown {
  platform: string;
  count: number;
  percentage: number;
}

export interface DeviceBreakdown {
  device: string;
  count: number;
  percentage: number;
}

export interface AnalyticsLink {
  url: string;
  count: number;
  lastClicked: string | null;
}

export interface AnalyticsLinksResponse {
  links: AnalyticsLink[];
}

export interface SenderHealthRecord {
  id: string;
  senderId: string;
  date: string;
  successCount: number;
  errorCount: number;
  bounceCount: number;
  errorDetails: any;
  sender: {
    email: string;
    name: string | null;
  };
}

export interface ActivityLogEntry {
  id: string;
  eventType: string;
  createdAt: string;
  emailJob: {
    toEmail: string;
    campaign: { subject: string };
  };
}

export interface ActivityLogsResponse {
  logs: ActivityLogEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── PRM / Contact Types ───

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  contactId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactList {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactActivity {
  id: string;
  contactId: string;
  type: string;
  metadata: any;
  createdAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  phone?: string | null;
  jobTitle: string | null;
  stage: string;
  createdAt: string;
  updatedAt: string;
  engagementScore?: number;
  lastContactedAt?: string | null;
  notes?: Note[];
  activities?: ContactActivity[];
  tags?: Tag[];
  lists?: ContactList[];
  _count?: {
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    emailsReplied: number;
  };
}

export interface PaginatedContacts {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CallTaskStatus = "PENDING" | "COMPLETED" | "SKIPPED";

export interface CallTask {
  id: string;
  userId: string;
  contactId: string;
  status: CallTaskStatus;
  priority: number;
  dueAt: string;
  lastOutcome: string | null;
  lastDisposition?: string | null;
  lastNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CallQueueItem extends CallTask {
  contact: Pick<Contact, "id" | "email" | "firstName" | "lastName" | "company" | "phone" | "stage" | "updatedAt">;
}

export interface CallQueueResponse {
  tasks: CallQueueItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LogCallPayload {
  contactId: string;
  outcome: string;
  note?: string;
  nextAction?: string;
  nextCallAt?: string;
  taskId?: string;
}

export type CallProviderStatus = "CONNECTED" | "FAILED" | "REQUIRES_ATTENTION" | "DISCONNECTED";

export interface CallProviderConnection {
  id: string;
  userId: string;
  type: "SIP_WEBRTC";
  name: string;
  sipDomain: string;
  websocketUrl: string;
  displayName: string | null;
  vendorMetadata: any;
  status: CallProviderStatus;
  lastCheckedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrmQualitySummary {
  totalContacts: number;
  duplicateContacts: number;
  missingRequiredFields: number;
  invalidEmails: number;
  launchBlocked: number;
}

export interface PrmCondition {
  field: "tags" | "stage" | "lastActivity" | "campaignStatus" | "replyState" | "openState";
  operator: "equals" | "notEquals" | "contains" | "inLastDays" | "is";
  value: string | string[] | number | boolean;
}

export interface PrmSegmentExpression {
  op: "AND" | "OR";
  conditions: PrmCondition[];
}

export interface PrmSegment {
  id: string;
  userId: string;
  name: string;
  expression: PrmSegmentExpression;
  isAdhoc: boolean;
  previewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InboxThread {
  id: string;
  senderId: string;
  threadId: string;
  subject: string;
  participants: string[];
  lastMessageAt: string;
  lastSnippet: string | null;
  lastSenderEmail: string | null;
  unreadCount: number;
  hasAttachments: boolean;
}

export interface InboxEmail {
  id: string;
  senderId: string;
  messageId: string;
  inReplyTo: string | null;
  references: string | null;
  threadId: string | null;
  fromName: string | null;
  fromEmail: string;
  toName: string | null;
  toEmail: string;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  snippet: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  folder: string;
  receivedAt: string;
  syncedAt: string;
}

// ─── Organization / Team Collaboration Types ───

export type OrgMemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface OrgMember {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: OrgMemberRole;
  joinedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  role: OrgMemberRole;
  members: OrgMember[];
  createdAt: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  role: OrgMemberRole;
  createdAt: string;
}

export interface OrganizationInvite {
  id: string;
  email: string;
  role: OrgMemberRole;
  createdAt: string;
  expiresAt: string;
  inviteLink?: string;
}
