/* tinycore.js — lazy-loaded v86 TinyCore Linux VM widget */
(function () {
  "use strict";

  var bootBtn = document.getElementById('tc-boot-btn');
  var statusEl = document.getElementById('tc-status');
  var screen = document.getElementById('tc-screen');
  var gate = document.getElementById('tc-gate');
  var fallback = document.getElementById('tc-fallback');
  var perfNote = document.getElementById('tc-perf-note');

  if (typeof WebAssembly === 'undefined') {
    screen.style.display = 'none';
    fallback.style.display = 'block';
    return;
  }

  var cores = navigator.hardwareConcurrency || 2;
  if (cores <= 2) {
    perfNote.textContent = 'Boot may take longer on this device.';
  }

  function setStatus(text) { statusEl.textContent = text; }

  function loadV86(callback) {
    if (typeof window.V86 !== 'undefined') { callback(); return; }
    var s = document.createElement('script');
    s.src = 'v86/libv86.js';
    s.onload = callback;
    s.onerror = function () {
      setStatus('error');
      bootBtn.textContent = 'Load Failed';
      screen.style.display = 'none';
      fallback.style.display = 'block';
    };
    document.body.appendChild(s);
  }

  function bootTinyCore() {
    bootBtn.disabled = true;
    bootBtn.textContent = 'Loading v86…';
    setStatus('loading');

    loadV86(function () {
      bootBtn.textContent = 'Booting…';

      screen.innerHTML = '';
      var v86Screen = document.createElement('div');
      v86Screen.style.width = '100%';
      screen.appendChild(v86Screen);

      var emulator = new V86({
        screen: { container: v86Screen },
        wasm_path: 'v86/v86.wasm',
        bios: { url: 'bios/seabios.bin' },
        vga_bios: { url: 'bios/vgabios.bin' },
        bzimage: { url: 'tinycore/vmlinuz' },
        initrd: { url: 'tinycore/custom_core.gz' },
        memory_size: 96 * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        autostart: true,
        disable_speaker: true
      });

      var sawFirstFrame = false;
      var stallTimeout = setTimeout(function () {
        if (!sawFirstFrame) setStatus('stalled?');
      }, 20000);

      emulator.add_listener('screen-set-size', function () {
        if (!sawFirstFrame) {
          sawFirstFrame = true;
          setStatus('running');
          clearTimeout(stallTimeout);
        }
      });

      emulator.add_listener('emulator-ready', function () {
        setStatus('ready');
      });

      emulator.add_listener('download-error', function (e) {
        setStatus('error');
        clearTimeout(stallTimeout);
        v86Screen.innerHTML =
          '<p style="color:var(--cyan);padding:20px;font-family:var(--mono);font-size:.75rem;text-align:center">' +
          'Failed to load <code>' + e.file_name + '</code> — check that bios/, tinycore/, and v86/ are present.' +
          '</p>';
      });

      window.addEventListener('unhandledrejection', function (event) {
        if (event.reason && event.reason.toString().indexOf('RangeError') !== -1) {
          setStatus('error');
          clearTimeout(stallTimeout);
          v86Screen.innerHTML =
            '<div style="color:var(--cyan);padding:2.5rem;text-align:center;font-family:var(--mono);font-size:.75rem">' +
            '<p style="font-weight:700;margin-bottom:.5rem">VM Crash — Out of Memory</p>' +
            '<p>Increase memory_size in the boot config.</p>' +
            '</div>';
        }
      });
    });
  }

  bootBtn.addEventListener('click', bootTinyCore, { once: true });
})();
