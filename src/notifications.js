export function createNotifier(root) {
  const text = root.querySelector("#app-message-text");
  const action = root.querySelector("#app-message-action");
  let timeoutId = null;

  function hide() {
    window.clearTimeout(timeoutId);
    timeoutId = null;
    action.onclick = null;
    action.hidden = true;
    root.hidden = true;
  }

  function show(message, options = {}) {
    const {
      actionLabel = "",
      duration = 3500,
      onAction = null,
    } = options;

    hide();
    text.textContent = message;
    root.hidden = false;

    if (actionLabel && onAction) {
      action.textContent = actionLabel;
      action.hidden = false;
      action.onclick = () => {
        hide();
        onAction();
      };
    }

    timeoutId = window.setTimeout(hide, duration);
  }

  return Object.freeze({ hide, show });
}
