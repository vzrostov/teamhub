import { PRIORITY_LABELS, STATUS_LABELS, getNextStatus } from "./data.js";
import { formatDate } from "./formatters.js";

export function createTaskDialog(options) {
  const {
    onAdvance,
    onDelete,
    onEdit,
    root,
  } = options;

  const elements = {
    advance: root.querySelector("#advance-task"),
    assignee: root.querySelector("#task-dialog-assignee"),
    close: root.querySelector("[data-close-dialog]"),
    delete: root.querySelector("#delete-task"),
    description: root.querySelector("#task-dialog-description"),
    dueDate: root.querySelector("#task-dialog-due-date"),
    edit: root.querySelector("#edit-task"),
    priority: root.querySelector("#task-dialog-priority"),
    status: root.querySelector("#task-dialog-status"),
    title: root.querySelector("#task-dialog-title"),
  };

  let selectedTaskId = null;

  function close() {
    if (root.open) {
      root.close();
    }
  }

  function open(task) {
    if (!task) {
      return;
    }

    selectedTaskId = task.id;
    elements.status.textContent = STATUS_LABELS[task.status] ?? task.status;
    elements.title.textContent = task.title;
    elements.description.textContent = task.description?.trim() || "No description provided.";
    elements.assignee.textContent = task.assignee || "Unassigned";
    elements.priority.textContent = PRIORITY_LABELS[task.priority] ?? "Not set";
    elements.dueDate.textContent = formatDate(task.dueDate);

    const nextStatus = getNextStatus(task.status);
    elements.advance.hidden = !nextStatus;
    if (nextStatus) {
      elements.advance.textContent = `Move to ${STATUS_LABELS[nextStatus]}`;
    }

    root.showModal();
  }

  elements.close.addEventListener("click", close);
  elements.edit.addEventListener("click", () => {
    if (selectedTaskId) {
      const taskId = selectedTaskId;
      close();
      onEdit(taskId);
    }
  });
  elements.advance.addEventListener("click", () => {
    if (selectedTaskId) {
      const taskId = selectedTaskId;
      close();
      onAdvance(taskId);
    }
  });
  elements.delete.addEventListener("click", () => {
    if (selectedTaskId) {
      const taskId = selectedTaskId;
      close();
      onDelete(taskId);
    }
  });
  root.addEventListener("click", (event) => {
    if (event.target === root) {
      close();
    }
  });
  root.addEventListener("close", () => {
    selectedTaskId = null;
  });

  return Object.freeze({ close, open });
}
