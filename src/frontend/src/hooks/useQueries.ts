import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  type AppSettings,
  type Category,
  FrequencyType,
  type Task,
  type TaskCompletion,
} from "../backend";
import { useActor } from "./useActor";

export { FrequencyType };
export type { Category, Task, AppSettings, TaskCompletion };

// ── Time helpers ────────────────────────────────────────────────────────────
export const nowNs = () => BigInt(Date.now()) * 1_000_000n;

export function startOfDayNs(daysAgo = 0): bigint {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return BigInt(d.getTime()) * 1_000_000n;
}

export function endOfDayNs(daysAgo = 0): bigint {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(23, 59, 59, 999);
  return BigInt(d.getTime()) * 1_000_000n;
}

export function startOfWeekNs(weeksAgo = 0): bigint {
  const ms = Date.now() - (weeksAgo * 7 + 7) * 24 * 60 * 60 * 1000;
  return BigInt(ms) * 1_000_000n;
}

export function endOfWeekNs(weeksAgo = 0): bigint {
  const ms = Date.now() - weeksAgo * 7 * 24 * 60 * 60 * 1000;
  return BigInt(ms) * 1_000_000n;
}

// ── Queries ─────────────────────────────────────────────────────────────────
export function useCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => (actor ? actor.getAllCategories() : []),
    enabled: !!actor && !isFetching,
  });
}

export function useTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => (actor ? actor.getAllTasks() : []),
    enabled: !!actor && !isFetching,
  });
}

export function useAppSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<AppSettings>({
    queryKey: ["appSettings"],
    queryFn: async () =>
      actor
        ? actor.getAppSettings()
        : {
            redThreshold: 60n,
            amberThreshold: 80n,
            dailyBarDays: 6n,
            weeklyBarWeeks: 4n,
            daysPerWeek: 7n,
            maxWeeklyFreq: 6n,
          },
    enabled: !!actor && !isFetching,
  });
}

export function useCompletionsInRange(
  startNs: bigint,
  endNs: bigint,
  enabled = true,
) {
  const { actor, isFetching } = useActor();
  return useQuery<TaskCompletion[]>({
    queryKey: ["completions", startNs.toString(), endNs.toString()],
    queryFn: async () =>
      actor ? actor.getTaskCompletionsInRange(startNs, endNs) : [],
    enabled: !!actor && !isFetching && enabled,
  });
}

// Wide range for dashboard (30 days back to now)
export function useDashboardCompletions() {
  const start = BigInt(Date.now() - 30 * 24 * 60 * 60 * 1000) * 1_000_000n;
  const end = nowNs();
  return useCompletionsInRange(start, end);
}

// Today's completions
export function useTodayCompletions() {
  return useCompletionsInRange(startOfDayNs(0), endOfDayNs(0));
}

// This week completions (last 7 days)
export function useWeekCompletions() {
  const start = BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000) * 1_000_000n;
  return useCompletionsInRange(start, nowNs());
}

// ── Computation helpers ──────────────────────────────────────────────────────
export function getThresholdColor(
  pct: number,
  red: number,
  amber: number,
): string {
  if (pct < red) return "#E36D64";
  if (pct <= amber) return "#F59E0B";
  return "#1FA373";
}

/**
 * Daily Completion Factor:
 * For each category: factor = tasks completed today / daily tasks in that category
 * Overall = weighted average across categories (by category weight)
 * Categories with no daily tasks are excluded from the weighted average.
 */
export function computeDailyFactor(
  completions: TaskCompletion[],
  tasks: Task[],
  categories: Category[],
  dayStartNs: bigint,
  dayEndNs: bigint,
): number {
  const dailyTasks = tasks.filter(
    (t) => t.frequencyType === FrequencyType.daily,
  );
  if (dailyTasks.length === 0) return 0;

  const dayCompletions = completions.filter(
    (c) => c.completedAt >= dayStartNs && c.completedAt <= dayEndNs,
  );
  const completedTaskIds = new Set(
    dayCompletions.map((c) => c.taskId.toString()),
  );

  let weightedSum = 0;
  let weightUsed = 0;

  for (const cat of categories) {
    const catDailyTasks = dailyTasks.filter(
      (t) => t.categoryId.toString() === cat.id.toString(),
    );
    if (catDailyTasks.length === 0) continue;

    const completedCount = catDailyTasks.filter((t) =>
      completedTaskIds.has(t.id.toString()),
    ).length;
    const catFactor = completedCount / catDailyTasks.length;
    const w = Number(cat.weight);
    weightedSum += catFactor * w;
    weightUsed += w;
  }

  if (weightUsed === 0) return 0;
  return Math.round((weightedSum / weightUsed) * 100);
}

/**
 * Weekly Completion Factor:
 * For each category:
 *   planned = (daily tasks in category * 7) + sum(weeklyCount for weekly tasks in category)
 *   completed = total completions for tasks in that category over the last 7 days
 *   factor = completed / planned  (can exceed 1 if over-achieved)
 * Overall = weighted average across categories (by category weight)
 * Categories with no planned tasks are excluded from the weighted average.
 */
export function computeWeeklyFactor(
  completions: TaskCompletion[],
  tasks: Task[],
  categories: Category[],
  weekStartNs: bigint,
  weekEndNs: bigint,
): number {
  const weekCompletions = completions.filter(
    (c) => c.completedAt >= weekStartNs && c.completedAt <= weekEndNs,
  );

  const completionCountByTask = new Map<string, number>();
  for (const c of weekCompletions) {
    const key = c.taskId.toString();
    completionCountByTask.set(key, (completionCountByTask.get(key) ?? 0) + 1);
  }

  let weightedSum = 0;
  let weightUsed = 0;

  for (const cat of categories) {
    const catTasks = tasks.filter(
      (t) => t.categoryId.toString() === cat.id.toString(),
    );
    if (catTasks.length === 0) continue;

    const planned = catTasks.reduce((sum, t) => {
      if (t.frequencyType === FrequencyType.daily) return sum + 7;
      return sum + Number(t.weeklyCount);
    }, 0);
    if (planned === 0) continue;

    const completed = catTasks.reduce((sum, t) => {
      return sum + (completionCountByTask.get(t.id.toString()) ?? 0);
    }, 0);

    const catFactor = completed / planned; // can exceed 1 for over-achievement
    const w = Number(cat.weight);
    weightedSum += catFactor * w;
    weightUsed += w;
  }

  if (weightUsed === 0) return 0;
  return Math.min(100, Math.round((weightedSum / weightUsed) * 100));
}

// ── Mutations ────────────────────────────────────────────────────────────────
export function useCreateCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, weight }: { name: string; weight: bigint }) =>
      actor!.createCategory(name, weight),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
    },
    onError: () => toast.error("Failed to create category"),
  });
}

export function useUpdateCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (category: Category) => actor!.updateCategory(category),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
    },
    onError: () => toast.error("Failed to update category"),
  });
}

export function useDeleteCategory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: () => toast.error("Failed to delete category"),
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: {
      name: string;
      categoryId: bigint;
      frequencyType: FrequencyType;
      weeklyCount: bigint;
    }) =>
      actor!.createTask(t.name, t.categoryId, t.frequencyType, t.weeklyCount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
    },
    onError: () => toast.error("Failed to create task"),
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: Task) => actor!.updateTask(task),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated");
    },
    onError: () => toast.error("Failed to update task"),
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: () => toast.error("Failed to delete task"),
  });
}

export function useAddTaskCompletion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      completedAt,
    }: { taskId: bigint; completedAt: bigint }) =>
      actor!.addTaskCompletion(taskId, completedAt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["completions"] });
      toast.success("Task marked complete");
    },
    onError: () => toast.error("Failed to mark task complete"),
  });
}

export function useDeleteTaskCompletion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteTaskCompletion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["completions"] });
      toast.success("Completion removed");
    },
    onError: () => toast.error("Failed to remove completion"),
  });
}

export function useUpdateAppSettings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: AppSettings) => actor!.updateAppSettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appSettings"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });
}
