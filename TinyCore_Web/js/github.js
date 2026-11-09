/* github.js — live repo cards and stat counters from the GitHub API */
(function () {
  "use strict";

  // Shared scroll observer is created by animations.js (loaded first).
  const observer = window.scrollObserver;

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

  const LANG_COLORS = {
    'Assembly': '#6E4C13', 'C#': '#178600', 'Python': '#3572A5', 'Bash': '#89e051',
    'C': '#555555', 'C++': '#f34b7d', 'JavaScript': '#f1e05a', 'HTML': '#e34c26',
    'Makefile': '#427819', 'Shell': '#89e051', 'Rust': '#dea584', 'Go': '#00ADD8'
  };

  /* GitHub repos + stats */
  async function fetchRepos() {
    const container = document.getElementById('repos-container');
    try {
      const [reposRes, userRes] = await Promise.all([
        fetch('https://api.github.com/users/ElectroBAI/repos?sort=updated&per_page=12'),
        fetch('https://api.github.com/users/ElectroBAI')
      ]);
      if (!reposRes.ok || !userRes.ok) throw new Error('API error');
      const [repos, user] = await Promise.all([reposRes.json(), userRes.json()]);

      // Populate stats cards
      const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
      document.getElementById('stat-repos').textContent = user.public_repos ?? repos.length;
      document.getElementById('stat-followers').textContent = user.followers ?? '—';
      document.getElementById('stat-gists').textContent = user.public_gists ?? '—';
      document.getElementById('stat-stars').textContent = totalStars;

      if (!repos.length) {
        container.innerHTML = '<div class="repo-error">No public repositories found.</div>';
        return;
      }
      const grid = document.createElement('div');
      grid.className = 'repos-grid';
      repos.forEach(repo => {
        const lang = repo.language || 'N/A';
        const color = LANG_COLORS[lang] || '#9D9DE4';
        const card = document.createElement('a');
        card.className = 'repo-card fade-up';
        card.href = repo.html_url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.innerHTML =
          '<div class="repo-name">' +
          '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" opacity=".5"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9z"/></svg>' +
          esc(repo.name) +
          '</div>' +
          '<p class="repo-desc">' + esc(repo.description || 'No description provided.') + '</p>' +
          '<div class="repo-meta">' +
          '<span class="repo-lang"><span class="lang-dot" style="background:' + color + '"></span>' + esc(lang) + '</span>' +
          '<span class="repo-stars">★ ' + repo.stargazers_count + '</span>' +
          (repo.fork ? '<span>fork</span>' : '') +
          '</div>';
        grid.appendChild(card);
        if (observer) observer.observe(card);
      });
      container.innerHTML = '';
      container.appendChild(grid);
    } catch (e) {
      container.innerHTML =
        '<div class="repo-error">' +
        '<p style="color:var(--cyan);margin-bottom:.5rem">$ git remote show ElectroBAI</p>' +
        '<p>Unable to fetch live data — GitHub API rate limit or network error.</p>' +
        '<p style="margin-top:.75rem"><a href="https://github.com/ElectroBAI" target="_blank" rel="noopener noreferrer">→ View repositories on GitHub</a></p>' +
        '</div>';
    }
  }

  fetchRepos();
})();
