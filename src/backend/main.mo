import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile type
  public type UserProfile = {
    name : Text;
  };

  // Data types
  type Category = {
    id : Nat;
    name : Text;
    weight : Nat;
  };

  type FrequencyType = {
    #daily;
    #weekly;
  };

  type Task = {
    id : Nat;
    name : Text;
    categoryId : Nat;
    frequencyType : FrequencyType;
    weeklyCount : Nat;
  };

  type TaskCompletion = {
    id : Nat;
    taskId : Nat;
    completedAt : Int;
  };

  type AppSettings = {
    redThreshold : Nat;
    amberThreshold : Nat;
    dailyBarDays : Nat;
    weeklyBarWeeks : Nat;
    daysPerWeek : Nat;
    maxWeeklyFreq : Nat;
  };

  // User-scoped data storage
  type UserData = {
    categories : Map.Map<Nat, Category>;
    tasks : Map.Map<Nat, Task>;
    taskCompletions : Map.Map<Nat, TaskCompletion>;
    nextId : Nat;
    appSettings : AppSettings;
  };

  // Storage per user
  let userDataStore = Map.empty<Principal, UserData>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Get or initialize user data
  func getUserData(user : Principal) : UserData {
    switch (userDataStore.get(user)) {
      case (?data) { data };
      case (null) {
        let newData : UserData = {
          categories = Map.empty<Nat, Category>();
          tasks = Map.empty<Nat, Task>();
          taskCompletions = Map.empty<Nat, TaskCompletion>();
          nextId = 0;
          appSettings = {
            redThreshold = 50;
            amberThreshold = 75;
            dailyBarDays = 7;
            weeklyBarWeeks = 4;
            daysPerWeek = 7;
            maxWeeklyFreq = 7;
          };
        };
        userDataStore.add(user, newData);
        newData;
      };
    };
  };

  // Update user data
  func setUserData(user : Principal, data : UserData) {
    userDataStore.add(user, data);
  };

  // Get new ID for a user
  func getNextId(user : Principal) : Nat {
    let data = getUserData(user);
    let id = data.nextId;
    let updatedData = {
      categories = data.categories;
      tasks = data.tasks;
      taskCompletions = data.taskCompletions;
      nextId = data.nextId + 1;
      appSettings = data.appSettings;
    };
    setUserData(user, updatedData);
    id;
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Category CRUD
  public shared ({ caller }) func createCategory(name : Text, weight : Nat) : async Category {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create categories");
    };
    if (weight > 100) { Runtime.trap("Weight cannot exceed 100") };
    
    let id = getNextId(caller);
    let category : Category = {
      id;
      name;
      weight;
    };
    
    let data = getUserData(caller);
    data.categories.add(id, category);
    setUserData(caller, data);
    category;
  };

  public query ({ caller }) func getCategory(id : Nat) : async ?Category {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view categories");
    };
    let data = getUserData(caller);
    data.categories.get(id);
  };

  public query ({ caller }) func getAllCategories() : async [Category] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view categories");
    };
    let data = getUserData(caller);
    data.categories.values().toArray();
  };

  public shared ({ caller }) func updateCategory(category : Category) : async Category {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update categories");
    };
    let data = getUserData(caller);
    switch (data.categories.get(category.id)) {
      case (null) { Runtime.trap("Category not found") };
      case (_) {
        data.categories.add(category.id, category);
        setUserData(caller, data);
        category;
      };
    };
  };

  public shared ({ caller }) func deleteCategory(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete categories");
    };
    let data = getUserData(caller);
    data.categories.remove(id);
    setUserData(caller, data);
  };

  // Task CRUD
  public shared ({ caller }) func createTask(name : Text, categoryId : Nat, frequencyType : FrequencyType, weeklyCount : Nat) : async Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tasks");
    };
    let id = getNextId(caller);
    let task : Task = {
      id;
      name;
      categoryId;
      frequencyType;
      weeklyCount;
    };
    let data = getUserData(caller);
    data.tasks.add(id, task);
    setUserData(caller, data);
    task;
  };

  public query ({ caller }) func getTask(id : Nat) : async ?Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };
    let data = getUserData(caller);
    data.tasks.get(id);
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };
    let data = getUserData(caller);
    data.tasks.values().toArray();
  };

  public shared ({ caller }) func updateTask(task : Task) : async Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tasks");
    };
    let data = getUserData(caller);
    switch (data.tasks.get(task.id)) {
      case (null) { Runtime.trap("Task not found") };
      case (_) {
        data.tasks.add(task.id, task);
        setUserData(caller, data);
        task;
      };
    };
  };

  public shared ({ caller }) func deleteTask(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasks");
    };
    let data = getUserData(caller);
    data.tasks.remove(id);
    setUserData(caller, data);
  };

  // TaskCompletion CRUD
  public shared ({ caller }) func addTaskCompletion(taskId : Nat, completedAt : Int) : async TaskCompletion {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add task completions");
    };
    let id = getNextId(caller);
    let completion : TaskCompletion = {
      id;
      taskId;
      completedAt;
    };
    let data = getUserData(caller);
    data.taskCompletions.add(id, completion);
    setUserData(caller, data);
    completion;
  };

  public shared ({ caller }) func deleteTaskCompletion(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete task completions");
    };
    let data = getUserData(caller);
    data.taskCompletions.remove(id);
    setUserData(caller, data);
  };

  public query ({ caller }) func getTaskCompletionsInRange(startTimestamp : Int, endTimestamp : Int) : async [TaskCompletion] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view task completions");
    };
    let data = getUserData(caller);
    let completionsList = List.empty<TaskCompletion>();
    data.taskCompletions.values().forEach(
      func(completion) {
        if (completion.completedAt >= startTimestamp and completion.completedAt <= endTimestamp) {
          completionsList.add(completion);
        };
      }
    );
    completionsList.toArray();
  };

  // AppSettings
  public query ({ caller }) func getAppSettings() : async AppSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view app settings");
    };
    let data = getUserData(caller);
    data.appSettings;
  };

  public shared ({ caller }) func updateAppSettings(settings : AppSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update app settings");
    };
    let data = getUserData(caller);
    let updatedData = {
      categories = data.categories;
      tasks = data.tasks;
      taskCompletions = data.taskCompletions;
      nextId = data.nextId;
      appSettings = settings;
    };
    setUserData(caller, updatedData);
  };
};
