# Wordly Dictionary

A small single-page dictionary app built with semantic HTML, CSS, and vanilla JavaScript. It looks up English words with the [Free Dictionary API](https://dictionaryapi.dev/), then displays pronunciation, definitions, examples, synonyms, and source links without reloading the page.

## Run it

Open `index.html` in a browser. An internet connection is needed for dictionary lookups and the optional Google Fonts. Saved words and the theme preference are handled in the browser; saved words use `localStorage`.

## Features

- Search by form submission, Enter, or a popular word suggestion.
- Play pronunciation audio when the API provides an audio file.
- Save and remove words from a collection stored in the browser.
- Switch between light and dark themes.
- Show useful messages for empty or invalid input, missing words, network problems, and unavailable pronunciation or synonyms.
- Use keyboard-friendly controls, semantic landmarks, and a live status region for lookup feedback.

## API data used

The app reads the first returned entry's `word`, `phonetic` or `phonetics[].text`, `phonetics[].audio`, `meanings[].partOfSpeech`, `meanings[].definitions[].definition`, `meanings[].definitions[].example`, `meanings[].synonyms`, and `sourceUrls` fields. Missing optional fields are handled gracefully.

## Files

- `index.html` — page structure and accessible controls.
- `styles.css` — responsive layout and light/dark themes.
- `app.js` — API requests, rendering, audio playback, and saved-word behavior.
