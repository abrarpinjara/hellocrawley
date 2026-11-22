/*
 * Story data for Hello Crawley.
 *
 * Every entry below is a SAMPLE placeholder (sample: true) so the layout can be
 * previewed. Replace them with real, consented stories before launch.
 *
 * Fields:
 *   id            unique slug used in story.html?id=...
 *   name          first name (or how the person wants to be credited)
 *   neighbourhood one of NEIGHBOURHOODS below
 *   theme         one of THEMES below
 *   headline      short pull-quote shown on cards
 *   photo         path/URL to a portrait (optional; a coloured tile is shown if empty)
 *   date          ISO date the story was published
 *   body          array of paragraphs, first person, in their own words
 *   sample        true for placeholder content
 */

window.NEIGHBOURHOODS = [
  "Bewbush", "Broadfield", "Forge Wood", "Furnace Green", "Gossops Green",
  "Ifield", "Kilnwood Vale", "Langley Green", "Maidenbower", "Northgate",
  "Pound Hill", "Southgate", "Three Bridges", "Tilgate", "West Green"
];

window.THEMES = ["Work", "Family", "Arrivals", "Community", "Youth", "Memory"];

window.STORIES = [
  {
    id: "sample-market-stall",
    name: "Sample: Market trader",
    neighbourhood: "West Green",
    theme: "Work",
    headline: "“Thirty years on the same corner, and I still learn something from every customer.”",
    photo: "",
    date: "2026-11-15",
    sample: true,
    body: [
      "This is a placeholder story showing how a long-form interview will look. Replace it with a real conversation.",
      "Stories here are written in the first person, in the speaker's own words, lightly edited for length. A good story focuses on one moment, one decision or one feeling rather than a whole life history.",
      "Aim for three to six short paragraphs. End on a line that stays with the reader."
    ]
  },
  {
    id: "sample-airport-shift",
    name: "Sample: Airport night-shift worker",
    neighbourhood: "Langley Green",
    theme: "Work",
    headline: "“When the runway goes quiet at 3am, that's when the town feels like mine.”",
    photo: "",
    date: "2026-11-08",
    sample: true,
    body: [
      "Placeholder. Gatwick shapes daily life for thousands of Crawley households, so stories about shifts, commutes and the people who keep the airport running are a natural strand.",
      "Ask: what does your day look like that the rest of us never see?"
    ]
  },
  {
    id: "sample-new-arrival",
    name: "Sample: Recent arrival",
    neighbourhood: "Broadfield",
    theme: "Arrivals",
    headline: "“The first person who said hello to me was the bus driver. I still remember his face.”",
    photo: "",
    date: "2026-11-01",
    sample: true,
    body: [
      "Placeholder. Crawley has been a town of arrivals since it became a New Town in 1947. Every generation has its own version of that first week.",
      "Ask: what surprised you? Who helped? What do you miss?"
    ]
  },
  {
    id: "sample-tilgate-walker",
    name: "Sample: Early-morning walker",
    neighbourhood: "Tilgate",
    theme: "Memory",
    headline: "“I've walked round Tilgate Lake every morning since my husband passed. The geese know me now.”",
    photo: "",
    date: "2026-10-25",
    sample: true,
    body: [
      "Placeholder. Parks and green spaces are where many encounters happen, and they make good settings for portraits.",
      "Ask: why this place? What has it seen you through?"
    ]
  },
  {
    id: "sample-young-footballer",
    name: "Sample: Youth footballer",
    neighbourhood: "Bewbush",
    theme: "Youth",
    headline: "“My mum drives me to training four nights a week. One day I'm going to pay her back.”",
    photo: "",
    date: "2026-10-18",
    sample: true,
    body: [
      "Placeholder. For under-18s, get written consent from a parent or guardian before you publish a story or photo.",
      "Ask: what are you working towards? Who's in your corner?"
    ]
  },
  {
    id: "sample-volunteer",
    name: "Sample: Food bank volunteer",
    neighbourhood: "Northgate",
    theme: "Community",
    headline: "“Nobody plans to need help. That's why we never ask why you're here.”",
    photo: "",
    date: "2026-10-11",
    sample: true,
    body: [
      "Placeholder. Volunteers, faith groups, clubs and charities are a rich source of stories and often help introduce you to others.",
      "Ask: what keeps you coming back?"
    ]
  },
  {
    id: "sample-grandparents",
    name: "Sample: Grandparents",
    neighbourhood: "Three Bridges",
    theme: "Family",
    headline: "“We moved here in 1962 when it was all fields and building sites. Now our grandkids think it's always been like this.”",
    photo: "",
    date: "2026-10-04",
    sample: true,
    body: [
      "Placeholder. Older residents remember the New Town being built, and those memories are worth recording while we can.",
      "Ask: what did it look like then? What's changed and what hasn't?"
    ]
  },
  {
    id: "sample-new-estate",
    name: "Sample: First-time buyer",
    neighbourhood: "Forge Wood",
    theme: "Family",
    headline: "“Our street didn't exist three years ago. We're building the neighbourhood as we go.”",
    photo: "",
    date: "2026-09-27",
    sample: true,
    body: [
      "Placeholder. Newer neighbourhoods like Forge Wood and Kilnwood Vale are still writing their first chapter.",
      "Ask: what makes a new street feel like home?"
    ]
  }
];
