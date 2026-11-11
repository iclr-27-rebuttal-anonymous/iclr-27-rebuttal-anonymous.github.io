"use strict";

(() => {
  const videos = [...document.querySelectorAll("video[data-src]")];
  const states = new Map();

  function pause(video) {
    if (video.paused) return;
    states.get(video).automaticPause = true;
    video.pause();
  }

  function play(video) {
    const state = states.get(video);
    if (!state.visible || document.hidden || state.userPaused || video.ended) return;
    if (!video.getAttribute("src")) video.src = video.dataset.src;
    video.play().catch(() => {
      // Native controls remain available when autoplay is blocked by the browser.
    });
  }

  for (const video of videos) {
    const state = { visible: false, userPaused: false, automaticPause: false };
    states.set(video, state);
    video.muted = true;
    video.defaultMuted = true;
    video.addEventListener("pause", () => {
      if (state.automaticPause) state.automaticPause = false;
      else if (state.visible && !video.ended) state.userPaused = true;
    });
    video.addEventListener("play", () => { state.userPaused = false; });
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const video = entry.target;
        states.get(video).visible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
        if (states.get(video).visible) play(video);
        else pause(video);
      }
    }, { threshold: [0, 0.1] });
    videos.forEach((video) => observer.observe(video));
  } else {
    videos.forEach((video) => { states.get(video).visible = true; play(video); });
  }

  document.addEventListener("visibilitychange", () => {
    videos.forEach((video) => document.hidden ? pause(video) : play(video));
  });
  window.addEventListener("pagehide", () => videos.forEach(pause));
  window.addEventListener("pageshow", () => videos.forEach(play));
})();
