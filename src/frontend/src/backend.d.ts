import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Category {
    id: bigint;
    weight: bigint;
    name: string;
}
export interface TaskCompletion {
    id: bigint;
    completedAt: bigint;
    taskId: bigint;
}
export interface Task {
    id: bigint;
    categoryId: bigint;
    frequencyType: FrequencyType;
    name: string;
    weeklyCount: bigint;
}
export interface AppSettings {
    redThreshold: bigint;
    weeklyBarWeeks: bigint;
    maxWeeklyFreq: bigint;
    dailyBarDays: bigint;
    daysPerWeek: bigint;
    amberThreshold: bigint;
}
export interface UserProfile {
    name: string;
}
export enum FrequencyType {
    daily = "daily",
    weekly = "weekly"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTaskCompletion(taskId: bigint, completedAt: bigint): Promise<TaskCompletion>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCategory(name: string, weight: bigint): Promise<Category>;
    createTask(name: string, categoryId: bigint, frequencyType: FrequencyType, weeklyCount: bigint): Promise<Task>;
    deleteCategory(id: bigint): Promise<void>;
    deleteTask(id: bigint): Promise<void>;
    deleteTaskCompletion(id: bigint): Promise<void>;
    getAllCategories(): Promise<Array<Category>>;
    getAllTasks(): Promise<Array<Task>>;
    getAppSettings(): Promise<AppSettings>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategory(id: bigint): Promise<Category | null>;
    getTask(id: bigint): Promise<Task | null>;
    getTaskCompletionsInRange(startTimestamp: bigint, endTimestamp: bigint): Promise<Array<TaskCompletion>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateAppSettings(settings: AppSettings): Promise<void>;
    updateCategory(category: Category): Promise<Category>;
    updateTask(task: Task): Promise<Task>;
}
