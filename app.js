const defaultDocuments = [
  { title: "Project Overview", path: "./docs/overview.md" },
  { title: "Getting Started", path: "./docs/getting-started.md" },
];

/** After publishing, set your listing review URL (Chrome Web Store item ID in the URL). */
const CHROME_STORE_REVIEW_URL =
  "https://chromewebstore.google.com/detail/markdown-viewer/YOUR_EXTENSION_ID/reviews";

const welcomeScreen = document.getElementById("welcome-screen");
const appShell = document.getElementById("app-shell");
const documentList = document.getElementById("document-list");
const tocContainer = document.getElementById("toc");
const contentContainer = document.getElementById("content");
const documentTitle = document.getElementById("document-title");
const currentDocumentLabel = document.getElementById("current-document-label");
const markdownUploadWelcome = document.getElementById("markdown-upload");
const markdownUploadSidebar = document.getElementById("markdown-upload-sidebar");
const dropZone = document.getElementById("drop-zone");
const rateLink = document.getElementById("rate-link");

marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
  mangle: false,
});

function showViewer() {
  welcomeScreen.classList.add("welcome--hidden");
  welcomeScreen.setAttribute("aria-hidden", "true");
  appShell.classList.remove("app-shell--hidden");
  appShell.setAttribute("aria-hidden", "false");
}

function isMarkdownFile(file) {
  if (!file) {
    return false;
  }
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".md") ||
    name.endsWith(".markdown") ||
    file.type === "text/markdown" ||
    file.type === "text/x-markdown"
  );
}

function makeDocNavLink(title, path) {
  const link = document.createElement("a");
  link.className = "nav-link";
  link.textContent = title;
  if (path) {
    link.href = `?doc=${encodeURIComponent(path)}`;
    link.dataset.path = path;
  } else {
    link.href = "#";
  }
  return link;
}

function renderDefaultDocLinks(activePath) {
  documentList.innerHTML = "";
  defaultDocuments.forEach((doc) => {
    const link = makeDocNavLink(doc.title, doc.path);
    link.addEventListener("click", (event) => {
      event.preventDefault();
      loadMarkdownDocument(doc);
      updateUrl(doc.path);
    });
    if (doc.path === activePath) {
      link.classList.add("is-active");
    }
    documentList.appendChild(link);
  });
}

function renderUploadedDocLink(fileName) {
  documentList.innerHTML = "";
  const link = makeDocNavLink(fileName, null);
  link.classList.add("is-active");
  link.setAttribute("aria-current", "page");
  documentList.appendChild(link);
}

function updateUrl(docPath, headingId = "") {
  const url = new URL(window.location.href);
  if (docPath) {
    url.searchParams.set("doc", docPath);
  } else {
    url.searchParams.delete("doc");
  }
  url.hash = headingId ? `#${headingId}` : "";
  history.replaceState(null, "", url);
}

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function ensureHeadingIds(container) {
  const seenIds = new Map();

  container.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
    const baseId = heading.id || slugifyHeading(heading.textContent) || "section";
    const count = seenIds.get(baseId) || 0;
    const nextId = count === 0 ? baseId : `${baseId}-${count + 1}`;
    seenIds.set(baseId, count + 1);
    heading.id = nextId;
  });
}

function renderToc(container) {
  const headings = [...container.querySelectorAll("h1, h2, h3, h4, h5, h6")];

  if (!headings.length) {
    tocContainer.innerHTML =
      '<p class="empty-state">No headings were found in this markdown file.</p>';
    return;
  }

  tocContainer.innerHTML = "";

  headings.forEach((heading) => {
    const link = document.createElement("a");
    const level = Number(heading.tagName.replace("H", ""));

    link.className = `nav-link toc-link level-${level}`;
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      const activeDoc = document.querySelector("#document-list .nav-link.is-active")?.dataset.path;
      if (activeDoc) {
        updateUrl(activeDoc, heading.id);
      }
    });

    tocContainer.appendChild(link);
  });
}

function renderMarkdown(markdown, title, docPath = "", syncUrl = true) {
  const rawHtml = marked.parse(markdown);
  const safeHtml = DOMPurify.sanitize(rawHtml);

  documentTitle.textContent = title;
  currentDocumentLabel.textContent = title;
  contentContainer.innerHTML = safeHtml;
  ensureHeadingIds(contentContainer);
  renderToc(contentContainer);

  if (syncUrl && docPath) {
    updateUrl(docPath);
  } else if (syncUrl && !docPath) {
    const url = new URL(window.location.href);
    url.searchParams.delete("doc");
    url.hash = "";
    history.replaceState(null, "", url);
  }

  const hash = window.location.hash;
  if (hash.startsWith("#")) {
    const target = document.getElementById(hash.slice(1));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

async function loadMarkdownDocument(doc) {
  renderDefaultDocLinks(doc.path);
  contentContainer.innerHTML = '<div class="loading">Loading markdown...</div>';

  try {
    const response = await fetch(doc.path);

    if (!response.ok) {
      throw new Error(`Unable to load ${doc.path}`);
    }

    const markdown = await response.text();
    renderMarkdown(markdown, doc.title, doc.path, false);
  } catch (error) {
    contentContainer.innerHTML = `
      <div class="error">
        Failed to load the markdown file. Make sure you're serving this project over HTTP and the path exists.
      </div>
    `;
    tocContainer.innerHTML =
      '<p class="empty-state">The table of contents could not be generated.</p>';
    console.error(error);
  }
}

function readMarkdownFile(file) {
  if (!isMarkdownFile(file)) {
    return;
  }

  showViewer();
  renderUploadedDocLink(file.name);
  contentContainer.innerHTML = '<div class="loading">Loading markdown...</div>';

  const reader = new FileReader();
  reader.onload = () => {
    const markdown = typeof reader.result === "string" ? reader.result : "";
    renderMarkdown(markdown, file.name, "", true);
  };
  reader.onerror = () => {
    contentContainer.innerHTML = `
      <div class="error">
        Failed to read the selected markdown file.
      </div>
    `;
    tocContainer.innerHTML =
      '<p class="empty-state">The table of contents could not be generated.</p>';
  };
  reader.readAsText(file);
}

function handleMarkdownUpload(event) {
  const [file] = event.target.files || [];
  event.target.value = "";
  if (!file) {
    return;
  }
  readMarkdownFile(file);
}

function getDocumentFromQuery() {
  const path = new URLSearchParams(window.location.search).get("doc");
  if (!path) {
    return null;
  }
  return defaultDocuments.find((doc) => doc.path === path) ?? null;
}

function setupDropZone() {
  if (!dropZone) {
    return;
  }

  dropZone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dropZone.classList.add("drop-zone--active");
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    dropZone.classList.add("drop-zone--active");
  });

  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    if (!dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove("drop-zone--active");
    }
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drop-zone--active");
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      readMarkdownFile(file);
    }
  });

  dropZone.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      markdownUploadWelcome.click();
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  if (rateLink) {
    rateLink.href = CHROME_STORE_REVIEW_URL;
    if (CHROME_STORE_REVIEW_URL.includes("YOUR_EXTENSION_ID")) {
      rateLink.title =
        "After publishing, replace YOUR_EXTENSION_ID in app.js with your Chrome Web Store item ID.";
    }
  }

  markdownUploadWelcome.addEventListener("change", handleMarkdownUpload);
  markdownUploadSidebar.addEventListener("change", handleMarkdownUpload);
  setupDropZone();

  const fromQuery = getDocumentFromQuery();
  if (fromQuery) {
    showViewer();
    loadMarkdownDocument(fromQuery);
  }
});
