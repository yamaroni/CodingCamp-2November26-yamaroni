/* js/app.js — Todo Life Dashboard application logic */
/* Modules and App bootstrap populated in Tasks 2–9 */

/* ─────────────────────────────────────────────────────────────
   StorageService — localStorage read/write with graceful errors
   Requirements: 5.1, 5.2, 5.3, 5.4
   ───────────────────────────────────────────────────────────── */
const StorageService = (() => {
  /** Dedicated storage keys used by the application. */
  const KEYS = {
    tasks: 'tld_tasks',
    links: 'tld_links',
  };

  /**
   * Check whether localStorage is usable in this browser / context.
   * Performs a real read-write-delete cycle so that:
   *   • Private-browsing modes that silently quota-limit writes are detected.
   *   • Environments where the API exists but throws on access are caught.
   * @returns {boolean}
   */
  function isAvailable() {
    const TEST_KEY = '__tld_storage_test__';
    try {
      localStorage.setItem(TEST_KEY, '1');
      const val = localStorage.getItem(TEST_KEY);
      localStorage.removeItem(TEST_KEY);
      return val === '1';
    } catch (_) {
      return false;
    }
  }

  /**
   * Read and deserialise a value from localStorage.
   * @param {string} key
   * @returns {*} Parsed value, or `null` when the key is absent or the
   *              stored string is not valid JSON.
   */
  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;          // key not present
      return JSON.parse(raw);
    } catch (_) {
      // SyntaxError from JSON.parse or SecurityError from getItem
      return null;
    }
  }

  /**
   * Serialise `val` and write it to localStorage under `key`.
   * @param {string} key
   * @param {*} val  Any JSON-serialisable value.
   * @returns {{ ok: true } | { ok: false, error: Error }}
   */
  function save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  return { KEYS, isAvailable, load, save };
})();

/* ─────────────────────────────────────────────────────────────
   GreetingPanel — live clock, date, and time-contextual greeting
   Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
   ───────────────────────────────────────────────────────────── */
const GreetingPanel = (() => {
  // Cached DOM references — populated in init()
  let _elTime = null;
  let _elDate = null;
  let _elMsg  = null;

  /**
   * Format a Date as "Weekday, D Month YYYY"
   * e.g. "Monday, 26 November 2025"
   * @param {Date} d
   * @returns {string}
   */
  function _formatDate(d) {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      year:    'numeric',
    });
  }

  /**
   * Format a Date as zero-padded "HH:MM:SS"
   * @param {Date} d
   * @returns {string}
   */
  function _formatTime(d) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  /**
   * Return the appropriate greeting for the given hour (0–23).
   * 05–11 → "Good Morning"
   * 12–17 → "Good Afternoon"
   * 18–21 → "Good Evening"
   * 22–04 → "Good Night"
   * @param {number} h  Integer in [0, 23]
   * @returns {string}
   */
  function _getGreeting(h) {
    if (h >= 5  && h <= 11) return 'Good Morning';
    if (h >= 12 && h <= 17) return 'Good Afternoon';
    if (h >= 18 && h <= 21) return 'Good Evening';
    return 'Good Night'; // covers 22–23 and 0–4
  }

  /**
   * Update the three display elements for the given moment.
   * If `now` is an invalid Date, suppress time/date and show "Welcome!".
   * @param {Date} now
   */
  function _render(now) {
    if (isNaN(now.getTime())) {
      // Req 1.8 — invalid system clock fallback
      if (_elTime) _elTime.style.display = 'none';
      if (_elDate) _elDate.style.display = 'none';
      if (_elMsg)  _elMsg.textContent    = 'Welcome!';
      return;
    }

    // Restore visibility in case a previous tick showed the fallback
    if (_elTime) {
      _elTime.style.display = '';
      _elTime.textContent   = _formatTime(now);  // Req 1.2
    }
    if (_elDate) {
      _elDate.style.display = '';
      _elDate.textContent   = _formatDate(now);  // Req 1.1
    }
    if (_elMsg) {
      _elMsg.textContent = _getGreeting(now.getHours()); // Req 1.3–1.6
    }
  }

  /**
   * Initialise the panel: cache DOM refs, render immediately, then
   * start a one-second interval so the clock stays live.
   * Requirements: 1.7
   */
  function init() {
    _elTime = document.getElementById('greeting-time');
    _elDate = document.getElementById('greeting-date');
    _elMsg  = document.getElementById('greeting-msg');

    // Render at once so the user sees the time within < 1 second of load
    _render(new Date());

    // Tick every second — _render is called with a fresh Date each time
    setInterval(() => _render(new Date()), 1000);
  }

  // Expose only the public API; internal helpers are exported for testing
  return { init, _formatDate, _formatTime, _getGreeting, _render };
})();

/* ─────────────────────────────────────────────────────────────
   FocusTimer — 25-minute Pomodoro countdown
   Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
   ───────────────────────────────────────────────────────────── */
const FocusTimer = (() => {
  // ── State ────────────────────────────────────────────────────
  let remainingSeconds = 1500;   // Req 2.1 — 25 × 60
  let intervalId       = null;
  let running          = false;

  // ── DOM references — populated in init() ─────────────────────
  let _elDisplay = null;
  let _elStart   = null;
  let _elStop    = null;
  let _elReset   = null;
  let _elEndMsg  = null;

  /**
   * Render the current state to the DOM.
   * Updates the MM:SS display and toggles the Start button's disabled state.
   * Requirements: 2.7, 2.8
   */
  function _render() {
    const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
    const ss = String(remainingSeconds % 60).padStart(2, '0');
    if (_elDisplay) _elDisplay.textContent = `${mm}:${ss}`;
    // Req 2.8 — Start is disabled while running; enabled when stopped with time left
    if (_elStart) _elStart.disabled = running;
  }

  /**
   * Called by setInterval every second while the timer is running.
   * Decrements the counter, re-renders, and fires _onEnd when done.
   * Requirements: 2.3
   */
  function _tick() {
    remainingSeconds -= 1;
    _render();
    if (remainingSeconds === 0) {
      _onEnd(); // Req 2.6
    }
  }

  /**
   * Begin (or resume) the countdown.
   * Guards against a double-start and a zero-remaining start.
   * Requirements: 2.2, 2.8
   */
  function _start() {
    if (running || remainingSeconds === 0) return;
    running    = true;
    intervalId = setInterval(_tick, 1000);
    _render();
  }

  /**
   * Pause the countdown, preserving remaining time.
   * A no-op when already stopped (Req 2.9).
   * Requirements: 2.4, 2.9
   */
  function _stop() {
    if (!running) return; // Req 2.9 — ignore if not running
    clearInterval(intervalId);
    intervalId = null;
    running    = false;
    _render();
  }

  /**
   * Stop the countdown and restore to the full 25-minute value.
   * Also hides the session-end message if it was visible.
   * Requirements: 2.5
   */
  function _reset() {
    clearInterval(intervalId);
    intervalId       = null;
    running          = false;
    remainingSeconds = 1500;
    if (_elEndMsg) _elEndMsg.hidden = true;
    _render();
  }

  /**
   * Called when the countdown reaches 00:00.
   * Stops the timer and surfaces the session-end message.
   * Requirements: 2.6
   */
  function _onEnd() {
    _stop();
    if (_elEndMsg) {
      _elEndMsg.textContent = 'Session complete! Take a break.';
      _elEndMsg.hidden      = false;
    }
  }

  /**
   * Initialise the module: cache DOM refs, attach event listeners,
   * and render the initial state.
   */
  function init() {
    _elDisplay = document.getElementById('timer-display');
    _elStart   = document.getElementById('timer-start');
    _elStop    = document.getElementById('timer-stop');
    _elReset   = document.getElementById('timer-reset');
    _elEndMsg  = document.getElementById('timer-end-msg');

    if (_elStart) _elStart.addEventListener('click', _start);
    if (_elStop)  _elStop.addEventListener('click', _stop);
    if (_elReset) _elReset.addEventListener('click', _reset);

    _render(); // show 25:00 immediately — Req 2.1
  }

  // Expose public API; internals are also returned for unit/PBT testing
  return { init, _start, _stop, _reset, _tick, _onEnd, _render,
           // expose state accessors for testing
           _getState: () => ({ remainingSeconds, intervalId, running }) };
})();

/* ─────────────────────────────────────────────────────────────
   TodoList — add, edit, complete, delete tasks with persistence
   Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11
   ───────────────────────────────────────────────────────────── */
const TodoList = (() => {
  // ── State ────────────────────────────────────────────────────
  // Req 3.10 — load persisted tasks on module creation; fall back to [] (Req 3.11)
  let tasks = StorageService.load(StorageService.KEYS.tasks) ?? [];
  if (!Array.isArray(tasks)) tasks = [];

  // ── DOM references — populated in init() ─────────────────────
  let _elForm  = null;
  let _elInput = null;
  let _elList  = null;

  // ── Helpers ──────────────────────────────────────────────────

  /**
   * Generate a unique ID for a new task.
   * Prefers crypto.randomUUID(); falls back to Date.now() string.
   * @returns {string}
   */
  function _generateId() {
    try {
      return crypto.randomUUID();
    } catch (_) {
      return Date.now().toString();
    }
  }

  /**
   * Validate task input text.
   * Returns false when the trimmed text is empty (Req 3.3, 3.7).
   * @param {string} text
   * @returns {boolean}
   */
  function _validateInput(text) {
    return text.trim().length > 0;
  }

  /**
   * Persist the current tasks array to localStorage.
   * Requirements: 3.9
   */
  function _persist() {
    StorageService.save(StorageService.KEYS.tasks, tasks);
  }

  // ── Rendering ────────────────────────────────────────────────

  /**
   * Build and return an <li> element for a single task.
   * The <li> carries a data-id attribute used by all event handlers.
   * Requirements: 3.4, 3.5, 3.8
   * @param {{ id: string, text: string, done: boolean, createdAt: number }} task
   * @returns {HTMLLIElement}
   */
  function _renderItem(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    li.className  = 'todo-item';

    // Completion checkbox — Req 3.4
    const checkbox = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => _toggleComplete(task.id));

    // Task text span — strikethrough when done (Req 3.4)
    const textSpan = document.createElement('span');
    textSpan.className   = 'todo-text' + (task.done ? ' task-done' : '');
    textSpan.textContent = task.text;

    // Edit button — Req 3.5
    const editBtn = document.createElement('button');
    editBtn.type        = 'button';
    editBtn.className   = 'todo-edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.addEventListener('click', () => _beginEdit(task.id));

    // Delete button — Req 3.8
    const deleteBtn = document.createElement('button');
    deleteBtn.type        = 'button';
    deleteBtn.className   = 'todo-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.addEventListener('click', () => _deleteTask(task.id));

    li.append(checkbox, textSpan, editBtn, deleteBtn);
    return li;
  }

  /**
   * Clear and fully re-render the task list from the in-memory array.
   * Requirements: 3.2, 3.4, 3.8
   */
  function _renderList() {
    if (!_elList) return;
    _elList.innerHTML = '';
    tasks.forEach(task => _elList.appendChild(_renderItem(task)));
  }

  // ── CRUD operations ──────────────────────────────────────────

  /**
   * Show an inline validation error adjacent to #todo-input.
   * Clears automatically on the next input event (Req 3.3).
   * @param {string} message
   */
  function _showInputError(message) {
    // Remove any pre-existing error
    const existing = document.getElementById('todo-input-error');
    if (existing) existing.remove();

    const span       = document.createElement('span');
    span.id          = 'todo-input-error';
    span.className   = 'field-error';
    span.textContent = message;
    span.setAttribute('role', 'alert');

    // Insert immediately after the input inside the form
    if (_elInput && _elInput.parentNode) {
      _elInput.insertAdjacentElement('afterend', span);
    }

    // Clear error on next input event — Req 3.3
    const clearOnce = () => {
      span.remove();
      _elInput.removeEventListener('input', clearOnce);
    };
    if (_elInput) _elInput.addEventListener('input', clearOnce);
  }

  /**
   * Add a new task from user input text.
   * Validates, creates the task object, persists, and re-renders.
   * Requirements: 3.1, 3.2, 3.3
   * @param {string} text
   */
  function _addTask(text) {
    if (!_validateInput(text)) {
      _showInputError('Task cannot be empty.');
      return;
    }

    const task = {
      id:        _generateId(),
      text:      text.trim(),
      done:      false,     // Req 3.2 — always starts incomplete
      createdAt: Date.now(),
    };

    tasks.push(task);
    _persist();      // Req 3.9
    _renderList();

    // Clear the input field after a successful add
    if (_elInput) _elInput.value = '';
  }

  /**
   * Toggle the completion state of a task identified by id.
   * Requirements: 3.4
   * @param {string} id
   */
  function _toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.done = !task.done;
    _persist();    // Req 3.9
    _renderList();
  }

  /**
   * Remove a task by id from both memory and localStorage.
   * Requirements: 3.8, 3.9
   * @param {string} id
   */
  function _deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    _persist();    // Req 3.9
    _renderList();
  }

  /**
   * Enter inline-edit mode for the task with the given id.
   * Replaces the text <span> with a pre-filled <input> and
   * Confirm / Cancel buttons; binds Escape to _cancelEdit.
   * Requirements: 3.5
   * @param {string} id
   */
  function _beginEdit(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Find the <li> for this task in the rendered list
    const li = _elList && _elList.querySelector(`[data-id="${id}"]`);
    if (!li) return;

    const textSpan = li.querySelector('.todo-text');
    const editBtn  = li.querySelector('.todo-edit-btn');
    if (!textSpan || !editBtn) return;

    // Build the inline edit input
    const editInput    = document.createElement('input');
    editInput.type      = 'text';
    editInput.className = 'todo-edit-input';
    editInput.value     = task.text;
    editInput.maxLength = 200;
    editInput.setAttribute('aria-label', 'Edit task text');

    // Confirm button
    const confirmBtn       = document.createElement('button');
    confirmBtn.type        = 'button';
    confirmBtn.className   = 'todo-confirm-btn';
    confirmBtn.textContent = 'Confirm';
    confirmBtn.setAttribute('aria-label', 'Confirm edit');
    confirmBtn.addEventListener('click', () => _confirmEdit(id, editInput.value));

    // Cancel button
    const cancelBtn       = document.createElement('button');
    cancelBtn.type        = 'button';
    cancelBtn.className   = 'todo-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');
    cancelBtn.addEventListener('click', () => _cancelEdit(id));

    // Escape key cancels — Req 3.5
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') _cancelEdit(id);
      if (e.key === 'Enter')  _confirmEdit(id, editInput.value);
    });

    // Swap text span → edit input; swap Edit button → Confirm + Cancel
    textSpan.replaceWith(editInput);
    editBtn.replaceWith(confirmBtn, cancelBtn);

    // Focus the edit input for immediate keyboard interaction
    editInput.focus();
  }

  /**
   * Confirm the pending edit for the task with the given id.
   * Validates the new text; on empty/whitespace retains the original.
   * Requirements: 3.6, 3.7
   * @param {string} id
   * @param {string} text
   */
  function _confirmEdit(id, text) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!_validateInput(text)) {
      // Req 3.7 — reject empty/whitespace; restore original text view
      _renderList();
      return;
    }

    task.text = text.trim();  // Req 3.6
    _persist();               // Req 3.9
    _renderList();
  }

  /**
   * Cancel the pending edit for the task with the given id.
   * Re-renders the list without modifying tasks[].
   * Requirements: 3.5
   * @param {string} id
   */
  function _cancelEdit(id) { // eslint-disable-line no-unused-vars
    _renderList(); // no task mutation — Req 3.5
  }

  // ── Initialisation ───────────────────────────────────────────

  /**
   * Initialise the module: cache DOM refs, attach form submit listener,
   * and render whatever was loaded from storage.
   * Requirements: 3.1, 3.10, 3.11
   */
  function init() {
    _elForm  = document.getElementById('todo-form');
    _elInput = document.getElementById('todo-input');
    _elList  = document.getElementById('todo-list');

    if (_elForm) {
      _elForm.addEventListener('submit', (e) => {
        e.preventDefault();           // Req 3.1 — no page reload on Enter/button
        if (_elInput) _addTask(_elInput.value);
      });
    }

    _renderList();  // Req 3.10 — display tasks loaded from storage
  }

  // Expose public API; internals are exported for unit/PBT testing
  return {
    init,
    _validateInput,
    _addTask,
    _deleteTask,
    _toggleComplete,
    _beginEdit,
    _confirmEdit,
    _cancelEdit,
    _persist,
    _renderList,
    _renderItem,
    // State accessor for testing
    _getTasks: () => tasks,
    _setTasks: (arr) => { tasks = arr; },
  };
})();

/* ─────────────────────────────────────────────────────────────
   QuickLinks — add, display, and delete quick-access link buttons
   Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11
   ───────────────────────────────────────────────────────────── */
const QuickLinks = (() => {
  // ── State ────────────────────────────────────────────────────
  // Req 4.11 — load persisted links on module creation; fall back to [] on null/error
  let links = StorageService.load(StorageService.KEYS.links) ?? [];
  if (!Array.isArray(links)) links = [];

  // ── DOM references — populated in init() ─────────────────────
  let _elForm       = null;
  let _elLabelInput = null;
  let _elUrlInput   = null;
  let _elGrid       = null;

  // ── Helpers ──────────────────────────────────────────────────

  /**
   * Generate a unique ID for a new link.
   * Prefers crypto.randomUUID(); falls back to Date.now() string.
   * @returns {string}
   */
  function _generateId() {
    try {
      return crypto.randomUUID();
    } catch (_) {
      return Date.now().toString();
    }
  }

  /**
   * Validate a new link submission against all business rules.
   * Rules are evaluated in strict priority order per the design.
   * @param {string} label
   * @param {string} url
   * @param {{ id: string, label: string, url: string }[]} existingLinks
   * @returns {{ valid: true } | { valid: false, field: 'label'|'url', message: string }}
   */
  function _validateLink(label, url, existingLinks) {
    // Rule 1 — Req 4.3: empty label
    if (!label || label.trim().length === 0) {
      return { valid: false, field: 'label', message: 'Label cannot be empty.' };
    }

    // Rule 2 — Req 4.3: empty URL
    if (!url || url.trim().length === 0) {
      return { valid: false, field: 'url', message: 'URL cannot be empty.' };
    }

    // Rule 3 — Req 4.4: URL must start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return {
        valid:   false,
        field:   'url',
        message: 'URL must begin with http:// or https://',
      };
    }

    // Rule 4 — Req 4.5: duplicate URL
    const isDuplicate = existingLinks.some(link => link.url === url);
    if (isDuplicate) {
      return { valid: false, field: 'url', message: 'This URL is already saved.' };
    }

    // Rule 5 — Req 4.6: maximum 20 links
    if (existingLinks.length >= 20) {
      return {
        valid:   false,
        field:   'url',
        message: 'Maximum of 20 links reached. Delete a link to add a new one.',
      };
    }

    return { valid: true };
  }

  /**
   * Persist the current links array to localStorage.
   * Requirements: 4.9, 4.10
   */
  function _persist() {
    StorageService.save(StorageService.KEYS.links, links);
  }

  // ── Rendering ────────────────────────────────────────────────

  /**
   * Build and return a <div> element containing a link <a> button
   * (opens in a new tab) and a delete control.
   * Requirements: 4.2, 4.7, 4.8
   * @param {{ id: string, label: string, url: string }} link
   * @returns {HTMLDivElement}
   */
  function _renderButton(link) {
    const wrapper = document.createElement('div');
    wrapper.className = 'link-item';
    wrapper.dataset.id = link.id;

    // Link anchor — Req 4.7: opens in a new tab
    const anchor = document.createElement('a');
    anchor.href             = link.url;
    anchor.target           = '_blank';
    anchor.rel              = 'noopener noreferrer';
    anchor.className        = 'link-btn';
    anchor.textContent      = link.label;
    anchor.setAttribute('aria-label', `Open ${link.label}`);

    // Delete button — Req 4.8
    const deleteBtn         = document.createElement('button');
    deleteBtn.type          = 'button';
    deleteBtn.className     = 'link-delete-btn';
    deleteBtn.textContent   = '×';
    deleteBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
    deleteBtn.addEventListener('click', () => _deleteLink(link.id));

    wrapper.append(anchor, deleteBtn);
    return wrapper;
  }

  /**
   * Clear and fully re-render the links grid from the in-memory array.
   * Requirements: 4.2, 4.8
   */
  function _renderLinks() {
    if (!_elGrid) return;
    _elGrid.innerHTML = '';
    links.forEach(link => _elGrid.appendChild(_renderButton(link)));
  }

  // ── CRUD operations ──────────────────────────────────────────

  /**
   * Show an inline validation error adjacent to the relevant input field.
   * Clears automatically on the next input event on that field.
   * Requirements: 4.3, 4.4, 4.5, 4.6
   * @param {'label'|'url'} field
   * @param {string} message
   */
  function _showFieldError(field, message) {
    const errorId = `link-${field}-error`;
    const targetInput = field === 'label' ? _elLabelInput : _elUrlInput;

    // Remove any pre-existing error for this field
    const existing = document.getElementById(errorId);
    if (existing) existing.remove();

    const span       = document.createElement('span');
    span.id          = errorId;
    span.className   = 'field-error';
    span.textContent = message;
    span.setAttribute('role', 'alert');

    if (targetInput && targetInput.parentNode) {
      targetInput.insertAdjacentElement('afterend', span);
    }

    // Clear error on next input event
    const clearOnce = () => {
      span.remove();
      targetInput.removeEventListener('input', clearOnce);
    };
    if (targetInput) targetInput.addEventListener('input', clearOnce);
  }

  /**
   * Add a new link from the form inputs.
   * Validates all rules; on failure shows inline error; on success
   * creates the Link object, persists, and re-renders.
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.9
   * @param {string} label
   * @param {string} url
   */
  function _addLink(label, url) {
    const result = _validateLink(label, url, links);

    if (!result.valid) {
      _showFieldError(result.field, result.message);
      return;
    }

    const link = {
      id:    _generateId(),
      label: label.trim(),
      url:   url,           // URL is kept as-is (already validated)
    };

    links.push(link);
    _persist();       // Req 4.9
    _renderLinks();

    // Clear both inputs on success
    if (_elLabelInput) _elLabelInput.value = '';
    if (_elUrlInput)   _elUrlInput.value   = '';
  }

  /**
   * Remove a link by id from both memory and localStorage.
   * Requirements: 4.8, 4.10
   * @param {string} id
   */
  function _deleteLink(id) {
    links = links.filter(l => l.id !== id);
    _persist();    // Req 4.10
    _renderLinks();
  }

  // ── Initialisation ───────────────────────────────────────────

  /**
   * Initialise the module: cache DOM refs, attach form submit listener,
   * and render whatever was loaded from storage.
   * Requirements: 4.1, 4.11
   */
  function init() {
    _elForm       = document.getElementById('quick-links-form');
    _elLabelInput = document.getElementById('link-label-input');
    _elUrlInput   = document.getElementById('link-url-input');
    _elGrid       = document.getElementById('links-grid');

    if (_elForm) {
      _elForm.addEventListener('submit', (e) => {
        e.preventDefault();  // no page reload on Enter/button
        const label = _elLabelInput ? _elLabelInput.value : '';
        const url   = _elUrlInput   ? _elUrlInput.value   : '';
        _addLink(label, url);
      });
    }

    _renderLinks();  // Req 4.11 — display links loaded from storage
  }

  // Expose public API; internals are also exported for unit/PBT testing
  return {
    init,
    _validateLink,
    _addLink,
    _deleteLink,
    _renderButton,
    _renderLinks,
    _persist,
    // State accessor for testing
    _getLinks: () => links,
    _setLinks: (arr) => { links = arr; },
  };
})();

/* ─────────────────────────────────────────────────────────────
   App — bootstrap coordinator
   Requirements: 5.3, 5.4
   ───────────────────────────────────────────────────────────── */
const App = (() => {
  /**
   * Initialise the entire dashboard.
   * Called once the DOM is fully parsed (DOMContentLoaded).
   *
   * 1. Check localStorage availability (Req 5.3, 5.4).
   *    If unavailable, reveal #storage-banner with a warning message.
   * 2. Initialise each feature module in order.
   */
  function init() {
    // Req 5.3, 5.4 — warn the user if localStorage is unavailable
    if (!StorageService.isAvailable()) {
      const banner = document.getElementById('storage-banner');
      if (banner) {
        banner.textContent = 'Warning: Local Storage is unavailable. Your tasks and links will not be saved.';
        banner.hidden      = false;
      }
    }

    // Initialise feature panels in order
    GreetingPanel.init();
    FocusTimer.init();
    TodoList.init();
    QuickLinks.init();
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────────
   Bootstrap — kick everything off once the DOM is ready
   ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => App.init());
