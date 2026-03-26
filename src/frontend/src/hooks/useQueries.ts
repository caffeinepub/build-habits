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

export function computeDailyFactor(
  completions: TaskCompletion[],
  dailyTasks: Task[],
  dayStartNs: bigint,
  dayEndNs: bigint,
): number {
  if (dailyTasks.length === 0) return 0;
  const dayCompletions = completions.filter(
    (c) => c.completedAt >= dayStartNs && c.completedAt <= dayEndNs,
  );
  const dailyTaskIds = new Set(dailyTasks.map((t) => t.id));
  const completed = new Set(
    dayCompletions
      .filter((c) => dailyTaskIds.has(c.taskId))
      .map((c) => c.taskId),
  );
  return Math.round((completed.size / dailyTasks.length) * 100);
}

export function computeWeeklyFactor(
  completions: TaskCompletion[],
  tasks: Task[],
  daysPerWeek: number,
  weekStartNs: bigint,
  weekEndNs: bigint,
): number {
  const dailyTasks = tasks.filter(
    (t) => t.frequencyType === FrequencyType.daily,
  );
  const weeklyTasks = tasks.filter(
    (t) => t.frequencyType === FrequencyType.weekly,
  );
  const planned =
    dailyTasks.length * daysPerWeek +
    weeklyTasks.reduce((sum, t) => sum + Number(t.weeklyCount), 0);
  if (planned === 0) return 0;
  const weekCompletions = completions.filter(
    (c) => c.completedAt >= weekStartNs && c.completedAt <= weekEndNs,
  );
  return Math.min(100, Math.round((weekCompletions.length / planned) * 100));
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
