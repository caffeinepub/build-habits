import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = { name : Text };

  type Category = { id : Nat; name : Text; weight : Nat };
  type FrequencyType = { #daily; #weekly };
  type Task = { id : Nat; name : Text; categoryId : Nat; frequencyType : FrequencyType; weeklyCount : Nat };
  type TaskCompletion = { id : Nat; taskId : Nat; completedAt : Int };
  type AppSettings = { redThreshold : Nat; amberThreshold : Nat; dailyBarDays : Nat; weeklyBarWeeks : Nat; daysPerWeek : Nat; maxWeeklyFreq : Nat };
  type UserData = { categories : Map.Map<Nat, Category>; tasks : Map.Map<Nat, Task>; taskCompletions : Map.Map<Nat, TaskCompletion>; nextId : Nat; appSettings : AppSettings };

  stable let userDataStore = Map.empty<Principal, UserData>();
  stable let userProfiles = Map.empty<Principal, UserProfile>();

  // Auto-register non-anonymous callers as #user on first use
  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    switch (accessControlState.userRoles.get(caller)) {
      case (null) { accessControlState.userRoles.add(caller, #user) };
      case (_) {};
    };
  };

  func getUserData(user : Principal) : UserData {
    switch (userDataStore.get(user)) {
      case (?data) { data };
      case (null) {
        let newData : UserData = {
          categories = Map.empty<Nat, Category>();
          tasks = Map.empty<Nat, Task>();
          taskCompletions = Map.empty<Nat, TaskCompletion>();
          nextId = 0;
          appSettings = { redThreshold = 50; amberThreshold = 75; dailyBarDays = 7; weeklyBarWeeks = 4; daysPerWeek = 7; maxWeeklyFreq = 7 };
        };
        userDataStore.add(user, newData);
        newData;
      };
    };
  };

  func setUserData(user : Principal, data : UserData) { userDataStore.add(user, data) };

  func getNextId(user : Principal) : Nat {
    let data = getUserData(user);
    let id = data.nextId;
    setUserData(user, { categories = data.categories; tasks = data.tasks; taskCompletions = data.taskCompletions; nextId = data.nextId + 1; appSettings = data.appSettings });
    id;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    requireAuth(caller);
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireAuth(caller);
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createCategory(name : Text, weight : Nat) : async Category {
    requireAuth(caller);
    if (weight > 100) { Runtime.trap("Weight cannot exceed 100") };
    let id = getNextId(caller);
    let category : Category = { id; name; weight };
    let data = getUserData(caller);
    data.categories.add(id, category);
    setUserData(caller, data);
    category;
  };

  public query ({ caller }) func getCategory(id : Nat) : async ?Category {
    requireAuth(caller);
    getUserData(caller).categories.get(id);
  };

  public query ({ caller }) func getAllCategories() : async [Category] {
    requireAuth(caller);
    getUserData(caller).categories.values().toArray();
  };

  public shared ({ caller }) func updateCategory(category : Category) : async Category {
    requireAuth(caller);
    let data = getUserData(caller);
    switch (data.categories.get(category.id)) {
      case (null) { Runtime.trap("Category not found") };
      case (_) { data.categories.add(category.id, category); setUserData(caller, data); category };
    };
  };

  public shared ({ caller }) func deleteCategory(id : Nat) : async () {
    requireAuth(caller);
    let data = getUserData(caller);
    data.categories.remove(id);
    setUserData(caller, data);
  };

  public shared ({ caller }) func createTask(name : Text, categoryId : Nat, frequencyType : FrequencyType, weeklyCount : Nat) : async Task {
    requireAuth(caller);
    let id = getNextId(caller);
    let task : Task = { id; name; categoryId; frequencyType; weeklyCount };
    let data = getUserData(caller);
    data.tasks.add(id, task);
    setUserData(caller, data);
    task;
  };

  public query ({ caller }) func getTask(id : Nat) : async ?Task {
    requireAuth(caller);
    getUserData(caller).tasks.get(id);
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    requireAuth(caller);
    getUserData(caller).tasks.values().toArray();
  };

  public shared ({ caller }) func updateTask(task : Task) : async Task {
    requireAuth(caller);
    let data = getUserData(caller);
    switch (data.tasks.get(task.id)) {
      case (null) { Runtime.trap("Task not found") };
      case (_) { data.tasks.add(task.id, task); setUserData(caller, data); task };
    };
  };

  public shared ({ caller }) func deleteTask(id : Nat) : async () {
    requireAuth(caller);
    let data = getUserData(caller);
    data.tasks.remove(id);
    setUserData(caller, data);
  };

  public shared ({ caller }) func addTaskCompletion(taskId : Nat, completedAt : Int) : async TaskCompletion {
    requireAuth(caller);
    let id = getNextId(caller);
    let completion : TaskCompletion = { id; taskId; completedAt };
    let data = getUserData(caller);
    data.taskCompletions.add(id, completion);
    setUserData(caller, data);
    completion;
  };

  public shared ({ caller }) func deleteTaskCompletion(id : Nat) : async () {
    requireAuth(caller);
    let data = getUserData(caller);
    data.taskCompletions.remove(id);
    setUserData(caller, data);
  };

  public query ({ caller }) func getTaskCompletionsInRange(startTimestamp : Int, endTimestamp : Int) : async [TaskCompletion] {
    requireAuth(caller);
    let data = getUserData(caller);
    let completionsList = List.empty<TaskCompletion>();
    data.taskCompletions.values().forEach(func(c) {
      if (c.completedAt >= startTimestamp and c.completedAt <= endTimestamp) { completionsList.add(c) };
    });
    completionsList.toArray();
  };

  public query ({ caller }) func getAppSettings() : async AppSettings {
    requireAuth(caller);
    getUserData(caller).appSettings;
  };

  public shared ({ caller }) func updateAppSettings(settings : AppSettings) : async () {
    requireAuth(caller);
    let data = getUserData(caller);
    setUserData(caller, { categories = data.categories; tasks = data.tasks; taskCompletions = data.taskCompletions; nextId = data.nextId; appSettings = settings });
  };
};
