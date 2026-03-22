# Project Overview

This sample markdown file shows how the viewer renders headings and builds a table of contents automatically.

## What It Does

The left panel has two jobs:

- load a markdown document
- generate a table of contents from that document
- let readers jump directly to a section on the right

## Why This Layout Works

The content stays visible while navigation remains fixed on the left side. That makes long documents easier to scan.

### Quick Navigation

Each heading becomes a link in the table of contents.

### Minimal Setup

The app is just static HTML, CSS, JavaScript, and plain markdown files.

## Notes

You can add more `.md` files inside the `docs` folder and register them in `app.js`.
