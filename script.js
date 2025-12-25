// 🔑 PUT YOUR REAL TMDB API KEY HERE
const TMDB_KEY = "PASTE_YOUR_TMDB_API_KEY_HERE";

const input = document.getElementById("searchInput");
const grid = document.getElementById("movieGrid");
const statusText = document.getElementById("statusText");
const voiceBtn = document.getElementById("voiceBtn");

let debounceTimer;

/* ---------------- SEARCH ---------------- */

input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchMovies(input.value.trim());
  }, 500);
});

/* ---------------- VOICE ---------------- */

voiceBtn.onclick = () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert("voice search not supported, pookie 😔");
    return;
  }

  const rec = new webkitSpeechRecognition();
  rec.lang = "en-US";
  rec.start();

  rec.onresult = e => {
    input.value = e.results[0][0].transcript;
    searchMovies(input.value.trim());
  };
};

/* ---------------- TMDB SEARCH ---------------- */

async function searchMovies(query) {
  grid.innerHTML = "";

  if (!query) {
    statusText.textContent = "✨ start typing, pookie ✨";
    return;
  }

  if (!TMDB_KEY || TMDB_KEY.includes("PASTE")) {
    statusText.textContent = "❌ TMDB API key missing, pookie";
    return;
  }

  statusText.textContent = "🔍 searching...";

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`
    );

    if (!res.ok) throw new Error("TMDB error");

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      statusText.textContent = "😔 no results found, pookie";
      return;
    }

    statusText.textContent = "";

    data.results.forEach(movie => {
      if (movie.poster_path) createCard(movie);
    });

  } catch (err) {
    console.error(err);
    statusText.textContent = "⚠️ something broke, pookie";
  }
}

/* ---------------- CARD ---------------- */

function createCard(movie) {
  const card = document.createElement("div");
  card.className = "card";
  card.onclick = () => playMovie(movie.id);

  card.innerHTML = `
    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}">
    <span>${movie.title}</span>
  `;

  grid.appendChild(card);
}

/* ---------------- PLAYER ---------------- */

function playMovie(id) {
  document.getElementById("playerFrame").src =
    `https://www.vidking.net/embed/movie/${id}?autoPlay=true&color=ff69b4`;

  document.getElementById("playerModal").style.display = "flex";
}

function closePlayer() {
  document.getElementById("playerFrame").src = "";
  document.getElementById("playerModal").style.display = "none";
}
