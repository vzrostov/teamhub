export const STATUS_LABELS = Object.freeze({
  todo: "Todo",
  "in-progress": "In progress",
  done: "Done",
});

export const PRIORITY_LABELS = Object.freeze({
  low: "Low",
  medium: "Medium",
  high: "High",
});

export const ASSIGNEES = Object.freeze({
  "mr-x": "Mr X",
  "ms-q": "Ms Q",
  "mr-y": "Mr Y",
  "ms-d": "Ms D",
});

export const INITIAL_TASKS = Object.freeze([
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
]);

export function getNextStatus(status) {
  if (status === "todo") {
    return "in-progress";
  }

  if (status === "in-progress") {
    return "done";
  }

  return null;
}
