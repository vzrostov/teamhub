import { INITIAL_TASKS } from "./data.js";
import { loadTasks, saveTasks } from "./storage.js";

export function createTaskStore() {
  let tasks = loadTasks(INITIAL_TASKS);
  const subscribers = new Set();

  function getTasks() {
    return structuredClone(tasks);
  }

  function getById(taskId) {
    const task = tasks.find(({ id }) => id === taskId);
    return task ? structuredClone(task) : null;
  }

  function notify() {
    const snapshot = getTasks();
    subscribers.forEach((subscriber) => subscriber(snapshot));
  }

  function commit(nextTasks) {
    tasks = nextTasks;
    const persisted = saveTasks(tasks);
    notify();
    return persisted;
  }

  function add(task) {
    const nextTask = structuredClone(task);
    const persisted = commit([...tasks, nextTask]);
    return { task: structuredClone(nextTask), persisted };
  }

  function update(taskId, changes) {
    const { id: ignoredId, ...safeChanges } = changes;
    void ignoredId;
    let updatedTask = null;

    const nextTasks = tasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      updatedTask = { ...task, ...safeChanges, id: task.id };
      return updatedTask;
    });

    if (!updatedTask) {
      return null;
    }

    const persisted = commit(nextTasks);
    return { task: structuredClone(updatedTask), persisted };
  }

  function remove(taskId) {
    const index = tasks.findIndex(({ id }) => id === taskId);
    if (index < 0) {
      return null;
    }

    const removedTask = structuredClone(tasks[index]);
    const nextTasks = tasks.filter(({ id }) => id !== taskId);
    const persisted = commit(nextTasks);

    return { task: removedTask, index, persisted };
  }

  function restore(task, index) {
    if (tasks.some(({ id }) => id === task.id)) {
      return null;
    }

    const nextTasks = [...tasks];
    const safeIndex = Math.min(Math.max(index, 0), nextTasks.length);
    nextTasks.splice(safeIndex, 0, structuredClone(task));
    const persisted = commit(nextTasks);

    return { task: structuredClone(task), persisted };
  }

  function subscribe(subscriber) {
    subscribers.add(subscriber);
    subscriber(getTasks());

    return () => subscribers.delete(subscriber);
  }

  return Object.freeze({
    add,
    getById,
    getTasks,
    remove,
    restore,
    subscribe,
    update,
  });
}
