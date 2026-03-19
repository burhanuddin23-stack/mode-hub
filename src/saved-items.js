const STORAGE_KEY = "mode-hub-saved-items-v1";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readRaw() {
  if (!canUseStorage()) return [];

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(items) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("saved-items-updated"));
  } catch {
    // Ignore storage write failures to avoid breaking page rendering.
  }
}

export function buildSavedId(type, title, link = "") {
  return `${type}:${title}:${link}`.toLowerCase().replace(/\s+/g, "-");
}

export function getSavedItems() {
  return readRaw();
}

export function isSaved(id) {
  return readRaw().some((item) => item.id === id);
}

export function toggleSavedItem(item) {
  const items = readRaw();
  const existingIndex = items.findIndex((entry) => entry.id === item.id);

  if (existingIndex >= 0) {
    items.splice(existingIndex, 1);
    writeRaw(items);
    return false;
  }

  items.unshift({
    ...item,
    savedAt: new Date().toISOString(),
  });
  writeRaw(items);
  return true;
}

export function removeSavedItem(id) {
  const items = readRaw().filter((item) => item.id !== id);
  writeRaw(items);
}

export function getSavedCount() {
  return readRaw().length;
}
