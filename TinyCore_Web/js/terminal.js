/* terminal.js — hero terminal CLI (help, whoami, streak, skills, clear) */
(function () {
  "use strict";

  /* CLI */
  const body = document.getElementById('terminal-body');
  const input = document.getElementById('cli-input');
  const welcome = document.getElementById('welcome-msg');
  const inputLine = body.querySelector('.terminal-input-line');
  const history = [];
  let histIdx = -1;

  const COMMANDS = {
    help: () =>
      'Available commands:\n' +
      '  whoami   — system architect profile\n' +
      '  streak   — active operating streak\n' +
      '  skills   — core technical proficiencies\n' +
      '  help     — list available commands\n' +
      '  clear    — clear terminal output',

    whoami: () =>
      'Baibhab Das — Systems Architect\n' +
      'Linux specialist & robotics inventor\n' +
      'Focus: embedded systems, custom distros, AI × robotics\n' +
      'Architectures: x86 · ARM · AVR · RISC-V',

    streak: () => 'Active since 2021 · 5yr streak',

    skills: () =>
      '→ Linux Kernel Development\n' +
      '→ Arduino / Embedded C\n' +
      '→ Assembly Language (x86/ARM)\n' +
      '→ Robotics + AI Integration\n' +
      '→ Custom Distro Engineering\n' +
      '→ Python / Bash / C#',

    clear: () => null
  };

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

  function appendOutput(text, cls) {
    const el = document.createElement('div');
    el.className = 'terminal-output' + (cls ? ' ' + cls : '');
    el.textContent = text;
    body.insertBefore(el, inputLine);
    body.scrollTop = body.scrollHeight;
  }

  function appendPrompt(cmd) {
    const el = document.createElement('div');
    el.className = 'terminal-output';
    el.innerHTML = '<span class="t-prompt"><span class="t-host">electroBAI@linux</span>:~$&nbsp;</span>' + esc(cmd);
    body.insertBefore(el, inputLine);
  }

  function runCommand(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    appendPrompt(cmd);
    const key = cmd.toLowerCase().split(/\s+/)[0];
    if (key === 'clear') {
      body.querySelectorAll('.terminal-output').forEach(el => {
        if (el !== welcome) el.remove();
      });
      if (welcome) welcome.style.display = 'none';
      return;
    }
    if (COMMANDS[key]) {
      const result = COMMANDS[key]();
      if (result) appendOutput(result, key === 'help' ? '' : 'out');
    } else {
      appendOutput('zsh: command not found: ' + cmd.split(/\s+/)[0], 'err');
    }
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      history.unshift(input.value);
      histIdx = -1;
      runCommand(input.value);
      input.value = '';
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
      else { histIdx = -1; input.value = ''; }
    }
  });

  input.focus();
})();
