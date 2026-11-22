import * as THREE from "three";
import {
  TOWNS, townAt, LANDMARKS, NEIGHBOURHOODS, ROADS, OCCUPATIONS, NPC_NAMES,
  GREETINGS, MEET_LINES, DECLINE_LINES
} from "./data.js";

// ---------------------------------------------------------------- utilities
const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const COLORS = ["#c8102e", "#2563eb", "#0f766e", "#d97706", "#7c3aed", "#db2777", "#4d7c0f", "#0891b2", "#334155"];
// The walkable world is the union of every town's area.
const BOUNDS = {
  minX: Math.min(...TOWNS.map((t) => t.bounds.minX)), maxX: Math.max(...TOWNS.map((t) => t.bounds.maxX)),
  minZ: Math.min(...TOWNS.map((t) => t.bounds.minZ)), maxZ: Math.max(...TOWNS.map((t) => t.bounds.maxZ))
};

function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { return null; }
}

function distToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
function nearRoad(x, z, pad) {
  for (const road of ROADS)
    for (let i = 0; i < road.length - 1; i++)
      if (distToSegment(x, z, road[i][0], road[i][1], road[i + 1][0], road[i + 1][1]) < pad) return true;
  return false;
}
function nearLandmark(x, z, pad) {
  return LANDMARKS.some((l) => Math.hypot(x - l.x, z - l.z) < l.r + pad);
}

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$("#app").appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#bfe3f5");
scene.fog = new THREE.Fog("#bfe3f5", 120, 320);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.5, 600);

scene.add(new THREE.HemisphereLight("#ffffff", "#7aa36a", 0.9));
const sun = new THREE.DirectionalLight("#fff4e0", 1.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 200 });
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);

// Materials
const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const M = {
  grass: mat("#8cc474"), road: mat("#5b5f66"), pave: mat("#d8d2c4"), water: mat("#4aa3d8", { transparent: true, opacity: 0.9 }),
  white: mat("#f5f2ec"), red: mat("#c8102e"), brick: mat("#a4553a"), glass: mat("#9fd3ea"), dark: mat("#3a3d42"),
  wood: mat("#7a5233"), leaf: mat("#3f8f3a"), leaf2: mat("#5aa846"), gold: mat("#e0b23a"), pitch: mat("#4fa83d"),
  rail: mat("#6b6b6b"), roof: mat("#7b3f2e"), sand: mat("#e8dcb5")
};

function box(w, h, d, m, x = 0, y = 0, z = 0, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 16, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function disc(r, m, x, z, y = 0.02) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, 40), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
function flat(w, d, m, x, z, y = 0.02, rot = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rot;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------- world
flat(600, 600, M.grass, 0, -30, 0);

for (const road of ROADS) {
  for (let i = 0; i < road.length - 1; i++) {
    const [ax, az] = road[i], [bx, bz] = road[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    flat(7, len, M.road, (ax + bx) / 2, (az + bz) / 2, 0.03, -Math.atan2(bx - ax, bz - az));
    disc(3.5, M.road, ax, az, 0.031);
  }
  const end = road[road.length - 1];
  disc(3.5, M.road, end[0], end[1], 0.031);
}

// Instanced trees and houses
const tmp = new THREE.Object3D();
const treeSpots = [], houseSpots = [];

for (const n of NEIGHBOURHOODS) {
  let tries = 0, placed = 0;
  while (placed < 34 && tries++ < 400) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * 34;
    const x = n.x + Math.cos(a) * d, z = n.z + Math.sin(a) * d;
    if (nearRoad(x, z, 7) || nearLandmark(x, z, 4)) continue;
    if (houseSpots.some((h) => Math.hypot(h.x - x, h.z - z) < 7)) continue;
    houseSpots.push({ x, z, rot: Math.round(Math.random() * 4) * (Math.PI / 2) + rand(-0.15, 0.15) });
    placed++;
  }
}
for (let i = 0; i < 700 * TOWNS.length; i++) {
  const tb = pick(TOWNS).bounds;
  const x = rand(tb.minX, tb.maxX), z = rand(tb.minZ + 60, tb.maxZ);
  if (nearRoad(x, z, 5) || houseSpots.some((h) => Math.hypot(h.x - x, h.z - z) < 5)) continue;
  const inPark = LANDMARKS.find((l) => ["park", "lake", "pond", "gardens"].includes(l.type) && Math.hypot(x - l.x, z - l.z) < l.r + 12);
  if (!inPark && nearLandmark(x, z, 3)) continue;
  if (inPark && Math.hypot(x - inPark.x, z - inPark.z) < inPark.r * 0.55) continue;
  treeSpots.push({ x, z, s: rand(0.8, 1.5) });
}

{
  const houseBody = new THREE.InstancedMesh(new THREE.BoxGeometry(5, 3.4, 5.5), mat("#ffffff"), houseSpots.length);
  const houseRoof = new THREE.InstancedMesh(new THREE.ConeGeometry(4.4, 2.4, 4), M.roof, houseSpots.length);
  const walls = ["#efe6d6", "#e6d3b8", "#d9c3a5", "#f2eee8", "#c99a7a", "#b8735a", "#e9dccb"];
  const c = new THREE.Color();
  houseSpots.forEach((h, i) => {
    tmp.position.set(h.x, 1.7, h.z); tmp.rotation.set(0, h.rot, 0); tmp.scale.set(1, 1, 1); tmp.updateMatrix();
    houseBody.setMatrixAt(i, tmp.matrix);
    houseBody.setColorAt(i, c.set(pick(walls)));
    tmp.position.set(h.x, 4.6, h.z); tmp.rotation.set(0, h.rot + Math.PI / 4, 0); tmp.scale.set(1, 1, 1.05); tmp.updateMatrix();
    houseRoof.setMatrixAt(i, tmp.matrix);
  });
  houseBody.castShadow = houseBody.receiveShadow = houseRoof.castShadow = true;
  scene.add(houseBody, houseRoof);

  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.35, 2, 6), M.wood, treeSpots.length);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.7, 0), mat("#ffffff"), treeSpots.length);
  const greens = ["#3f8f3a", "#4f9e40", "#5aa846", "#367a34", "#6bb04f"];
  treeSpots.forEach((t, i) => {
    tmp.position.set(t.x, t.s, t.z); tmp.rotation.set(0, 0, 0); tmp.scale.setScalar(t.s); tmp.updateMatrix();
    trunk.setMatrixAt(i, tmp.matrix);
    tmp.position.set(t.x, 2.6 * t.s, t.z); tmp.rotation.set(rand(0, 3), rand(0, 3), 0); tmp.updateMatrix();
    crown.setMatrixAt(i, tmp.matrix);
    crown.setColorAt(i, c.set(pick(greens)));
  });
  trunk.castShadow = crown.castShadow = true;
  scene.add(trunk, crown);
}

function tree(x, z, s = 1) {
  cyl(0.25 * s, 0.35 * s, 2 * s, M.wood, x, 0, z, 6);
  const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 * s, 0), M.leaf);
  c.position.set(x, 2.6 * s, z); c.castShadow = true; scene.add(c);
}

// Landmark builders
const BUILD = {
  square(l) {
    disc(l.r, M.pave, l.x, l.z);
    cyl(3.2, 3.2, 0.4, M.white, l.x, 0, l.z, 24);                    // bandstand base
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      cyl(0.15, 0.15, 3, M.white, l.x + Math.cos(a) * 2.8, 0.4, l.z + Math.sin(a) * 2.8, 6);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.6, 6), M.red);
    roof.position.set(l.x, 4.2, l.z); roof.castShadow = true; scene.add(roof);
    for (const [dx, dz] of [[-8, -7], [8, 7]]) {                      // fountains
      cyl(1.8, 2, 0.6, M.white, l.x + dx, 0, l.z + dz, 20);
      cyl(1.5, 1.5, 0.05, M.water, l.x + dx, 0.6, l.z + dz, 20);
    }
    for (const [dx, dz] of [[-11, 6], [11, -6], [-4, 11], [4, -11]]) tree(l.x + dx, l.z + dz, 0.9);
  },
  gardens(l) {
    disc(l.r, mat("#9fd18a"), l.x, l.z);
    flat(2, l.r * 2, M.sand, l.x, l.z, 0.04);
    flat(l.r * 2, 2, M.sand, l.x, l.z, 0.04);
    box(1.6, 5, 1.6, M.white, l.x, 0, l.z);                           // memorial
    box(2.6, 0.6, 2.6, M.white, l.x, 0, l.z);
    for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) {
      disc(2.2, mat("#e86a8a"), l.x + dx, l.z + dz, 0.05);
    }
  },
  museum(l) {
    box(9, 4, 6, M.white, l.x, 0, l.z);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.4, 3, 4), M.dark);
    roof.position.set(l.x, 5.5, l.z); roof.rotation.y = Math.PI / 4; roof.scale.set(1.1, 1, 0.75); roof.castShadow = true; scene.add(roof);
    for (let i = -3; i <= 3; i += 1.5) box(0.25, 4, 0.1, M.dark, l.x + i, 0, l.z + 3.05);
    tree(l.x + 7, l.z + 3, 1.8);
  },
  mall(l) {
    box(24, 7, 18, mat("#e7e2d8"), l.x, 0, l.z);
    box(10, 4, 0.3, M.glass, l.x, 0, l.z - 9.1);
    box(26, 0.6, 20, M.red, l.x, 7, l.z);
  },
  station(l) {
    box(10, 4.5, 6, M.brick, l.x, 0, l.z);
    box(11, 0.5, 7, M.dark, l.x, 4.5, l.z);
    box(26, 0.8, 4, M.pave, l.x, 0, l.z + 6);
    for (const dz of [9, 11]) box(30, 0.15, 0.3, M.rail, l.x, 0, l.z + dz);
    for (let i = -10; i <= 10; i += 5) box(0.3, 3.2, 0.3, M.dark, l.x + i, 0.8, l.z + 6);
    box(26, 0.2, 4, M.dark, l.x, 4, l.z + 6);
  },
  theatre(l) {
    cyl(8, 8, 6, M.white, l.x, 0, l.z, 24);
    cyl(8.6, 8.6, 1, M.red, l.x, 6, l.z, 24);
    box(6, 3.5, 0.3, M.glass, l.x, 0, l.z - 8);
  },
  park(l) {
    disc(l.r, mat("#9fd18a"), l.x, l.z);
    disc(l.r * 0.35, M.water, l.x + 4, l.z - 3, 0.05);
    const track = new THREE.Mesh(new THREE.RingGeometry(l.r * 0.75, l.r * 0.75 + 0.6, 48), M.rail);
    track.rotation.x = -Math.PI / 2; track.position.set(l.x, 0.06, l.z); scene.add(track);
    box(3, 1.6, 1.6, M.red, l.x + l.r * 0.75, 0, l.z);              // miniature train
    box(2.5, 1.2, 1.4, M.gold, l.x + l.r * 0.75, 0, l.z + 3);
  },
  leisure(l) {
    box(22, 8, 14, M.glass, l.x, 0, l.z);
    box(23, 1, 15, M.white, l.x, 8, l.z);
    box(5, 14, 5, mat("#5a6b7a"), l.x + 7, 0, l.z - 3);               // climbing tower
  },
  stadium(l) {
    flat(26, 16, M.pitch, l.x, l.z, 0.05);
    flat(0.3, 16, M.white, l.x, l.z, 0.06);
    for (const [dx, dz, w, d] of [[0, -11, 30, 4], [0, 11, 30, 4], [-16, 0, 4, 22], [16, 0, 4, 22]]) {
      box(w, 5, d, M.red, l.x + dx, 0, l.z + dz);
      box(w, 0.4, d + 1, M.white, l.x + dx, 6.5, l.z + dz);
    }
  },
  lake(l) {
    disc(l.r, mat("#9fd18a"), l.x, l.z);
    const lake = disc(l.r * 0.6, M.water, l.x, l.z + 2, 0.05);
    lake.scale.set(1.4, 0.8, 1);
    box(10, 0.4, 2, M.wood, l.x - l.r * 0.65, 0.2, l.z + 2);          // jetty
    box(6, 3, 5, M.wood, l.x + 8, 0, l.z - l.r * 0.75);               // nature centre
  },
  pond(l) {
    const p = disc(l.r * 0.7, M.water, l.x, l.z, 0.05);
    p.scale.set(1.3, 0.8, 1);
    box(6, 6, 6, M.white, l.x + l.r, 0, l.z);                         // the mill
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 3, 4), M.roof);
    roof.position.set(l.x + l.r, 7.5, l.z); roof.rotation.y = Math.PI / 4; roof.castShadow = true; scene.add(roof);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(2, 0.3, 6, 16), M.wood);
    wheel.position.set(l.x + l.r - 3.3, 2.2, l.z); wheel.rotation.y = Math.PI / 2; scene.add(wheel);
  },
  airport(l) {
    flat(14, 120, M.road, l.x - 30, l.z, 0.04, Math.PI / 2 - 0.15);
    for (let i = -50; i <= 50; i += 10) flat(1, 4, M.white, l.x - 30 + i * Math.cos(0.15), l.z + i * Math.sin(0.15) * -1, 0.05, Math.PI / 2 - 0.15);
    box(50, 10, 16, M.glass, l.x + 10, 0, l.z + 22);
    box(52, 1, 18, M.white, l.x + 10, 10, l.z + 22);
    cyl(1.4, 2, 20, M.white, l.x + 42, 0, l.z + 12, 10);               // control tower
    cyl(3.5, 3, 3, M.glass, l.x + 42, 20, l.z + 12, 10);
    // a parked plane
    const plane = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 22, 12), M.white);
    body.rotation.z = Math.PI / 2; plane.add(body);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8), M.white); nose.position.x = 11; plane.add(nose);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 24), M.white); plane.add(wing);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 0.3), M.red); tail.position.set(-10, 2.5, 0); plane.add(tail);
    plane.traverse((o) => (o.castShadow = true));
    plane.position.set(l.x - 10, 2.2, l.z + 2); plane.rotation.y = 0.3;
    scene.add(plane);
  }
};
LANDMARKS.forEach((l) => BUILD[l.type](l));

// Destination beacon
const beacon = new THREE.Mesh(
  new THREE.CylinderGeometry(1.2, 1.2, 60, 16, 1, true),
  new THREE.MeshBasicMaterial({ color: "#ff3355", transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide })
);
beacon.visible = false;
scene.add(beacon);

// ---------------------------------------------------------------- characters
function makePerson(color) {
  const g = new THREE.Group();
  const skin = mat(pick(["#f1c9a5", "#e0ac83", "#c68c62", "#8d5a3b", "#5c3a24"]));
  const shirt = mat(color), legs = mat(pick(["#2b3440", "#3b3b3b", "#334e7a", "#6b5b4b"]));
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 1.4, 10), shirt);
  torso.position.y = 1.75;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), skin);
  head.position.y = 2.85;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(pick(["#2a1c12", "#4a3020", "#111", "#8a6236", "#c9a26b"])));
  hair.position.y = 2.9;
  const limb = (w, h, m) => {
    const pivot = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), m);
    mesh.position.y = -h / 2; mesh.castShadow = true;
    pivot.add(mesh);
    return pivot;
  };
  const armL = limb(0.25, 1.2, shirt), armR = limb(0.25, 1.2, shirt);
  armL.position.set(-0.7, 2.35, 0); armR.position.set(0.7, 2.35, 0);
  const legL = limb(0.3, 1.1, legs), legR = limb(0.3, 1.1, legs);
  legL.position.set(-0.25, 1.1, 0); legR.position.set(0.25, 1.1, 0);
  [torso, head, hair].forEach((m) => (m.castShadow = true));
  g.add(torso, head, hair, armL, armR, legL, legR);
  g.userData.parts = { armL, armR, legL, legR };
  scene.add(g);
  return g;
}

function animatePerson(p, dt) {
  const { armL, armR, legL, legR } = p.mesh.userData.parts;
  p.phase += dt * (p.speed > 0.1 ? p.speed * 1.1 : 0);
  const s = p.speed > 0.1 ? Math.sin(p.phase) * 0.7 : 0;
  legL.rotation.x = s; legR.rotation.x = -s;
  armL.rotation.x = -s * 0.8;
  if (p.waveT > 0) {
    p.waveT -= dt;
    armR.rotation.x = 0;
    armR.rotation.z = Math.PI * 0.85 + Math.sin(p.waveT * 14) * 0.3;
  } else {
    armR.rotation.z = 0;
    armR.rotation.x = s * 0.8;
  }
  p.mesh.position.y = p.speed > 0.1 ? Math.abs(Math.sin(p.phase)) * 0.08 : 0;
}

const labelsEl = $("#labels");
function makeTag(name, job, you) {
  const el = document.createElement("div");
  el.className = "tag" + (you ? " you" : "");
  el.innerHTML = `<span class="nm">${esc(name)}</span>` + (job ? `<span class="jb">${esc(job)}</span>` : "");
  labelsEl.appendChild(el);
  return el;
}

function landmarkSpot(l, spread = 0.6) {
  const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * l.r * spread;
  return { x: l.x + Math.cos(a) * d, z: l.z + Math.sin(a) * d };
}

// Player
const profile = store("ht-profile") || { name: "", job: "", color: COLORS[0] };
const player = { name: "You", job: "", x: TOWNS[0].spawn.x, z: TOWNS[0].spawn.z, heading: Math.PI, speed: 0, phase: 0, waveT: 0, mesh: null, tag: null };

// NPCs: fictional demo characters
const npcs = NPC_NAMES.map((name, i) => {
  const home = LANDMARKS[i % LANDMARKS.length];
  const spot = landmarkSpot(home, 1);
  const color = pick(COLORS);
  const n = {
    id: "npc-" + i, name, job: OCCUPATIONS[i % OCCUPATIONS.length], color,
    x: spot.x, z: spot.z, heading: rand(0, 6.28), speed: 0, phase: rand(0, 6), waveT: 0,
    state: "idle", timer: rand(1, 12), target: null, bubbleT: 0, meetup: null,
    friendly: rand(0.55, 0.95)
  };
  n.mesh = makePerson(color);
  n.mesh.traverse((o) => (o.userData.npc = n));
  n.tag = makeTag(name, n.job);
  n.bubble = document.createElement("div");
  n.bubble.className = "bubble"; n.bubble.hidden = true;
  labelsEl.appendChild(n.bubble);
  return n;
});
const npcById = Object.fromEntries(npcs.map((n) => [n.id, n]));

function say(n, text, secs = 3.5) {
  n.bubble.textContent = text;
  n.bubble.hidden = false;
  n.bubbleT = secs;
}

// ---------------------------------------------------------------- input
const keys = {};
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
  keys[e.code] = true;
  if (e.code === "KeyF") doWave();
  if (e.code === "Escape") { closePanel(); closeCard(); }
});
addEventListener("keyup", (e) => (keys[e.code] = false));
addEventListener("blur", () => Object.keys(keys).forEach((k) => (keys[k] = false)));

const cam = { yaw: 0, pitch: 0.42, dist: 16 };
let drag = null;
const canvas = renderer.domElement;
canvas.addEventListener("pointerdown", (e) => {
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  cam.yaw -= (e.clientX - drag.x) * 0.006;
  cam.pitch = Math.max(0.12, Math.min(1.25, cam.pitch + (e.clientY - drag.y) * 0.004));
  drag.x = e.clientX; drag.y = e.clientY;
});
canvas.addEventListener("pointerup", (e) => {
  if (drag && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) handleClick(e);
  drag = null;
});
canvas.addEventListener("wheel", (e) => {
  cam.dist = Math.max(7, Math.min(45, cam.dist + e.deltaY * 0.02));
  e.preventDefault();
}, { passive: false });

const raycaster = new THREE.Raycaster();
function handleClick(e) {
  const p = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(p, camera);
  const hits = raycaster.intersectObjects(npcs.map((n) => n.mesh), true);
  if (hits.length) openCard(hits[0].object.userData.npc);
}

// Joystick
const joy = { x: 0, y: 0, id: null };
const joyEl = $("#joystick"), knob = $("#knob");
joyEl.addEventListener("pointerdown", (e) => { joy.id = e.pointerId; joyEl.setPointerCapture(e.pointerId); moveJoy(e); });
joyEl.addEventListener("pointermove", (e) => { if (e.pointerId === joy.id) moveJoy(e); });
const endJoy = () => { joy.id = null; joy.x = joy.y = 0; knob.style.transform = ""; };
joyEl.addEventListener("pointerup", endJoy);
joyEl.addEventListener("pointercancel", endJoy);
function moveJoy(e) {
  const r = joyEl.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const max = r.width / 2 - 10, len = Math.hypot(dx, dy);
  if (len > max) { dx *= max / len; dy *= max / len; }
  joy.x = dx / max; joy.y = dy / max;
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
}

// ---------------------------------------------------------------- UI
const toastsEl = $("#toasts");
function toast(text, good) {
  const el = document.createElement("div");
  el.className = "toast" + (good ? " good" : "");
  el.textContent = text;
  toastsEl.appendChild(el);
  setTimeout(() => el.remove(), 3800);
  while (toastsEl.children.length > 3) toastsEl.firstChild.remove();
}

let destination = null; // { x, z, label }
function setDestination(x, z, label) {
  destination = { x, z, label };
  beacon.position.set(x, 30, z);
  beacon.visible = true;
  $("#compass").hidden = false;
}
function clearDestination() {
  destination = null;
  beacon.visible = false;
  $("#compass").hidden = true;
}
$("#compass-clear").onclick = clearDestination;

const distTo = (o) => Math.hypot(o.x - player.x, o.z - player.z);
const metres = (d) => (d < 1000 ? Math.round(d * 4) + " m" : (d * 4 / 1000).toFixed(1) + " km"); // 1 unit ≈ 4 m

// Meetups
const meetups = [];
const metIds = new Set(store("ht-met") || []);
function updateMetCount() { $("#met").textContent = `👋 ${metIds.size} met`; }

// Panels
let openPanelName = null;
function openPanel(name) {
  openPanelName = name;
  document.querySelectorAll("#actions [data-panel]").forEach((b) => b.classList.toggle("active", b.dataset.panel === name));
  $("#panel").hidden = false;
  $("#hint").hidden = true;
  renderPanel();
}
function closePanel() {
  openPanelName = null;
  $("#panel").hidden = true;
  document.querySelectorAll("#actions [data-panel]").forEach((b) => b.classList.remove("active"));
}
$("#panel-close").onclick = closePanel;
document.querySelectorAll("#actions [data-panel]").forEach((b) => {
  b.onclick = () => (openPanelName === b.dataset.panel ? closePanel() : openPanel(b.dataset.panel));
});
$("#btn-wave").onclick = doWave;

const peopleFilter = { q: "", job: "" };
function avatar(n) { return `<div class="av" style="background:${n.color}">${esc(n.name[0])}</div>`; }

function renderPanel() {
  const body = $("#panel-body");
  if (openPanelName === "people") {
    $("#panel-title").textContent = "Find people";
    const jobs = [...new Set(npcs.map((n) => n.job))].sort();
    body.innerHTML = `
      <input class="search" id="pq" placeholder="Search by name or what they do" value="${esc(peopleFilter.q)}">
      <div class="chips">${["All", ...jobs].map((j) => `<button class="chip ${(j === "All" ? !peopleFilter.job : peopleFilter.job === j) ? "on" : ""}" data-job="${esc(j)}">${esc(j)}</button>`).join("")}</div>
      <div id="plist"></div>`;
    const pq = $("#pq");
    pq.oninput = () => { peopleFilter.q = pq.value; renderPeopleList(); };
    body.querySelectorAll(".chip").forEach((c) => (c.onclick = () => {
      peopleFilter.job = c.dataset.job === "All" ? "" : c.dataset.job;
      renderPanel();
    }));
    renderPeopleList();
  } else if (openPanelName === "places") {
    $("#panel-title").textContent = "Places";
    const here = townAt(player.x, player.z);
    body.innerHTML = LANDMARKS.filter((l) => !here || l.town === here.id).sort((a, b) => distTo(a) - distTo(b)).map((l) => `
      <div class="row place">
        <div class="info"><b>${esc(l.name)}</b><small>${metres(distTo(l))} away</small><p>${esc(l.blurb)}</p></div>
        <div class="btns"><button class="sm red" data-go="${l.id}">Go</button></div>
      </div>`).join("");
    body.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => {
      const l = LANDMARKS.find((x) => x.id === b.dataset.go);
      setDestination(l.x, l.z, l.name);
      toast(`Heading to ${l.name}. Follow the red beacon.`);
      if (innerWidth < 600) closePanel();
    }));
  } else if (openPanelName === "meetups") {
    $("#panel-title").textContent = "Meetups";
    body.innerHTML = meetups.length ? meetups.slice().reverse().map((m) => `
      <div class="row">
        ${avatar(m.npc)}
        <div class="info"><b>${esc(m.npc.name)} at ${esc(m.place.name)}</b>
          <span class="status ${m.status}">${{ pending: "On the way", met: "Met ✓", declined: "Declined" }[m.status]}</span></div>
        ${m.status === "pending" ? `<div class="btns"><button class="sm" data-guide="${m.id}">Guide me</button></div>` : ""}
      </div>`).join("") : `<p class="empty">No meetups yet. Open <b>People</b>, find someone and tap <b>Meet</b>.</p>`;
    body.querySelectorAll("[data-guide]").forEach((b) => (b.onclick = () => {
      const m = meetups.find((x) => x.id === +b.dataset.guide);
      setDestination(m.spot.x, m.spot.z, m.place.name);
    }));
  }
}

function renderPeopleList() {
  const q = peopleFilter.q.trim().toLowerCase();
  const list = npcs
    .filter((n) => (!peopleFilter.job || n.job === peopleFilter.job) && (!q || (n.name + " " + n.job).toLowerCase().includes(q)))
    .sort((a, b) => distTo(a) - distTo(b));
  $("#plist").innerHTML = list.length ? list.map((n) => `
    <div class="row">
      ${avatar(n)}
      <div class="info"><b>${esc(n.name)}${metIds.has(n.id) ? " ✓" : ""}</b><small>${esc(n.job)} · ${metres(distTo(n))} · near ${esc(placeName(n.x, n.z))}</small></div>
      <div class="btns"><button class="sm" data-find="${n.id}">Find</button><button class="sm red" data-card="${n.id}">Say hi</button></div>
    </div>`).join("") : `<p class="empty">Nobody matches that yet.</p>`;
  $("#plist").querySelectorAll("[data-find]").forEach((b) => (b.onclick = () => {
    const n = npcById[b.dataset.find];
    following = n;
    setDestination(n.x, n.z, n.name);
    toast(`Tracking ${n.name}. Follow the beacon.`);
  }));
  $("#plist").querySelectorAll("[data-card]").forEach((b) => (b.onclick = () => openCard(npcById[b.dataset.card])));
}
let following = null;

// Person card
let cardNpc = null;
function openCard(n) {
  cardNpc = n;
  const d = distTo(n);
  const pendingMeet = meetups.find((m) => m.npc === n && m.status === "pending");
  const placesByDist = LANDMARKS.slice().sort((a, b) => Math.hypot(a.x - (n.x + player.x) / 2, a.z - (n.z + player.z) / 2) - Math.hypot(b.x - (n.x + player.x) / 2, b.z - (n.z + player.z) / 2));
  $("#card").innerHTML = `
    <div class="top">${avatar(n)}
      <div><h3>${esc(n.name)}${metIds.has(n.id) ? " ✓" : ""}</h3>
      <div class="meta">${esc(n.job)} · near ${esc(placeName(n.x, n.z))} · ${metres(d)}</div></div>
      <button class="x" id="card-x" aria-label="Close">✕</button></div>
    ${pendingMeet ? `<p class="meta" style="margin:12px 0 0">You're meeting at <b>${esc(pendingMeet.place.name)}</b>.</p>` :
      `<select id="meet-place">${placesByDist.map((l) => `<option value="${l.id}">Meet at ${esc(l.name)}</option>`).join("")}</select>`}
    <div class="acts">
      <button class="sm" id="c-wave">👋 Wave</button>
      <button class="sm" id="c-find">📍 Find</button>
      ${pendingMeet ? "" : `<button class="sm red" id="c-meet">☕ Ask to meet</button>`}
    </div>`;
  $("#card").hidden = false;
  $("#card-x").onclick = closeCard;
  $("#c-wave").onclick = () => waveAt(n);
  $("#c-find").onclick = () => { following = n; setDestination(n.x, n.z, n.name); closeCard(); };
  const meetBtn = $("#c-meet");
  if (meetBtn) meetBtn.onclick = () => { askToMeet(n, LANDMARKS.find((l) => l.id === $("#meet-place").value)); closeCard(); };
}
function closeCard() { cardNpc = null; $("#card").hidden = true; }

// Social actions
function doWave() {
  if (!started) return;
  player.waveT = 1.6;
  const near = npcs.filter((n) => distTo(n) < 18);
  if (!near.length) { toast("You wave. Nobody's close enough to see. Try a busier spot!"); return; }
  near.forEach((n, i) => setTimeout(() => respondToWave(n), 400 + i * 250));
}
function waveAt(n) {
  player.waveT = 1.6;
  player.heading = Math.atan2(n.x - player.x, n.z - player.z);
  if (distTo(n) > 30) { toast(`${n.name} is too far away to see you. Walk a bit closer.`); return; }
  setTimeout(() => respondToWave(n), 500);
}
function respondToWave(n) {
  n.heading = Math.atan2(player.x - n.x, player.z - n.z);
  n.waveT = 1.6;
  if (n.state === "walk") { n.state = "idle"; n.timer = 2.5; n.speed = 0; }
  say(n, pick(GREETINGS).replace("!", profile.name ? `, ${profile.name}!` : "!"));
}

let meetSeq = 0;
function askToMeet(n, place) {
  toast(`You asked ${n.name} to meet at ${place.name}…`);
  setTimeout(() => {
    const busy = n.meetup || Math.random() > n.friendly;
    if (busy) {
      meetups.push({ id: ++meetSeq, npc: n, place, spot: place, status: "declined" });
      toast(`${n.name}: “${pick(DECLINE_LINES)}”`);
      if (distTo(n) < 35) say(n, "Sorry, can't right now!");
    } else {
      const spot = landmarkSpot(place, 0.35);
      const m = { id: ++meetSeq, npc: n, place, spot, status: "pending" };
      meetups.push(m);
      n.meetup = m;
      n.state = "walk"; n.target = spot;
      setDestination(spot.x, spot.z, `Meet ${n.name} · ${place.name}`);
      following = null;
      toast(`${n.name}: “Go on then! See you at ${place.name}.”`, true);
    }
    if (openPanelName === "meetups") renderPanel();
  }, 1300);
}

function checkMeetups() {
  for (const m of meetups) {
    if (m.status !== "pending") continue;
    const pd = Math.hypot(player.x - m.spot.x, player.z - m.spot.z);
    const nd = Math.hypot(m.npc.x - m.spot.x, m.npc.z - m.spot.z);
    if (pd < 9 && nd < 4) {
      m.status = "met";
      const n = m.npc;
      n.meetup = null; n.state = "idle"; n.timer = 25; n.speed = 0;
      n.heading = Math.atan2(player.x - n.x, player.z - n.z);
      n.waveT = 1.6;
      say(n, pick(MEET_LINES), 5);
      metIds.add(n.id);
      store("ht-met", [...metIds]);
      updateMetCount();
      toast(`You met ${n.name} (${n.job}) at ${m.place.name}! 🎉`, true);
      if (destination && destination.label.startsWith("Meet " + n.name)) clearDestination();
      if (openPanelName === "meetups") renderPanel();
    }
  }
}

function placeName(x, z) {
  let best = null, bd = Infinity;
  for (const l of LANDMARKS) {
    const d = Math.hypot(x - l.x, z - l.z) - l.r;
    if (d < bd) { bd = d; best = l.name; }
  }
  if (bd < 10) return best;
  let hood = null; bd = Infinity;
  for (const n of NEIGHBOURHOODS) {
    const d = Math.hypot(x - n.x, z - n.z);
    if (d < bd) { bd = d; hood = n.name; }
  }
  return hood;
}

// ---------------------------------------------------------------- minimap
const mm = $("#minimap"), mctx = mm.getContext("2d");
const MM_SCALE = 0.55; // px per world unit
function drawMinimap() {
  const w = mm.width, h = mm.height;
  mctx.save();
  mctx.fillStyle = "#9ccf8a"; mctx.fillRect(0, 0, w, h);
  mctx.translate(w / 2, h / 2);
  mctx.rotate(cam.yaw);
  mctx.scale(MM_SCALE, MM_SCALE);
  mctx.translate(-player.x, -player.z);
  mctx.strokeStyle = "#6b6f75"; mctx.lineWidth = 7; mctx.lineCap = mctx.lineJoin = "round";
  for (const road of ROADS) {
    mctx.beginPath();
    road.forEach(([x, z], i) => (i ? mctx.lineTo(x, z) : mctx.moveTo(x, z)));
    mctx.stroke();
  }
  for (const l of LANDMARKS) {
    mctx.fillStyle = ["lake", "pond"].includes(l.type) ? "#4aa3d8" : ["park", "gardens"].includes(l.type) ? "#6fb35a" : "#e8e1d3";
    mctx.beginPath(); mctx.arc(l.x, l.z, l.r * 0.8, 0, 7); mctx.fill();
  }
  for (const n of npcs) {
    mctx.fillStyle = n.meetup ? "#ffcc00" : "#ffffff";
    mctx.beginPath(); mctx.arc(n.x, n.z, n.meetup ? 4 : 2.5, 0, 7); mctx.fill();
  }
  if (destination) {
    mctx.fillStyle = "#ff3355";
    mctx.beginPath(); mctx.arc(destination.x, destination.z, 6, 0, 7); mctx.fill();
  }
  mctx.restore();
  // player arrow (always up)
  mctx.save();
  mctx.translate(w / 2, h / 2);
  mctx.rotate(Math.PI - (player.heading - cam.yaw));
  mctx.fillStyle = "#c8102e"; mctx.strokeStyle = "#fff"; mctx.lineWidth = 2;
  mctx.beginPath(); mctx.moveTo(0, -9); mctx.lineTo(6, 7); mctx.lineTo(0, 3); mctx.lineTo(-6, 7); mctx.closePath();
  mctx.fill(); mctx.stroke();
  mctx.restore();
}

// ---------------------------------------------------------------- update loop
const v3 = new THREE.Vector3();
function project(x, y, z) {
  v3.set(x, y, z).project(camera);
  return { x: (v3.x + 1) / 2 * innerWidth, y: (1 - v3.y) / 2 * innerHeight, behind: v3.z > 1 };
}

function updatePlayer(dt) {
  let fx = 0, fz = 0;
  if (keys.KeyW || keys.ArrowUp) fz += 1;
  if (keys.KeyS || keys.ArrowDown) fz -= 1;
  if (keys.KeyA || keys.ArrowLeft) fx -= 1;
  if (keys.KeyD || keys.ArrowRight) fx += 1;
  if (keys.KeyQ) cam.yaw += dt * 1.8;
  if (keys.KeyE) cam.yaw -= dt * 1.8;
  fx += joy.x; fz -= joy.y;
  const len = Math.min(1, Math.hypot(fx, fz));
  if (len > 0.05) {
    // camera-relative movement: forward is the direction the camera looks
    const fwdX = -Math.sin(cam.yaw), fwdZ = -Math.cos(cam.yaw);
    const rightX = -fwdZ, rightZ = fwdX;
    let mx = fwdX * fz + rightX * fx, mz = fwdZ * fz + rightZ * fx;
    const ml = Math.hypot(mx, mz); mx /= ml; mz /= ml;
    const speed = (keys.ShiftLeft || keys.ShiftRight ? 17 : 9) * len;
    player.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, player.x + mx * speed * dt));
    player.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, player.z + mz * speed * dt));
    const target = Math.atan2(mx, mz);
    let diff = target - player.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.heading += diff * Math.min(1, dt * 12);
    player.speed = speed;
  } else player.speed = 0;
  player.mesh.position.x = player.x; player.mesh.position.z = player.z;
  player.mesh.rotation.y = player.heading;
  animatePerson(player, dt);
}

function updateNpc(n, dt) {
  if (n.state === "idle") {
    n.speed = 0;
    n.timer -= dt;
    if (n.timer <= 0 && !n.meetup) {
      // mostly potter around nearby, sometimes head across town
      const l = Math.random() < 0.25 ? pick(LANDMARKS) : LANDMARKS.slice().sort((a, b) => Math.hypot(a.x - n.x, a.z - n.z) - Math.hypot(b.x - n.x, b.z - n.z))[Math.floor(Math.random() * 3)];
      n.target = landmarkSpot(l, 0.8);
      n.state = "walk";
    }
  } else if (n.state === "walk") {
    const dx = n.target.x - n.x, dz = n.target.z - n.z, d = Math.hypot(dx, dz);
    if (d < 0.6) { n.state = "idle"; n.timer = n.meetup ? 9999 : rand(4, 18); n.speed = 0; }
    else {
      const sp = n.meetup ? 7 : 3.2;
      n.x += (dx / d) * sp * dt; n.z += (dz / d) * sp * dt;
      n.speed = sp;
      n.heading = Math.atan2(dx, dz);
    }
  }
  n.mesh.position.x = n.x; n.mesh.position.z = n.z;
  n.mesh.rotation.y = n.heading;
  animatePerson(n, dt);
}

function placeTag(el, x, z, h, maxD) {
  const d = Math.hypot(x - camera.position.x, z - camera.position.z);
  const p = project(x, h, z);
  if (p.behind || d > maxD) { el.style.display = "none"; return null; }
  el.style.display = "";
  el.style.left = p.x + "px"; el.style.top = p.y + "px";
  return p;
}

// "Hello Town" + the name of the town the player is in
let currentTown;
function updateTown() {
  const t = townAt(player.x, player.z);
  const id = t ? t.id : null;
  if (id === currentTown) return;
  const first = currentTown === undefined;
  currentTown = id;
  const el = $("#town-name");
  el.textContent = t ? t.name : "On the road";
  el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap");
  document.title = t ? `Hello Town · ${t.name}` : "Hello Town";
  if (!first && t && started) toast(`Welcome to ${t.name}${t.county ? ", " + t.county : ""}!`, true);
}

let started = false, last = performance.now(), panelTick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (started) updatePlayer(dt);
  npcs.forEach((n) => updateNpc(n, dt));
  if (following) {
    if (following.meetup) following = null;
    else { destination.x = following.x; destination.z = following.z; beacon.position.set(following.x, 30, following.z); }
    if (following && distTo(following) < 8) { toast(`You found ${following.name}. Say hi!`); openCard(following); following = null; clearDestination(); }
  }
  checkMeetups();

  // camera
  const cx = player.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist;
  const cz = player.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist;
  const cy = 2 + Math.sin(cam.pitch) * cam.dist;
  camera.position.lerp(v3.set(cx, cy, cz), Math.min(1, dt * 10));
  camera.lookAt(player.x, 2.4, player.z);

  sun.position.set(player.x + 40, 70, player.z + 25);
  sun.target.position.set(player.x, 0, player.z);

  // labels
  if (player.tag) placeTag(player.tag, player.x, player.z, 3.7, 80);
  for (const n of npcs) {
    placeTag(n.tag, n.x, n.z, 3.7, 55);
    if (n.bubbleT > 0) {
      n.bubbleT -= dt;
      const p = placeTag(n.bubble, n.x, n.z, 5.2, 70);
      if (p) n.bubble.style.top = (p.y - 26) + "px";
      if (n.bubbleT <= 0) n.bubble.hidden = true;
    }
  }

  // compass + area
  if (destination) {
    const dx = destination.x - player.x, dz = destination.z - player.z;
    const fwdX = -Math.sin(cam.yaw), fwdZ = -Math.cos(cam.yaw);
    const ahead = dx * fwdX + dz * fwdZ, right = dx * -fwdZ + dz * fwdX;
    $("#compass-arrow").style.transform = `rotate(${Math.atan2(right, ahead) - Math.PI / 2}rad)`;
    $("#compass-text").textContent = `${destination.label} · ${metres(Math.hypot(dx, dz))}`;
    if (!following && Math.hypot(dx, dz) < 6 && !destination.label.startsWith("Meet ")) {
      toast(`You've arrived at ${destination.label}.`, true);
      clearDestination();
    }
  }
  if ((panelTick += dt) > 0.5) {
    panelTick = 0;
    $("#area").textContent = "📍 " + placeName(player.x, player.z);
    updateTown();
    if (openPanelName === "people") renderPeopleList();
  }

  drawMinimap();
  renderer.render(scene, camera);
  updateTown();
requestAnimationFrame(frame);
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------------------------------------------------------------- start screen
$("#jobs").innerHTML = OCCUPATIONS.map((o) => `<option value="${esc(o)}">`).join("");
$("#p-name").value = profile.name || "";
$("#p-job").value = profile.job || "";
const swEl = $("#swatches");
COLORS.forEach((c) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "sw" + (c === profile.color ? " on" : "");
  b.style.background = c; b.setAttribute("aria-label", "Colour " + c);
  b.onclick = () => { profile.color = c; swEl.querySelectorAll(".sw").forEach((s) => s.classList.toggle("on", s === b)); };
  swEl.appendChild(b);
});

$("#start-form").addEventListener("submit", (e) => {
  e.preventDefault();
  profile.name = $("#p-name").value.trim();
  profile.job = $("#p-job").value.trim();
  store("ht-profile", profile);
  player.name = profile.name; player.job = profile.job;
  player.mesh = makePerson(profile.color);
  player.tag = makeTag(profile.name + " (you)", profile.job, true);
  $("#start").hidden = true;
  started = true;
  updateMetCount();
  updateTown();
  toast(`Welcome to ${townAt(player.x, player.z)?.name || "town"}, ${profile.name}! Try waving at someone nearby.`, true);
});

// Expose a tiny hook for automated checks.
window.__ht = { player, npcs, meetups, askToMeet, LANDMARKS, TOWNS, updateTown };

updateTown();
requestAnimationFrame(frame);
