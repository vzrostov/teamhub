import { ASSIGNEES, STATUS_LABELS, getNextStatus } from "./data.js";
import {
  createTaskId,
  getLocalDateValue,
  getNextTaskTitle,
} from "./formatters.js";
import { createNotifier } from "./notifications.js";
import { createTaskBoard } from "./task-board.js";
import { createTaskDialog } from "./task-dialog.js";
import { createTaskStore } from "./task-store.js";

const elements = {
  assigneeFilter: document.querySelector("#assignee-filter"),
  board: document.querySelector(".task-board"),
  cancelEdit: document.querySelector("#cancel-task-edit"),
  clearFilters: document.querySelector("#clear-filters"),
  completedTodayCount: document.querySelector("#completed-today-count"),
  createForm: document.querySelector("#create-task-form"),
  dialog: document.querySelector("#task-dialog"),
  formHeading: document.querySelector("#create-task-heading"),
  formMessage: document.querySelector("#task-form-message"),
  message: document.querySelector("#app-message"),
  openTaskCount: document.querySelector("#open-task-count"),
  resultCount: document.querySelector("#filter-result-count"),
  search: document.querySelector("#task-search"),
  signOutForm: document.querySelector("#sign-out-form"),
  statusFilter: document.querySelector("#status-filter"),
  submitTask: document.querySelector("#submit-task"),
};

const store = createTaskStore();
const notifier = createNotifier(elements.message);
let editingTaskId = null;

function getFilters() {
  return {
    assignee: elements.assigneeFilter.value,
    search: elements.search.value,
    status: elements.statusFilter.value,
  };
}

const board = createTaskBoard({
  completedTodayCount: elements.completedTodayCount,
  onOpen: (taskId) => dialog.open(store.getById(taskId)),
  openTaskCount: elements.openTaskCount,
  resultCount: elements.resultCount,
  root: elements.board,
});

const dialog = createTaskDialog({
  onAdvance: advanceTask,
  onDelete: deleteTask,
  onEdit: startEditing,
  root: elements.dialog,
});

function persistenceNote(persisted) {
  return persisted ? "" : " Changes are available for this session only.";
}

function renderCurrentTasks() {
  board.render(store.getTasks(), getFilters());
}

function readTaskValues() {
  const values = Object.fromEntries(new FormData(elements.createForm).entries());
  const {
    assigneeId,
    description,
    dueDate,
    priority,
    status,
    title,
  } = values;

  return {
    assignee: ASSIGNEES[String(assigneeId)] ?? "",
    description: String(description).trim(),
    dueDate: String(dueDate),
    priority: String(priority),
    status: String(status),
    title: String(title).trim(),
  };
}

function resetFormMode() {
  editingTaskId = null;
  elements.formHeading.textContent = "Create a task";
  elements.submitTask.textContent = "Create task";
  elements.cancelEdit.hidden = true;
  elements.formMessage.textContent = "";
}

function startEditing(taskId) {
  const task = store.getById(taskId);
  if (!task) {
    return;
  }

  const assigneeEntry = Object.entries(ASSIGNEES)
    .find(([, name]) => name === task.assignee);

  editingTaskId = task.id;
  elements.createForm.elements.namedItem("title").value = task.title;
  elements.createForm.elements.namedItem("description").value = task.description;
  elements.createForm.elements.namedItem("status").value = task.status;
  elements.createForm.elements.namedItem("priority").value = task.priority;
  elements.createForm.elements.namedItem("assigneeId").value = assigneeEntry?.[0] ?? "";
  elements.createForm.elements.namedItem("dueDate").value = task.dueDate;
  elements.formHeading.textContent = `Edit ${task.title}`;
  elements.submitTask.textContent = "Save changes";
  elements.cancelEdit.hidden = false;
  elements.formMessage.textContent = "";
  elements.createForm.scrollIntoView({ behavior: "smooth", block: "start" });
  elements.createForm.elements.namedItem("title").focus();
}

function handleTaskSubmit(event) {
  event.preventDefault();

  if (!elements.createForm.reportValidity()) {
    elements.formMessage.textContent = "Complete the required fields.";
    return;
  }

  const values = readTaskValues();

  if (editingTaskId) {
    const currentTask = store.getById(editingTaskId);
    if (!currentTask) {
      resetFormMode();
      return;
    }

    const completedAt = values.status === "done"
      ? currentTask.completedAt ?? getLocalDateValue()
      : null;
    const result = store.update(editingTaskId, { ...values, completedAt });

    if (result) {
      notifier.show(
        `${result.task.title} was updated.${persistenceNote(result.persisted)}`,
      );
    }
  } else {
    const task = {
      ...values,
      completedAt: values.status === "done" ? getLocalDateValue() : null,
      id: createTaskId(),
      title: values.title || getNextTaskTitle(store.getTasks()),
    };
    const result = store.add(task);
    notifier.show(
      `${result.task.title} added to ${STATUS_LABELS[result.task.status]}.${persistenceNote(result.persisted)}`,
    );
  }

  elements.createForm.reset();
  resetFormMode();
}

function advanceTask(taskId) {
  const task = store.getById(taskId);
  const nextStatus = getNextStatus(task?.status);
  if (!task || !nextStatus) {
    return;
  }

  const result = store.update(taskId, {
    completedAt: nextStatus === "done" ? getLocalDateValue() : null,
    status: nextStatus,
  });

  if (result) {
    notifier.show(
      `${result.task.title} moved to ${STATUS_LABELS[nextStatus]}.${persistenceNote(result.persisted)}`,
    );
  }
}

function deleteTask(taskId) {
  const result = store.remove(taskId);
  if (!result) {
    return;
  }

  notifier.show(
    `${result.task.title} was deleted.${persistenceNote(result.persisted)}`,
    {
      actionLabel: "Undo",
      duration: 6000,
      onAction: () => {
        const restored = store.restore(result.task, result.index);
        if (restored) {
          notifier.show(
            `${restored.task.title} was restored.${persistenceNote(restored.persisted)}`,
          );
        }
      },
    },
  );
}

function clearFilters() {
  elements.search.value = "";
  elements.statusFilter.value = "all";
  elements.assigneeFilter.value = "all";
  renderCurrentTasks();
  elements.search.focus();
}

elements.search.addEventListener("input", renderCurrentTasks);
elements.statusFilter.addEventListener("change", renderCurrentTasks);
elements.assigneeFilter.addEventListener("change", renderCurrentTasks);
elements.clearFilters.addEventListener("click", clearFilters);
elements.createForm.addEventListener("submit", handleTaskSubmit);
elements.createForm.addEventListener("reset", () => {
  window.setTimeout(resetFormMode, 0);
});
elements.cancelEdit.addEventListener("click", () => {
  elements.createForm.reset();
  resetFormMode();
});
elements.signOutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  notifier.show("Sign out requires an active account session.");
});

store.subscribe((tasks) => board.render(tasks, getFilters()));
