import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  type AppSettings,
  type Category,
  FrequencyType,
  type Task,
  useAppSettings,
  useCategories,
  useCreateCategory,
  useCreateTask,
  useDeleteCategory,
  useDeleteTask,
  useTasks,
  useUpdateAppSettings,
  useUpdateCategory,
  useUpdateTask,
} from "../hooks/useQueries";

// ── Category Form Dialog ──────────────────────────────────────────────────────
function CategoryDialog({
  open,
  onClose,
  initial,
  onSave,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Category;
  onSave: (name: string, weight: bigint) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [weight, setWeight] = useState(initial ? Number(initial.weight) : 0);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), BigInt(weight));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-ocid="categories.dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Category" : "New Category"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Health & Fitness"
              data-ocid="categories.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-weight">Weight (%)</Label>
            <Input
              id="cat-weight"
              type="number"
              min={0}
              max={100}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              data-ocid="categories.input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="categories.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim()}
            data-ocid="categories.save_button"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Task Form Dialog ──────────────────────────────────────────────────────────
function TaskDialog({
  open,
  onClose,
  initial,
  categories,
  maxWeeklyFreq,
  onSave,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Task;
  categories: Category[];
  maxWeeklyFreq: number;
  onSave: (data: {
    name: string;
    categoryId: bigint;
    frequencyType: FrequencyType;
    weeklyCount: bigint;
  }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [catId, setCatId] = useState(
    initial?.categoryId.toString() ?? categories[0]?.id.toString() ?? "",
  );
  const [freq, setFreq] = useState<FrequencyType>(
    initial?.frequencyType ?? FrequencyType.daily,
  );
  const [weeklyCount, setWeeklyCount] = useState(
    initial ? Number(initial.weeklyCount) : 1,
  );

  const handleSave = () => {
    if (!name.trim() || !catId) return;
    onSave({
      name: name.trim(),
      categoryId: BigInt(catId),
      frequencyType: freq,
      weeklyCount: BigInt(freq === FrequencyType.weekly ? weeklyCount : 1),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-ocid="tasks.dialog">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Task Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning meditation"
              data-ocid="tasks.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={catId} onValueChange={setCatId}>
              <SelectTrigger data-ocid="tasks.select">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id.toString()} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Frequency</Label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="freq"
                  checked={freq === FrequencyType.daily}
                  onChange={() => setFreq(FrequencyType.daily)}
                  className="accent-app-green"
                  data-ocid="tasks.radio"
                />
                <span className="text-sm">Daily (7×/week)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="freq"
                  checked={freq === FrequencyType.weekly}
                  onChange={() => setFreq(FrequencyType.weekly)}
                  className="accent-app-green"
                  data-ocid="tasks.radio"
                />
                <span className="text-sm">Weekly</span>
              </label>
            </div>
          </div>
          {freq === FrequencyType.weekly && (
            <div className="space-y-1.5">
              <Label>Times per week (1–{maxWeeklyFreq})</Label>
              <Input
                type="number"
                min={1}
                max={maxWeeklyFreq}
                value={weeklyCount}
                onChange={(e) =>
                  setWeeklyCount(
                    Math.max(
                      1,
                      Math.min(maxWeeklyFreq, Number(e.target.value)),
                    ),
                  )
                }
                data-ocid="tasks.input"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="tasks.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim() || !catId}
            data-ocid="tasks.save_button"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Categories Tab ────────────────────────────────────────────────────────────
function CategoriesTab() {
  const { data: categories = [], isLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [showCreate, setShowCreate] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const totalWeight = categories.reduce((s, c) => s + Number(c.weight), 0);
  const isValid = totalWeight === 100;

  const handleCreate = (name: string, weight: bigint) => {
    createCat.mutate(
      { name, weight },
      { onSuccess: () => setShowCreate(false) },
    );
  };

  const handleUpdate = (name: string, weight: bigint) => {
    if (!editCat) return;
    updateCat.mutate(
      { ...editCat, name, weight },
      { onSuccess: () => setEditCat(null) },
    );
  };

  const handleDelete = (id: bigint) => {
    deleteCat.mutate(id, { onSuccess: () => setDeletingId(null) });
  };

  if (isLoading)
    return <Skeleton className="h-48" data-ocid="categories.loading_state" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Total weight:</span>
          <span
            className={`text-sm font-bold ${
              isValid ? "text-app-green" : "text-app-red"
            }`}
          >
            {totalWeight}%
          </span>
          {!isValid && (
            <span
              className="flex items-center gap-1 text-xs text-app-red"
              data-ocid="categories.error_state"
            >
              <AlertTriangle size={12} /> Must total 100%
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="bg-app-charcoal text-white"
          data-ocid="categories.open_modal_button"
        >
          <Plus size={14} className="mr-1" /> Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="categories.empty_state"
        >
          <p className="font-medium">No categories yet</p>
          <p className="text-sm mt-1">Add your first category above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, idx) => (
            <div
              key={cat.id.toString()}
              className="bg-card rounded-xl shadow-card px-5 py-4 flex items-center gap-4"
              data-ocid={`categories.item.${idx + 1}`}
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{cat.name}</p>
              </div>
              <Badge className="bg-app-green/10 text-app-green border-0 font-semibold">
                {Number(cat.weight)}%
              </Badge>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setEditCat(cat)}
                  data-ocid={`categories.edit_button.${idx + 1}`}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => setDeletingId(cat.id)}
                  data-ocid={`categories.delete_button.${idx + 1}`}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
        isPending={createCat.isPending}
      />
      {editCat && (
        <CategoryDialog
          open={!!editCat}
          onClose={() => setEditCat(null)}
          initial={editCat}
          onSave={handleUpdate}
          isPending={updateCat.isPending}
        />
      )}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(v) => !v && setDeletingId(null)}
      >
        <AlertDialogContent data-ocid="categories.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="categories.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId !== null && handleDelete(deletingId)}
              data-ocid="categories.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const maxWeeklyFreq = Number(settings?.maxWeeklyFreq ?? 6n);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const catMap = new Map(categories.map((c) => [c.id.toString(), c.name]));

  if (isLoading)
    return <Skeleton className="h-48" data-ocid="tasks.loading_state" />;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="bg-app-charcoal text-white"
          data-ocid="tasks.open_modal_button"
        >
          <Plus size={14} className="mr-1" /> Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="tasks.empty_state"
        >
          <p className="font-medium">No tasks yet</p>
          <p className="text-sm mt-1">Add your first habit task above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, idx) => (
            <div
              key={task.id.toString()}
              className="bg-card rounded-xl shadow-card px-5 py-4 flex items-center gap-4"
              data-ocid={`tasks.item.${idx + 1}`}
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{task.name}</p>
                <p className="text-xs text-muted-foreground">
                  {catMap.get(task.categoryId.toString()) ?? "—"}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  task.frequencyType === FrequencyType.daily
                    ? "border-blue-200 text-blue-600"
                    : "border-purple-200 text-purple-600"
                }
              >
                {task.frequencyType === FrequencyType.daily
                  ? "Daily"
                  : `${Number(task.weeklyCount)}×/wk`}
              </Badge>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setEditTask(task)}
                  data-ocid={`tasks.edit_button.${idx + 1}`}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => setDeletingId(task.id)}
                  data-ocid={`tasks.delete_button.${idx + 1}`}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        categories={categories}
        maxWeeklyFreq={maxWeeklyFreq}
        onSave={(data) =>
          createTask.mutate(data, { onSuccess: () => setShowCreate(false) })
        }
        isPending={createTask.isPending}
      />
      {editTask && (
        <TaskDialog
          open={!!editTask}
          onClose={() => setEditTask(null)}
          initial={editTask}
          categories={categories}
          maxWeeklyFreq={maxWeeklyFreq}
          onSave={(data) =>
            updateTask.mutate(
              { ...editTask, ...data },
              { onSuccess: () => setEditTask(null) },
            )
          }
          isPending={updateTask.isPending}
        />
      )}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(v) => !v && setDeletingId(null)}
      >
        <AlertDialogContent data-ocid="tasks.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="tasks.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deletingId !== null &&
                deleteTask.mutate(deletingId, {
                  onSuccess: () => setDeletingId(null),
                })
              }
              data-ocid="tasks.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const { data: settings, isLoading } = useAppSettings();
  const updateSettings = useUpdateAppSettings();

  const [red, setRed] = useState("");
  const [amber, setAmber] = useState("");
  const [dailyDays, setDailyDays] = useState("");
  const [weeklyWeeks, setWeeklyWeeks] = useState("");
  const [daysPerWk, setDaysPerWk] = useState("");
  const [maxFreq, setMaxFreq] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setRed(String(Number(settings.redThreshold)));
    setAmber(String(Number(settings.amberThreshold)));
    setDailyDays(String(Number(settings.dailyBarDays)));
    setWeeklyWeeks(String(Number(settings.weeklyBarWeeks)));
    setDaysPerWk(String(Number(settings.daysPerWeek)));
    setMaxFreq(String(Number(settings.maxWeeklyFreq)));
    setInitialized(true);
  }

  const redN = Number(red);
  const amberN = Number(amber);
  const validThresholds = amberN > redN;

  const handleSave = () => {
    if (!validThresholds) return;
    const s: AppSettings = {
      redThreshold: BigInt(redN),
      amberThreshold: BigInt(amberN),
      dailyBarDays: BigInt(Number(dailyDays)),
      weeklyBarWeeks: BigInt(Number(weeklyWeeks)),
      daysPerWeek: BigInt(Number(daysPerWk)),
      maxWeeklyFreq: BigInt(Number(maxFreq)),
    };
    updateSettings.mutate(s);
  };

  if (isLoading)
    return <Skeleton className="h-48" data-ocid="settings.loading_state" />;

  return (
    <div className="max-w-lg space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="red-threshold">Red threshold (%)</Label>
          <Input
            id="red-threshold"
            type="number"
            min={0}
            max={99}
            value={red}
            onChange={(e) => setRed(e.target.value)}
            data-ocid="settings.input"
          />
          <p className="text-xs text-muted-foreground">Below this = red</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amber-threshold">Amber threshold (%)</Label>
          <Input
            id="amber-threshold"
            type="number"
            min={1}
            max={100}
            value={amber}
            onChange={(e) => setAmber(e.target.value)}
            data-ocid="settings.input"
          />
          <p className="text-xs text-muted-foreground">Below this = amber</p>
        </div>
      </div>

      {!validThresholds && (
        <p
          className="text-xs text-app-red flex items-center gap-1"
          data-ocid="settings.error_state"
        >
          <AlertTriangle size={12} /> Amber threshold must be greater than red
          threshold
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="daily-days">Daily bar chart (days)</Label>
          <Input
            id="daily-days"
            type="number"
            min={1}
            max={30}
            value={dailyDays}
            onChange={(e) => setDailyDays(e.target.value)}
            data-ocid="settings.input"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weekly-weeks">Weekly bar chart (weeks)</Label>
          <Input
            id="weekly-weeks"
            type="number"
            min={1}
            max={12}
            value={weeklyWeeks}
            onChange={(e) => setWeeklyWeeks(e.target.value)}
            data-ocid="settings.input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="days-per-week">Days per week (daily tasks)</Label>
          <Input
            id="days-per-week"
            type="number"
            min={1}
            max={7}
            value={daysPerWk}
            onChange={(e) => setDaysPerWk(e.target.value)}
            data-ocid="settings.input"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="max-freq">Max weekly frequency</Label>
          <Input
            id="max-freq"
            type="number"
            min={1}
            max={7}
            value={maxFreq}
            onChange={(e) => setMaxFreq(e.target.value)}
            data-ocid="settings.input"
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={updateSettings.isPending || !validThresholds}
        className="bg-app-charcoal text-white"
        data-ocid="settings.save_button"
      >
        {updateSettings.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {updateSettings.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}

// ── Definitions page ──────────────────────────────────────────────────────────
export default function Definitions() {
  return (
    <div>
      {/* Hero strip */}
      <div className="bg-app-hero border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <h1 className="text-4xl font-extrabold text-app-charcoal">
            Definitions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage categories, tasks, and app settings
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Tabs defaultValue="categories" data-ocid="definitions.panel">
          <TabsList className="mb-6">
            <TabsTrigger value="categories" data-ocid="definitions.tab">
              Categories
            </TabsTrigger>
            <TabsTrigger value="tasks" data-ocid="definitions.tab">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="settings" data-ocid="definitions.tab">
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>
          <TabsContent value="tasks">
            <TasksTab />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
