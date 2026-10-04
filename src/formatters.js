export function formatDate(value) {
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

export function getLocalDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createTaskId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `task-${Date.now()}`;
}

export function getNextTaskTitle(tasks) {
  const highestNumber = tasks.reduce((currentHighest, task) => {
    const match = /^Task (\d+)$/.exec(task.title);
    return match ? Math.max(currentHighest, Number(match[1])) : currentHighest;
  }, 0);

  return `Task ${highestNumber + 1}`;
}
