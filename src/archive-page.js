import { getSavedItems, removeSavedItem } from "./saved-items.js";

const archiveGrid = document.querySelector("#archiveGrid");
const archiveCountText = document.querySelector("#archiveCountText");
const archiveFilters = document.querySelector("#archiveFilters");

const FILTERS = [
  { key: "all", label: "All" },
  { key: "news", label: "News" },
  { key: "recipe", label: "Recipes" },
  { key: "match", label: "Matches" },
  { key: "quote", label: "Quotes" },
];

let activeFilter = "all";

function formatSavedDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderFilters() {
  archiveFilters.innerHTML = FILTERS.map(
    (filter) => `
      <button
        class="archive-filter${filter.key === activeFilter ? " active" : ""}"
        type="button"
        data-filter="${filter.key}"
      >
        ${filter.label}
      </button>
    `
  ).join("");

  archiveFilters.querySelectorAll(".archive-filter").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      renderArchive();
    });
  });
}

function renderArchive() {
  const items = getSavedItems();
  const visibleItems =
    activeFilter === "all" ? items : items.filter((item) => item.type === activeFilter);

  archiveCountText.textContent = items.length
    ? `${items.length} saved item${items.length === 1 ? "" : "s"}.`
    : "Nothing saved yet.";

  archiveGrid.innerHTML = visibleItems.length
    ? visibleItems
        .map(
          (item) => `
            <article class="archive-card">
              <div class="card-topline">
                <span class="tag">${item.type}</span>
                <span class="update-date">${formatSavedDate(item.savedAt)}</span>
              </div>
              <h3>${item.title}</h3>
              <p class="card-description">${item.description || "Saved item."}</p>
              <div class="archive-card-footer">
                <span>${item.source || "Mode Hub"}</span>
                <div class="archive-card-actions">
                  ${
                    item.link
                      ? `<a href="${item.link}" target="_blank" rel="noreferrer">Open</a>`
                      : ""
                  }
                  <button class="save-button active" type="button" data-remove-id="${item.id}">
                    Remove
                  </button>
                </div>
              </div>
            </article>
          `
        )
        .join("")
    : `
      <article class="archive-empty panel-subsection">
        <p class="panel-label">Archive</p>
        <h3>No saved items in this view.</h3>
      </article>
    `;

  archiveGrid.querySelectorAll("[data-remove-id]").forEach((button) => {
    button.addEventListener("click", () => {
      removeSavedItem(button.dataset.removeId);
      renderArchive();
    });
  });

  renderFilters();
}

window.addEventListener("saved-items-updated", renderArchive);
renderArchive();
