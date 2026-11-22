# Hello Crawley

Portraits and first-person stories from the people of Crawley, West Sussex, in the spirit of *People of Ahmedabad* and *Humans of New York*.

A plain static site with no build step and no dependencies.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

| File | Purpose |
|---|---|
| `index.html` | Home page: hero, latest featured story, filterable story grid, neighbourhoods, call to action |
| `story.html?id=<id>` | A single story page, with share buttons and related stories |
| `about.html` | Mission, how to get involved, privacy and consent |
| `submit.html` | Form to share or nominate a story (Netlify Forms) |
| `assets/stories.js` | **All story content.** Add, edit or remove stories here |
| `assets/app.js` | Rendering, filters, search, sharing, form handling |
| `assets/style.css` | Styles, with light and dark mode |

## Adding a story

Add an object to `window.STORIES` in `assets/stories.js`. Put portraits in `assets/photos/` and set `photo: "assets/photos/name.jpg"`. Stories without a photo get a coloured tile with initials. The newest story by `date` becomes the featured story.

Every current entry is a **sample placeholder** (`sample: true`). Remove them before launch.

## Deploying

Built to drop straight onto Netlify, where the submission form works without any setup. For other hosts (GitHub Pages, Vercel), set `FORM_ENDPOINT` in `assets/app.js` to a form backend such as Formspree.

## Before launch, replace

- `hello@example.com` in `about.html` and `submit.html`
- the sample stories
