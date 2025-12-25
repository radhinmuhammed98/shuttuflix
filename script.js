function playMovie(id) {
  const modal = document.getElementById("playerModal");
  const frame = document.getElementById("playerFrame");

  frame.src = `https://www.vidking.net/embed/movie/${id}?autoPlay=true&color=ff69b4`;
  modal.style.display = "flex";
}

function closePlayer() {
  const modal = document.getElementById("playerModal");
  const frame = document.getElementById("playerFrame");

  frame.src = "";
  modal.style.display = "none";
}
