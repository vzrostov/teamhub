const STORAGE_KEY = "teamhub.tasks.v1";

export function loadTasks(fallbackTasks) {
  try {
    const savedValue = localStorage.getItem(STORAGE_KEY);
    if (!savedValue) {
      return structuredClone(fallbackTasks);
    }

    const parsedValue = JSON.parse(savedValue);
    return Array.isArray(parsedValue)
      ? parsedValue
      : structuredClone(fallbackTasks);
  } catch {
    return structuredClone(fallbackTasks);
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}
