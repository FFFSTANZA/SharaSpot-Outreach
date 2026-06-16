# Session: PRM Redesign of Compose Page

## Goal
Full PRM (clay + Notion design pattern) restyle of the compose page and all its sub-components — consistent brand tokens, raw color classes eliminated, Modal/Button components replaced with raw elements.

## Layout Architecture (Final)
```
┌─ dashboard-content (bg-[#F8FAFC]) ──────────────────┐
│  Sidebar         main (flex-1, overflow-hidden)      │
│                   ┌─ card (max-w-[1600px]) ────────┐ │
│                   │  HEADER (sticky, outside scroll)  │
│                   │  border-b, px-4 py-3 sm:px-6     │
│                   │  [☰] [← Back] │ [Compose]        │
│                   │  │  [schedule badge] [⏰] [Send]  │
│                   ├──────────────────────────────────┤
│                   │  SCROLL AREA (flex-1 overflow-y)  │
│                   │  ┌─ max-w-5xl mx-auto ──────────┐ │
│                   │  │  py-6 px-4 md:px-6             │ │
│                   │  │  [Error banner]                │ │
│                   │  │  grid gap-4 (12-col)           │ │
│                   │  │  ┌─ 8 cols ──┐ ┌─ 4 cols ──┐  │ │
│                   │  │  │ Email card│ │Settings    │  │ │
│                   │  │  │ Sequence  │ │Templates   │  │ │
│                   │  │  │ Builder   │ │VarPreview  │  │ │
│                   │  │  └───────────┘ └────────────┘  │ │
│                   │  └────────────────────────────────┘ │
│                   └──────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

## Design Language Check Results
### ✅ Color Tokens
- All `bg-gray-*`/`text-gray-*`/`border-gray-*` → design tokens (`text-text-primary`, `border-border-light`, `bg-[#F8F9FA]`, `bg-[#F0F1F3]`)
- All `bg-emerald-*`/`text-emerald-*` → brand tokens (`bg-brand`, `text-brand`)
- All `bg-red-*`/`text-red-*` → error tokens (`bg-error-bg`, `text-error-text`)
- All `bg-black/30` overlays → `bg-text-primary/10 backdrop-blur-sm`
- Semantic status dots kept: `bg-green-500`, `bg-amber-500`, `bg-red-500`

### ✅ Layout & Spacing
- **Shell header** (sticky, no scroll): `border-b`, `px-4 py-3 sm:px-6` — sidebar toggle + back + title on left, ComposeHeader (schedule+send) on right
- **Scroll area** (flex-1 overflow-y): form content only
- **Form container**: `max-w-5xl mx-auto px-4 md:px-6 py-6` — consistent with shell padding
- **Grid**: `gap-4` (16px) between main (8 cols) and sidebar (4 cols)
- **Email card sections**: `py-3.5` field rows, `gap-1.5` chip spacing
- No duplicate headers, no extra action bars

### ✅ Modal Pattern (all 5 modals)
Overlay: `fixed inset-0 z-50 flex items-center justify-center bg-text-primary/10 backdrop-blur-sm`
Card: `rounded-lg bg-white shadow-premium-lg`
Buttons: Primary `bg-brand hover:bg-brand/90`, Secondary `border border-border-light hover:bg-[#F0F1F3]`

### ✅ Button Pattern
- Primary: `h-7 rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand/90 disabled:opacity-50`
- Icon: `h-7 w-7 rounded-md text-text-muted hover:bg-[#F0F1F3]`
- Secondary: `rounded-md border border-border-light px-4 text-xs font-medium text-text-secondary hover:bg-[#F0F1F3]`

### ✅ Input Fields
`border-border-light outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10 placeholder:text-text-muted`

### ✅ Errors & Empty States
- Error banners: `bg-error-bg border border-error-bg text-error-text`
- Error messages: `text-xs text-error-text`
- Success: `text-xs text-brand`
- Empty state: muted icon + "No X yet" text

### ✅ Editor
- ToolbarButton: `cn()` with `bg-brand/10 text-brand` (active), `text-text-muted` (disabled), `text-text-secondary hover:bg-[#F0F1F3]` (default)
- Prose classes use brand instead of emerald
- Link/Table/Calendly modals use PRM modal pattern

## Done
1. **page.tsx** — PRM shell, header with sidebar toggle + back + title + ComposeHeader (schedule+send buttons) in sticky header via `forwardRef`/`useImperativeHandle`; schedule modal managed inside ComposeForm
2. **ComposeHeader.tsx** — stripped to just schedule badge + actions (right-aligned), no duplicate back/title
3. **ComposeSettings.tsx** — inline Toggle, all tokens, no raw classes
4. **ComposeForm.tsx** — full token pass, removed Modal/Button imports, PRM template confirmation modal, removed outer scrolling container; refactored to `forwardRef` exposing `openSchedule` + `submit`
5. **SenderField.tsx** — all tokens
6. **BulkActionsDropdown.tsx** — all tokens, error-text/bg token for remove action
7. **ScheduleModal.tsx** — Modal/Button replaced, PRM modal, all tokens
8. **SignatureModal.tsx** — Modal/Button replaced, PRM modal, all tokens
9. **EmailValidator.tsx** — Modal/Button replaced, PRM modal, all tokens, semantic status dots preserved
10. **Editor.tsx (630 lines)** — ToolbarButton converted to `cn()`, Link/Table/Calendly modals PRM pattern, emerald→brand, prose classes brand, all raw classes eliminated
11. **TemplateSelector.tsx** — all tokens, supports both `onChange`/`onSelect` props
12. **VariablePreview.tsx** — all tokens, fixed to match ComposeForm's `recipientColumnData`/`recipients` API
13. **SenderModal.tsx** — `rounded-xl`→`rounded-lg`

## Files Changed (all in `client/src/app/dashboard/compose/`)
- `page.tsx`
- `ComposeHeader.tsx`
- `ComposeSettings.tsx`
- `ComposeForm.tsx`
- `SenderField.tsx`
- `BulkActionsDropdown.tsx`
- `ScheduleModal.tsx`
- `SignatureModal.tsx`
- `EmailValidator.tsx`
- `Editor.tsx`
- `TemplateSelector.tsx`
- `VariablePreview.tsx`
- `SenderModal.tsx`

## Remaining (needs separate pass)
- **SequenceBuilder.tsx** (~1000 lines, ~139 raw class instances) — massive file with extensive raw gray classes, amber/red/green status colors, and complex layout. Needs dedicated session.

## Session: Workspace Sharing & Data Visibility Fix

### Problem
`getOrgScope()` returned `{ organizationId, userId }` — an AND condition that prevented team members from seeing each other's data in a shared workspace:
- Contacts created by User A were invisible to User B in the same org
- Call tasks, campaigns, tags, lists, segments — same issue

### Root Cause
`getOrgScope()` at `server/src/utils/orgScope.ts:8` included `userId` in the scope filter when an org was active. All 87+ usages across controllers inherited this broken behavior.

### Fixes Applied
1. **`server/src/utils/orgScope.ts`** — `getOrgScope()` now returns `{ organizationId }` only when an org is active (no `userId`). Personal scope (`{ userId }`) is used when no org is active. `OrgScope.userId` made optional.
2. **`server/src/utils/contactService.ts`** — `upsertContact()` uses `(organizationId, email)` lookup via `findFirst` when org is provided, instead of `(userId, email)` via `findUnique`. Prevents duplicate workspace contacts.
3. **`server/src/utils/contactService.ts`** — `logContactActivityByEmail()` and `updateContactStageByEmail()` now try personal-scoped lookup first, then fall back to org-scoped lookup via the user's active organization.
4. **`server/prisma/schema.prisma`** — Added `@@unique([organizationId, email])` to Contact model for data integrity.

### Payment / Premium Inheritance (already correct)
- `getSubscriptionStatus()` already inherits org owner's premium to members
- `createSubscription()` blocks non-OWNER members from subscribing
- `removeMember()` / `leaveOrganization()` properly invalidate premium cache and reassign active org

### Design Decisions
- When an org is active, ALL members see ALL workspace data (no per-user isolation)
- VIEWER role can read all, write blocked by `requireOrgWriteAccess` middleware
- Assignment (`assignedToId`) is for responsibility tracking, not visibility gating
- Records tagged with `userId` (creator) + `organizationId` (workspace) — scoping is by org only

## Previous Sessions
- Logo replacement: `client/public/sharaspot-icon.png` (new), `Logo.tsx` (replaced SVG with `<img>`), `favicon.svg` (simplified).
- Font preload warnings: added `preload: false` to Geist/Geist_Mono in layout.tsx.
- TypeError in contacts tab: `?? []` guard in page.tsx:108, null check in ContactList.tsx:51.
- Docker compose: switched to `docker-compose.local.yml`.
- Not updated: `og-image.jpg`/`.png` (social preview cards — need manual image tool).
