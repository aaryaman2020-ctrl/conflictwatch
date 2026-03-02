// app.js — CONFLICTWATCH Dashboard Logic (Enhanced Military Intelligence)
// All interactive functionality: GDELT API, Leaflet maps, Chart.js analytics

'use strict';

// ============================================================
// STATE
// ============================================================
const STATE = {
  theme: 'dark',
  activeTab: 'live',
  liveData: [],
  liveFilter: 'all',         // severity filter
  liveAttackFilter: 'all',   // attack type filter
  histFilters: {
    country: '',
    types: [],
    yearMin: 1975,
    yearMax: 2025,
    severityMin: 1,
    severityMax: 5,
    status: 'all'
  },
  histSortCol: 'severity',
  histSortDir: 'desc',
  liveSortCol: 'count',
  liveSortDir: 'desc',
  lastUpdated: null,
  maps: {},
  layers: {},
  charts: {}
};

// ============================================================
// CONSTANTS
// ============================================================
const GDELT_QUERIES = [
  'conflict military',
  'military attack',
  'airstrike bombing',
  'terror attack',
  'war insurgency'
];

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/geo/geo?mode=PointData&format=GeoJSON&timespan=2d&maxpoints=250&query=';

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e'
};

const TYPE_COLORS = {
  'Interstate War':       '#ef4444',
  'Civil War':            '#f97316',
  'Insurgency':           '#eab308',
  'Terrorism':            '#a855f7',
  'Genocide':             '#dc2626',
  'Border Conflict':      '#3b82f6',
  'Proxy War':            '#06b6d4',
  'Military Intervention':'#84cc16',
  'Frozen Conflict':      '#6b7280'
};

const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Middle East'];

// ============================================================
// THEME MANAGEMENT
// ============================================================
function initTheme() {
  const root = document.documentElement;
  STATE.theme = root.getAttribute('data-theme') || 'dark';
  root.setAttribute('data-theme', STATE.theme);

  const toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    updateThemeIcon(toggle);
    toggle.addEventListener('click', () => {
      STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', STATE.theme);
      updateThemeIcon(toggle);
      Object.values(STATE.maps).forEach(map => {
        if (map) { try { map.invalidateSize(); } catch(e) {} }
      });
    });
  }
}

function updateThemeIcon(btn) {
  btn.innerHTML = STATE.theme === 'dark'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

// ============================================================
// TAB NAVIGATION
// ============================================================
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      activateTab(tab);
    });
  });
}

function activateTab(tab) {
  STATE.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab));

  if (tab === 'analytics') initAnalytics();

  requestAnimationFrame(() => {
    if (STATE.maps.live) STATE.maps.live.invalidateSize();
    if (STATE.maps.hist) STATE.maps.hist.invalidateSize();
  });
}

// ============================================================
// UTILITY
// ============================================================
function getSeverityFromCount(count) {
  if (count > 5000) return 'critical';
  if (count > 2000) return 'high';
  if (count > 500)  return 'medium';
  return 'low';
}

function getMarkerRadius(count) {
  const min = 7, max = 26;
  const logMin = Math.log(1), logMax = Math.log(20000);
  const logCount = Math.log(Math.max(1, count));
  const ratio = (logCount - logMin) / (logMax - logMin);
  return Math.round(min + ratio * (max - min));
}

function formatNumber(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString();
}

function formatTime(date) {
  if (!date) return '—';
  const now = new Date();
  const diff = Math.floor((now - date) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

function getRegionFromCoords(lat, lng) {
  if (lat > 35 && lng > -15 && lng < 65) return 'Europe/Russia';
  if (lat > 0 && lng > 25 && lng < 60 && lat < 42) return 'Middle East';
  if (lat > -35 && lat < 40 && lng > -20 && lng < 55) return 'Africa';
  if (lng > 60 && lat > -10 && lat < 55) return 'Asia';
  if (lng > -180 && lng < -30) return 'Americas';
  return 'Global';
}

function badgeHTML(severity) {
  return `<span class="badge badge-${severity}">${severity.toUpperCase()}</span>`;
}

function typeBadgeHTML(type) {
  return `<span class="badge badge-type" style="background:${TYPE_COLORS[type] || '#6b7280'}22;color:${TYPE_COLORS[type] || '#9ca3af'};border-color:${TYPE_COLORS[type] || '#6b7280'}44;">${type}</span>`;
}

/**
 * Render colored attack-type badges for a list of attack type strings.
 */
function attackBadgesHTML(attackTypes) {
  if (!attackTypes || attackTypes.length === 0) return '';
  const cats = window.ATTACK_CATEGORIES || {};
  return attackTypes.map(at => {
    const cat = cats[at] || {};
    const color = cat.color || '#6b7280';
    return `<span class="attack-badge" style="background:${color}22;color:${color};border-color:${color}55;">${at}</span>`;
  }).join('');
}

/**
 * Render weapon system tags.
 */
function weaponTagsHTML(weapons) {
  if (!weapons || weapons.length === 0) return '';
  return weapons.map(w => `<span class="weapon-tag">${w}</span>`).join('');
}

/**
 * Render a daily activity timeline.
 */
function dailyTimelineHTML(dailyActivity) {
  if (!dailyActivity || dailyActivity.length === 0) return '';
  const events = dailyActivity.map(da => `
    <div class="daily-event">
      <span class="event-date">${da.date}</span>
      <span class="event-desc">${da.event}</span>
    </div>
  `).join('');
  return `
    <div class="daily-timeline">
      <div class="timeline-label">Operational Timeline</div>
      ${events}
    </div>
  `;
}

// ============================================================
// GDELT API — LIVE DATA PARSING
// ============================================================
function parseGDELTFeature(f) {
  const coords = f.geometry.coordinates;
  const props = f.properties;
  const count = parseInt(props.count) || 0;
  const severity = getSeverityFromCount(count);

  const links = [];
  if (props.html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = props.html;
    tempDiv.querySelectorAll('a').forEach(a => {
      if (a.href && links.length < 3) {
        links.push({href: a.href, text: a.textContent.trim() || a.href.split('/')[2] || 'Article'});
      }
    });
  }

  return {
    name: props.name || 'Unknown Location',
    lat: coords[1],
    lng: coords[0],
    count,
    severity,
    links,
    shareimage: props.shareimage || null,
    region: getRegionFromCoords(coords[1], coords[0]),
    attackTypes: [],
    weapons: [],
    description: '',
    casualties: '',
    dailyActivity: [],
    conflictName: ''
  };
}

// ============================================================
// LIVE MAP
// ============================================================
function initLiveMap() {
  const mapEl = document.getElementById('live-map');
  if (!mapEl) return;

  const map = L.map('live-map', {
    center: [20, 10],
    zoom: 2,
    zoomControl: false,
    attributionControl: true,
    preferCanvas: true
  });
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://openstreetmap.org" target="_blank" rel="noopener">OpenStreetMap</a> © <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  STATE._lightTile = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  STATE._darkTile  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 50,
    showCoverageOnHover: false,
    iconCreateFunction: cluster => {
      const count = cluster.getChildCount();
      let cls = count < 10 ? 'small' : count < 30 ? 'medium' : 'large';
      return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster marker-cluster-${cls}`,
        iconSize: L.point(40, 40)
      });
    }
  });

  STATE.maps.live = map;
  STATE.layers.liveCluster = clusterGroup;
  STATE.layers.liveMarkers = [];

  map.addLayer(clusterGroup);

  loadLiveData();
}

async function loadLiveData() {
  setRefreshBtnLoading(true);

  // Step 1: Immediately load from embedded data
  if (window.LIVE_CONFLICT_DATA && window.LIVE_CONFLICT_DATA.length > 0) {
    STATE.liveData = parseEmbeddedData(window.LIVE_CONFLICT_DATA);
    STATE.lastUpdated = new Date();
    updateLastUpdatedDisplay();
    renderLiveMarkers();
    renderLiveTable();
    showLiveLoading(false);
  }

  // Step 2: Try GDELT API in background with 10s timeout — silently fallback on failure
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const promises = GDELT_QUERIES.map(q =>
      fetch(GDELT_BASE + encodeURIComponent(q), { signal: controller.signal })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    );

    const results = await Promise.allSettled(promises);
    clearTimeout(timeout);

    const allFeatures = new Map();
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value && result.value.features) {
        result.value.features.forEach(f => {
          if (!f.geometry || !f.properties) return;
          const key = f.properties.name || `${f.geometry.coordinates[1].toFixed(2)},${f.geometry.coordinates[0].toFixed(2)}`;
          const existing = allFeatures.get(key);
          if (!existing || f.properties.count > existing.properties.count) {
            allFeatures.set(key, f);
          }
        });
      }
    });

    const features = Array.from(allFeatures.values());
    if (features.length > 0) {
      const parsed = features
        .map(parseGDELTFeature)
        .filter(d => d.lat && d.lng && !isNaN(d.lat) && !isNaN(d.lng))
        .filter(d => Math.abs(d.lat) < 85);

      if (parsed.length > 0) {
        // Merge with embedded: prefer embedded data by lat/lng proximity
        STATE.liveData = mergeWithEmbedded(parsed);
        STATE.lastUpdated = new Date();
        updateLastUpdatedDisplay();
        renderLiveMarkers();
        renderLiveTable();
      }
    }
  } catch(e) {
    console.warn('GDELT background fetch failed, using embedded data:', e);
  } finally {
    setRefreshBtnLoading(false);
  }
}

/**
 * Parse embedded LIVE_CONFLICT_DATA into normalized data objects.
 */
function parseEmbeddedData(data) {
  return data
    .map(d => ({
      name: d.name,
      lat: d.lat,
      lng: d.lng,
      count: d.articles || d.count || 0,
      severity: d.severity,
      links: (d.urls || []).map(u => {
        try { return { href: u, text: new URL(u).hostname }; }
        catch(e) { return { href: u, text: u }; }
      }),
      region: d.region || getRegionFromCoords(d.lat, d.lng),
      country: d.country || '',
      attackTypes: d.attackTypes || [],
      weapons: d.weapons || [],
      description: d.description || '',
      casualties: d.casualties || '',
      dailyActivity: d.dailyActivity || [],
      conflictName: d.conflictName || ''
    }))
    .filter(d => d.lat && d.lng && !isNaN(d.lat) && !isNaN(d.lng) && Math.abs(d.lat) < 85);
}

/**
 * Attempt to merge GDELT live features with embedded data.
 * Keeps embedded items intact, only adds GDELT items without a nearby embedded entry.
 */
function mergeWithEmbedded(gdeltData) {
  const embedded = parseEmbeddedData(window.LIVE_CONFLICT_DATA || []);
  const merged = [...embedded];

  gdeltData.forEach(gd => {
    const nearby = embedded.some(e => {
      const dist = Math.sqrt(Math.pow(gd.lat - e.lat, 2) + Math.pow(gd.lng - e.lng, 2));
      return dist < 0.5;
    });
    if (!nearby) {
      merged.push(gd);
    }
  });

  return merged;
}

// ============================================================
// FILTER HELPERS
// ============================================================
function getFilteredLiveData() {
  let data = STATE.liveData;

  if (STATE.liveFilter !== 'all') {
    data = data.filter(d => d.severity === STATE.liveFilter);
  }

  if (STATE.liveAttackFilter !== 'all') {
    data = data.filter(d =>
      Array.isArray(d.attackTypes) && d.attackTypes.includes(STATE.liveAttackFilter)
    );
  }

  return data;
}

// ============================================================
// LIVE MAP MARKERS
// ============================================================
function renderLiveMarkers() {
  const cluster = STATE.layers.liveCluster;
  if (!cluster) return;

  cluster.clearLayers();

  const filtered = getFilteredLiveData();

  filtered.forEach(d => {
    const color  = SEVERITY_COLORS[d.severity] || '#6b7280';
    const radius = getMarkerRadius(d.count);

    const marker = L.circleMarker([d.lat, d.lng], {
      radius,
      fillColor: color,
      color: color,
      weight: 1.5,
      opacity: 0.9,
      fillOpacity: 0.55
    });

    marker.bindPopup(buildLivePopup(d), { maxWidth: 340 });
    cluster.addLayer(marker);
  });
}

/**
 * Build rich HTML popup for a live conflict data point.
 */
function buildLivePopup(d) {
  // Conflict name
  const conflictNameHTML = d.conflictName
    ? `<div class="popup-conflict-name">⚑ ${d.conflictName}</div>`
    : '';

  // Attack type badges
  const atBadgesWrap = d.attackTypes && d.attackTypes.length
    ? `<div class="attack-badges-wrap">${attackBadgesHTML(d.attackTypes)}</div>`
    : '';

  // Weapons
  const weaponSection = d.weapons && d.weapons.length
    ? `<div class="popup-section-title">Weapons Used</div><div class="weapon-tags-wrap">${weaponTagsHTML(d.weapons)}</div>`
    : '';

  // Description
  const descHTML = d.description
    ? `<div class="popup-desc" style="white-space:normal;line-height:1.5;">${d.description}</div>`
    : '';

  // Casualties
  const casualtiesHTML = d.casualties
    ? `<div class="popup-casualties">⚠ ${d.casualties}</div>`
    : '';

  // Daily timeline
  const timelineHTML = dailyTimelineHTML(d.dailyActivity);

  // Source links
  let linksHTML = '';
  if (d.links && d.links.length > 0) {
    linksHTML = `<div class="popup-links">
      ${d.links.map(l => `
        <a href="${l.href}" class="popup-link" target="_blank" rel="noopener noreferrer">
          <svg class="popup-link-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          ${l.text.substring(0, 55)}${l.text.length > 55 ? '…' : ''}
        </a>`).join('')}
    </div>`;
  }

  // Region / country meta
  const metaParts = [];
  if (d.country) metaParts.push(d.country);
  if (d.region) metaParts.push(d.region);
  const metaStr = metaParts.length ? `<span class="popup-count">${metaParts.join(' · ')} · ${(d.count || 0).toLocaleString()} articles</span>` : '';

  return `
    <div class="popup-title">${d.name}</div>
    <div class="popup-meta">
      ${badgeHTML(d.severity)}
      ${metaStr}
    </div>
    ${conflictNameHTML}
    ${atBadgesWrap}
    ${weaponSection}
    ${descHTML}
    ${casualtiesHTML}
    ${timelineHTML}
    ${linksHTML}
  `;
}

// ============================================================
// LIVE TABLE
// ============================================================
function renderLiveTable() {
  const tbody   = document.getElementById('live-table-body');
  const countEl = document.getElementById('live-count');
  if (!tbody) return;

  let data = getFilteredLiveData();

  // Sort
  const col = STATE.liveSortCol;
  const dir = STATE.liveSortDir === 'asc' ? 1 : -1;
  data.sort((a, b) => {
    if (col === 'count') return (a.count - b.count) * dir;
    if (col === 'name') return a.name.localeCompare(b.name) * dir;
    if (col === 'conflict') return (a.conflictName || '').localeCompare(b.conflictName || '') * dir;
    if (col === 'attackType') {
      const aStr = (a.attackTypes || []).join(',');
      const bStr = (b.attackTypes || []).join(',');
      return aStr.localeCompare(bStr) * dir;
    }
    if (col === 'severity') {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return ((order[a.severity] || 0) - (order[b.severity] || 0)) * dir;
    }
    if (col === 'region') return (a.region || '').localeCompare(b.region || '') * dir;
    return 0;
  });

  if (countEl) countEl.textContent = `${data.length} locations`;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></div>
        <div class="empty-title">No data matches filters</div>
        <div class="empty-desc">Try adjusting severity or attack type filters.</div>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((d, i) => {
    // Attack type — show first 2 badges to keep table compact
    const atkTypes = d.attackTypes || [];
    const atkBadges = atkTypes.slice(0, 2).map(at => {
      const cat = (window.ATTACK_CATEGORIES || {})[at] || {};
      const color = cat.color || '#6b7280';
      return `<span class="attack-badge" style="background:${color}22;color:${color};border-color:${color}55;">${at}</span>`;
    }).join('');
    const atkMore = atkTypes.length > 2
      ? `<span class="attack-badge" style="background:var(--color-surface-offset);color:var(--color-text-faint);border-color:var(--color-border);">+${atkTypes.length - 2}</span>`
      : '';

    return `
    <tr data-lat="${d.lat}" data-lng="${d.lng}" data-name="${d.name.replace(/"/g, '&quot;')}">
      <td class="rank-cell">${i + 1}</td>
      <td class="location-cell">${d.name}</td>
      <td style="font-size:var(--text-xs);color:var(--color-text-muted);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.conflictName || (d.country || d.region || '—')}</td>
      <td><div style="display:flex;flex-wrap:wrap;gap:3px;">${atkBadges}${atkMore}</div></td>
      <td>${badgeHTML(d.severity)}</td>
      <td class="tabular-nums" style="color:var(--color-text-muted);font-size:var(--text-xs);">${(d.count || 0).toLocaleString()}</td>
    </tr>`;
  }).join('');

  // Row click → fly map
  tbody.querySelectorAll('tr[data-lat]').forEach(row => {
    row.addEventListener('click', () => {
      const lat = parseFloat(row.dataset.lat);
      const lng = parseFloat(row.dataset.lng);
      if (STATE.maps.live && lat && lng) {
        STATE.maps.live.flyTo([lat, lng], 6, {animate: true, duration: 1});
      }
    });
  });
}

function initLiveTableSort() {
  document.querySelectorAll('#live-table thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (STATE.liveSortCol === col) {
        STATE.liveSortDir = STATE.liveSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        STATE.liveSortCol = col;
        STATE.liveSortDir = 'desc';
      }
      document.querySelectorAll('#live-table thead th').forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
      });
      th.classList.add(`sort-${STATE.liveSortDir}`);
      renderLiveTable();
    });
  });
}

function initLiveFilters() {
  // Severity filter buttons
  document.querySelectorAll('.filter-btn[data-severity]').forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.liveFilter = btn.dataset.severity;
      document.querySelectorAll('.filter-btn[data-severity]').forEach(b =>
        b.classList.toggle('active', b.dataset.severity === STATE.liveFilter)
      );
      renderLiveMarkers();
      renderLiveTable();
    });
  });

  // Attack type filter buttons
  document.querySelectorAll('.atk-filter-btn[data-attack]').forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.liveAttackFilter = btn.dataset.attack;
      document.querySelectorAll('.atk-filter-btn[data-attack]').forEach(b =>
        b.classList.toggle('active', b.dataset.attack === STATE.liveAttackFilter)
      );
      renderLiveMarkers();
      renderLiveTable();
    });
  });

  // Refresh button
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (!refreshBtn.classList.contains('loading')) {
        loadLiveData();
      }
    });
  }
}

function showLiveLoading(show) {
  const el = document.getElementById('live-map-loading');
  if (el) el.classList.toggle('hidden', !show);
}

function setRefreshBtnLoading(loading) {
  const btn = document.querySelector('.refresh-btn');
  if (btn) {
    btn.classList.toggle('loading', loading);
    btn.querySelector('.refresh-text').textContent = loading ? 'Fetching…' : 'Refresh';
  }
}

function updateLastUpdatedDisplay() {
  const el = document.getElementById('last-updated');
  if (el && STATE.lastUpdated) {
    el.textContent = `Updated ${formatTime(STATE.lastUpdated)}`;
  }
}

// ============================================================
// HISTORICAL MAP
// ============================================================
function initHistMap() {
  const mapEl = document.getElementById('hist-map');
  if (!mapEl) return;

  const map = L.map('hist-map', {
    center: [20, 10],
    zoom: 2,
    zoomControl: false,
    attributionControl: true,
    preferCanvas: true
  });
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://openstreetmap.org" target="_blank" rel="noopener">OpenStreetMap</a> © <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  STATE.maps.hist = map;
  STATE.layers.histMarkers = L.layerGroup().addTo(map);

  renderHistMarkers();
  renderHistTable();
}

function getFilteredHistData() {
  return window.HISTORICAL_CONFLICTS.filter(c => {
    const f = STATE.histFilters;
    if (f.country && c.country.toLowerCase().indexOf(f.country.toLowerCase()) === -1) return false;
    if (f.types.length > 0 && !f.types.includes(c.type)) return false;
    const startOk = c.startYear <= f.yearMax;
    const endOk = c.endYear === null ? true : c.endYear >= f.yearMin;
    if (!startOk || !endOk) return false;
    if (c.severity < f.severityMin || c.severity > f.severityMax) return false;
    if (f.status !== 'all' && c.status !== f.status) return false;
    return true;
  });
}

function renderHistMarkers() {
  const layer = STATE.layers.histMarkers;
  if (!layer) return;
  layer.clearLayers();

  const data = getFilteredHistData();
  data.forEach(c => {
    const color  = TYPE_COLORS[c.type] || '#6b7280';
    const radius = 4 + c.severity * 2.5;

    const marker = L.circleMarker([c.lat, c.lng], {
      radius,
      fillColor: color,
      color: color,
      weight: 1.5,
      opacity: 0.9,
      fillOpacity: 0.5
    });

    const partiesStr  = c.parties.join(', ');
    const yearsStr    = c.startYear + (c.endYear ? `–${c.endYear}` : '–Present');
    const fatalStr    = c.fatalities > 0 ? formatNumber(c.fatalities) + ' est. fatalities' : 'Fatalities undocumented';
    const statusColor = c.status === 'Ongoing' ? 'var(--color-critical)' : c.status === 'Frozen' ? 'var(--color-medium)' : 'var(--color-low)';

    marker.bindPopup(`
      <div class="popup-title">${c.name}</div>
      <div class="popup-meta">
        ${typeBadgeHTML(c.type)}
        <span class="badge" style="background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;">${c.status}</span>
      </div>
      <div class="popup-meta" style="margin-top:0;">
        <span class="popup-count">${yearsStr}</span>
        <span class="popup-count">·</span>
        <span class="popup-count">${fatalStr}</span>
      </div>
      <div class="popup-desc">${c.description}</div>
      <div style="font-size:var(--text-xs);color:var(--color-text-faint);border-top:1px solid var(--color-border);padding-top:var(--space-2);margin-top:var(--space-2);">Parties: ${partiesStr}</div>
    `, { maxWidth: 320 });

    layer.addLayer(marker);
  });
}

function renderHistTable() {
  const tbody   = document.getElementById('hist-table-body');
  const countEl = document.getElementById('hist-count');
  if (!tbody) return;

  let data = getFilteredHistData();

  const col = STATE.histSortCol;
  const dir = STATE.histSortDir === 'asc' ? 1 : -1;
  data.sort((a, b) => {
    if (col === 'name')       return a.name.localeCompare(b.name) * dir;
    if (col === 'country')    return a.country.localeCompare(b.country) * dir;
    if (col === 'type')       return a.type.localeCompare(b.type) * dir;
    if (col === 'startYear')  return (a.startYear - b.startYear) * dir;
    if (col === 'fatalities') return (a.fatalities - b.fatalities) * dir;
    if (col === 'severity')   return (a.severity - b.severity) * dir;
    if (col === 'status')     return a.status.localeCompare(b.status) * dir;
    return 0;
  });

  if (countEl) countEl.textContent = `${data.length} conflicts`;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state">
        <div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
        <div class="empty-title">No conflicts match filters</div>
        <div class="empty-desc">Try adjusting the year range, type selection, or other filters.</div>
      </div>
    </td></tr>`;
    return;
  }

  const sevColors = { 1: 'var(--color-low)', 2: 'var(--color-low)', 3: 'var(--color-medium)', 4: 'var(--color-high)', 5: 'var(--color-critical)' };

  tbody.innerHTML = data.map(c => {
    const yearsStr   = c.startYear + (c.endYear ? `–${c.endYear}` : '–Now');
    const statusColor = c.status === 'Ongoing' ? 'var(--color-critical)' : c.status === 'Frozen' ? 'var(--color-medium)' : 'var(--color-text-faint)';
    const sColor      = sevColors[c.severity] || 'var(--color-text-faint)';
    const typeColor   = TYPE_COLORS[c.type] || '#6b7280';
    return `
    <tr data-lat="${c.lat}" data-lng="${c.lng}">
      <td style="font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;">${c.name}</td>
      <td style="font-size:var(--text-xs);color:var(--color-text-muted);white-space:nowrap;">${c.country}</td>
      <td><span style="font-size:var(--text-xs);padding:0.1em 0.5em;border-radius:var(--radius-full);background:${typeColor}22;color:${typeColor};border:1px solid ${typeColor}44;">${c.type}</span></td>
      <td class="tabular-nums" style="font-size:var(--text-xs);color:var(--color-text-muted);">${yearsStr}</td>
      <td class="tabular-nums" style="font-size:var(--text-xs);">${c.fatalities > 0 ? formatNumber(c.fatalities) : '—'}</td>
      <td>
        <div style="display:flex;align-items:center;gap:var(--space-2);">
          <span style="font-weight:700;color:${sColor};">${c.severity}</span>
          <div style="width:40px;height:4px;background:var(--color-surface-offset);border-radius:var(--radius-full);overflow:hidden;">
            <div style="height:100%;width:${c.severity * 20}%;background:${sColor};border-radius:var(--radius-full);"></div>
          </div>
        </div>
      </td>
      <td><span style="font-size:var(--text-xs);color:${statusColor};">${c.status}</span></td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('tr[data-lat]').forEach(row => {
    row.addEventListener('click', () => {
      const lat = parseFloat(row.dataset.lat);
      const lng = parseFloat(row.dataset.lng);
      if (STATE.maps.hist && lat && lng) {
        STATE.maps.hist.flyTo([lat, lng], 5, {animate: true, duration: 1.2});
      }
    });
  });
}

function initHistTableSort() {
  document.querySelectorAll('#hist-table thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (STATE.histSortCol === col) {
        STATE.histSortDir = STATE.histSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        STATE.histSortCol = col;
        STATE.histSortDir = col === 'name' || col === 'country' || col === 'type' ? 'asc' : 'desc';
      }
      document.querySelectorAll('#hist-table thead th').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(`sort-${STATE.histSortDir}`);
      renderHistTable();
    });
  });
}

// ============================================================
// HISTORICAL FILTERS
// ============================================================
function initHistFilters() {
  // Country dropdown
  const countrySelect = document.getElementById('filter-country');
  if (countrySelect) {
    const countries = [...new Set(window.HISTORICAL_CONFLICTS.map(c => c.country))].sort();
    countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      countrySelect.appendChild(opt);
    });
    countrySelect.addEventListener('change', () => {
      STATE.histFilters.country = countrySelect.value;
      applyHistFilters();
    });
  }

  // Conflict type checkboxes
  const typeContainer = document.getElementById('filter-types');
  if (typeContainer) {
    Object.keys(TYPE_COLORS).forEach(type => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `
        <input type="checkbox" value="${type}" checked>
        <span class="legend-dot" style="background:${TYPE_COLORS[type]};"></span>
        ${type}
      `;
      const cb = label.querySelector('input');
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (!STATE.histFilters.types.includes(type)) STATE.histFilters.types.push(type);
        } else {
          STATE.histFilters.types = STATE.histFilters.types.filter(t => t !== type);
        }
        applyHistFilters();
      });
      typeContainer.appendChild(label);
    });
  }

  // Year range
  const yearMin    = document.getElementById('filter-year-min');
  const yearMax    = document.getElementById('filter-year-max');
  const yearMinVal = document.getElementById('year-min-val');
  const yearMaxVal = document.getElementById('year-max-val');
  if (yearMin && yearMax) {
    yearMin.addEventListener('input', () => {
      STATE.histFilters.yearMin = parseInt(yearMin.value);
      if (yearMinVal) yearMinVal.textContent = yearMin.value;
      applyHistFilters();
    });
    yearMax.addEventListener('input', () => {
      STATE.histFilters.yearMax = parseInt(yearMax.value);
      if (yearMaxVal) yearMaxVal.textContent = yearMax.value;
      applyHistFilters();
    });
  }

  // Severity range
  const sevMin    = document.getElementById('filter-sev-min');
  const sevMax    = document.getElementById('filter-sev-max');
  const sevMinVal = document.getElementById('sev-min-val');
  const sevMaxVal = document.getElementById('sev-max-val');
  if (sevMin && sevMax) {
    sevMin.addEventListener('input', () => {
      STATE.histFilters.severityMin = parseInt(sevMin.value);
      if (sevMinVal) sevMinVal.textContent = sevMin.value;
      applyHistFilters();
    });
    sevMax.addEventListener('input', () => {
      STATE.histFilters.severityMax = parseInt(sevMax.value);
      if (sevMaxVal) sevMaxVal.textContent = sevMax.value;
      applyHistFilters();
    });
  }

  // Status filter
  document.querySelectorAll('.status-btn[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.histFilters.status = btn.dataset.status;
      document.querySelectorAll('.status-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.status === STATE.histFilters.status)
      );
      applyHistFilters();
    });
  });

  // Reset button
  const resetBtn = document.querySelector('.reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetHistFilters);
  }
}

function applyHistFilters() {
  renderHistMarkers();
  renderHistTable();
}

function resetHistFilters() {
  STATE.histFilters = { country: '', types: [], yearMin: 1975, yearMax: 2025, severityMin: 1, severityMax: 5, status: 'all' };

  const countrySelect = document.getElementById('filter-country');
  if (countrySelect) countrySelect.value = '';

  document.querySelectorAll('#filter-types input[type="checkbox"]').forEach(cb => cb.checked = true);

  const yearMin    = document.getElementById('filter-year-min');
  const yearMax    = document.getElementById('filter-year-max');
  const yearMinVal = document.getElementById('year-min-val');
  const yearMaxVal = document.getElementById('year-max-val');
  if (yearMin) { yearMin.value = 1975; if (yearMinVal) yearMinVal.textContent = '1975'; }
  if (yearMax) { yearMax.value = 2025; if (yearMaxVal) yearMaxVal.textContent = '2025'; }

  const sevMin    = document.getElementById('filter-sev-min');
  const sevMax    = document.getElementById('filter-sev-max');
  const sevMinVal = document.getElementById('sev-min-val');
  const sevMaxVal = document.getElementById('sev-max-val');
  if (sevMin) { sevMin.value = 1; if (sevMinVal) sevMinVal.textContent = '1'; }
  if (sevMax) { sevMax.value = 5; if (sevMaxVal) sevMaxVal.textContent = '5'; }

  document.querySelectorAll('.status-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.status === 'all')
  );

  applyHistFilters();
}

// ============================================================
// ANALYTICS TAB
// ============================================================
function initAnalytics() {
  renderStatCards();
  renderCharts();
}

function renderStatCards() {
  const total    = window.HISTORICAL_CONFLICTS.length;
  const ongoing  = window.HISTORICAL_CONFLICTS.filter(c => c.status === 'Ongoing').length;
  const frozen   = window.HISTORICAL_CONFLICTS.filter(c => c.status === 'Frozen').length;
  const countries = new Set(window.HISTORICAL_CONFLICTS.map(c => c.country)).size;
  const totalFat  = window.HISTORICAL_CONFLICTS.reduce((s, c) => s + (c.fatalities || 0), 0);
  const liveZones = STATE.liveData.length;

  const statsEl = document.getElementById('stats-cards');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Live Conflict Zones</div>
        <div class="stat-value" style="color:var(--color-critical);">${liveZones > 0 ? liveZones.toLocaleString() : '—'}</div>
        <div class="stat-sub">Embedded intelligence + GDELT</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ongoing Conflicts</div>
        <div class="stat-value" style="color:var(--color-high);">${ongoing}</div>
        <div class="stat-sub">${frozen} frozen · ${total - ongoing - frozen} ended</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Countries Affected</div>
        <div class="stat-value">${countries}</div>
        <div class="stat-sub">Historical database</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Historical Fatalities</div>
        <div class="stat-value" style="color:var(--color-text-muted);">${formatNumber(totalFat)}+</div>
        <div class="stat-sub">1975–2025 est. total</div>
      </div>
    `;
  }
}

function renderCharts() {
  Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#9ca3af';
  Chart.defaults.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || '#2a3444';

  renderSeverityDonut();
  renderDecadeBar();
  renderTypeBar();
  renderRegionPie();
  renderDeadliestBar();
  renderAttackTypesChart();
  renderWeaponsChart();
}

function destroyChart(id) {
  if (STATE.charts[id]) {
    STATE.charts[id].destroy();
    delete STATE.charts[id];
  }
}

function renderSeverityDonut() {
  destroyChart('severity');
  const ctx = document.getElementById('chart-severity');
  if (!ctx) return;

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  STATE.liveData.forEach(d => counts[d.severity] = (counts[d.severity] || 0) + 1);

  if (STATE.liveData.length === 0) {
    window.HISTORICAL_CONFLICTS.filter(c => c.status === 'Ongoing').forEach(c => {
      if (c.severity >= 5) counts.critical++;
      else if (c.severity >= 4) counts.high++;
      else if (c.severity >= 3) counts.medium++;
      else counts.low++;
    });
  }

  STATE.charts.severity = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [{
        data: [counts.critical, counts.high, counts.medium, counts.low],
        backgroundColor: ['#dc2626cc', '#f97316cc', '#eab308cc', '#22c55ecc'],
        borderColor: ['#dc2626', '#f97316', '#eab308', '#22c55e'],
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 14, padding: 12, font: { size: 11, family: 'Inter' } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} zones` } }
      }
    }
  });
}

function renderDecadeBar() {
  destroyChart('decade');
  const ctx = document.getElementById('chart-decade');
  if (!ctx) return;

  const decades = { '1975': 0, '1980': 0, '1985': 0, '1990': 0, '1995': 0, '2000': 0, '2005': 0, '2010': 0, '2015': 0, '2020': 0 };
  window.HISTORICAL_CONFLICTS.forEach(c => {
    const decade = Math.floor(c.startYear / 5) * 5;
    const key = String(decade);
    if (decades.hasOwnProperty(key)) decades[key]++;
  });

  STATE.charts.decade = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(decades).map(y => `${y}–${parseInt(y) + 4}`),
      datasets: [{
        label: 'Conflicts Started',
        data: Object.values(decades),
        backgroundColor: '#3b82f666',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#2a344440' }, ticks: { font: { size: 10, family: 'Inter' } } },
        y: { grid: { color: '#2a344440' }, ticks: { stepSize: 1, font: { size: 10, family: 'Inter' } }, beginAtZero: true }
      }
    }
  });
}

function renderTypeBar() {
  destroyChart('type');
  const ctx = document.getElementById('chart-type');
  if (!ctx) return;

  const typeCounts = {};
  window.HISTORICAL_CONFLICTS.forEach(c => {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  });

  const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([t]) => t);
  const values = sorted.map(([, v]) => v);
  const colors = labels.map(t => TYPE_COLORS[t] || '#6b7280');

  STATE.charts.type = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.map(c => c + '66'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#2a344440' }, ticks: { stepSize: 1, font: { size: 10, family: 'Inter' } }, beginAtZero: true },
        y: { grid: { display: false }, ticks: { font: { size: 10, family: 'Inter' } } }
      }
    }
  });
}

function renderRegionPie() {
  destroyChart('region');
  const ctx = document.getElementById('chart-region');
  if (!ctx) return;

  const regionCounts = {};
  window.HISTORICAL_CONFLICTS.forEach(c => {
    regionCounts[c.region] = (regionCounts[c.region] || 0) + 1;
  });

  const labels = Object.keys(regionCounts);
  const values = Object.values(regionCounts);
  const regionColors = {
    'Africa': '#f97316', 'Americas': '#22c55e', 'Asia': '#3b82f6',
    'Europe': '#a855f7', 'Middle East': '#ef4444'
  };

  STATE.charts.region = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map(l => (regionColors[l] || '#6b7280') + 'aa'),
        borderColor: labels.map(l => regionColors[l] || '#6b7280'),
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 14, padding: 10, font: { size: 11, family: 'Inter' } } }
      }
    }
  });
}

function renderDeadliestBar() {
  destroyChart('deadliest');
  const ctx = document.getElementById('chart-deadliest');
  if (!ctx) return;

  const top10 = [...window.HISTORICAL_CONFLICTS]
    .filter(c => c.fatalities > 0)
    .sort((a, b) => b.fatalities - a.fatalities)
    .slice(0, 10);

  STATE.charts.deadliest = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top10.map(c => c.name.length > 22 ? c.name.substring(0, 22) + '…' : c.name),
      datasets: [{
        data: top10.map(c => c.fatalities),
        backgroundColor: top10.map(c => c.severity >= 5 ? '#dc262666' : c.severity >= 4 ? '#f9731666' : '#eab30866'),
        borderColor: top10.map(c => c.severity >= 5 ? '#dc2626' : c.severity >= 4 ? '#f97316' : '#eab308'),
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x.toLocaleString()} estimated fatalities` } }
      },
      scales: {
        x: { grid: { color: '#2a344440' }, ticks: { font: { size: 10, family: 'Inter' }, callback: v => formatNumber(v) }, beginAtZero: true },
        y: { grid: { display: false }, ticks: { font: { size: 10, family: 'Inter' } } }
      }
    }
  });
}

/**
 * NEW: Attack Types Distribution chart — bar chart of attack type counts across all live events.
 */
function renderAttackTypesChart() {
  destroyChart('attackTypes');
  const ctx = document.getElementById('chart-attack-types');
  if (!ctx) return;

  const liveData = STATE.liveData;
  if (!liveData || liveData.length === 0) {
    ctx.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-text-faint);font-size:var(--text-sm);">No live data</div>';
    return;
  }

  // Count occurrences of each attack type across all events
  const atkCounts = {};
  const cats = window.ATTACK_CATEGORIES || {};
  liveData.forEach(d => {
    (d.attackTypes || []).forEach(at => {
      atkCounts[at] = (atkCounts[at] || 0) + 1;
    });
  });

  const sorted  = Object.entries(atkCounts).sort((a, b) => b[1] - a[1]);
  const labels  = sorted.map(([t]) => t);
  const values  = sorted.map(([, v]) => v);
  const colors  = labels.map(t => (cats[t] || {}).color || '#6b7280');

  STATE.charts.attackTypes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Events',
        data: values,
        backgroundColor: colors.map(c => c + '66'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} event${ctx.parsed.x !== 1 ? 's' : ''}` } }
      },
      scales: {
        x: {
          grid: { color: '#2a344440' },
          ticks: { stepSize: 1, font: { size: 10, family: 'Inter' } },
          beginAtZero: true
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 10, family: 'Inter' } }
        }
      }
    }
  });
}

/**
 * NEW: Weapon Systems Deployed chart — horizontal bar of most-seen weapon systems across live events.
 */
function renderWeaponsChart() {
  destroyChart('weapons');
  const ctx = document.getElementById('chart-weapons');
  if (!ctx) return;

  const liveData = STATE.liveData;
  if (!liveData || liveData.length === 0) {
    ctx.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-text-faint);font-size:var(--text-sm);">No live data</div>';
    return;
  }

  // Count occurrences of each weapon system
  const wpnCounts = {};
  liveData.forEach(d => {
    (d.weapons || []).forEach(w => {
      wpnCounts[w] = (wpnCounts[w] || 0) + 1;
    });
  });

  if (Object.keys(wpnCounts).length === 0) {
    ctx.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-text-faint);font-size:var(--text-sm);">No weapon data</div>';
    return;
  }

  // Top 15 weapons
  const sorted = Object.entries(wpnCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const labels = sorted.map(([w]) => w);
  const values = sorted.map(([, v]) => v);

  // Color by weapon type from WEAPON_SYSTEMS
  const ws = window.WEAPON_SYSTEMS || {};
  const typeColorMap = {
    'Ballistic Missile':    '#dc2626',
    'Cruise Missile':       '#f97316',
    'Cruise Drone':         '#f97316',
    'Loitering Munition':   '#eab308',
    'Combat UAV':           '#eab308',
    'Combat UCAV':          '#eab308',
    'First-Person-View':    '#84cc16',
    'Guided FPV':           '#84cc16',
    'Guided Bomb':          '#3b82f6',
    'Small Diameter Bomb':  '#3b82f6',
    'Stealth Fighter':      '#a855f7',
    'Strike Fighter':       '#a855f7',
    'Multirole Fighter':    '#a855f7',
    'Stealth Bomber':       '#dc2626',
    'Air Defense':          '#06b6d4',
    'ABM System':           '#06b6d4'
  };

  const colors = labels.map(w => {
    const sys = ws[w];
    if (sys && sys.type) return typeColorMap[sys.type] || '#6b7280';
    return '#6b7280';
  });

  STATE.charts.weapons = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Deployments',
        data: values,
        backgroundColor: colors.map(c => c + '66'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const wName = labels[ctx.dataIndex];
              const sys = ws[wName];
              let label = ` ${ctx.parsed.x} deployment${ctx.parsed.x !== 1 ? 's' : ''}`;
              if (sys) label += ` · ${sys.type} (${sys.origin})`;
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#2a344440' },
          ticks: { stepSize: 1, font: { size: 10, family: 'Inter' } },
          beginAtZero: true
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 10, family: 'Inter' } }
        }
      }
    }
  });
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initLiveFilters();
  initLiveTableSort();
  initHistFilters();
  initHistTableSort();

  // Initialize both maps eagerly — all panels are laid out now (visibility-based tabs)
  initLiveMap();
  initHistMap();

  // Start with live tab active
  activateTab('live');

  // Auto-refresh live data every 10 minutes
  setInterval(() => {
    if (STATE.activeTab === 'live') loadLiveData();
  }, 10 * 60 * 1000);
});
