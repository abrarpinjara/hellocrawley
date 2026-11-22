# Hello Town

A little 3D town you can walk around in the browser, starting with Crawley, West Sussex. Find people by what they do, wave hello and arrange to meet up at places around town.

**Status: early demo.** The people you meet are made-up characters (NPCs) for now. Real multiplayer is the next step.

## Play locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Controls: **WASD / arrows** to walk, **Shift** to run, **drag** to look, **scroll** to zoom, **Q/E** to turn, **F** to wave, **click someone** to open their card. On phones there's a joystick.

## Towns

The header always says **Hello Town**, with the name of the town your character is standing in underneath it. It updates automatically when you walk into another town (with a "Welcome to …" message) and shows "On the road" between towns.

Each town is one entry in `TOWNS` in `src/data.js`, with its own map area (`bounds`), landmarks, neighbourhoods and roads. To add Brighton or London, give it bounds that don't overlap existing towns and add it to the list. Only Crawley exists so far.

## What's in Crawley

- A stylised 3D town with 13 landmarks: Queens Square, Memorial Gardens, Crawley Museum, County Mall, Crawley Station, The Hawth, Goffs Park, K2 Crawley, Broadfield Stadium, Tilgate Park, Three Bridges Station, Gatwick Airport and Ifield Mill Pond, plus all 15 neighbourhoods with roads, houses and trees
- **People:** search and filter by occupation, see who's nearby, track someone with a beacon
- **Wave:** people nearby turn and wave back
- **Meetups:** ask someone to meet at a landmark; they walk there and you get credit when you both arrive
- **Places:** a guide to each landmark with a "Go" beacon
- Minimap, compass, "you are here" area label, and a met-people counter saved in the browser

## Code

| File | Purpose |
|---|---|
| `index.html` | Page shell, HUD and start screen |
| `src/main.js` | Game: world building, characters, controls, UI, meetups |
| `src/data.js` | Towns (bounds, landmarks, neighbourhoods, roads), occupations, NPC names and lines. Edit this to change or add to the map |
| `src/style.css` | HUD and panel styling |
| `vendor/three.module.js` | three.js r160 (MIT), bundled so the game has no external dependencies |

No build step. It deploys as static files (Netlify config is in `netlify.toml`).

## Next steps

- Real multiplayer: show other players and live waves and meetups. Needs a realtime backend (e.g. Supabase Realtime, PartyKit or Ably), since Netlify alone can't hold websocket connections
- Accounts and privacy controls (visible / invisible)
- More landmark detail and a closer match to the real street layout
