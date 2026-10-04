import { PRIORITY_LABELS } from "./data.js";
import { formatDate, getLocalDateValue } from "./formatters.js";

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
  description.textContent = task.description?.trim() || "No description provided.";

  details.append(
    createDefinitionRow("Assignee", task.assignee || "Unassigned"),
    createDefinitionRow("Priority", PRIORITY_LABELS[task.priority] ?? "Not set"),
    createDefinitionRow(
      task.status === "done" ? "Completed" : "Due date",
      formatDate(task.status === "done" ? task.completedAt : task.dueDate),
    ),
  );

  button.className = "button button-secondary";
  button.type = "button";
  button.dataset.action = "view-task";
  button.textContent = "View details";

  card.append(title, description, details, button);
  return card;
}

function filterTasks(tasks, filters) {
  const searchValue = filters.search.trim().toLocaleLowerCase();

  return tasks.filter((task) => {
    const searchableText = `${task.title} ${task.description}`.toLocaleLowerCase();
    const matchesSearch = !searchValue || searchableText.includes(searchValue);
    const matchesStatus = filters.status === "all" || task.status === filters.status;
    const matchesAssignee = filters.assignee === "all"
      || (filters.assignee === "unassigned" && !task.assignee)
      || task.assignee === filters.assignee;

    return matchesSearch && matchesStatus && matchesAssignee;
  });
}

export function createTaskBoard(options) {
  const {
    completedTodayCount,
    onOpen,
    openTaskCount,
    resultCount,
    root,
  } = options;

  const taskLists = root.querySelectorAll("[data-task-list]");
  const taskCounts = root.querySelectorAll("[data-task-count]");

  root.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const button = event.target.closest("[data-action='view-task']");
    const card = button?.closest("[data-task-id]");
    if (card) {
      onOpen(card.dataset.taskId);
    }
  });

  function render(tasks, filters) {
    const filteredTasks = filterTasks(tasks, filters);

    taskLists.forEach((list) => {
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

    taskCounts.forEach((count) => {
      const status = count.dataset.taskCount;
      count.textContent = String(
        filteredTasks.filter((task) => task.status === status).length,
      );
    });

    const today = getLocalDateValue();
    openTaskCount.textContent = String(
      tasks.filter((task) => task.status !== "done").length,
    );
    completedTodayCount.textContent = String(
      tasks.filter((task) => task.completedAt === today).length,
    );
    resultCount.textContent = `${filteredTasks.length} of ${tasks.length} tasks shown.`;
  }

  return Object.freeze({ render });
}
