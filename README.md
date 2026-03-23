# Markdown Viewer

Created by Atul Purohit (<gonewiththeway@gmail.com>).

Simple two-panel markdown viewer:

- left panel shows markdown file links
- left panel includes a markdown upload button
- left panel also generates a table of contents from the selected file
- right panel renders the full markdown as HTML
- clicking a heading in the table of contents scrolls to that section
- uploaded files are loaded in the browser only
- no tracking, analytics, sync, or cloud upload
- can be loaded as a Chrome extension

## Run

```bash
node server.js
```

Open [http://localhost:3000](http://localhost:3000).

## Add another markdown file

1. Put a new `.md` file inside `docs/`
2. Add an entry to the `documents` array in `app.js`
3. Refresh the page

## Upload a markdown file

Use the upload button in the sidebar to open a local `.md` file without adding it to the project. The file is read in the browser and is not saved back to the server.

## Chrome extension

This project now includes a Chrome extension manifest and service worker.

Load it in Chrome:

1. Open `chrome://extensions`
2. Turn on Developer mode
3. Click Load unpacked
4. Select `/Users/atulpurohit/workspace/personal/mdtohtml`
5. Click the extension icon to open the viewer in a new tab

Create a zip package:

```bash
npm run package-extension
```

That produces `dist/markdown-viewer-extension.zip`.

## Repackage after changes

From `/Users/atulpurohit/workspace/personal/mdtohtml` run:

```bash
npm run package-extension
```

The updated extension zip will be written to `dist/markdown-viewer-extension.zip`.
