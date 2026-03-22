# Getting Started

Use this document as another example for the markdown viewer.

## Run the Viewer

Start the local server:

```bash
node server.js
```

Then open [http://localhost:3000](http://localhost:3000).

## Add New Markdown Files

1. Create a new markdown file in the `docs` directory.
2. Add its title and path to the `documents` array in `app.js`.
3. Refresh the browser.

## Supported Markdown

The viewer uses `marked`, so common markdown features such as headings, lists, links, code blocks, and blockquotes render correctly.

> This is a simple viewer intended for lightweight documentation.
