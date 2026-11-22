// World data for Hello Crawley.
// Coordinates are a stylised map, not to scale: -z is north (towards Gatwick).

export const LANDMARKS = [
  { id: "queens", name: "Queens Square", type: "square", x: 0, z: 0, r: 14,
    blurb: "The heart of the town centre: bandstand, fountains and the Saturday crowd." },
  { id: "memorial", name: "Memorial Gardens", type: "gardens", x: 32, z: -18, r: 13,
    blurb: "Lawns, paths and the war memorial. A good spot for lunch on a sunny day." },
  { id: "museum", name: "Crawley Museum & The Tree", type: "museum", x: -24, z: -16, r: 9,
    blurb: "On the High Street, in one of the oldest buildings in town." },
  { id: "mall", name: "County Mall", type: "mall", x: -18, z: 26, r: 14,
    blurb: "The big indoor shopping centre beside the station." },
  { id: "station", name: "Crawley Station", type: "station", x: 14, z: 56, r: 13,
    blurb: "Trains to London, Brighton and Horsham." },
  { id: "hawth", name: "The Hawth", type: "theatre", x: 64, z: 66, r: 12,
    blurb: "Theatre, cinema and panto season, set in the woods." },
  { id: "goffs", name: "Goffs Park", type: "park", x: -82, z: 48, r: 20,
    blurb: "A pond, a miniature railway and plenty of grass to sit on." },
  { id: "k2", name: "K2 Crawley", type: "leisure", x: -8, z: 128, r: 14,
    blurb: "Swimming, climbing, the gym and five-a-side." },
  { id: "stadium", name: "Broadfield Stadium", type: "stadium", x: -78, z: 132, r: 19,
    blurb: "Home of the Reds. Matchday in Broadfield is loud." },
  { id: "tilgate", name: "Tilgate Park", type: "lake", x: 90, z: 128, r: 26,
    blurb: "The lake, the woods and the nature centre. Crawley's favourite walk." },
  { id: "threebridges", name: "Three Bridges Station", type: "station", x: 96, z: -40, r: 12,
    blurb: "The commuter hub on the Brighton main line." },
  { id: "gatwick", name: "Gatwick Airport", type: "airport", x: 0, z: -190, r: 42,
    blurb: "The airport on Crawley's doorstep, where thousands of locals work." },
  { id: "ifield", name: "Ifield Mill Pond", type: "pond", x: -142, z: -52, r: 16,
    blurb: "A quiet old mill pond, popular with dog walkers and herons." }
];

export const NEIGHBOURHOODS = [
  { name: "Northgate", x: 22, z: -62 },
  { name: "West Green", x: -50, z: -18 },
  { name: "Three Bridges", x: 110, z: -15 },
  { name: "Pound Hill", x: 150, z: -45 },
  { name: "Maidenbower", x: 150, z: 35 },
  { name: "Furnace Green", x: 105, z: 70 },
  { name: "Tilgate", x: 45, z: 105 },
  { name: "Southgate", x: 35, z: 90 },
  { name: "Broadfield", x: -40, z: 95 },
  { name: "Bewbush", x: -120, z: 95 },
  { name: "Gossops Green", x: -100, z: 15 },
  { name: "Ifield", x: -105, z: -40 },
  { name: "Langley Green", x: -55, z: -85 },
  { name: "Forge Wood", x: 70, z: -105 },
  { name: "Kilnwood Vale", x: -165, z: 35 }
];

// Road polylines.
export const ROADS = [
  [[0, -150], [0, -50], [0, 0], [0, 40], [12, 76], [-6, 112]],          // north-south spine
  [[-125, -38], [-48, -6], [0, 0], [28, 0], [94, -24], [150, -28]],     // east-west through town
  [[-82, 40], [-40, 42], [0, 42], [56, 50], [100, 56], [150, 40]],      // southern ring
  [[56, 50], [72, 100]],                                                 // to Tilgate
  [[12, 76], [-50, 112], [-115, 82], [-95, 30], [-82, 40]],              // western loop
  [[94, -24], [62, -100], [0, -150]],                                    // Forge Wood to Gatwick
  [[-125, -38], [-55, -80], [0, -50]],                                   // Langley Green
  [[-165, 40], [-115, 82]]                                               // Kilnwood Vale
];

export const OCCUPATIONS = [
  "Baggage handler", "Cabin crew", "Pilot", "Nurse", "Teacher", "Barista",
  "Bus driver", "Software developer", "Student", "Retired", "Shop owner",
  "Chef", "Electrician", "Artist", "Gardener", "Librarian", "Mechanic",
  "Personal trainer", "Musician", "Taxi driver"
];

// Fictional demo characters. Nobody here is a real person.
export const NPC_NAMES = [
  "Priya", "Tom", "Aisha", "Jack", "Grace", "Kwame", "Sophie", "Hamza", "Ellie",
  "Ravi", "Megan", "Oliver", "Fatima", "Dan", "Chloe", "Marek", "Zara", "Liam",
  "Amara", "Harry", "Neha", "Sam", "Joy", "Kofi", "Lucy", "Tariq", "Hannah",
  "Ben", "Ola", "Mia", "Arjun", "Rosie", "Ike", "Jess", "Bilal", "Kate",
  "Nikhil", "Ruth", "Ewa", "George"
];

export const GREETINGS = [
  "Hiya!", "Alright?", "Hello!", "Morning!", "Hey there!", "Nice day for it!",
  "Hi, you new round here?"
];

export const MEET_LINES = [
  "Good to meet you properly!", "Fancy a coffee after this?",
  "Didn't think you'd make it, ha!", "This is my favourite spot in Crawley.",
  "Glad you came. Same time next week?"
];

export const DECLINE_LINES = [
  "Sorry, I'm on an early shift at Gatwick tomorrow!",
  "Can't today, picking the kids up. Another time?",
  "I'm just heading home, maybe later!",
  "Ah, I've got plans, sorry!"
];
