# Plan: Mobile-usable dashboard nav (off-canvas drawer)

## Problem

`apps/app/app/dashboard/layout.tsx` renders a fixed `w-56` sidebar with no responsive
behaviour at all — it's the same 224px-wide `<aside>` at every screen width. On a
phone that sidebar eats most of the viewport and makes the dashboard unusable.

## Constraints (must hold)

- **Zero visual/behavioural change at `md:` and above.** Desktop must look and act
  pixel-identical to today. Do not restyle, reorder, or rename anything in the
  existing sidebar markup — only gate it behind a breakpoint.
- **Sidebar/nav only.** Do not touch page content (`{children}`) — clients table,
  pipeline board, reporting charts, email flows, automations, settings, etc. Those
  may still not be great on mobile; that's separate, later work, not this plan.
- **Reuse `DashboardNav` as-is.** Don't fork the link list or duplicate nav items
  between a "desktop" and "mobile" version — one source of truth, just rendered
  inside a different container on mobile.
- **No new nav items, no redesign.** This is a layout/interaction fix, not a
  visual refresh.

## Current state (for reference)

- `apps/app/app/dashboard/layout.tsx` — server component. Calls `auth()`, then
  renders `<aside className="flex h-full w-56 shrink-0 flex-col border-r bg-muted">`
  containing `AppBrand`, `DashboardNav`, and a staff-only `SignOutForm` footer.
  `<main>` is the sibling flex-1 content area.
- `apps/app/components/dashboard/dashboard-nav.tsx` — client component (`usePathname`),
  plain `NAV_ITEMS` array of headings/links, no responsive awareness, no
  open/close concept.
- `packages/ui` (`@stky/ui`) already depends on `@radix-ui/react-dialog` and
  `lucide-react`, and has an existing `src/dialog.tsx`. No existing Sheet/Drawer
  component — build the off-canvas panel using Radix Dialog directly (gives
  focus trap, Escape-to-close, backdrop-click-to-close, and scroll lock for
  free), following the styling conventions in `dialog.tsx` so it matches the
  rest of the app rather than looking bolted on.

## Chosen pattern: hamburger + slide-in drawer

Below `md`, the fixed sidebar disappears and is replaced by:
1. A slim top bar — `AppBrand` (small) on the left, a hamburger icon button
   (`lucide-react` `Menu`) on the right, `aria-label="Open navigation"` /
   `aria-expanded`.
2. Tapping the hamburger opens the nav as a full-height panel that slides in
   from the left (~80vw, capped around 300px) over a backdrop, containing the
   same header/`DashboardNav`/sign-out footer as the desktop sidebar.
3. Tapping a nav link, the backdrop, or Escape closes it.

## Implementation steps

1. **New client wrapper**: `apps/app/components/dashboard/mobile-dashboard-shell.tsx`.
   Owns `isOpen` state (`useState`) for the drawer.
2. **Move, don't rewrite**: lift the current `<aside>` JSX out of `layout.tsx`
   into this new client component, wrapped in `hidden md:flex` so it renders
   exactly as today at `md:`+ with the same classes/structure. `layout.tsx`
   stays a server component — it still does `auth()` and passes whatever
   `session`/`isStaff` info the shell needs as props; it just renders
   `<MobileDashboardShell>{children}</MobileDashboardShell>` instead of the
   raw `<aside>`/`<main>` markup directly.
3. **Mobile top bar**: `flex md:hidden` bar (~48–56px tall) with brand +
   hamburger button, rendered above `<main>`.
4. **Drawer**: Radix `Dialog.Root`/`Dialog.Content` positioned as a left-edge
   sliding panel, `md:hidden` (never mounted/relevant at desktop widths).
   Contents: same brand header + `<DashboardNav />` + staff `SignOutForm`
   footer as the desktop sidebar — no duplicated link data.
5. **Auto-close on navigate**: close the drawer the moment a nav link is
   tapped (e.g. via `usePathname()` change inside the shell, or an
   `onNavigate` callback passed down), so it doesn't linger through the route
   transition.
6. **Scroll lock**: confirm Radix Dialog's default scroll-lock covers the
   background page while the drawer is open (it should, out of the box).
7. **`<main>` spacing**: add top padding on mobile only to clear the new top
   bar (`pt-14 md:pt-4` or similar) — desktop `<main>` classes unchanged.

## Out of scope (do not do this in the same pass)

- Any styling/layout work inside dashboard pages themselves (tables, kanban,
  charts, forms).
- Reordering, renaming, adding, or removing nav items.
- Auth/session logic changes.
- A bottom tab bar or icon-rail alternative — hamburger + drawer was the
  chosen pattern.

## Verification checklist

- Diff `layout.tsx`/the lifted `<aside>` markup: confirm the `md:`+ classes
  and DOM structure are unchanged from before the change (pixel parity, not
  just "looks similar").
- Test at 375×667 (iPhone SE), 390×844 (iPhone 12/13), and 768×1024 (iPad
  portrait — should show the desktop sidebar since it's exactly at `md`).
- At mobile widths: sidebar/drawer hidden on load; hamburger opens it; tapping
  a link, the backdrop, or Escape closes it; no horizontal scroll/overflow
  anywhere on any dashboard page at any tested width.
- Focus moves into the drawer on open and returns to the hamburger button on
  close (keyboard/screen-reader accessibility).
- Staff-only `SignOutForm` still renders correctly in both the desktop
  sidebar and the mobile drawer for staff users; hidden for non-staff in both.
- No new console errors/warnings, in particular no hydration mismatches —
  the most likely failure mode when a server layout gains a client child with
  state.
