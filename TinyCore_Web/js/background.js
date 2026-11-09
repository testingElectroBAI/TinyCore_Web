/* background.js — cursor/touch parallax for the letter-grid background */
(function () {
  "use strict";

  var svg = document.getElementById('letterGrid');
  if (!svg) return;

  var OVERSIZE = 1.2;   // svg drawn 20% larger than the viewport's longer side
  var PAN_RATIO = 0.06; // max pan distance as a fraction of that longer side
  var SMOOTH = 0.08;    // easing factor for cursor following

  var vmax, size, baseLeft, baseTop, maxPan;
  var targetX = 0, targetY = 0, curX = 0, curY = 0;
  var rafId = null, resizeTimer = null;

  function resize() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    vmax = Math.max(vw, vh);
    size = vmax * OVERSIZE;
    maxPan = vmax * PAN_RATIO;
    baseLeft = (vw - size) / 2;
    baseTop = (vh - size) / 2;
    svg.style.width = size + 'px';
    svg.style.height = size + 'px';
    svg.style.left = baseLeft + 'px';
    svg.style.top = baseTop + 'px';
    render();
  }

  function onPointerMove(e) {
    var p = e.touches ? e.touches[0] : e;
    var nx = (p.clientX / window.innerWidth - 0.5) * 2;
    var ny = (p.clientY / window.innerHeight - 0.5) * 2;
    targetX = nx * maxPan;
    targetY = ny * maxPan;
    requestRender();
  }

  function requestRender() {
    if (rafId === null) rafId = requestAnimationFrame(loop);
  }

  function loop() {
    curX += (targetX - curX) * SMOOTH;
    curY += (targetY - curY) * SMOOTH;
    render();
    var moving = Math.abs(targetX - curX) > 0.02 || Math.abs(targetY - curY) > 0.02;
    rafId = moving ? requestAnimationFrame(loop) : null;
  }

  function render() {
    svg.style.transform = 'translate3d(' + curX.toFixed(2) + 'px, ' + curY.toFixed(2) + 'px, 0)';
  }

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }, { passive: true });

  window.addEventListener('mousemove', onPointerMove, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });

  resize();
})();
