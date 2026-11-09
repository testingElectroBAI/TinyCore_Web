/* animations.js — scroll-reveal observer and loading-screen dismissal */
(function () {
  "use strict";

  /* Scroll animations */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        e.target.querySelectorAll('.spec-bar[data-width]').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  document.querySelectorAll('.spec-bar[data-width]').forEach(bar => observer.observe(bar.closest('.spec-cell') || bar));

  // Expose for github.js, which observes repo cards created after load.
  window.scrollObserver = observer;

  /* Dismiss loader once page is ready */
  (function () {
    var loader = document.getElementById('page-loader');
    if (!loader) return;
    // Wait for loader bar animation (1.4s) + small buffer, then fade out
    setTimeout(function () {
      loader.classList.add('hidden');
      loader.addEventListener('transitionend', function () {
        loader.remove();
      }, { once: true });
    }, 1500);
  })();
})();
