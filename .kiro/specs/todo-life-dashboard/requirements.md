# Requirements Document

## Introduction

The Todo List Life Dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no backend server, using the Local Storage API for all data persistence. The app serves as a personal productivity hub featuring a time-based greeting, a Pomodoro-style focus timer, a task management list, and a quick-access link panel. It can be used as a standalone web page or as a browser extension.

## Glossary

- **Dashboard**: The single-page web application that hosts all four feature panels.
- **Greeting_Panel**: The UI section that displays the current time, date, and a time-based greeting message.
- **Focus_Timer**: The Pomodoro-style countdown timer component with Start, Stop, and Reset controls.
- **Todo_List**: The task management component that supports adding, editing, completing, and deleting tasks.
- **Quick_Links**: The panel that displays user-saved website shortcut buttons.
- **Local_Storage**: The browser built-in client-side key-value storage API used for all data persistence.
- **Task**: A single to-do item with a text description and a completion state.
- **Link**: A user-defined quick-access entry containing a label and a URL.
- **Session**: A single 25-minute Focus_Timer countdown interval.

---

## Requirements

### Requirement 1: Time and Date Greeting

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the Dashboard, so that I am immediately oriented to the present moment.

#### Acceptance Criteria

1. THE Greeting_Panel SHALL display the current date formatted as the full weekday name, numeric day, full month name, and four-digit year (e.g., "Monday, 26 November 2025").
2. THE Greeting_Panel SHALL display the current time in HH:MM:SS format and update it every second without requiring a page reload.
3. WHEN the local hour is between 05:00 and 11:59 (inclusive), THE Greeting_Panel SHALL display the message "Good Morning".
4. WHEN the local hour is between 12:00 and 17:59 (inclusive), THE Greeting_Panel SHALL display the message "Good Afternoon".
5. WHEN the local hour is between 18:00 and 21:59 (inclusive), THE Greeting_Panel SHALL display the message "Good Evening".
6. WHEN the local hour is between 22:00 and 04:59 (inclusive), THE Greeting_Panel SHALL display the message "Good Night".
7. THE Greeting_Panel SHALL display the time, date, and greeting within 1 second of the page becoming interactive, without requiring any user interaction.
8. IF the system clock is unavailable or returns an invalid value, THEN THE Greeting_Panel SHALL display a fallback message (e.g., "Welcome!") in place of the greeting and suppress the time and date display.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can manage focused work sessions using the Pomodoro technique.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes and 00 seconds (25:00).
2. WHEN the user activates the Start control and the remaining time is greater than 00:00 and the Focus_Timer is not counting down, THE Focus_Timer SHALL begin counting down one second at a time.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown and preserve the remaining time.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop the countdown and restore the display to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visible session-end message to the user.
7. THE Focus_Timer SHALL display remaining time in MM:SS format at all times.
8. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the Start control; WHEN the Focus_Timer is not counting down and the remaining time is greater than 00:00, THE Focus_Timer SHALL enable the Start control.
9. IF the Stop control is activated while the Focus_Timer is not counting down, THEN the Focus_Timer SHALL ignore the activation and preserve the current displayed time.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks, and have those tasks persist across browser sessions, so that I can track my work without losing data on refresh.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a text input field accepting up to 200 characters and a submission control (button click or Enter key) for entering new Task text.
2. WHEN the user submits a new Task, THE Todo_List SHALL add the Task to the list with an incomplete state.
3. IF the user submits an empty or whitespace-only Task, THEN THE Todo_List SHALL reject the submission and display an inline validation message adjacent to the input field; the validation message SHALL be cleared when the user next modifies the input field content.
4. WHEN the user activates the complete control on a Task, THE Todo_List SHALL toggle the Task completion state and apply a strikethrough style to the Task text of completed Tasks.
5. WHEN the user activates the edit control on a Task, THE Todo_List SHALL present the Task text in an editable field pre-filled with the current text; IF the user cancels the edit (via a cancel control or Escape key), THEN THE Todo_List SHALL discard the changes and restore the original Task text.
6. WHEN the user confirms an edit, THE Todo_List SHALL update the Task text in the list and in Local_Storage.
7. IF the user confirms an edit with empty or whitespace-only text, THEN THE Todo_List SHALL reject the update and retain the original Task text.
8. WHEN the user activates the delete control on a Task, THE Todo_List SHALL remove the Task from the list and from Local_Storage.
9. THE Todo_List SHALL persist all Tasks to Local_Storage after every add, edit, complete-toggle, or delete operation.
10. WHEN the Dashboard loads, THE Todo_List SHALL read Tasks from Local_Storage and restore them to the list with their saved completion states.
11. IF Local_Storage data is missing or cannot be parsed on Dashboard load, THEN THE Todo_List SHALL render an empty task list with no error shown to the user.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save favourite website shortcuts and open them with one click, so that I can navigate to frequently used sites without leaving the Dashboard.

#### Acceptance Criteria

1. THE Quick_Links panel SHALL provide an input field for a link label (maximum 50 characters) and an input field for a URL (maximum 2048 characters).
2. WHEN the user submits a new Link, THE Quick_Links panel SHALL add a button labelled with the link label to the panel.
3. IF the user submits a Link with an empty label or empty URL, THEN THE Quick_Links panel SHALL reject the submission and display an inline validation message indicating which field is empty.
4. IF the user submits a Link whose URL does not begin with "http://" or "https://", THEN THE Quick_Links panel SHALL reject the submission and display an inline validation message indicating the URL format requirement.
5. IF the user submits a Link whose URL is identical to an existing saved Link URL, THEN THE Quick_Links panel SHALL reject the submission and display an inline validation message indicating the URL is already saved.
6. IF the number of saved Links has reached 20, THEN THE Quick_Links panel SHALL reject any new submission and display an inline validation message indicating the maximum number of links has been reached.
7. WHEN the user clicks a Link button, THE Dashboard SHALL open the associated URL in a new browser tab.
8. WHEN the user activates the delete control on a Link, THE Quick_Links panel SHALL remove the Link button from the panel and from Local_Storage.
9. WHEN the user adds a Link, THE Quick_Links panel SHALL persist all Links to Local_Storage.
10. WHEN the user deletes a Link, THE Quick_Links panel SHALL persist the remaining Links to Local_Storage.
11. WHEN the Dashboard loads, THE Quick_Links panel SHALL read Links from Local_Storage and restore all saved Link buttons.

---

### Requirement 5: Data Persistence and Storage

**User Story:** As a user, I want all my tasks and links to be saved automatically in the browser, so that my data is not lost when I close or refresh the page.

#### Acceptance Criteria

1. THE Dashboard SHALL use the browser Local Storage API as the sole data store; no server-side storage is permitted.
2. WHEN a Task or Link is created, updated, or deleted, THE Dashboard SHALL immediately write the current full list of Tasks or Links (respectively) to its dedicated Local Storage key before the operation is considered complete.
3. WHEN the Dashboard initializes, THE Dashboard SHALL read Tasks and Links from their respective dedicated Local Storage keys and restore them as the active in-memory state before rendering any content.
4. IF Local Storage is unavailable or throws an error during a read or write operation, THEN THE Dashboard SHALL display a persistent warning banner visible on all views for the remainder of the session, indicating that data will not be saved and will be lost when the page is closed or refreshed.

---

### Requirement 6: Layout and Visual Design

**User Story:** As a user, I want a clean, readable, and visually organised interface, so that I can use the Dashboard comfortably without confusion.

#### Acceptance Criteria

1. THE Dashboard SHALL arrange all four panels (Greeting_Panel, Focus_Timer, Todo_List, Quick_Links) on a single HTML page with no navigation to other pages.
2. THE Dashboard SHALL apply all styles from exactly one CSS file located at css/styles.css.
3. THE Dashboard SHALL execute all behaviour from exactly one JavaScript file located at js/app.js.
4. THE Dashboard SHALL use a legible base font size of at least 14px for body text.
5. THE Dashboard SHALL apply sufficient colour contrast between text and background to meet WCAG 2.1 AA contrast ratio requirements: minimum 4.5:1 for normal text (below 18px regular or 14px bold) and minimum 3:1 for large text (18px or above regular, or 14px or above bold).
6. WHEN the viewport width is 768px or below, THE Dashboard SHALL reflow all four panels into a single-column layout stacked vertically at full available width in the order: Greeting_Panel, Focus_Timer, Todo_List, Quick_Links.
7. WHEN the viewport width is above 768px, THE Dashboard SHALL display panels in a two-column grid layout.

---

### Requirement 7: Browser Compatibility

**User Story:** As a user, I want the Dashboard to work correctly in any modern browser, so that I am not restricted to a specific browser.

#### Acceptance Criteria

1. THE Dashboard SHALL render all UI elements visibly, respond to all interactive controls without uncaught JavaScript exceptions, and produce no console errors in the stable release versions of Chrome, Firefox, Edge, and Safari released within the 12 months prior to the Dashboard release date.
2. THE Dashboard SHALL operate as a standalone web page opened directly from the file system (via file:// protocol) without requiring a web server, using only browser APIs that are unrestricted under the file:// protocol across all four listed browsers.
3. THE Dashboard SHALL not depend on any external JavaScript libraries, CSS frameworks, or CDN-hosted resources.
