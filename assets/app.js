"use strict";

(() => {
  const grid = document.getElementById("video-grid");
  const videos = [...grid.querySelectorAll(".video-card")].map((card) => ({
    id: card.dataset.id,
    title: card.querySelector("h3").textContent.trim(),
    category: card.dataset.category,
    duration: Number(card.dataset.duration),
    src: card.querySelector(".card-watch").href,
    poster: card.querySelector("img").getAttribute("src"),
    prompt: card.querySelector(".card-prompt p").textContent,
    card,
  }));
  if (!videos.length) return;
  const byId = new Map(videos.map((video) => [video.id, video]));
  const dialog = document.getElementById("viewer");
  const player = document.getElementById("player");
  const search = document.getElementById("search");
  const filters = [...document.querySelectorAll("[data-filter]")];
  const resultCount = document.getElementById("results-count");
  const closeButton = document.getElementById("close-viewer");
  const previousButton = document.getElementById("previous-video");
  const nextButton = document.getElementById("next-video");
  const playbackError = document.getElementById("playback-error");
  const promptText = document.getElementById("viewer-prompt");
  const promptNote = document.querySelector(".prompt-note");
  const momentGrid = document.getElementById("moment-grid");
  let category = "all";
  let current = null;
  let lastFocus = null;
  let previousHash = "";
  let pendingSeek = null;
  let ownsHistoryEntry = false;
  document.getElementById("gallery-toolbar").hidden = false;

  const timestamp = (seconds) => {
    const whole = Math.floor(seconds);
    return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
  };

  function applyFilters() {
    const query = search.value.trim().toLocaleLowerCase();
    let shown = 0;
    for (const video of videos) {
      const text = `${video.title} ${video.prompt}`.toLocaleLowerCase();
      const visible = (category === "all" || video.category === category) &&
        (!query || text.includes(query));
      video.card.hidden = !visible;
      if (visible) shown += 1;
    }
    resultCount.textContent = shown === videos.length
      ? `Showing all ${videos.length} videos`
      : `Showing ${shown} of ${videos.length} videos`;
    document.getElementById("empty-state").hidden = shown > 0;
    for (const button of filters) {
      const active = button.dataset.filter === category;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  filters.forEach((button) => button.addEventListener("click", () => {
    category = button.dataset.filter;
    applyFilters();
  }));
  search.addEventListener("input", applyFilters);
  document.getElementById("reset-filters").addEventListener("click", () => {
    category = "all";
    search.value = "";
    applyFilters();
    search.focus();
  });

  function updateHash(id, second = 0, push = false) {
    const hash = `#video=${encodeURIComponent(id)}${second ? `&t=${Math.floor(second)}` : ""}`;
    const url = `${location.pathname}${location.search}${hash}`;
    if (push) {
      history.pushState({ rollingSinkViewer: true }, "", url);
      ownsHistoryEntry = true;
    } else {
      history.replaceState(history.state, "", url);
    }
  }

  function seek(second, shouldPlay = true) {
    const value = Number.isFinite(second) ? second : 0;
    const bounded = Math.max(0, Math.min(value, (current?.duration || 300) - .1));
    if (player.readyState >= 1) player.currentTime = bounded;
    else pendingSeek = bounded;
    if (shouldPlay) {
      const playback = player.play();
      if (playback) playback.catch(() => {
        // Native controls remain available if another user gesture is required.
      });
    }
  }

  player.addEventListener("loadedmetadata", () => {
    if (pendingSeek !== null) {
      player.currentTime = Math.min(pendingSeek, Math.max(0, player.duration - .1));
      pendingSeek = null;
    }
  });
  player.addEventListener("error", () => {
    if (current && player.getAttribute("src")) playbackError.hidden = false;
  });
  player.addEventListener("playing", () => { playbackError.hidden = true; });

  function fillMoments(video) {
    const labels = ["Beginning", "Middle", "Near the end"];
    momentGrid.replaceChildren();
    [0, 150, 290].forEach((second, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "moment-button";
      button.dataset.time = String(second);
      button.setAttribute("aria-label", `Jump to ${timestamp(second)} in ${video.title}`);
      const image = document.createElement("img");
      image.src = `assets/posters/${video.id}-${String(second).padStart(3, "0")}.webp`;
      image.alt = "";
      image.width = 832;
      image.height = 480;
      const caption = document.createElement("span");
      caption.className = "moment-caption";
      const name = document.createElement("span");
      name.textContent = labels[index];
      const time = document.createElement("span");
      time.textContent = timestamp(second);
      caption.append(name, time);
      button.append(image, caption);
      button.addEventListener("click", () => {
        updateHash(video.id, second);
        seek(second);
      });
      momentGrid.append(button);
    });
  }

  function openVideo(id, second = 0, shouldPlay = true, fromHash = false) {
    const video = byId.get(id);
    if (!video) return;
    const firstOpen = !dialog.open;
    if (firstOpen) {
      lastFocus = document.activeElement;
      previousHash = location.hash.startsWith("#video=") ? "#gallery" : location.hash;
      if (fromHash) ownsHistoryEntry = Boolean(history.state?.rollingSinkViewer);
    }
    const changed = current?.id !== id;
    current = video;
    if (changed) {
      pendingSeek = null;
      player.pause();
      player.poster = video.poster;
      player.preload = "metadata";
      player.src = video.src;
      player.setAttribute("aria-label", `${video.title}, full five-minute generated video`);
      playbackError.hidden = true;
      document.getElementById("viewer-title").textContent = video.title;
      const index = videos.indexOf(video);
      document.getElementById("viewer-count").textContent =
        `${String(index + 1).padStart(2, "0")} / ${videos.length}`;
      promptText.textContent = video.prompt;
      promptNote.textContent = "Prompt reproduced verbatim.";
      document.getElementById("copy-prompt").querySelector("span").textContent = "Copy";
      document.getElementById("direct-video-link").href = video.src;
      document.getElementById("error-video-link").href = video.src;
      document.getElementById("video-specs").textContent = "832 × 480 · 16 fps";
      previousButton.disabled = index === 0;
      nextButton.disabled = index === videos.length - 1;
      fillMoments(video);
    }
    if (firstOpen) {
      dialog.showModal();
      document.body.classList.add("viewer-open");
      closeButton.focus({ preventScroll: true });
    }
    if (changed) dialog.scrollTop = 0;
    if (!fromHash) updateHash(id, second, firstOpen);
    seek(second, shouldPlay);
  }

  function closeViewer(restoreHash = true) {
    if (!dialog.open) return;
    player.pause();
    pendingSeek = null;
    player.removeAttribute("src");
    player.preload = "none";
    player.load();
    current = null;
    dialog.close();
    document.body.classList.remove("viewer-open");
    if (restoreHash && location.hash.startsWith("#video=")) {
      if (ownsHistoryEntry) history.back();
      else history.replaceState(null, "", `${location.pathname}${location.search}${previousHash}`);
    }
    ownsHistoryEntry = false;
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-open]");
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey ||
        event.shiftKey || event.altKey) return;
    if (!byId.has(link.dataset.open)) return;
    event.preventDefault();
    openVideo(link.dataset.open, Number(link.dataset.time || 0));
  });
  closeButton.addEventListener("click", () => closeViewer());
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeViewer();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) closeViewer();
  });
  previousButton.addEventListener("click", () => {
    const index = videos.indexOf(current);
    if (index > 0) openVideo(videos[index - 1].id);
  });
  nextButton.addEventListener("click", () => {
    const index = videos.indexOf(current);
    if (index < videos.length - 1) openVideo(videos[index + 1].id);
  });

  document.getElementById("copy-prompt").addEventListener("click", async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.prompt);
      document.getElementById("copy-prompt").querySelector("span").textContent = "Copied";
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(promptText);
      selection.removeAllRanges();
      selection.addRange(range);
      promptText.focus();
      promptNote.textContent = "Prompt selected. Press Ctrl+C or ⌘C to copy.";
    }
  });

  function readHash() {
    if (!location.hash.startsWith("#video=")) {
      if (dialog.open) closeViewer(false);
      return;
    }
    const parameters = new URLSearchParams(location.hash.slice(1));
    const second = Math.max(0, Number(parameters.get("t") || 0));
    openVideo(parameters.get("video"), second, false, true);
  }
  window.addEventListener("hashchange", readHash);
  document.addEventListener("keydown", (event) => {
    const editing = event.target.matches("input, textarea, [contenteditable]");
    if (event.key === "/" && !dialog.open && !editing && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      search.focus();
    }
  });
  window.addEventListener("pagehide", () => player.pause());
  applyFilters();
  readHash();
})();
