const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const form = document.querySelector("#search-form");
const input = document.querySelector("#word-input");
const button = document.querySelector("#search-button");
const results = document.querySelector("#results");
const statusMessage = document.querySelector("#status-message");
const resultsRegion = document.querySelector("#results-region");
const savedList = document.querySelector("#saved-list");
const savedCount = document.querySelector("#saved-count");
const collectionCount = document.querySelector("#collection-count");
const STORAGE_KEY = "wordly-saved-words";
let savedWords = loadSavedWords();
let activeAudio = "";
let currentEntry = null;
renderSavedWords();

function loadSavedWords() {
  try {
    const words = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(words) ? words.filter((word) => typeof word === "string") : [];
  } catch {
    return [];
  }
}

function saveWords() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedWords)); } catch { /* Storage may be unavailable in private browsing. */ }
}

function showStatus(message, isError = false) {
  statusMessage.hidden = false;
  statusMessage.classList.toggle("error", isError);
  statusMessage.innerHTML = `<span class="sparkle" aria-hidden="true">${isError ? "!" : "✳"}</span><span></span>`;
  statusMessage.querySelector("span:last-child").textContent = message;
  results.hidden = true;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function getPronunciation(entry) {
  const phonetic = entry.phonetics?.find((item) => item.text)?.text || entry.phonetic || "";
  const audio = entry.phonetics?.find((item) => item.audio)?.audio || "";
  return { phonetic, audio };
}

function renderEntry(entry, searchedWord) {
  currentEntry = entry;
  const { phonetic, audio } = getPronunciation(entry);
  activeAudio = audio;
  const meanings = (entry.meanings || []).flatMap((meaning) => (meaning.definitions || []).map((definition) => ({
    partOfSpeech: meaning.partOfSpeech || "Meaning",
    definition: definition.definition || "Definition unavailable.",
    example: definition.example || "",
    synonyms: [...new Set([...(meaning.synonyms || []), ...(definition.synonyms || [])])],
  })));
  const synonymSet = [...new Set(meanings.flatMap((meaning) => meaning.synonyms))].slice(0, 14);
  const safeWord = escapeHTML(entry.word || searchedWord);
  const saved = savedWords.some((word) => word.toLowerCase() === (entry.word || searchedWord).toLowerCase());
  results.innerHTML = `
    <div class="result-top"><div><h2 class="word-title">${safeWord}</h2><span class="phonetic">${phonetic ? escapeHTML(phonetic) : "Pronunciation not available"}</span></div>
      <div class="result-actions">${audio ? '<button class="sound-button" type="button" id="play-audio" aria-label="Play pronunciation">▶ <span>Listen</span></button>' : ""}<button class="save-button" type="button" id="save-word" aria-pressed="${saved}">${saved ? "♥ Saved" : "♡ Save word"}</button></div></div>
    ${meanings.length ? meanings.map((meaning) => `<div class="meaning"><p class="part-of-speech">${escapeHTML(meaning.partOfSpeech)}</p><p class="definition">${escapeHTML(meaning.definition)}</p>${meaning.example ? `<p class="example">“${escapeHTML(meaning.example)}”</p>` : ""}</div>`).join("") : '<p class="definition">No definition details are available for this entry.</p>'}
    ${synonymSet.length ? `<div class="result-divider"></div><p class="detail-label">SYNONYMS</p><div class="chips">${synonymSet.map((word) => `<span class="chip">${escapeHTML(word)}</span>`).join("")}</div>` : ""}
    ${entry.sourceUrls?.length ? `<div class="result-divider"></div><a class="source-link" href="${escapeHTML(entry.sourceUrls[0])}" target="_blank" rel="noreferrer">View source ↗</a>` : ""}`;
  statusMessage.hidden = true;
  results.hidden = false;
  results.querySelector("#play-audio")?.addEventListener("click", () => {
    if (activeAudio) { const audioPlayer = new Audio(activeAudio); audioPlayer.play().catch(() => showStatus("Audio playback isn’t available right now.", true)); }
  });
  results.querySelector("#save-word").addEventListener("click", () => toggleSaved(entry.word || searchedWord));
}

async function searchWord(rawWord) {
  const word = rawWord.trim();
  if (!word) { input.focus(); showStatus("Enter a word to look up.", true); return; }
  if (!/^[\p{L}][\p{L}' -]*$/u.test(word)) { showStatus("Please enter a word using letters, spaces, apostrophes, or hyphens.", true); return; }
  button.disabled = true;
  button.querySelector(".button-label").textContent = "Searching…";
  resultsRegion.setAttribute("aria-busy", "true");
  showStatus(`Looking up “${word}”…`);
  try {
    const response = await fetch(`${API_URL}${encodeURIComponent(word)}`, { headers: { Accept: "application/json" } });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data) || !data.length) {
      const message = data?.message || `We couldn’t find “${word}”. Try another spelling.`;
      showStatus(message, true);
      return;
    }
    renderEntry(data[0], word);
  } catch {
    showStatus("We couldn’t reach the dictionary. Check your connection and try again.", true);
  } finally {
    button.disabled = false;
    button.querySelector(".button-label").textContent = "Look up";
    resultsRegion.setAttribute("aria-busy", "false");
  }
}

function toggleSaved(word) {
  const existingIndex = savedWords.findIndex((saved) => saved.toLowerCase() === word.toLowerCase());
  if (existingIndex >= 0) savedWords.splice(existingIndex, 1);
  else savedWords.unshift(word);
  saveWords();
  renderSavedWords();
  if (!results.hidden && currentEntry) renderEntry(currentEntry, word);
}

function renderSavedWords() {
  savedCount.textContent = String(savedWords.length);
  collectionCount.textContent = `${savedWords.length} ${savedWords.length === 1 ? "WORD" : "WORDS"}`;
  if (!savedWords.length) {
    savedList.innerHTML = '<p class="empty-saved">Words you save will find a home here.</p>';
    return;
  }
  savedList.innerHTML = savedWords.map((word) => `<span class="saved-word"><button type="button" class="saved-search" data-word="${escapeHTML(word)}" aria-label="Look up ${escapeHTML(word)}">${escapeHTML(word)}</button><button type="button" class="remove-saved" data-word="${escapeHTML(word)}" aria-label="Remove ${escapeHTML(word)} from saved words">×</button></span>`).join("");
  savedList.querySelectorAll(".saved-search").forEach((item) => item.addEventListener("click", () => { input.value = item.dataset.word; searchWord(item.dataset.word); }));
  savedList.querySelectorAll(".remove-saved").forEach((item) => item.addEventListener("click", () => toggleSaved(item.dataset.word)));
}

form.addEventListener("submit", (event) => { event.preventDefault(); searchWord(input.value); });
document.querySelectorAll(".suggestion").forEach((item) => item.addEventListener("click", () => { input.value = item.textContent; searchWord(item.textContent); }));
document.querySelector("#theme-toggle").addEventListener("click", (event) => {
  const dark = document.body.classList.toggle("dark");
  event.currentTarget.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  event.currentTarget.title = dark ? "Switch to light theme" : "Switch to dark theme";
});
