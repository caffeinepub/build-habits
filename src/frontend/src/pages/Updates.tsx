import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  FrequencyType,
  type Task,
  type TaskCompletion,
  nowNs,
  useAddTaskCompletion,
  useCategories,
  useDeleteTaskCompletion,
  useTasks,
  useTodayCompletions,
  useWeekCompletions,
} from "../hooks/useQueries";

type FreqFilter = "all" | "daily" | "weekly";
type CompFilter = "all" | "completed" | "incomplete";

export default function Updates() {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: categories = [] } = useCategories();
  const { data: todayCompletions = [], isLoading: todayLoading } =
    useTodayCompletions();
  const { data: weekCompletions = [] } = useWeekCompletions();

  const addCompletion = useAddTaskCompletion();
  const deleteCompletion = useDeleteTaskCompletion();

  const [catFilter, setCatFilter] = useState("all");
  const [freqFilter, setFreqFilter] = useState<FreqFilter>("all");
  const [compFilter, setCompFilter] = useState<CompFilter>("all");

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id.toString(), c])),
    [categories],
  );

  const todayByTask = useMemo(() => {
    const map = new Map<string, TaskCompletion[]>();
    for (const c of todayCompletions) {
      const key = c.taskId.toString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [todayCompletions]);

  const weekByTask = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of weekCompletions) {
      const key = c.taskId.toString();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [weekCompletions]);

  const isDailyCompleted = (t: Task) =>
    (todayByTask.get(t.id.toString()) ?? []).length > 0;
  const isWeeklyMet = (t: Task) =>
    (weekByTask.get(t.id.toString()) ?? 0) >= Number(t.weeklyCount);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (catFilter !== "all" && t.categoryId.toString() !== catFilter)
        return false;
      if (freqFilter !== "all" && t.frequencyType !== freqFilter) return false;
      if (compFilter === "completed") {
        if (t.frequencyType === FrequencyType.daily) {
          return (todayByTask.get(t.id.toString()) ?? []).length > 0;
        }
        return (weekByTask.get(t.id.toString()) ?? 0) >= Number(t.weeklyCount);
      }
      if (compFilter === "incomplete") {
        if (t.frequencyType === FrequencyType.daily) {
          return (todayByTask.get(t.id.toString()) ?? []).length === 0;
        }
        return (weekByTask.get(t.id.toString()) ?? 0) < Number(t.weeklyCount);
      }
      return true;
    });
  }, [tasks, catFilter, freqFilter, compFilter, todayByTask, weekByTask]);

  const handleToggleDaily = async (task: Task) => {
    const completions = todayByTask.get(task.id.toString()) ?? [];
    if (completions.length > 0) {
      await deleteCompletion.mutateAsync(
        completions[completions.length - 1].id,
      );
    } else {
      await addCompletion.mutateAsync({
        taskId: task.id,
        completedAt: nowNs(),
      });
    }
  };

  const handleAddWeeklyCompletion = async (task: Task) => {
    await addCompletion.mutateAsync({ taskId: task.id, completedAt: nowNs() });
  };

  const handleUndoWeekly = async (task: Task) => {
    const todayList = todayByTask.get(task.id.toString()) ?? [];
    if (todayList.length > 0) {
      await deleteCompletion.mutateAsync(todayList[todayList.length - 1].id);
    }
  };

  const isLoading = tasksLoading || todayLoading;

  return (
    <div>
      <div className="bg-app-hero border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <h1 className="text-4xl font-extrabold text-app-charcoal">Updates</h1>
          <p className="text-muted-foreground mt-1">
            Track your daily progress and mark habits complete
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div
          className="flex flex-wrap items-center gap-3 mb-6"
          data-ocid="updates.panel"
        >
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-44 h-9" data-ocid="updates.select">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id.toString()} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={freqFilter}
            onValueChange={(v) => setFreqFilter(v as FreqFilter)}
          >
            <SelectTrigger className="w-36 h-9" data-ocid="updates.select">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frequencies</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={compFilter}
            onValueChange={(v) => setCompFilter(v as CompFilter)}
          >
            <SelectTrigger className="w-40 h-9" data-ocid="updates.select">
              <SelectValue placeholder="Completion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
            </SelectContent>
          </Select>

          <span className="ml-auto text-sm text-muted-foreground">
            {filteredTasks.length} tasks
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="h-16 rounded-xl"
                data-ocid="updates.loading_state"
              />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground"
            data-ocid="updates.empty_state"
          >
            <p className="text-lg font-medium">No tasks match your filters</p>
            <p className="text-sm mt-1">Try adjusting the filters above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task, idx) => {
              const cat = catMap.get(task.categoryId.toString());
              const isDaily = task.frequencyType === FrequencyType.daily;
              const dailyDone = isDailyCompleted(task);
              const weekCount = weekByTask.get(task.id.toString()) ?? 0;
              const weekTarget = Number(task.weeklyCount);
              const weekDone = isWeeklyMet(task);
              const todayList = todayByTask.get(task.id.toString()) ?? [];

              return (
                <div
                  key={task.id.toString()}
                  className={`bg-card rounded-xl shadow-card px-5 py-4 flex items-center gap-4 transition-all ${
                    (isDaily && dailyDone) || (!isDaily && weekDone)
                      ? "opacity-70"
                      : ""
                  }`}
                  data-ocid={`updates.item.${idx + 1}`}
                >
                  {isDaily ? (
                    <Checkbox
                      checked={dailyDone}
                      onCheckedChange={() => handleToggleDaily(task)}
                      className="h-5 w-5"
                      data-ocid={`updates.checkbox.${idx + 1}`}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-full"
                        onClick={() => handleAddWeeklyCompletion(task)}
                        data-ocid={`updates.primary_button.${idx + 1}`}
                      >
                        <Plus size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded-full"
                        onClick={() => handleUndoWeekly(task)}
                        disabled={todayList.length === 0}
                        data-ocid={`updates.secondary_button.${idx + 1}`}
                      >
                        <RotateCcw size={12} />
                      </Button>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-sm ${
                        (isDaily && dailyDone) || (!isDaily && weekDone)
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat?.name ?? "Uncategorized"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isDaily
                          ? "border-blue-200 text-blue-600"
                          : "border-purple-200 text-purple-600"
                      }`}
                    >
                      {isDaily ? "Daily" : "Weekly"}
                    </Badge>
                    {!isDaily && (
                      <span
                        className={`text-xs font-semibold ${
                          weekDone
                            ? "text-app-green"
                            : weekCount > 0
                              ? "text-app-amber"
                              : "text-app-red"
                        }`}
                      >
                        {weekCount}/{weekTarget}×
                      </span>
                    )}
                    {isDaily && dailyDone && (
                      <span className="text-xs font-semibold text-app-green">
                        ✓ Done
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
