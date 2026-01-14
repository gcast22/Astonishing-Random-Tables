const TABLE_FILES = [
  "tables/tavern.json",
  // Add more later:
  // "tables/wilderness.json",
];

let tables = [];
let currentTable = null;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseDice(diceStr) {
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

function pickEntry(table) {
  const dice = parseDice(table.dice);
  if (dice) {
    const r = rollDice(dice);
    const idx = Math.min(Math.max(r - 1, 0), table.entries.length - 1);
    return { roll: `${r} (${table.dice})`, text: table.entries[idx] };
  } else {
    const idx = randInt(0, table.entries.length - 1);
    return { roll: `— (uniform)`, text: table.entries[idx] };
  }
}

async function loadTables() {
  const loaded = [];
  for (const path of TABLE_FILES) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    const t = await res.json();
    t._path = path;
    loaded.push(t);
  }
  return loaded;
}

function renderSelect() {
  const sel = document.getElementById("tableSelect");
  sel.innerHTML = "";

  for (const t of tables) {
    const opt = document.createElement("option");
    opt.value = t._path;
    opt.textContent = t.name;
    sel.appendChild(opt);
  }

  sel.addEventListener("change", () => {
    currentTable = tables.find(t => t._path === sel.value);
    document.getElementById("tableName").textContent = currentTable?.name ?? "—";
    document.getElementById("rollInfo").textContent = currentTable?.dice ? `Dice: ${currentTable.dice}` : "";
    document.getElementById("output").textContent = "Ready to roll.";
  });

  currentTable = tables[0] ?? null;
  if (currentTable) {
    sel.value = currentTable._path;
    document.getElementById("tableName").textContent = currentTable.name;
    document.getElementById("rollInfo").textContent = currentTable.dice ? `Dice: ${currentTable.dice}` : "";
  }
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
  tables = await loadTables();
  renderSelect();
  wireButtons();
})();
