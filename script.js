// ⚠️ Replace with your TMDB API key
const TMDB_KEY = "YOUR_TMDB_API_KEY";

const input = document.getElementById("searchInput");
const grid = document.getElementById("movieGrid");
const statusText = document.getElementById("statusText");
const voiceBtn = document.getElementById("voiceBtn");

let debounceTimer;

// 🔁 Debounced search
input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchMovies(input.value);
  }, 500);
});

// 🎙️ Voice search
voiceBtn.onclick = () => {
  const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  rec.lang = "en-US";
  rec.start();

  rec.onresult = e => {
    input.value = e.results[0][0].transcript;
    searchMovies(input.value);
  };
};

// 🔍 TMDB Search
async function searchMovies(query) {
  grid.innerHTML = "";
  if (!query) {
    statusText.textContent = "✨ start typing, pookie ✨";
    return;
  }

  statusText.textContent = "🔍 searching...";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${query}`
  );
  const data = await res.json();

  if (!data.results.length) {
    statusText.textContent = "😔 no results found, pookie";
    return;
  }

  statusText.textContent = "";
  data.results.forEach(movie => createCard(movie));
}

// 🎥 Create movie card
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

// ▶️ Player
function playMovie(id) {
  document.getElementById("playerFrame").src =
    `https://www.vidking.net/embed/movie/${id}?autoPlay=true&color=ff69b4`;
  document.getElementById("playerModal").style.display = "flex";
}

function closePlayer() {
  document.getElementById("playerFrame").src = "";
  document.getElementById("playerModal").style.display = "none";
}
