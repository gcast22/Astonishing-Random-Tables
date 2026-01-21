// ---- Configure your menu here ----
// Native <select> supports one true grouping level (<optgroup>).
// We simulate a top-level category header with a disabled <option>.
const TABLE_TREE = [
  {
    label: "Magic & Miscellany",
    sections: [
      {
        label: "Scrolls",
        tables: [
          // You already have this one (range style table, 1d100):
          { name: "Spell Scroll Level", path: "tables/magic/scrolls/spell_scroll_level.json" },
          { name: "Cantrip Level Scrolls", path: "tables/magic/scrolls/cantrip_scrolls.json" },
          { name: "1st-Level Spell Scrolls", path: "tables/magic/scrolls/level1_scrolls.json" },
          { name: "2nd-Level Spell Scrolls", path: "tables/magic/scrolls/level2_scrolls.json" },
          { name: "3rd-Level Spell Scrolls", path: "tables/magic/scrolls/level3_scrolls.json" },
          { name: "4th-Level Spell Scrolls", path: "tables/magic/scrolls/level4_scrolls.json" },
          { name: "5th-Level Spell Scrolls", path: "tables/magic/scrolls/level5_scrolls.json" },
          { name: "6th-Level Spell Scrolls", path: "tables/magic/scrolls/level6_scrolls.json" },
          { name: "7th-Level Spell Scrolls", path: "tables/magic/scrolls/level7_scrolls.json" },
          { name: "8th-Level Spell Scrolls", path: "tables/magic/scrolls/level8_scrolls.json" },
          { name: "9th-Level Spell Scrolls", path: "tables/magic/scrolls/level9_scrolls.json" },
          { name: "Unexpected Spell Scroll Results", path: "tables/magic/scrolls/unexpected_results.json" },
          { name: "Transmuted Damage Types", path: "tables/magic/scrolls/transmuted_damage_types.json" },
        ],
      },
      {
        label: "Potions",
        tables: [
          // { name: "Potion Type", path: "tables/magic/potions/potion_type.json" },
          // { name: "Beneficial Potions & Elixirs", path: "tables/magic/potions/beneficial.json" },
          // { name: "Detrimental Potions & Poisons", path: "tables/magic/potions/detrimental.json" },
          // { name: "Mixed Potion Interactions", path: "tables/magic/potions/mixed_interactions.json" },
        ],
      },
      {
        label: "Items with Personality",
        tables: [
          // { name: "Good Sentient Magic Item Personalities", path: "tables/magic/items_personality/good_sentient.json" },
          // { name: "Evil Sentient Magic Item Personalities", path: "tables/magic/items_personality/evil_sentient.json" },
        ],
      },
      {
        label: "Personalities in Items",
        tables: [
          // { name: "Object Occupants: Dead", path: "tables/magic/object_occupants/dead.json" },
          // { name: "Object Occupants: Living", path: "tables/magic/object_occupants/living.json" },
        ],
      },
    ],
  },
];

// ---- App code ----
let tables = [];
let currentTable = null;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseDice(diceStr) {
  // supports "1d6", "2d20", etc.
  const m = /^(\d+)d(\d+)$/.exec((diceStr || "").trim());
  if (!m) return null;
  return { n: Number(m[1]), die: Number(m[2]) };
}

function rollDice(dice) {
  const { n, die } = dice;
  let total = 0;
  for (let i = 0; i < n; i++) total += randInt(1, die);
  return total;
}

// Supports TWO table formats:
// A) Classic list:
//    { dice: "1d6", entries: ["...", "...", ...] }
// B) Range-based (supports ranges AND single rolls):
//    { dice: "1d100", entries: [{min:1,max:5,text:"..."}, {min:6,max:6,text:"..."}, ...] }
function pickEntry(table) {
  const dice = parseDice(table.dice);
  let r = null;
  if (dice) r = rollDice(dice);

  const first = table.entries?.[0];

  // Case A: entries are strings (old style)
  if (typeof first === "string") {
    if (r === null) {
      const idx = randInt(0, table.entries.length - 1);
      return { roll: `— (uniform)`, text: table.entries[idx] };
    }
    const idx = Math.min(Math.max(r - 1, 0), table.entries.length - 1);
    return { roll: `${r} (${table.dice})`, text: table.entries[idx] };
  }

  // Case B: entries are objects with min/max/text (range style)
  if (r === null) {
    const idx = randInt(0, table.entries.length - 1);
    const e = table.entries[idx];
    return { roll: `— (uniform)`, text: e.text ?? String(e) };
  }

  const match = table.entries.find(e =>
    e && typeof e === "object" &&
    typeof e.min === "number" &&
    typeof e.max === "number" &&
    r >= e.min && r <= e.max
  );

  return {
    roll: `${r} (${table.dice})`,
    text: match ? (match.text ?? "—") : "No matching entry for that roll."
  };
}

async function loadTables() {
  const loaded = [];

  for (const cat of TABLE_TREE) {
    for (const section of cat.sections) {
      for (const item of section.tables) {
        const res = await fetch(item.path);
        if (!res.ok) throw new Error(`Failed to load ${item.path}`);
        const t = await res.json();

        // metadata used by UI
        t._path = item.path;
        t._displayName = item.name || t.name;
        t._category = cat.label;
        t._section = section.label;

        loaded.push(t);
      }
    }
  }

  return loaded;
}

function renderSelect() {
  const sel = document.getElementById("tableSelect");
  sel.innerHTML = "";

  const INDENT = "\u00A0\u00A0\u00A0\u00A0";
  const INDENT_DEEP = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0";

  for (const cat of TABLE_TREE) {
    // Level 1: top category header (disabled divider)
    const catHeader = document.createElement("option");
    catHeader.textContent = cat.label.toUpperCase();
    catHeader.disabled = true;
    catHeader.value = "";
    sel.appendChild(catHeader);

    // Level 2: sections as optgroups (bold label in most browsers)
    for (const section of cat.sections) {
      const group = document.createElement("optgroup");
      group.label = INDENT + section.label;

      // Level 3: tables as options (indented)
      for (const item of section.tables) {
        const opt = document.createElement("option");
        opt.value = item.path;
        opt.textContent = INDENT_DEEP + item.name;
        group.appendChild(opt);
      }

      sel.appendChild(group);
    }
  }

  sel.addEventListener("change", () => {
    currentTable = tables.find(t => t._path === sel.value) || null;
    renderCurrentTableHeader();
    document.getElementById("output").textContent = "Ready to roll.";
  });

  // Default selection to first real table in the tree
  const firstPath = TABLE_TREE?.[0]?.sections?.[0]?.tables?.[0]?.path ?? null;
  if (firstPath) {
    sel.value = firstPath;
    currentTable = tables.find(t => t._path === firstPath) || null;
    renderCurrentTableHeader();
    document.getElementById("output").textContent = "Ready to roll.";
  } else {
    renderCurrentTableHeader();
  }
}

function renderCurrentTableHeader() {
  document.getElementById("tableName").textContent = currentTable?._displayName ?? "—";
  document.getElementById("rollInfo").textContent =
    currentTable?.dice ? `Dice: ${currentTable.dice}` : "";
}

function wireButtons() {
  document.getElementById("rollBtn").addEventListener("click", () => {
    if (!currentTable) return;
    const result = pickEntry(currentTable);
    document.getElementById("output").textContent = result.text;
    document.getElementById("rollInfo").textContent = `Roll: ${result.roll}`;
  });

  document.getElementById("copyBtn").addEventListener("click", async () => {
    const text = document.getElementById("output").textContent;
    await navigator.clipboard.writeText(text);
  });
}

(async function init() {
  try {
    tables = await loadTables();
    renderSelect();
    wireButtons();
  } catch (err) {
    console.error(err);
    document.getElementById("output").textContent =
      "Error loading tables. Check the console and make sure your JSON paths are correct.";
  }
})();
