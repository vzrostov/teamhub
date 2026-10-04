# TeamHub

TeamHub is a responsive workspace for tracking projects, tasks, team members,
and recent activity.

## Current implementation

- Semantic HTML document structure
- Responsive layout for mobile, tablet, and desktop screens
- Project dashboard and task board
- Dynamic task creation and status transitions
- Search, status filtering, and assignee filtering
- Task details dialog and task deletion
- Browser storage for task persistence
- Team overview and activity feed
- Keyboard-visible focus states and a skip link
- Reduced-motion preference support

The application runs entirely in the browser and does not require a backend.
Task data is stored in the browser with `localStorage`.

## Run locally

No installation or build step is required. Run the directory through a local
HTTP server so browser storage has a stable origin.

From the parent directory, run:

```bash
python3 -m http.server 8080 --directory teamhub
```

Then open `http://localhost:8080`.

## Project structure

```text
teamhub/
├── app.js
├── index.html
├── styles.css
└── README.md
```

## Browser support

The interface targets current versions of Chrome, Edge, Firefox, and Safari.
JavaScript and browser storage must be enabled.
