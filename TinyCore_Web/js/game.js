/* game.js — hidden "Module 6¾" canvas game, opened from the footer button */
(function () {
  "use strict";
  function cssVar(n, f) { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || f; }
  var C_CYAN = cssVar('--cyan', '#00f0ff'), C_MAGENTA = cssVar('--magenta', '#ff0055'),
    C_AMBER = cssVar('--amber', '#ffe600'), C_MUTED = cssVar('--text2', '#9D9DE4');

  var SNIPPETS = [
    ["def __init__(self):", "#5fffb0"], ["import torch", "#5fffb0"], ["yield from gen()", "#5fffb0"],
    ["asm volatile(\"nop\");", "#ff9de2"], ["void setup(){}", "#ff9de2"], ["*(int*)0=0;", "#ff9de2"],
    ["console.log(0x1F);", C_AMBER], ["const x=>{};", C_AMBER], ["Promise.all([]);", C_AMBER],
    ["SELECT * FROM void;", C_CYAN], ["MOV AX, 0xDEAD", C_CYAN]
  ];
  var CRIT = [["sudo rm -rf /", C_MAGENTA], ["chmod 777 /root", C_MAGENTA], [":(){ :|:& };:", C_MAGENTA], ["DROP TABLE users;", C_MAGENTA]];
  var DECOY = [["# TODO: fixme", C_MUTED], ["print('unused')", C_MUTED], ["except: pass", C_MUTED], ["// legacy stub", C_MUTED]];
  var FONT = '"JetBrains Mono","Fira Code",Consolas,monospace';
  var GLYPHS = "01\u30A2\u30AB\u30B5\u30BF\u30CA$#@%&<>/";
  function glyph() { return GLYPHS[(Math.random() * GLYPHS.length) | 0]; }

  var LABEL_BASE = 'BREACH_THRESHOLD :: 0x82', glitchT = 0;
  function barrierGlitch(prox, dt) {
    if (prox <= 0) {
      dangerLine.style.transform = ''; dangerLine.style.filter = ''; dangerLine.style.opacity = '';
      dangerLabelTag.style.transform = ''; dangerLabelTag.textContent = LABEL_BASE;
      return;
    }
    var jitter = prox * 6, jx = (Math.random() - .5) * jitter, jy = (Math.random() - .5) * jitter * .4;
    dangerLine.style.transform = 'translate(' + jx + 'px,' + jy + 'px)';
    var split = prox * 4;
    dangerLine.style.filter = 'drop-shadow(' + split + 'px 0 var(--cyan)) drop-shadow(-' + split + 'px 0 var(--magenta))';
    dangerLine.style.opacity = (Math.random() < prox * .25) ? '.15' : '';
    dangerLabelTag.style.transform = 'translate(' + (jx * .6) + 'px,-100%)';
    glitchT -= dt;
    if (glitchT <= 0) {
      glitchT = 0.1 - prox * 0.06;
      if (Math.random() < prox) {
        var arr = LABEL_BASE.split(''), n = Math.ceil(prox * 3);
        for (var k = 0; k < n; k++) { var idx = (Math.random() * arr.length) | 0; if (arr[idx] !== ' ') arr[idx] = glyph(); }
        dangerLabelTag.textContent = arr.join('');
      } else dangerLabelTag.textContent = LABEL_BASE;
    }
  }

  var modal = document.getElementById('miModal'), canvas = document.getElementById('miCanvas'),
    ctx = canvas.getContext('2d'), trigger = document.getElementById('miTrigger'),
    exitBtn = document.getElementById('miExit'), actionBtn = document.getElementById('miAction'),
    msg = document.getElementById('miMsg'), panel = document.getElementById('miDialogPanel'),
    badgeTag = document.getElementById('miBadgeTag'), msgTitle = document.getElementById('miMsgTitle'),
    msgSub = document.getElementById('miMsgSub'), scoreEl = document.getElementById('miScore'),
    highEl = document.getElementById('miHigh'), comboEl = document.getElementById('miCombo'),
    comboFill = document.getElementById('miComboGauge'), dangerLine = document.getElementById('miDangerLine'),
    dangerLabelTag = document.getElementById('miDangerLabelTag'),
    dangerLabel = document.getElementById('miThreatBadge'), modeLabel = document.getElementById('miModeLabel'),
    diffRow = document.getElementById('miDiffRow'), diffPills = diffRow.querySelectorAll('.mi-diff-pill');

  var DIFFS = {
    easy: { label: 'EASY', spawnBase: 1700, spawnFloor: 750, spawnDecay: 4, vyBase: 40, vyCap: 140, vyAccel: .7, critT: .06, decoyT: .14, puMin: 7000, puMax: 11000, combo: 1.6, decoyPen: 1 },
    normal: { label: 'NORMAL', spawnBase: 1300, spawnFloor: 520, spawnDecay: 7, vyBase: 52, vyCap: 210, vyAccel: 1.3, critT: .14, decoyT: .30, puMin: 9000, puMax: 14000, combo: 1.3, decoyPen: 3 },
    hard: { label: 'HARD', spawnBase: 1050, spawnFloor: 400, spawnDecay: 10, vyBase: 65, vyCap: 260, vyAccel: 1.8, critT: .18, decoyT: .38, puMin: 10000, puMax: 16000, combo: 1.05, decoyPen: 4 },
    nightmare: { label: 'NIGHTMARE', spawnBase: 900, spawnFloor: 300, spawnDecay: 14, vyBase: 80, vyCap: 320, vyAccel: 2.4, critT: .22, decoyT: .46, puMin: 12000, puMax: 18000, combo: .85, decoyPen: 5 },
    terminal: { label: 'TERMINAL VELOCITY', spawnBase: 750, spawnFloor: 220, spawnDecay: 20, vyBase: 95, vyCap: 400, vyAccel: 3.2, critT: .28, decoyT: .58, puMin: 13000, puMax: 19000, combo: .7, decoyPen: 7 }
  };

  var HS_KEY = 'mi_hs_v2';
  function loadHS() {
    try { var raw = JSON.parse(localStorage.getItem(HS_KEY) || 'null'); if (raw) return raw; } catch (e) { }
    var seed = { easy: 0, normal: 0, hard: 0, nightmare: 0, terminal: 0 };
    var old = +localStorage.getItem('moduleInfinityHighScore') || 0;
    if (old) seed.normal = old;
    localStorage.setItem(HS_KEY, JSON.stringify(seed));
    return seed;
  }

  var S = {
    running: false, score: 0, hs: loadHS(), diffId: localStorage.getItem('mi_last_diff') || 'normal', diff: null,
    items: [], particles: [], floats: [], cols: [],
    spawnT: 0, puT: 6000, elapsed: 0, last: 0, shake: 0, punch: 0, freeze: 0, combo: 0, comboT: 0, slowUntil: 0, rafId: null, dangerY: 0
  };
  highEl.textContent = S.hs[S.diffId];
  diffPills.forEach(function (p) {
    p.classList.toggle('active', p.dataset.diff === S.diffId);
    p.addEventListener('click', function () {
      S.diffId = p.dataset.diff;
      localStorage.setItem('mi_last_diff', S.diffId);
      diffPills.forEach(function (x) { x.classList.toggle('active', x === p); });
      highEl.textContent = S.hs[S.diffId];
    });
  });

  var actx = null, drone = null, droneGain = null;
  function audio() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; }
  function osc(type, f0, f1, t, vol) {
    var a = audio(), o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, a.currentTime);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, a.currentTime + t);
    g.gain.setValueAtTime(vol, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + t);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + t + .02);
  }
  function blip(mult) { osc('square', 600 + Math.min(mult, 8) * 40, 900 + Math.min(mult, 8) * 40, .08, .11); }
  function critBlip() {
    osc('sine', 180, 55, .22, .16);
    var a = audio(), len = a.sampleRate * .09, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = a.createBufferSource(), g = a.createGain(); src.buffer = buf; g.gain.value = .14;
    src.connect(g); g.connect(a.destination); src.start();
  }
  function trapBuzz() { osc('square', 180, 150, .18, .13); osc('square', 172, 140, .18, .1); }
  function chime() { [880, 1174, 1568].forEach(function (f, i) { setTimeout(function () { osc('triangle', f, f, .14, .09); }, i * 70); }); }
  function buzzer() { osc('sawtooth', 240, 38, .65, .18); }
  function droneStart() {
    var a = audio(); drone = a.createOscillator(); droneGain = a.createGain();
    drone.type = 'sine'; drone.frequency.value = 55; droneGain.gain.value = .0001;
    drone.connect(droneGain); droneGain.connect(a.destination); drone.start();
    droneGain.gain.exponentialRampToValueAtTime(.035, a.currentTime + .6);
  }
  function droneStop() {
    if (!drone) return; var a = audio(), d = drone, dg = droneGain; drone = null; droneGain = null;
    dg.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .4);
    setTimeout(function () { try { d.stop(); } catch (e) { } }, 450);
  }

  function resize() {
    canvas.width = modal.clientWidth; canvas.height = modal.clientHeight;
    S.dangerY = canvas.height * .82;
    var n = Math.ceil(canvas.width / 22);
    S.cols = []; for (var i = 0; i < n; i++) S.cols.push({ x: i * 22 + 4, y: -Math.random() * canvas.height, speed: 40 + Math.random() * 50, ch: glyph() });
  }
  window.addEventListener('resize', function () { if (modal.classList.contains('mi-open')) resize(); });

  function spawn() {
    var r = Math.random(), tier = 'normal', pool = SNIPPETS, hp = 1;
    if (r < S.diff.critT) { pool = CRIT; tier = 'crit'; hp = 2; }
    else if (r < S.diff.decoyT) { pool = DECOY; tier = 'decoy'; }
    var pick = pool[(Math.random() * pool.length) | 0];
    ctx.font = '15px ' + FONT;
    var w = ctx.measureText(pick[0]).width + 20, h = 32;
    var slow = S.elapsed < S.slowUntil ? .45 : 1;
    var vy = Math.min(S.diff.vyCap, S.diff.vyBase + S.elapsed * S.diff.vyAccel) * slow;
    S.items.push({
      text: pick[0], color: pick[1], tier: tier, hp: hp, x: Math.random() * (canvas.width - w), y: -h, w: w, h: h,
      vy: vy
    });
  }
  function spawnPU() {
    var kind = Math.random() < .5 ? 'slowmo' : 'nuke', color = kind === 'slowmo' ? C_AMBER : C_MAGENTA;
    S.items.push({
      text: kind === 'slowmo' ? '<SLOWMO/>' : '<NUKE/>', color: color, tier: 'pu', kind: kind, hp: 1,
      x: Math.random() * (canvas.width - 140) + 30, y: -26, w: 130, h: 34, vy: 80
    });
  }

  function burst(x, y, color, n) {
    n = n || 16;
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2, spd = 60 + Math.random() * 160;
      S.particles.push({ x: x, y: y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 1, color: color, size: 2 + Math.random() * 3 });
    }
  }
  function floatText(str, color) { S.floats.push({ str: str, y: canvas.height * .4, life: 1, color: color || '#fff' }); }

  function addCombo() {
    S.combo++; S.comboT = S.diff.combo;
    var mult = 1 + Math.floor(S.combo / 5);
    if (S.combo % 5 === 0) { floatText('CASCADE \u00d7' + mult + '!', C_CYAN); S.punch = 1; }
    return mult;
  }
  function breakCombo() { if (S.combo >= 5) floatText('COMBO BROKEN', C_MAGENTA); S.combo = 0; S.comboT = 0; }

  function nukeAll() {
    var killed = 0;
    for (var i = S.items.length - 1; i >= 0; i--) {
      var s = S.items[i];
      if (s.tier === 'decoy' || s.tier === 'pu') { S.items.splice(i, 1); continue; }
      burst(s.x + s.w / 2, s.y + s.h / 2, s.color, 10); killed++;
      S.items.splice(i, 1);
    }
    if (killed) { var mult = 1 + Math.floor(S.combo / 5); S.score += killed * mult; scoreEl.textContent = S.score; }
    S.punch = 1; S.freeze = .08; floatText('SYSTEM PURGED', C_MAGENTA);
  }

  function update(dt) {
    if (S.freeze > 0) { S.freeze -= dt; return; }
    S.elapsed += dt;
    S.spawnT -= dt * 1000; S.puT -= dt * 1000;
    var spawnInt = Math.max(S.diff.spawnFloor, S.diff.spawnBase - S.elapsed * S.diff.spawnDecay);
    if (S.spawnT <= 0) { spawn(); S.spawnT = spawnInt * (0.7 + Math.random() * 0.6); }
    if (S.puT <= 0) { spawnPU(); S.puT = S.diff.puMin + Math.random() * (S.diff.puMax - S.diff.puMin); }

    if (S.comboT > 0) { S.comboT -= dt; if (S.comboT <= 0) breakCombo(); }
    var mult = 1 + Math.floor(S.combo / 5);
    comboEl.textContent = 'x' + S.combo + ' \u00b7\u00d7' + mult;
    comboFill.style.width = Math.max(0, (S.comboT / S.diff.combo) * 100) + '%';

    var slow = S.elapsed < S.slowUntil ? .45 : 1, hot = false, prox = 0, ZONE = 160;
    for (var i = S.items.length - 1; i >= 0; i--) {
      var s = S.items[i]; s.y += s.vy * (s.tier === 'pu' ? 1 : slow) * dt;
      if (s.tier === 'normal' || s.tier === 'crit') {
        var d = 1 - Math.max(0, Math.min(1, (S.dangerY - (s.y + s.h)) / ZONE));
        if (d > prox) prox = d;
      }
      if (s.y + s.h >= S.dangerY - 70 && s.tier !== 'decoy') hot = true;
      if (s.y + s.h >= S.dangerY) {
        if (s.tier === 'decoy' || s.tier === 'pu') { S.items.splice(i, 1); continue; }
        gameOver(); return;
      }
    }
    dangerLine.classList.toggle('mi-hot', hot);
    dangerLabelTag.classList.toggle('mi-hot', hot);
    dangerLabel.classList.toggle('critical', hot);
    dangerLabel.textContent = hot ? 'THREAT: CRITICAL' : 'THREAT: NOMINAL';
    barrierGlitch(prox, dt);

    for (var j = S.particles.length - 1; j >= 0; j--) {
      var p = S.particles[j]; p.vy += 400 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.6;
      if (p.life <= 0) S.particles.splice(j, 1);
    }
    for (var k = S.floats.length - 1; k >= 0; k--) {
      var f = S.floats[k]; f.y -= 40 * dt; f.life -= dt * 1.1; if (f.life <= 0) S.floats.splice(k, 1);
    }
    for (var m = 0; m < S.cols.length; m++) {
      var c = S.cols[m]; c.y += c.speed * dt;
      if (Math.random() < 0.02) c.ch = glyph();
      if (c.y > canvas.height) { c.y = -20; c.ch = glyph(); }
    }
    if (S.shake > 0) S.shake -= dt * 30;
    if (S.punch > 0) S.punch = Math.max(0, S.punch - dt * 4);
  }

  function render() {
    var cx = canvas.width / 2, cy = canvas.height / 2, scale = 1 + 0.07 * S.punch;
    var shX = S.shake > 0 ? (Math.random() - .5) * S.shake : 0, shY = S.shake > 0 ? (Math.random() - .5) * S.shake : 0;

    ctx.save();
    ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy); ctx.translate(shX, shY);
    ctx.fillStyle = 'rgba(8,12,20,.26)';
    ctx.fillRect(-20, -20, canvas.width + 40, canvas.height + 40);
    ctx.font = '13px ' + FONT; ctx.fillStyle = 'rgba(0,240,255,.16)'; ctx.textBaseline = 'top';
    for (var g = 0; g < S.cols.length; g++) { var c = S.cols[g]; ctx.fillText(c.ch, c.x, c.y); }
    ctx.restore();

    ctx.font = '15px ' + FONT; ctx.textBaseline = 'middle';
    for (var i = 0; i < S.items.length; i++) {
      var s = S.items[i];
      ctx.shadowColor = s.color; ctx.shadowBlur = s.tier === 'crit' ? 20 : s.tier === 'pu' ? 24 : 14;
      if (s.tier === 'pu') {
        ctx.save(); ctx.translate(s.x + s.w / 2, s.y + s.h / 2); ctx.rotate(Math.PI / 4);
        var d = 18 + Math.sin(S.elapsed * 6) * 2;
        ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.strokeRect(-d, -d, d * 2, d * 2); ctx.restore();
        ctx.fillStyle = s.color; ctx.fillText(s.text, s.x + s.w / 2 - ctx.measureText(s.text).width / 2, s.y + s.h / 2 + 1);
        continue;
      }
      if (s.tier === 'crit') { ctx.fillStyle = 'rgba(255,0,85,.12)'; ctx.fillRect(s.x, s.y, s.w, s.h); }
      ctx.strokeStyle = s.color; ctx.lineWidth = s.tier === 'crit' ? 2 : 1;
      ctx.globalAlpha = s.tier === 'decoy' ? .55 : 1;
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = s.color; ctx.fillText(s.text, s.x + 10, s.y + s.h / 2 + 1);
      if (s.tier === 'crit' && s.hp < 2) { ctx.beginPath(); ctx.moveTo(s.x + 4, s.y + s.h - 4); ctx.lineTo(s.x + s.w - 4, s.y + 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy); ctx.translate(shX, shY);
    for (var j = 0; j < S.particles.length; j++) {
      var p = S.particles[j]; ctx.globalAlpha = Math.max(p.life, 0); ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'center';
    for (var k = 0; k < S.floats.length; k++) {
      var f = S.floats[k]; ctx.globalAlpha = Math.max(f.life, 0); ctx.fillStyle = f.color;
      ctx.font = 'bold 22px ' + FONT; ctx.fillText(f.str, canvas.width / 2, f.y);
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
    ctx.restore();
  }

  function loop(t) {
    if (!S.running) return;
    var dt = Math.min((t - S.last) / 1000, .05); S.last = t;
    update(dt); render();
    S.rafId = requestAnimationFrame(loop);
  }

  function chroma(ms) { modal.classList.add('mi-chroma'); setTimeout(function () { modal.classList.remove('mi-chroma'); }, ms || 130); }

  function hitTest(cx, cy) {
    var P = 5;
    for (var i = S.items.length - 1; i >= 0; i--) {
      var s = S.items[i];
      if (cx < s.x - P || cx > s.x + s.w + P || cy < s.y - P || cy > s.y + s.h + P) continue;
      if (s.tier === 'decoy') {
        S.items.splice(i, 1); breakCombo(); S.score = Math.max(0, S.score - S.diff.decoyPen); scoreEl.textContent = S.score;
        S.shake = 10; chroma(180); trapBuzz(); burst(s.x + s.w / 2, s.y + s.h / 2, C_MAGENTA, 10); floatText('TRAP', C_MAGENTA);
        return;
      }
      if (s.tier === 'pu') {
        S.items.splice(i, 1);
        if (s.kind === 'slowmo') { S.slowUntil = S.elapsed + 4; floatText('SLOWMO ONLINE', C_AMBER); }
        else { nukeAll(); }
        chime(); S.shake = 4;
        return;
      }
      if (s.tier === 'crit') {
        s.hp--; S.shake = 4; burst(s.x + s.w / 2, s.y + s.h / 2, s.color, 6);
        if (s.hp > 0) { blip(1); return; }
        S.items.splice(i, 1); var m = addCombo();
        S.score += 5 * m; scoreEl.textContent = S.score; S.shake = 9; S.punch = Math.max(S.punch, .6); S.freeze = .04;
        chroma(110); critBlip(); burst(s.x + s.w / 2, s.y + s.h / 2, s.color, 20);
        return;
      }
      S.items.splice(i, 1); var m2 = addCombo();
      S.score += 1 * m2; scoreEl.textContent = S.score; S.shake = 6;
      blip(m2); burst(s.x + s.w / 2, s.y + s.h / 2, s.color, 14);
      return;
    }
  }
  canvas.addEventListener('pointerdown', function (e) {
    if (!S.running) return;
    var r = canvas.getBoundingClientRect();
    hitTest(e.clientX - r.left, e.clientY - r.top);
  });

  function startGame() {
    S.diff = DIFFS[S.diffId]; modeLabel.textContent = S.diff.label;
    S.running = true; S.score = 0; S.elapsed = 0; S.spawnT = 0; S.puT = S.diff.puMin; S.items = []; S.particles = []; S.floats = [];
    S.shake = 0; S.punch = 0; S.freeze = 0; S.combo = 0; S.comboT = 0; S.slowUntil = 0;
    scoreEl.textContent = 0; comboEl.textContent = 'x0 \u00b7\u00d71'; comboFill.style.width = '0%';
    barrierGlitch(0, 0);
    msg.classList.add('is-hidden');
    resize(); S.last = performance.now();
    audio(); droneStart();
    S.rafId = requestAnimationFrame(loop);
  }

  function gameOver() {
    S.running = false;
    if (S.rafId) cancelAnimationFrame(S.rafId);
    buzzer(); droneStop();
    if (S.score > S.hs[S.diffId]) { S.hs[S.diffId] = S.score; localStorage.setItem(HS_KEY, JSON.stringify(S.hs)); highEl.textContent = S.hs[S.diffId]; }
    panel.classList.add('panel-gameover');
    badgeTag.hidden = false; diffRow.hidden = true;
    msgTitle.classList.add('mi-over'); msgTitle.textContent = 'STACK OVERFLOW';
    msgSub.classList.add('mi-over');
    msgSub.innerHTML = 'KERNEL PANIC \u2014 <span class="score-val">' + S.score + '</span> LINES LOST TO THE VOID. BEST COMBO <span class="score-val">\u00d7' + (1 + Math.floor(S.combo / 5)) + '</span>.';
    actionBtn.classList.add('mi-btn-danger'); actionBtn.textContent = 'REBOOT SYSTEM';
    msg.classList.remove('is-hidden');
  }

  function openModal() {
    document.body.classList.add('mi-glitching');
    setTimeout(function () {
      document.body.classList.remove('mi-glitching');
      modal.classList.add('mi-open');
      modal.setAttribute('aria-hidden', 'false');
      resize();
      panel.classList.remove('panel-gameover');
      badgeTag.hidden = true; diffRow.hidden = false;
      highEl.textContent = S.hs[S.diffId];
      msgTitle.classList.remove('mi-over'); msgTitle.innerHTML = 'MODULE <span class="accent">6\u00BE</span>';
      msgSub.classList.remove('mi-over');
      msgSub.innerHTML = 'Resolve falling stack calls. <span class="c-red">RED</span> needs two hits. <span class="c-grey">GREY</span> is a trap \u2014 leave it. <span class="c-gold">GOLD</span> diamond slows time; <span class="c-red">MAGENTA</span> diamond purges the board. Chain hits fast to build <span class="c-cyan">\u00d7MULT</span>.';
      actionBtn.classList.remove('mi-btn-danger'); actionBtn.textContent = 'INITIALIZE';
      msg.classList.remove('is-hidden');
    }, 380);
  }
  function closeModal() {
    S.running = false;
    if (S.rafId) cancelAnimationFrame(S.rafId);
    droneStop();
    modal.classList.remove('mi-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  trigger.addEventListener('click', openModal);
  exitBtn.addEventListener('click', closeModal);
  actionBtn.addEventListener('click', startGame);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('mi-open')) closeModal();
  });
})();
