const API_URL = "https://pokeapi.co/api/v2/pokemon?limit=999";

const pokedexDiv = document.getElementById("pokedex");
const searchInput = document.getElementById("searchInput");
const typeSelect = document.getElementById("typeSelect");
const notFilter = document.getElementById("notFilter");
const errorDiv = document.getElementById("error");
const loader = document.getElementById("loader");
const noResults = document.getElementById("no-results");

let allPokemon = [];

async function loadPokemon() {
  try {
    loader.style.display = "flex";
    errorDiv.classList.add("hidden");

    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al cargar la PokéAPI");

    const data = await res.json();

    const detailedPromises = data.results.map(p =>
      fetch(p.url).then(r => r.json())
    );

    const detailedData = await Promise.all(detailedPromises);

    allPokemon = detailedData.map(p => ({
      id: p.id,
      name: p.name,
      image: p.sprites.other["official-artwork"].front_default,
      types: p.types.map(t => t.type.name)
    }));

    loadTypeOptions();
    render(allPokemon);

  } catch (err) {
    showError("No se pudo conectar con la PokéAPI. Intenta más tarde.");
  } finally {
    loader.style.display = "none";
  }
}

function loadTypeOptions() {
  const uniqueTypes = new Set();

  allPokemon.forEach(p =>
    p.types.forEach(t => uniqueTypes.add(t))
  );

  uniqueTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = capitalize(type);
    typeSelect.appendChild(option);
  });
}

function render(list) {
  pokedexDiv.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${capitalize(p.name)}</h3>
      <div class="id">#${String(p.id).padStart(3, "0")}</div>
      <div class="types">
        ${p.types.map(t =>
          `<span class="type ${t}">${capitalize(t)}</span>`
        ).join("")}
      </div>
    `;

    pokedexDiv.appendChild(card);
  });
}

function applyFilters() {
  const text = searchInput.value.toLowerCase().trim();
  const selectedTypes = Array.from(typeSelect.selectedOptions)
    .map(o => o.value)
    .filter(v => v !== "");

  const isNot = notFilter.checked;

  const filtered = allPokemon.filter(p => {
    // ---- FILTRO DE TEXTO ----
    const matchesText =
      p.name.includes(text) ||
      String(p.id).includes(text);

    const textCondition = isNot ? !matchesText : matchesText;

    // ---- FILTRO DE TIPO ----
    const matchesType =
      selectedTypes.length === 0 ||
      selectedTypes.some(t => p.types.includes(t));

    const typeCondition = isNot ? !matchesType : matchesType;

    return textCondition && typeCondition;
  });

  noResults.classList.toggle("hidden", filtered.length > 0);
  render(filtered);
}

function showError(msg) {
  errorDiv.textContent = msg;
  errorDiv.classList.remove("hidden");
}

searchInput.addEventListener("input", applyFilters);
typeSelect.addEventListener("change", applyFilters);
notFilter.addEventListener("change", applyFilters);

loadPokemon();

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
