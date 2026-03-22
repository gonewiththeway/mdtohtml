const documents = [
  { title: "Project Overview", path: "./docs/overview.md" },
  { title: "Getting Started", path: "./docs/getting-started.md" },
];

const documentList = document.getElementById("document-list");
const tocContainer = document.getElementById("toc");
const contentContainer = document.getElementById("content");
const documentTitle = document.getElementById("document-title");
const currentDocumentLabel = document.getElementById("current-document-label");
const markdownUpload = document.getElementById("markdown-upload");
const defaultDocuments = [...documents];

marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
  mangle: false,
});

function renderDocumentLinks() {
  documentList.innerHTML = "";

  documents.forEach((doc, index) => {
    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = `?doc=${encodeURIComponent(doc.path)}`;
    link.dataset.path = doc.path;
    link.textContent = doc.title;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      loadMarkdownDocument(doc);
      updateUrl(doc.path);
    });

    if (index === 0) {
      link.classList.add("is-active");
    }

    documentList.appendChild(link);
  });
}

function renderUploadedDocumentLink(fileName) {
  documentList.innerHTML = "";

  const link = document.createElement("a");
  link.className = "nav-link is-active";
  link.href = "#";
  link.textContent = fileName;
  link.setAttribute("aria-current", "true");
  documentList.appendChild(link);
}

function restoreDefaultDocumentLinks(activePath) {
  documentList.innerHTML = "";

  defaultDocuments.forEach((doc) => {
    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = `?doc=${encodeURIComponent(doc.path)}`;
    link.dataset.path = doc.path;
    link.textContent = doc.title;
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

function updateUrl(docPath, headingId = "") {
  const url = new URL(window.location.href);
  url.searchParams.set("doc", docPath);
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

function setActiveDocument(path) {
  document.querySelectorAll("#document-list .nav-link").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.path === path);
  });
}

function clearActiveDocument() {
  document.querySelectorAll("#document-list .nav-link").forEach((link) => {
    link.classList.remove("is-active");
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
    history.replaceState(null, "", window.location.pathname);
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
  restoreDefaultDocumentLinks(doc.path);
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

function handleMarkdownUpload(event) {
  const [file] = event.target.files || [];

  if (!file) {
    return;
  }

  renderUploadedDocumentLink(file.name);
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
  event.target.value = "";
}

function getRequestedDocument() {
  const params = new URLSearchParams(window.location.search);
  const path = params.get("doc");

  if (path) {
    return documents.find((doc) => doc.path === path);
  }

  return documents[0];
}

window.addEventListener("DOMContentLoaded", () => {
  renderDocumentLinks();
  markdownUpload.addEventListener("change", handleMarkdownUpload);

  const initialDocument = getRequestedDocument();
  if (initialDocument) {
    loadMarkdownDocument(initialDocument);
  }
});
