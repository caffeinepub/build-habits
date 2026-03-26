# Build Habits

## Current State
New project. No existing application files.

## Requested Changes (Diff)

### Add
- **Definitions Page**: 
  - Category manager: add/edit/delete categories with name and weight (%). Total weight must equal 100%.
  - Task manager: add/edit/delete tasks with name, assigned category, frequency type (Daily/Weekly), and for Weekly tasks: planned completions per week (configurable range, default 1–6).
- **Updates Page**: View all tasks filterable by Category, Frequency, and Completion status (Completed/Incomplete). Mark tasks as completed. Weekly tasks can exceed planned completions.
- **Dashboard Page**:
  - Daily Completion Factor pie chart. Clickable drill-down: completed/incomplete tasks for today, filterable by category.
  - Bar chart: last N days' daily completion factors (N configurable, default 6).
  - Weekly Completion Factor pie chart. Clickable drill-down: completed/incomplete tasks for the week, filterable by category.
  - Bar chart: last M weeks' weekly completion factors (M configurable, default 4).
  - Color coding: configurable thresholds (default: <60% Red, 61–80% Amber, >80% Green).
- **Settings Section** (within Definitions page or separate tab):
  - Red threshold (default 60%)
  - Amber threshold (default 80%)
  - Daily bar chart days count (default 6)
  - Weekly bar chart weeks count (default 4)
  - Days per week for "daily" tasks (default 7)
  - Max weekly frequency allowed per task (default 6)
- **About Page**: Objective, purpose, and feature overview.

### Modify
- None

### Remove
- None

## Implementation Plan
1. Backend (Motoko):
   - Data types: Category (id, name, weight), Task (id, name, categoryId, frequencyType, weeklyCount), TaskCompletion (id, taskId, completedAt: Int timestamp), AppSettings (redThreshold, amberThreshold, dailyBarDays, weeklyBarWeeks, daysPerWeek, maxWeeklyFreq)
   - CRUD for categories; validate weights sum to 100%
   - CRUD for tasks
   - Record/delete task completions with timestamps
   - Query completions by date range
   - Get/update AppSettings

2. Frontend:
   - Navigation: Dashboard | Updates | Definitions | About
   - Definitions page with two tabs: Categories, Tasks. Plus a Settings tab for app-wide config.
   - Updates page: task list with filter bar (category, frequency, completion). Click to toggle completion.
   - Dashboard: 2x [pie + bar] layout with drill-down modals and category filters. All thresholds and chart ranges driven by settings.
   - About page: static content.
   - Use recharts for all charts.
