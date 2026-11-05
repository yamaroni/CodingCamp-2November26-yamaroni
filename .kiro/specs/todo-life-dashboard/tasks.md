# Implementation Plan: Todo Life Dashboard

## Overview

Implement a self-contained, single-page productivity dashboard using pure HTML5, CSS3, and Vanilla JavaScript. The deliverable is three files: `index.html`, `css/styles.css`, and `js/app.js`. All persistence uses `localStorage`. The implementation follows a bottom-up module approach — data/storage first, then each feature panel, then layout and integration.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` at the workspace root with the full page skeleton: `<!DOCTYPE html>`, `<head>` (charset, viewport, title, link to `css/styles.css`), and `<body>` containing four panel sections (`#greeting-panel`, `#focus-timer`, `#todo-list-panel`, `#quick-links-panel`), a `<div id="storage-banner">` (hidden by default), and a `<script src="js/app.js" defer>` tag
  - Create an empty `css/styles.css` file at `css/styles.css`
  - Create an empty `js/app.js` file at `js/app.js`
  - Add the semantic HTML structure for each panel: heading, content container, and form/control placeholders as described in the design
  - _Requirements: 6.1, 6.2, 6.3, 7.2_

- [x] 2. Implement `StorageService` module
  - [x] 2.1 Write the `StorageService` IIFE module in `js/app.js`
    - Implement `isAvailable()`: wrap a test `localStorage.setItem` / `getItem` / `removeItem` in a try-catch, return `true`/`false`
    - Implement `load(key)`: call `localStorage.getItem(key)`, return `JSON.parse(value)` or `null` on missing key or `SyntaxError`
    - Implement `save(key, val)`: call `localStorage.setItem(key, JSON.stringify(val))` in a try-catch; return `{ ok: true }` or `{ ok: false, error }`
    - Use storage keys `tld_tasks` and `tld_links`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_


- [x] 3. Implement `GreetingPanel` module
  - [x] 3.1 Write the `GreetingPanel` IIFE module in `js/app.js`
    - Implement `_formatDate(d)`: return a string in the format `"Weekday, D Month YYYY"` using `d.toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' })` or manual lookup arrays
    - Implement `_formatTime(d)`: return `"HH:MM:SS"` with zero-padding via `String.prototype.padStart(2, '0')`
    - Implement `_getGreeting(h)`: return `"Good Morning"` (5–11), `"Good Afternoon"` (12–17), `"Good Evening"` (18–21), `"Good Night"` (22–23, 0–4)
    - Implement `_render(now)`: update `#greeting-time`, `#greeting-date`, `#greeting-msg`; guard against invalid Date with `isNaN(now.getTime())`, hiding time/date and showing `"Welcome!"` as fallback
    - Implement `init()`: query DOM refs, call `_render(new Date())` immediately, then `setInterval(_render, 1000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_


- [x] 4. Implement `FocusTimer` module
  - [x] 4.1 Write the `FocusTimer` IIFE module in `js/app.js`
    - Initialise state: `{ remainingSeconds: 1500, intervalId: null, running: false }`
    - Implement `_render()`: compute `mm = Math.floor(remainingSeconds / 60)`, `ss = remainingSeconds % 60`, update `#timer-display` with zero-padded `MM:SS`; set `#timer-start` `disabled` to `running`
    - Implement `_tick()`: decrement `remainingSeconds`; call `_render()`; if `remainingSeconds === 0` call `_onEnd()`
    - Implement `_start()`: guard against already-running or zero remaining; set `running = true`, start `setInterval(_tick, 1000)`, call `_render()`
    - Implement `_stop()`: if not `running`, return (no-op); clear interval, set `running = false`, call `_render()`
    - Implement `_reset()`: clear interval, set `running = false`, `remainingSeconds = 1500`; hide session-end message; call `_render()`
    - Implement `_onEnd()`: call `_stop()`, show `#timer-end-msg` (e.g. "Session complete! Take a break.")
    - Implement `init()`: query DOM refs, attach click listeners to Start/Stop/Reset buttons, call `_render()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_


- [ ] 5. Checkpoint — Core modules complete
  - Ensure `StorageService`, `GreetingPanel`, and `FocusTimer` modules are defined, all functions implemented, and the property/unit tests for these modules pass. Ask the user if any questions arise.

- [x] 6. Implement `TodoList` module
  - [x] 6.1 Write the `TodoList` IIFE module in `js/app.js`
    - Initialise `tasks = []` from `StorageService.load('tld_tasks') ?? []`
    - Implement `_validateInput(text)`: return `false` if `text.trim().length === 0`
    - Implement `_addTask(text)`: validate; if invalid, show inline `<span class="field-error">` adjacent to `#todo-input`; clear error on next `input` event; otherwise create `{ id, text: text.trim(), done: false, createdAt: Date.now() }`, push to `tasks`, call `_persist()` then `_renderList()`
    - Implement `_renderItem(task)`: return an `<li>` with a checkbox (checked state = `task.done`), a `<span>` for text (strikethrough class when `done`), Edit and Delete buttons
    - Implement `_renderList()`: clear `#todo-list`, map `tasks` through `_renderItem`, append all
    - Implement `_toggleComplete(id)`: flip `task.done`, call `_persist()` and `_renderList()`
    - Implement `_beginEdit(id)`: replace the task text `<span>` with a pre-filled `<input>` and Confirm/Cancel buttons; bind `Escape` key to `_cancelEdit(id)`
    - Implement `_confirmEdit(id, text)`: validate; if empty/whitespace retain original and restore; otherwise update `task.text`, call `_persist()` and `_renderList()`
    - Implement `_cancelEdit(id)`: call `_renderList()` without modifying `tasks`
    - Implement `_persist()`: call `StorageService.save('tld_tasks', tasks)`
    - Implement `init()`: load tasks from storage (use empty array on `null`/parse error), attach submit listener to `#todo-form` (Enter key + button), call `_renderList()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_


- [x] 7. Implement `QuickLinks` module
  - [x] 7.1 Write the `QuickLinks` IIFE module in `js/app.js`
    - Initialise `links = []` from `StorageService.load('tld_links') ?? []`
    - Implement `_validateLink(label, url, existingLinks)`: in order — empty label → `{ valid: false, field: 'label', message: '...' }`; empty URL → `{ valid: false, field: 'url', ... }`; URL does not start with `http://` or `https://` → `{ valid: false, field: 'url', ... }`; URL already in `existingLinks` → `{ valid: false, field: 'url', ... }`; `existingLinks.length >= 20` → `{ valid: false, field: 'url', ... }`; otherwise `{ valid: true }`
    - Implement `_addLink(label, url)`: call `_validateLink`; if invalid, inject `<span class="field-error">` next to the relevant field; otherwise create `{ id, label: label.trim(), url }`, push to `links`, call `_persist()` and `_renderLinks()`
    - Implement `_renderButton(link)`: return a `<div>` containing an `<a>` button opening `link.url` in a new tab (`target="_blank"`, `rel="noopener noreferrer"`) labelled with `link.label`, and a delete icon button
    - Implement `_renderLinks()`: clear `#links-grid`, map `links` through `_renderButton`, append all
    - Implement `_deleteLink(id)`: filter `links` to remove entry, call `_persist()` and `_renderLinks()`
    - Implement `_persist()`: call `StorageService.save('tld_links', links)`
    - Implement `init()`: load links from storage (empty array on `null`/error), attach submit listener to `#quick-links-form`, call `_renderLinks()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_


- [ ] 8. Checkpoint — Feature modules complete
  - Verify all four modules (`StorageService`, `GreetingPanel`, `FocusTimer`, `TodoList`, `QuickLinks`) are implemented in `js/app.js` with no syntax errors. Confirm that opening `index.html` via `file://` renders all four panels without console errors. Ask the user if any questions arise.

- [x] 9. Implement `App` bootstrap coordinator and Local Storage banner
  - [x] 9.1 Write the `App` init function in `js/app.js`
    - Implement `App.init()` called on `DOMContentLoaded`: call `StorageService.isAvailable()`; if `false`, reveal `#storage-banner` with the message `"Warning: Local Storage is unavailable. Your tasks and links will not be saved."`; then call `GreetingPanel.init()`, `FocusTimer.init()`, `TodoList.init()`, `QuickLinks.init()` in that order
    - Add the `DOMContentLoaded` event listener at the bottom of `js/app.js`
    - _Requirements: 5.3, 5.4_

- [ ] 10. Implement CSS layout and visual design
  - [x] 10.1 Write the base styles and two-column grid layout in `css/styles.css`
    - Set `body` base font size to at least 14px, choose a legible sans-serif font stack
    - Style `#dashboard` as a two-column CSS Grid (`grid-template-columns: 1fr 1fr`) for viewports above 768px
    - Add `@media (max-width: 768px)` breakpoint: reflow to `grid-template-columns: 1fr`, stacking panels vertically in order — Greeting_Panel, Focus_Timer, Todo_List, Quick_Links
    - Apply colour palette that meets WCAG 2.1 AA contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text)
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 6.7_

  - [-] 10.2 Style all four panels and their controls
    - Style `#greeting-panel`: large clock display, date line, greeting heading
    - Style `#focus-timer`: large `#timer-display`, Start/Stop/Reset button row, `#timer-end-msg` (hidden by default, shown on session end)
    - Style `#todo-list-panel`: `#todo-form` input + submit button, `#todo-list` `<ul>` with task items, `.field-error` inline validation spans, strikethrough for completed tasks
    - Style `#quick-links-panel`: `#quick-links-form` label input + URL input + submit button, `#links-grid` flexbox/grid of link buttons, delete icons
    - Style `#storage-banner`: persistent, visually prominent warning banner (hidden by default, revealed by JS)
    - _Requirements: 6.1, 6.4, 6.5_

- [ ] 11. Wire HTML structure to module DOM selectors
  - Audit all DOM `id` and class attributes in `index.html` against the selectors used in each module (`#greeting-time`, `#greeting-date`, `#greeting-msg`, `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`, `#timer-end-msg`, `#todo-form`, `#todo-input`, `#todo-list`, `#quick-links-form`, `#links-grid`, `#storage-banner`)
  - Add any missing `id`/`class` attributes, ensure form `input` max-length attributes match requirements (200 for tasks, 50 for link label, 2048 for link URL)
  - _Requirements: 3.1, 4.1, 6.1_

- [ ] 12. Final checkpoint — End-to-end validation
  - Open `index.html` via `file://` in a browser, verify: all four panels render, clock ticks, timer counts down, tasks and links can be added/edited/deleted and survive a page reload, responsive reflow works at 768px. Ensure no console errors appear. Ask the user if any questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for full traceability
- Checkpoints (tasks 5, 8, 12) provide incremental validation gates
- Property tests use `fast-check` loaded from a local file (`test/lib/fast-check.min.js`) — no CDN; the test runner lives in `test/index.html` and is excluded from the production bundle
- Unit tests use plain `console.assert` or QUnit in the same `test/` directory
- All 13 correctness properties from the design document are covered by property test sub-tasks

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.2", "3.3", "3.4", "3.5", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 2, "tasks": ["6.1", "7.1", "9.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6", "7.2", "7.3", "7.4"] },
    { "id": 4, "tasks": ["10.1"] },
    { "id": 5, "tasks": ["10.2", "11"] }
  ]
}
```
