import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type Category,
  FrequencyType,
  type Task,
  computeDailyFactor,
  computeWeeklyFactor,
  endOfDayNs,
  getThresholdColor,
  startOfDayNs,
  useAppSettings,
  useCategories,
  useDashboardCompletions,
  useTasks,
} from "../hooks/useQueries";

// ── Donut chart with center label ───────────────────────────────────────────
function DonutChart({
  pct,
  color,
  onClick,
}: {
  pct: number;
  color: string;
  onClick: () => void;
}) {
  const data = [{ value: pct }, { value: Math.max(0, 100 - pct) }];
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
      style={{ width: 160, height: 160 }}
      data-ocid="dashboard.chart_point"
    >
      <PieChart width={160} height={160}>
        <Pie
          data={data}
          cx={75}
          cy={75}
          innerRadius={52}
          outerRadius={70}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        >
          <Cell fill={color} />
          <Cell fill="#E6E7EA" />
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-extrabold" style={{ color }}>
          {pct}%
        </span>
        <span className="text-xs text-muted-foreground">complete</span>
      </div>
    </button>
  );
}

// ── Bar chart ────────────────────────────────────────────────────────────────
function CompletionBar({
  data,
  label,
}: { data: { label: string; pct: number; color: string }[]; label: string }) {
  const chartData = data.map((d) => ({
    name: d.label,
    pct: d.pct,
    fill: d.color,
  }));
  return (
    <div className="flex flex-col gap-1 flex-1">
      <span className="text-xs font-medium text-muted-foreground mb-1">
        {label}
      </span>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v: number) => [`${v}%`, "Completion"]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: chart data has no stable id
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Drill-down modal ──────────────────────────────────────────────────────────
function DrillDownModal({
  open,
  onClose,
  title,
  completedTasks,
  incompleteTasks,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  completedTasks: Task[];
  incompleteTasks: Task[];
  categories: Category[];
}) {
  const [catFilter, setCatFilter] = useState("all");
  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id.toString(), c.name])),
    [categories],
  );

  const filterTasks = (tasks: Task[]) =>
    catFilter === "all"
      ? tasks
      : tasks.filter((t) => t.categoryId.toString() === catFilter);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="dashboard.dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Category:</span>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger
              className="w-44 h-8 text-sm"
              data-ocid="dashboard.select"
            >
              <SelectValue />
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
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-app-green mb-2">
              ✓ Completed ({filterTasks(completedTasks).length})
            </h4>
            {filterTasks(completedTasks).length === 0 ? (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="dashboard.empty_state"
              >
                No completed tasks in this view.
              </p>
            ) : (
              <ul className="space-y-1">
                {filterTasks(completedTasks).map((t) => (
                  <li
                    key={t.id.toString()}
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/40"
                  >
                    <span>{t.name}</span>
                    <Badge
                      variant="outline"
                      className="text-xs text-muted-foreground"
                    >
                      {catMap.get(t.categoryId.toString()) ?? "—"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-app-red mb-2">
              ○ Not Yet Completed ({filterTasks(incompleteTasks).length})
            </h4>
            {filterTasks(incompleteTasks).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All tasks completed! 🎉
              </p>
            ) : (
              <ul className="space-y-1">
                {filterTasks(incompleteTasks).map((t) => (
                  <li
                    key={t.id.toString()}
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/40"
                  >
                    <span className="text-muted-foreground">{t.name}</span>
                    <Badge
                      variant="outline"
                      className="text-xs text-muted-foreground"
                    >
                      {catMap.get(t.categoryId.toString()) ?? "—"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: settings } = useAppSettings();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: allCompletions = [], isLoading: completionsLoading } =
    useDashboardCompletions();
  const { data: categories = [] } = useCategories();

  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);

  const red = Number(settings?.redThreshold ?? 60n);
  const amber = Number(settings?.amberThreshold ?? 80n);
  const daysPerWeek = Number(settings?.daysPerWeek ?? 7n);
  const dailyBarDays = Number(settings?.dailyBarDays ?? 6n);
  const weeklyBarWeeks = Number(settings?.weeklyBarWeeks ?? 4n);

  const dailyTasks = tasks.filter(
    (t) => t.frequencyType === FrequencyType.daily,
  );
  const weeklyTasks = tasks.filter(
    (t) => t.frequencyType === FrequencyType.weekly,
  );

  const todayDailyPct = useMemo(
    () =>
      computeDailyFactor(
        allCompletions,
        dailyTasks,
        startOfDayNs(0),
        endOfDayNs(0),
      ),
    [allCompletions, dailyTasks],
  );
  const dailyColor = getThresholdColor(todayDailyPct, red, amber);

  const weeklyPct = useMemo(() => {
    const weekStart = BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000) * 1_000_000n;
    const weekEnd = BigInt(Date.now()) * 1_000_000n;
    return computeWeeklyFactor(
      allCompletions,
      tasks,
      daysPerWeek,
      weekStart,
      weekEnd,
    );
  }, [allCompletions, tasks, daysPerWeek]);
  const weeklyColor = getThresholdColor(weeklyPct, red, amber);

  const dailyBarData = useMemo(() => {
    return Array.from({ length: dailyBarDays }, (_, i) => {
      const daysAgo = i + 1;
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const pct = computeDailyFactor(
        allCompletions,
        dailyTasks,
        startOfDayNs(daysAgo),
        endOfDayNs(daysAgo),
      );
      const label = d
        .toLocaleDateString("en", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
        .replace(",", "");
      return { label, pct, color: getThresholdColor(pct, red, amber) };
    }).reverse();
  }, [allCompletions, dailyTasks, dailyBarDays, red, amber]);

  const weeklyBarData = useMemo(() => {
    return Array.from({ length: weeklyBarWeeks }, (_, i) => {
      const weeksAgo = i + 1;
      const weekStart =
        BigInt(Date.now() - weeksAgo * 7 * 24 * 60 * 60 * 1000) * 1_000_000n;
      const weekEnd =
        BigInt(Date.now() - (weeksAgo - 1) * 7 * 24 * 60 * 60 * 1000) *
        1_000_000n;
      const pct = computeWeeklyFactor(
        allCompletions,
        tasks,
        daysPerWeek,
        weekStart,
        weekEnd,
      );
      const d = new Date(Date.now() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
      const label = `Wk ${d.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
      return { label, pct, color: getThresholdColor(pct, red, amber) };
    }).reverse();
  }, [allCompletions, tasks, daysPerWeek, weeklyBarWeeks, red, amber]);

  // Modal data
  const todayStart = startOfDayNs(0);
  const todayEnd = endOfDayNs(0);
  const todayCompletions = allCompletions.filter(
    (c) => c.completedAt >= todayStart && c.completedAt <= todayEnd,
  );
  const completedDailyTaskIds = new Set(
    todayCompletions.map((c) => c.taskId.toString()),
  );
  const completedDailyTasks = dailyTasks.filter((t) =>
    completedDailyTaskIds.has(t.id.toString()),
  );
  const incompleteDailyTasks = dailyTasks.filter(
    (t) => !completedDailyTaskIds.has(t.id.toString()),
  );

  const weekStart = BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000) * 1_000_000n;
  const weekEnd = BigInt(Date.now()) * 1_000_000n;
  const weekCompletions = allCompletions.filter(
    (c) => c.completedAt >= weekStart && c.completedAt <= weekEnd,
  );
  const weekCompletionCountByTask = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of weekCompletions) {
      const key = c.taskId.toString();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [weekCompletions]);

  const weeklyCompletedTasks = tasks.filter((t) => {
    const count = weekCompletionCountByTask.get(t.id.toString()) ?? 0;
    const target =
      t.frequencyType === FrequencyType.daily
        ? daysPerWeek
        : Number(t.weeklyCount);
    return count >= target;
  });
  const weeklyIncompleteTasks = tasks.filter((t) => {
    const count = weekCompletionCountByTask.get(t.id.toString()) ?? 0;
    const target =
      t.frequencyType === FrequencyType.daily
        ? daysPerWeek
        : Number(t.weeklyCount);
    return count < target;
  });

  const isLoading = tasksLoading || completionsLoading;

  return (
    <div>
      {/* Hero strip */}
      <div className="bg-app-hero border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <h1 className="text-4xl font-extrabold text-app-charcoal">
            Good{" "}
            {new Date().getHours() < 12
              ? "Morning"
              : new Date().getHours() < 18
                ? "Afternoon"
                : "Evening"}{" "}
            👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length} habits tracked · {dailyTasks.length} daily ·{" "}
            {weeklyTasks.length} weekly
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <Skeleton
                key={i}
                className="h-64 rounded-xl"
                data-ocid="dashboard.loading_state"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Section */}
            <div className="bg-card rounded-xl shadow-card p-6 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-foreground">
                Daily Completion Factor
              </h2>
              <div className="flex items-center gap-6">
                <DonutChart
                  pct={todayDailyPct}
                  color={dailyColor}
                  onClick={() => setDailyModalOpen(true)}
                />
                <CompletionBar
                  data={dailyBarData}
                  label={`Last ${dailyBarDays} days`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {completedDailyTasks.length} of {dailyTasks.length} daily tasks
                completed today · Click chart for details
              </p>
            </div>

            {/* Weekly Section */}
            <div className="bg-card rounded-xl shadow-card p-6 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-foreground">
                Weekly Completion Factor
              </h2>
              <div className="flex items-center gap-6">
                <DonutChart
                  pct={weeklyPct}
                  color={weeklyColor}
                  onClick={() => setWeeklyModalOpen(true)}
                />
                <CompletionBar
                  data={weeklyBarData}
                  label={`Last ${weeklyBarWeeks} weeks`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {weeklyCompletedTasks.length} of {tasks.length} tasks met their
                weekly target · Click chart for details
              </p>
            </div>
          </div>
        )}
      </div>

      <DrillDownModal
        open={dailyModalOpen}
        onClose={() => setDailyModalOpen(false)}
        title="Today's Tasks"
        completedTasks={completedDailyTasks}
        incompleteTasks={incompleteDailyTasks}
        categories={categories}
      />
      <DrillDownModal
        open={weeklyModalOpen}
        onClose={() => setWeeklyModalOpen(false)}
        title="This Week's Tasks"
        completedTasks={weeklyCompletedTasks}
        incompleteTasks={weeklyIncompleteTasks}
        categories={categories}
      />
    </div>
  );
}
