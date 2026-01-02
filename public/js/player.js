// Clean VidKing Player with Ad Removal
function openPlayer(id, mediaType, title) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('player-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Create clean VidKing URL
  const vidkingUrl = mediaType === 'movie' 
    ? `https://www.vidking.net/embed/movie/${id}?autoPlay=true&color=ff0000`
    : `https://www.vidking.net/embed/tv/${id}/1/1?autoPlay=true&color=ff0000&nextEpisode=true&episodeSelector=true`;
  
  // Use your proxy to remove ads
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(vidkingUrl)}`;
  
  // Create iframe with clean content
  const iframe = document.createElement('iframe');
  iframe.src = proxyUrl;
  iframe.allowFullscreen = true;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.allow = 'autoplay; fullscreen';
  
  const container = document.getElementById('video-container');
  container.innerHTML = '';
  container.appendChild(iframe);
}
