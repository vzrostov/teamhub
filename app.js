"use strict";

const STORAGE_KEY = "teamhub.tasks.v1";

const STATUS_LABELS = {
  todo: "Todo",
  "in-progress": "In progress",
  done: "Done",
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const ASSIGNEES = {
  "mr-x": "Mr X",
  "ms-q": "Ms Q",
  "mr-y": "Mr Y",
  "ms-d": "Ms D",
};

const INITIAL_TASKS = [
  {
    id: "task-1",
    title: "Task 1",
    description: "Create the first version of the production release checklist.",
    status: "todo",
    assignee: "Mr X",
    priority: "high",
    dueDate: "2026-10-03",
    completedAt: null,
  },
  {
    id: "task-2",
    title: "Task 2",
    description: "Confirm that all primary actions remain available on a phone.",
    status: "todo",
    assignee: "Mr Y",
    priority: "medium",
    dueDate: "2026-10-07",
    completedAt: null,
  },
  {
    id: "task-3",
    title: "Task 3",
    description: "Add filtering by status, assignee, and search text.",
    status: "in-progress",
    assignee: "Ms Q",
    priority: "high",
    dueDate: "2026-10-05",
    completedAt: null,
  },
  {
    id: "task-4",
    title: "Task 4",
    description: "Agree on the main product areas and navigation hierarchy.",
    status: "done",
    assignee: "Mr X",
    priority: "high",
    dueDate: "2026-09-27",
    completedAt: "2026-09-27",
  },
];

const elements = {
  board: document.querySelector(".task-board"),
  taskLists: document.querySelectorAll("[data-task-list]"),
  taskCounts: document.querySelectorAll("[data-task-count]"),
  openTaskCount: document.querySelector("#open-task-count"),
  completedTodayCount: document.querySelector("#completed-today-count"),
  resultCount: document.querySelector("#filter-result-count"),
  search: document.querySelector("#task-search"),
  statusFilter: document.querySelector("#status-filter"),
  assigneeFilter: document.querySelector("#assignee-filter"),
  clearFilters: document.querySelector("#clear-filters"),
  createForm: document.querySelector("#create-task-form"),
  formMessage: document.querySelector("#task-form-message"),
  dialog: document.querySelector("#task-dialog"),
  dialogStatus: document.querySelector("#task-dialog-status"),
  dialogTitle: document.querySelector("#task-dialog-title"),
  dialogDescription: document.querySelector("#task-dialog-description"),
  dialogAssignee: document.querySelector("#task-dialog-assignee"),
  dialogPriority: document.querySelector("#task-dialog-priority"),
  dialogDueDate: document.querySelector("#task-dialog-due-date"),
  advanceTask: document.querySelector("#advance-task"),
  deleteTask: document.querySelector("#delete-task"),
  closeDialog: document.querySelector("[data-close-dialog]"),
  appMessage: document.querySelector("#app-message"),
  signOutForm: document.querySelector("#sign-out-form"),
};

let tasks = loadTasks();
let selectedTaskId = null;
let messageTimer = null;

function loadTasks() {
  try {
    const savedValue = localStorage.getItem(STORAGE_KEY);
    if (!savedValue) {
      return structuredClone(INITIAL_TASKS);
    }

    const parsedValue = JSON.parse(savedValue);
    return Array.isArray(parsedValue) ? parsedValue : structuredClone(INITIAL_TASKS);
  } catch {
    return structuredClone(INITIAL_TASKS);
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    showMessage("Changes are available for this session only.");
  }
}

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getLocalDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDefinitionRow(term, value) {
  const fragment = document.createDocumentFragment();
  const termElement = document.createElement("dt");
  const valueElement = document.createElement("dd");

  termElement.textContent = term;
  valueElement.textContent = value;
  fragment.append(termElement, valueElement);

  return fragment;
}

function createTaskCard(task) {
  const card = document.createElement("article");
  const title = document.createElement("h5");
  const description = document.createElement("p");
  const details = document.createElement("dl");
  const button = document.createElement("button");

  card.className = "task-card";
  card.dataset.taskId = task.id;

  title.textContent = task.title;
  description.textContent = task.description || "No description provided.";

  details.append(
    createDefinitionRow("Assignee", task.assignee || "Unassigned"),
    createDefinitionRow("Priority", PRIORITY_LABELS[task.priority]),
    createDefinitionRow(task.status === "done" ? "Completed" : "Due date", formatDate(
      task.status === "done" ? task.completedAt : task.dueDate,
    )),
  );

  button.className = "button button-secondary";
  button.type = "button";
  button.dataset.action = "view-task";
  button.textContent = "View details";

  card.append(title, description, details, button);
  return card;
}

function getFilteredTasks() {
  const searchValue = elements.search.value.trim().toLocaleLowerCase();
  const selectedStatus = elements.statusFilter.value;
  const selectedAssignee = elements.assigneeFilter.value;

  return tasks.filter((task) => {
    const searchableText = `${task.title} ${task.description}`.toLocaleLowerCase();
    const matchesSearch = !searchValue || searchableText.includes(searchValue);
    const matchesStatus = selectedStatus === "all" || task.status === selectedStatus;
    const matchesAssignee = selectedAssignee === "all"
      || (selectedAssignee === "unassigned" && !task.assignee)
      || task.assignee === selectedAssignee;

    return matchesSearch && matchesStatus && matchesAssignee;
  });
}

function renderBoard() {
  const filteredTasks = getFilteredTasks();

  elements.taskLists.forEach((list) => {
    const status = list.dataset.taskList;
    const matchingTasks = filteredTasks.filter((task) => task.status === status);

    list.replaceChildren();

    if (matchingTasks.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-state";
      emptyState.textContent = "No matching tasks.";
      list.append(emptyState);
      return;
    }

    matchingTasks.forEach((task) => list.append(createTaskCard(task)));
  });

  elements.taskCounts.forEach((count) => {
    const status = count.dataset.taskCount;
    count.textContent = String(filteredTasks.filter((task) => task.status === status).length);
  });

  elements.resultCount.textContent = `${filteredTasks.length} of ${tasks.length} tasks shown.`;
  updateDashboard();
}

function updateDashboard() {
  const today = getLocalDateValue();
  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const completedToday = tasks.filter((task) => task.completedAt === today).length;

  elements.openTaskCount.textContent = String(openTasks);
  elements.completedTodayCount.textContent = String(completedToday);
}

function getNextTaskTitle() {
  const highestNumber = tasks.reduce((currentHighest, task) => {
    const match = /^Task (\d+)$/.exec(task.title);
    return match ? Math.max(currentHighest, Number(match[1])) : currentHighest;
  }, 0);

  return `Task ${highestNumber + 1}`;
}

function createTaskId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `task-${Date.now()}`;
}

function handleCreateTask(event) {
  event.preventDefault();

  if (!elements.createForm.reportValidity()) {
    elements.formMessage.textContent = "Complete the required fields.";
    return;
  }

  const formData = new FormData(elements.createForm);
  const status = String(formData.get("status"));
  const assigneeId = String(formData.get("assigneeId"));

  const task = {
    id: createTaskId(),
    title: String(formData.get("title")).trim() || getNextTaskTitle(),
    description: String(formData.get("description")).trim(),
    status,
    assignee: ASSIGNEES[assigneeId] || "",
    priority: String(formData.get("priority")),
    dueDate: String(formData.get("dueDate")),
    completedAt: status === "done" ? getLocalDateValue() : null,
  };

  tasks.push(task);
  saveTasks();
  elements.createForm.reset();
  elements.formMessage.textContent = `${task.title} was created.`;
  renderBoard();
  showMessage(`${task.title} added to ${STATUS_LABELS[task.status]}.`);
}

function openTaskDialog(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }

  selectedTaskId = task.id;
  elements.dialogStatus.textContent = STATUS_LABELS[task.status];
  elements.dialogTitle.textContent = task.title;
  elements.dialogDescription.textContent = task.description || "No description provided.";
  elements.dialogAssignee.textContent = task.assignee || "Unassigned";
  elements.dialogPriority.textContent = PRIORITY_LABELS[task.priority];
  elements.dialogDueDate.textContent = formatDate(task.dueDate);

  if (task.status === "done") {
    elements.advanceTask.hidden = true;
  } else {
    const nextStatus = task.status === "todo" ? "in-progress" : "done";
    elements.advanceTask.hidden = false;
    elements.advanceTask.textContent = `Move to ${STATUS_LABELS[nextStatus]}`;
  }

  elements.dialog.showModal();
}

function closeTaskDialog() {
  selectedTaskId = null;
  elements.dialog.close();
}

function advanceSelectedTask() {
  const task = tasks.find((item) => item.id === selectedTaskId);
  if (!task || task.status === "done") {
    return;
  }

  task.status = task.status === "todo" ? "in-progress" : "done";
  task.completedAt = task.status === "done" ? getLocalDateValue() : null;

  saveTasks();
  renderBoard();
  closeTaskDialog();
  showMessage(`${task.title} moved to ${STATUS_LABELS[task.status]}.`);
}

function deleteSelectedTask() {
  const task = tasks.find((item) => item.id === selectedTaskId);
  if (!task) {
    return;
  }

  tasks = tasks.filter((item) => item.id !== selectedTaskId);
  saveTasks();
  renderBoard();
  closeTaskDialog();
  showMessage(`${task.title} was deleted.`);
}

function handleBoardClick(event) {
  const button = event.target.closest("[data-action='view-task']");
  if (!button) {
    return;
  }

  const card = button.closest("[data-task-id]");
  openTaskDialog(card.dataset.taskId);
}

function clearFilters() {
  elements.search.value = "";
  elements.statusFilter.value = "all";
  elements.assigneeFilter.value = "all";
  renderBoard();
  elements.search.focus();
}

function showMessage(message) {
  window.clearTimeout(messageTimer);
  elements.appMessage.textContent = message;
  elements.appMessage.hidden = false;

  messageTimer = window.setTimeout(() => {
    elements.appMessage.hidden = true;
  }, 3500);
}

elements.search.addEventListener("input", renderBoard);
elements.statusFilter.addEventListener("change", renderBoard);
elements.assigneeFilter.addEventListener("change", renderBoard);
elements.clearFilters.addEventListener("click", clearFilters);
elements.createForm.addEventListener("submit", handleCreateTask);
elements.createForm.addEventListener("reset", () => {
  elements.formMessage.textContent = "";
});
elements.board.addEventListener("click", handleBoardClick);
elements.closeDialog.addEventListener("click", closeTaskDialog);
elements.advanceTask.addEventListener("click", advanceSelectedTask);
elements.deleteTask.addEventListener("click", deleteSelectedTask);
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) {
    closeTaskDialog();
  }
});
elements.dialog.addEventListener("close", () => {
  selectedTaskId = null;
});
elements.signOutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showMessage("Sign out requires an active account session.");
});

renderBoard();
