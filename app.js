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
  zonesVisible: true,         // conflict zone overlay toggle
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
  charts: {},
  countriesGeoJSON: null  // cached GeoJSON data for choropleth map
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

  // Render conflict zone overlays
  renderConflictZones();
}

// ============================================================
// CONFLICT ZONE OVERLAYS — GeoJSON Choropleth
// ============================================================

/**
 * Country name aliases: GeoJSON name → array of alternate names used in conflict data.
 */
const COUNTRY_ALIASES = {
  'United States of America': ['USA', 'United States', 'US', 'U.S.', 'U.S.A.'],
  'United Kingdom': ['UK', 'Britain', 'Great Britain', 'England'],
  'United Arab Emirates': ['UAE', 'U.A.E.'],
  'Dem. Rep. Congo': ['DR Congo', 'DRC', 'Democratic Republic of the Congo', 'Congo, Dem. Rep.', 'Zaire'],
  'Central African Rep.': ['Central African Republic', 'CAR'],
  'S. Sudan': ['South Sudan'],
  "Côte d'Ivoire": ['Ivory Coast', 'Cote d\'Ivoire', "Cote d'Ivoire"],
  'eSwatini': ['Swaziland'],
  'Bosnia and Herz.': ['Bosnia', 'Bosnia and Herzegovina', 'Bosnia & Herzegovina'],
  'Macedonia': ['North Macedonia', 'FYROM'],
  'Czech Rep.': ['Czech Republic', 'Czechia'],
  'Dominican Rep.': ['Dominican Republic'],
  'Eq. Guinea': ['Equatorial Guinea'],
  'W. Sahara': ['Western Sahara'],
  'Congo': ['Republic of Congo', 'Republic of the Congo', 'Congo-Brazzaville'],
  'Lao PDR': ['Laos'],
  'Korea': ['South Korea'],
  'Dem. Rep. Korea': ['North Korea', 'DPRK'],
  'Myanmar': ['Burma'],
  'Iran': ['Islamic Republic of Iran'],
  'Syria': ['Syrian Arab Republic'],
  'Russia': ['Russian Federation'],
  'Tanzania': ['United Republic of Tanzania'],
  'Venezuela': ['Venezuela, RB'],
  'Yemen': ['Republic of Yemen'],
  'Libya': ['Libyan Arab Jamahiriya'],
  'Moldova': ['Republic of Moldova'],
  'Palestine': ['Palestinian Territory', 'West Bank', 'Gaza', 'Gaza Strip'],
  'Israel': ['State of Israel'],
  'Serbia': ['Republic of Serbia'],
  'Kosovo': ['Republic of Kosovo'],
  'Somaliland': ['Somaliland Region'],
  'N. Cyprus': ['Northern Cyprus'],
  'Falkland Is.': ['Falkland Islands'],
  'Papua New Guinea': ['PNG']
};

/** Build reverse lookup: alternate name (lowercase) → canonical GeoJSON name */
const _ALIAS_LOOKUP = {};
Object.entries(COUNTRY_ALIASES).forEach(([canonical, aliases]) => {
  aliases.forEach(a => { _ALIAS_LOOKUP[a.toLowerCase()] = canonical; });
  _ALIAS_LOOKUP[canonical.toLowerCase()] = canonical;
});

/**
 * Normalize a country name from conflict data to match GeoJSON feature name.
 * Returns canonical GeoJSON name if found, or original name.
 */
function normalizeCountryName(name) {
  if (!name) return '';
  const lower = name.toLowerCase().trim();
  return _ALIAS_LOOKUP[lower] || name;
}

/**
 * Load the countries GeoJSON once and cache it in STATE.
 */
async function loadCountriesGeoJSON() {
  if (STATE.countriesGeoJSON) return STATE.countriesGeoJSON;
  try {
    const resp = await fetch('countries.geojson');
    STATE.countriesGeoJSON = await resp.json();
  } catch(e) {
    console.warn('Failed to load countries GeoJSON:', e);
    STATE.countriesGeoJSON = { type: 'FeatureCollection', features: [] };
  }
  return STATE.countriesGeoJSON;
}

/**
 * Determine the worst severity for each country from live data.
 * Returns { normalizedCountryName: { severity, conflicts: [...], count, attackTypes } }
 */
function getCountrySeverityMap() {
  const countryMap = {};
  const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };

  const filtered = getFilteredLiveData();
  filtered.forEach(d => {
    const rawCountry = d.country || '';
    if (!rawCountry) return;
    const country = normalizeCountryName(rawCountry);

    const existing = countryMap[country];
    const rank = severityRank[d.severity] || 0;

    if (!existing) {
      countryMap[country] = {
        severity: d.severity,
        conflicts: [d],
        count: 1,
        attackTypes: d.attackTypes || []
      };
    } else {
      existing.count++;
      existing.conflicts.push(d);
      if (rank > (severityRank[existing.severity] || 0)) {
        existing.severity = d.severity;
        existing.attackTypes = d.attackTypes || [];
      }
    }
  });

  return countryMap;
}

/**
 * Style function for a GeoJSON feature on the live map.
 */
function getLiveFeatureStyle(feature, countrySeverity) {
  const name = feature.properties && feature.properties.name;
  const match = countrySeverity[name];

  if (!match) {
    return {
      color: '#374151',
      weight: 0.4,
      opacity: 0.5,
      fillColor: '#1f2937',
      fillOpacity: 0.0,
      className: 'country-no-conflict'
    };
  }

  const colors = {
    critical: '#dc2626',
    high:     '#f97316',
    medium:   '#eab308',
    low:      '#22c55e'
  };
  const color = colors[match.severity] || '#6b7280';

  return {
    color: color,
    weight: 1.2,
    opacity: 0.8,
    fillColor: color,
    fillOpacity: 0.22,
    className: 'conflict-zone-polygon'
  };
}

/**
 * Build popup HTML for clicking a conflict country on the live map.
 */
function buildCountryPopupHTML(countryName, matchData) {
  const conflicts = matchData.conflicts || [];
  const listItems = conflicts.map(c => {
    const sev = c.severity || 'low';
    const colors = { critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    const col = colors[sev] || '#6b7280';
    return `<li class="country-popup-conflict-item" data-conflict-name="${(c.name || '').replace(/"/g,'&quot;')}">
      <span class="country-popup-sev-dot" style="background:${col};"></span>
      <span class="country-popup-conflict-name">${c.name || c.conflict || 'Unknown conflict'}</span>
      <span class="country-popup-sev-label" style="color:${col};">${sev.toUpperCase()}</span>
    </li>`;
  }).join('');

  return `<div class="country-info-popup">
    <div class="country-popup-header">
      <strong>${countryName}</strong>
      <span class="country-popup-count">${matchData.count} active hotspot${matchData.count !== 1 ? 's' : ''}</span>
    </div>
    <ul class="country-popup-list">${listItems}</ul>
    <div class="country-popup-hint">Click a conflict to view details</div>
  </div>`;
}

/**
 * Render choropleth conflict zones on the live map using Natural Earth GeoJSON.
 */
async function renderConflictZones() {
  const map = STATE.maps.live;
  if (!map) return;

  // Remove old GeoJSON layer if present
  if (STATE.layers.conflictZones) {
    map.removeLayer(STATE.layers.conflictZones);
    STATE.layers.conflictZones = null;
  }

  if (!STATE.zonesVisible) return;

  const geoData = await loadCountriesGeoJSON();
  const countrySeverity = getCountrySeverityMap();

  const geoLayer = L.geoJSON(geoData, {
    style: feature => getLiveFeatureStyle(feature, countrySeverity),

    onEachFeature: function(feature, layer) {
      const name = feature.properties && feature.properties.name;
      const match = countrySeverity[name];

      if (match) {
        // Hover highlight
        layer.on('mouseover', function(e) {
          const s = this.options;
          this.setStyle({ fillOpacity: Math.min(s.fillOpacity * 2.2, 0.55), weight: 2.2 });
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) this.bringToFront();
          L.tooltip({ sticky: true, direction: 'top', className: 'zone-tooltip', offset: [0, -8] })
            .setContent(`<strong>${name}</strong> &nbsp;${badgeHTML(match.severity)}<br><span style="font-size:11px;color:#9ca3af;">${match.count} active hotspot${match.count !== 1 ? 's' : ''}</span>`)
            .setLatLng(e.latlng)
            .addTo(map);
          layer._zoneTooltip = map._layers[Object.keys(map._layers).pop()];
        });
        layer.on('mouseout', function() {
          geoLayer.resetStyle(this);
          if (layer._zoneTooltip) { map.removeLayer(layer._zoneTooltip); layer._zoneTooltip = null; }
        });
        layer.on('mousemove', function(e) {
          if (layer._zoneTooltip) layer._zoneTooltip.setLatLng(e.latlng);
        });

        // Click: zoom + open country briefing in detail panel
        layer.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
          if (layer._zoneTooltip) { map.removeLayer(layer._zoneTooltip); layer._zoneTooltip = null; }

          // Zoom to country bounds
          try { map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 6 }); } catch(_) {}

          // Open country intelligence briefing in detail panel
          openCountryBriefing(name, match, 'live');
        });
      } else {
        // Non-conflict country: just show name on hover
        layer.on('mouseover', function(e) {
          this.setStyle({ fillOpacity: 0.06, weight: 0.8 });
          L.tooltip({ sticky: true, direction: 'top', className: 'zone-tooltip zone-tooltip-muted', offset: [0, -6] })
            .setContent(`<span style="font-size:12px;">${name}</span>`)
            .setLatLng(e.latlng)
            .addTo(map);
          layer._zoneTooltip = map._layers[Object.keys(map._layers).pop()];
        });
        layer.on('mouseout', function() {
          geoLayer.resetStyle(this);
          if (layer._zoneTooltip) { map.removeLayer(layer._zoneTooltip); layer._zoneTooltip = null; }
        });
        layer.on('mousemove', function(e) {
          if (layer._zoneTooltip) layer._zoneTooltip.setLatLng(e.latlng);
        });
      }
    }
  });

  // Add below marker cluster so markers always appear on top
  geoLayer.addTo(map);
  if (STATE.layers.markers) STATE.layers.markers.bringToFront();

  STATE.layers.conflictZones = geoLayer;
}

/**
 * Style function for a GeoJSON feature on the historical map.
 */
function getHistFeatureStyle(feature, countrySeverity) {
  const name = feature.properties && feature.properties.name;
  const match = countrySeverity[name];

  if (!match) {
    return {
      color: '#374151',
      weight: 0.4,
      opacity: 0.5,
      fillColor: '#1f2937',
      fillOpacity: 0.0,
      className: 'country-no-conflict'
    };
  }

  // Map numeric severity (1–5) to color
  const sevToColor = { 5: '#dc2626', 4: '#f97316', 3: '#eab308', 2: '#22c55e', 1: '#22c55e' };
  const color = sevToColor[match.severity] || '#6b7280';

  return {
    color: color,
    weight: 1.2,
    opacity: 0.8,
    fillColor: color,
    fillOpacity: 0.20,
    className: 'conflict-zone-polygon'
  };
}

/**
 * Build popup HTML for clicking a conflict country on the historical map.
 */
function buildHistCountryPopupHTML(countryName, matchData) {
  const conflicts = matchData.conflicts || [];
  const sevToLabel = { 5: 'critical', 4: 'high', 3: 'medium', 2: 'low', 1: 'low' };
  const sevToColor = { 5: '#dc2626', 4: '#f97316', 3: '#eab308', 2: '#22c55e', 1: '#22c55e' };

  const listItems = conflicts.map(c => {
    const col = sevToColor[c.severity] || '#6b7280';
    const label = sevToLabel[c.severity] || 'low';
    const years = c.endYear ? `${c.startYear}–${c.endYear}` : `${c.startYear}–present`;
    return `<li class="country-popup-conflict-item hist" data-conflict-idx="${c._popupIdx}">
      <span class="country-popup-sev-dot" style="background:${col};"></span>
      <span class="country-popup-conflict-name">${c.name}</span>
      <span class="country-popup-years">${years}</span>
      <span class="country-popup-sev-label" style="color:${col};">${label.toUpperCase()}</span>
    </li>`;
  }).join('');

  return `<div class="country-info-popup">
    <div class="country-popup-header">
      <strong>${countryName}</strong>
      <span class="country-popup-count">${matchData.count} conflict${matchData.count !== 1 ? 's' : ''}</span>
    </div>
    <ul class="country-popup-list">${listItems}</ul>
    <div class="country-popup-hint">Click a conflict to view details</div>
  </div>`;
}

/**
 * Render choropleth conflict zones on the historical map using Natural Earth GeoJSON.
 */
async function renderHistConflictZones() {
  const map = STATE.maps.hist;
  if (!map) return;

  // Remove old GeoJSON layer
  if (STATE.layers.histConflictZones) {
    map.removeLayer(STATE.layers.histConflictZones);
    STATE.layers.histConflictZones = null;
  }

  const geoData = await loadCountriesGeoJSON();
  const filtered = getFilteredHistData();

  // Build country → worst severity map, collecting all conflicts per country
  const countrySeverity = {};
  filtered.forEach((c, idx) => {
    const rawCountry = c.country || '';
    if (!rawCountry) return;
    const country = normalizeCountryName(rawCountry);
    const cWithIdx = Object.assign({}, c, { _popupIdx: idx });

    const existing = countrySeverity[country];
    if (!existing) {
      countrySeverity[country] = { severity: c.severity, count: 1, conflicts: [cWithIdx] };
    } else {
      existing.count++;
      existing.conflicts.push(cWithIdx);
      if (c.severity > existing.severity) existing.severity = c.severity;
    }
  });

  const histGeoLayer = L.geoJSON(geoData, {
    style: feature => getHistFeatureStyle(feature, countrySeverity),

    onEachFeature: function(feature, layer) {
      const name = feature.properties && feature.properties.name;
      const match = countrySeverity[name];
      const sevToColor = { 5: '#dc2626', 4: '#f97316', 3: '#eab308', 2: '#22c55e', 1: '#22c55e' };
      const sevToLabel = { 5: 'critical', 4: 'high', 3: 'medium', 2: 'low', 1: 'low' };

      if (match) {
        layer.on('mouseover', function(e) {
          const s = this.options;
          this.setStyle({ fillOpacity: Math.min(s.fillOpacity * 2.2, 0.55), weight: 2.2 });
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) this.bringToFront();
          const col = sevToColor[match.severity] || '#6b7280';
          const lbl = sevToLabel[match.severity] || 'low';
          L.tooltip({ sticky: true, direction: 'top', className: 'zone-tooltip', offset: [0, -8] })
            .setContent(`<strong>${name}</strong> &nbsp;<span class="badge badge-${lbl}">${lbl.toUpperCase()}</span><br><span style="font-size:11px;color:#9ca3af;">${match.count} historical conflict${match.count !== 1 ? 's' : ''} &bull; Severity ${match.severity}/5</span>`)
            .setLatLng(e.latlng)
            .addTo(map);
          layer._zoneTooltip = map._layers[Object.keys(map._layers).pop()];
        });
        layer.on('mouseout', function() {
          histGeoLayer.resetStyle(this);
          if (layer._zoneTooltip) { map.removeLayer(layer._zoneTooltip); layer._zoneTooltip = null; }
        });
        layer.on('mousemove', function(e) {
          if (layer._zoneTooltip) layer._zoneTooltip.setLatLng(e.latlng);
        });

        layer.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
          if (layer._zoneTooltip) { map.removeLayer(layer._zoneTooltip); layer._zoneTooltip = null; }
          try { map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 6 }); } catch(_) {}

          // Open country intelligence briefing in detail panel
          openCountryBriefing(name, match, 'historical');
        });
      } else {
        layer.on('mouseover', function(e) {
          this.setStyle({ fillOpacity: 0.06, weight: 0.8 });
          L.tooltip({ sticky: true, direction: 'top', className: 'zone-tooltip zone-tooltip-muted', offset: [0, -6] })
            .setContent(`<span style="font-size:12px;">${name}</span>`)
            .setLatLng(e.latlng)
            .addTo(map);
          layer._zoneTooltip = map._layers[Object.keys(map._layers).pop()];
        });
        layer.on('mouseout', function() {
          histGeoLayer.resetStyle(this);
          if (layer._zoneTooltip) { map.removeLayer(layer._zoneTooltip); layer._zoneTooltip = null; }
        });
        layer.on('mousemove', function(e) {
          if (layer._zoneTooltip) layer._zoneTooltip.setLatLng(e.latlng);
        });
      }
    }
  });

  histGeoLayer.addTo(map);
  if (STATE.layers.histMarkers) STATE.layers.histMarkers.bringToFront();

  STATE.layers.histConflictZones = histGeoLayer;
}

/**
 * Toggle zone visibility on the live map.
 */
function toggleConflictZones() {
  STATE.zonesVisible = !STATE.zonesVisible;

  const btn = document.getElementById('zone-toggle');
  if (btn) btn.classList.toggle('active', STATE.zonesVisible);

  if (STATE.zonesVisible) {
    renderConflictZones();
  } else {
    if (STATE.layers.conflictZones) {
      const map = STATE.maps.live;
      if (map) map.removeLayer(STATE.layers.conflictZones);
      STATE.layers.conflictZones = null;
    }
  }
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

  // View Full Briefing button — stores data on window for inline onclick
  const briefingBtn = `<button class="popup-briefing-btn" onclick="(function(){var d=window._popupData_${d.name.replace(/[^a-zA-Z0-9]/g,'_')};if(d)openDetailPanel(d,'live');})()">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    View Full Briefing
  </button>`;
  const safeKey = d.name.replace(/[^a-zA-Z0-9]/g, '_');
  window[`_popupData_${safeKey}`] = d;

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
    ${briefingBtn}
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

  // Row click → fly map + open detail panel
  tbody.querySelectorAll('tr[data-lat]').forEach(row => {
    row.addEventListener('click', () => {
      const lat = parseFloat(row.dataset.lat);
      const lng = parseFloat(row.dataset.lng);
      if (STATE.maps.live && lat && lng) {
        STATE.maps.live.flyTo([lat, lng], 6, {animate: true, duration: 1});
      }
      // Find matching data entry and open detail panel
      const name = row.dataset.name;
      const entry = STATE.liveData.find(d => d.name === name || (d.lat && Math.abs(d.lat - lat) < 0.001 && Math.abs(d.lng - lng) < 0.001));
      if (entry) openDetailPanel(entry, 'live');
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

  // Zone toggle button
  const zoneBtn = document.getElementById('zone-toggle');
  if (zoneBtn) {
    zoneBtn.classList.add('active'); // start active
    zoneBtn.addEventListener('click', toggleConflictZones);
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
  renderHistConflictZones();
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
    const histSafeKey = c.name.replace(/[^a-zA-Z0-9]/g, '_');
    window[`_histPopupData_${histSafeKey}`] = c;

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
      <button class="popup-briefing-btn" onclick="(function(){var c=window._histPopupData_${histSafeKey};if(c)openDetailPanel(c,'historical');})()"><svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/><line x1='16' y1='13' x2='8' y2='13'/><line x1='16' y1='17' x2='8' y2='17'/><polyline points='10 9 9 9 8 9'/></svg>View Full Briefing</button>
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
      // Find matching historical conflict and open detail panel
      const entry = window.HISTORICAL_CONFLICTS.find(c =>
        c.lat && Math.abs(c.lat - lat) < 0.001 && Math.abs(c.lng - lng) < 0.001
      );
      if (entry) openDetailPanel(entry, 'historical');
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
  renderHistConflictZones();
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
// DETAIL PANEL — SLIDE-OUT BRIEFING
// ============================================================

/**
 * Find related HISTORICAL_CONFLICTS by country or region (case-insensitive partial match).
 */
function findRelatedHistorical(country, region, excludeName) {
  const all = window.HISTORICAL_CONFLICTS || [];
  const cLow = (country || '').toLowerCase();
  const rLow = (region || '').toLowerCase();

  // First try country match
  let matches = all.filter(c =>
    c.name !== excludeName &&
    cLow &&
    c.country.toLowerCase().indexOf(cLow) !== -1
  );

  // Fallback to region match
  if (matches.length === 0 && rLow) {
    matches = all.filter(c =>
      c.name !== excludeName &&
      (c.region || '').toLowerCase().indexOf(rLow) !== -1
    );
  }

  return matches;
}

/**
 * Find related LIVE_CONFLICT_DATA by country or region.
 */
function findRelatedLive(country, region, excludeName) {
  const all = window.LIVE_CONFLICT_DATA || [];
  const cLow = (country || '').toLowerCase();
  const rLow = (region || '').toLowerCase();

  let matches = all.filter(d =>
    d.name !== excludeName &&
    cLow &&
    (d.country || '').toLowerCase().indexOf(cLow) !== -1
  );

  if (matches.length === 0 && rLow) {
    matches = all.filter(d =>
      d.name !== excludeName &&
      (d.region || '').toLowerCase().indexOf(rLow) !== -1
    );
  }

  return matches;
}

/**
 * Get weapon category color for border styling.
 */
function getWeaponColor(weaponName) {
  const ws = window.WEAPON_SYSTEMS || {};
  const sys = ws[weaponName];
  if (!sys) return '#6b7280';
  const typeColorMap = {
    'Ballistic Missile': '#dc2626',
    'Cruise Missile': '#f97316',
    'Cruise Drone': '#f97316',
    'Loitering Munition': '#eab308',
    'Combat UAV': '#eab308',
    'Combat UCAV': '#eab308',
    'First-Person-View': '#84cc16',
    'Guided FPV': '#84cc16',
    'Guided Bomb': '#3b82f6',
    'Small Diameter Bomb': '#3b82f6',
    'Stealth Fighter': '#a855f7',
    'Strike Fighter': '#a855f7',
    'Multirole Fighter': '#a855f7',
    'Stealth Bomber': '#dc2626',
    'Air Defense': '#06b6d4',
    'ABM System': '#06b6d4'
  };
  return typeColorMap[sys.type] || '#6b7280';
}

/**
 * Get severity bar color.
 */
function getSevColor(sev) {
  const sevColors = { 1: 'var(--color-low)', 2: 'var(--color-low)', 3: 'var(--color-medium)', 4: 'var(--color-high)', 5: 'var(--color-critical)' };
  return sevColors[sev] || 'var(--color-text-faint)';
}

/**
 * Build the HTML content for a LIVE conflict detail panel.
 */
function buildLiveDetailHTML(d) {
  const cats = window.ATTACK_CATEGORIES || {};
  const ws = window.WEAPON_SYSTEMS || {};

  // --- Hero header ---
  const conflictNameHTML = d.conflictName
    ? `<div class="dp-hero-conflict-name"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm0 8h18v2H3v-2zm0 8h18v2H3v-2z"/></svg>${d.conflictName}</div>`
    : '';
  const metaParts = [];
  if (d.country) metaParts.push(d.country);
  if (d.region && d.region !== d.country) metaParts.push(d.region);

  const heroHTML = `
    <div class="dp-hero">
      <div class="dp-hero-location">${d.name}</div>
      ${conflictNameHTML}
      <div class="dp-hero-meta">
        ${badgeHTML(d.severity)}
        ${metaParts.length ? `<span class="dp-hero-geo"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${metaParts.join(' &middot; ')}</span>` : ''}
        <span style="font-size:var(--text-xs);color:var(--color-text-faint);">${(d.count || 0).toLocaleString()} articles</span>
      </div>
    </div>`;

  // --- Situation Summary ---
  const summaryHTML = `
    <div class="dp-section">
      <div class="dp-section-title">
        <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        Situation Summary
      </div>
      <div class="dp-description">${d.description || 'No description available.'}</div>
      ${d.casualties ? `<div class="dp-casualties"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>${d.casualties}</div>` : ''}
    </div>`;

  // --- Attack Analysis ---
  let attackHTML = '';
  if (d.attackTypes && d.attackTypes.length > 0) {
    const cards = d.attackTypes.map(at => {
      const cat = cats[at] || {};
      const color = cat.color || '#6b7280';
      return `
        <div class="dp-attack-card" style="border-left:3px solid ${color};">
          <span class="dp-attack-icon">${cat.icon || '⚡'}</span>
          <div>
            <div class="dp-attack-name" style="color:${color};">${at}</div>
            <div class="dp-attack-desc">${cat.desc || ''}</div>
          </div>
        </div>`;
    }).join('');
    attackHTML = `
      <div class="dp-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Attack Analysis
          <span class="dp-count-badge">${d.attackTypes.length}</span>
        </div>
        <div class="dp-attack-grid">${cards}</div>
      </div>`;
  }

  // --- Weapons Intelligence ---
  let weaponsHTML = '';
  if (d.weapons && d.weapons.length > 0) {
    const cards = d.weapons.map(wName => {
      const sys = ws[wName];
      const color = getWeaponColor(wName);
      const meta = sys ? [
        sys.type ? `<span class="dp-weapon-chip"><strong>Type</strong> ${sys.type}</span>` : '',
        sys.origin ? `<span class="dp-weapon-chip"><strong>Origin</strong> ${sys.origin}</span>` : '',
        sys.range ? `<span class="dp-weapon-chip"><strong>Range</strong> ${sys.range}</span>` : '',
        sys.warhead ? `<span class="dp-weapon-chip"><strong>Warhead</strong> ${sys.warhead}</span>` : ''
      ].filter(Boolean).join('') : '<span class="dp-weapon-chip">No specs available</span>';
      return `
        <div class="dp-weapon-card" style="border-left-color:${color};">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" style="margin-top:3px;flex-shrink:0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <div>
            <div class="dp-weapon-name">${wName}</div>
            <div class="dp-weapon-meta">${meta}</div>
          </div>
        </div>`;
    }).join('');
    weaponsHTML = `
      <div class="dp-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Weapons Intelligence
          <span class="dp-count-badge">${d.weapons.length}</span>
        </div>
        <div class="dp-weapons-grid">${cards}</div>
      </div>`;
  }

  // --- Operational Timeline ---
  let timelineHTML = '';
  if (d.dailyActivity && d.dailyActivity.length > 0) {
    const events = d.dailyActivity.map(da => `
      <div class="dp-timeline-event">
        <div class="dp-timeline-date">${da.date}</div>
        <div class="dp-timeline-text">${da.event}</div>
      </div>`).join('');
    timelineHTML = `
      <div class="dp-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Operational Timeline
          <span class="dp-count-badge">${d.dailyActivity.length}</span>
        </div>
        <div class="dp-timeline">${events}</div>
      </div>`;
  }

  // --- Source Links ---
  let sourcesHTML = '';
  if (d.links && d.links.length > 0) {
    const links = d.links.map(l => {
      let domain = l.href;
      try { domain = new URL(l.href).hostname.replace('www.', ''); } catch(e) {}
      return `
        <a href="${l.href}" class="dp-source-link" target="_blank" rel="noopener noreferrer">
          <svg class="dp-source-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span><strong style="color:var(--color-text)">${domain}</strong><br>${l.text.substring(0, 70)}${l.text.length > 70 ? '...' : ''}</span>
        </a>`;
    }).join('');
    sourcesHTML = `
      <div class="dp-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Source Intelligence
        </div>
        <div class="dp-sources">${links}</div>
      </div>`;
  }

  // --- Historical Context ---
  const related = findRelatedHistorical(d.country, d.region, null);
  let histContextHTML = '';
  if (related.length > 0) {
    const cards = related.slice(0, 5).map(c => {
      const yearsStr = c.startYear + (c.endYear ? `–${c.endYear}` : '–Present');
      const typeColor = TYPE_COLORS[c.type] || '#6b7280';
      const sColor = getSevColor(c.severity);
      const shortDesc = (c.description || '').substring(0, 150) + ((c.description || '').length > 150 ? '...' : '');
      return `
        <div class="dp-related-card" onclick="openDetailPanel(window.HISTORICAL_CONFLICTS.find(x=>x.name===\`${c.name.replace(/`/g, "'").replace(/"/g, '&quot;')}\`), 'historical')">
          <div class="dp-related-card-header">
            <div class="dp-related-card-name">${c.name}</div>
            <span class="dp-related-card-years">${yearsStr}</span>
          </div>
          <div class="dp-related-card-meta">
            <span style="font-size:var(--text-xs);padding:1px 6px;border-radius:var(--radius-full);background:${typeColor}22;color:${typeColor};border:1px solid ${typeColor}44;">${c.type}</span>
            ${c.fatalities > 0 ? `<span class="dp-related-card-fatalities">${formatNumber(c.fatalities)} est. fatalities</span>` : ''}
          </div>
          <div class="dp-severity-bar">
            <div class="dp-severity-bar-track"><div class="dp-severity-bar-fill" style="width:${c.severity * 20}%;background:${sColor};"></div></div>
            <span class="dp-severity-label" style="color:${sColor};">${c.severity}/5</span>
          </div>
          ${shortDesc ? `<div class="dp-related-card-desc" style="margin-top:var(--space-2);">${shortDesc}</div>` : ''}
        </div>`;
    }).join('');
    const contextLabel = d.country || d.region || 'Region';
    histContextHTML = `
      <div class="dp-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Historical Context: ${contextLabel}
          <span class="dp-count-badge">${related.length}</span>
        </div>
        <div class="dp-related-grid">${cards}</div>
      </div>`;
  }

  return heroHTML + summaryHTML + attackHTML + weaponsHTML + timelineHTML + sourcesHTML + histContextHTML;
}

/**
 * Build the HTML content for a HISTORICAL conflict detail panel.
 */
function buildHistDetailHTML(c) {
  const yearsStr = c.startYear + (c.endYear ? `–${c.endYear}` : '–Present');
  const typeColor = TYPE_COLORS[c.type] || '#6b7280';
  const statusColor = c.status === 'Ongoing' ? 'var(--color-critical)' : c.status === 'Frozen' ? 'var(--color-medium)' : 'var(--color-low)';
  const sColor = getSevColor(c.severity);

  // --- Hero ---
  const heroHTML = `
    <div class="dp-hero">
      <div class="dp-hero-location">${c.name}</div>
      <div class="dp-hero-meta">
        <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:var(--radius-full);background:${typeColor}22;color:${typeColor};border:1px solid ${typeColor}44;font-weight:600;">${c.type}</span>
        <span class="badge" style="background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;">${c.status}</span>
      </div>
      <div class="dp-hero-meta" style="margin-top:var(--space-2);">
        <span class="dp-hero-geo"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${c.country}</span>
        ${c.region ? `<span class="dp-hero-geo">&middot; ${c.region}</span>` : ''}
        <span style="font-size:var(--text-xs);color:var(--color-text-faint);">${yearsStr}</span>
      </div>
    </div>`;

  // --- Overview ---
  const overviewHTML = `
    <div class="dp-section">
      <div class="dp-section-title">
        <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        Overview
      </div>
      <div class="dp-description">${c.description || 'No description available.'}</div>
      ${c.fatalities > 0 ? `<div class="dp-casualties" style="margin-top:var(--space-3);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>${formatNumber(c.fatalities)} estimated fatalities</div>` : ''}
      <div class="dp-severity-bar" style="margin-top:var(--space-3);">
        <span style="font-size:var(--text-xs);color:var(--color-text-faint);text-transform:uppercase;letter-spacing:0.05em;">Severity</span>
        <div class="dp-severity-bar-track" style="max-width:100px;"><div class="dp-severity-bar-fill" style="width:${c.severity * 20}%;background:${sColor};"></div></div>
        <span class="dp-severity-label" style="color:${sColor};">${c.severity} / 5</span>
      </div>
    </div>`;

  // --- Key Parties ---
  let partiesHTML = '';
  if (c.parties && c.parties.length > 0) {
    const chips = c.parties.map(p => `<span class="dp-party-chip">${p}</span>`).join('');
    partiesHTML = `
      <div class="dp-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Key Parties
          <span class="dp-count-badge">${c.parties.length}</span>
        </div>
        <div class="dp-parties">${chips}</div>
      </div>`;
  }

  // --- Related Historical Conflicts ---
  const related = findRelatedHistorical(c.country, c.region, c.name);
  let relatedHTML = '';
  if (related.length > 0) {
    const cards = related.slice(0, 5).map(r => {
      const rYears = r.startYear + (r.endYear ? `–${r.endYear}` : '–Present');
      const rTypeColor = TYPE_COLORS[r.type] || '#6b7280';
      const rSColor = getSevColor(r.severity);
      const shortDesc = (r.description || '').substring(0, 130) + ((r.description || '').length > 130 ? '...' : '');
      return `
        <div class="dp-related-card" onclick="openDetailPanel(window.HISTORICAL_CONFLICTS.find(x=>x.name===\`${r.name.replace(/`/g, "'").replace(/"/g, '&quot;')}\`), 'historical')">
          <div class="dp-related-card-header">
            <div class="dp-related-card-name">${r.name}</div>
            <span class="dp-related-card-years">${rYears}</span>
          </div>
          <div class="dp-related-card-meta">
            <span style="font-size:var(--text-xs);padding:1px 6px;border-radius:var(--radius-full);background:${rTypeColor}22;color:${rTypeColor};border:1px solid ${rTypeColor}44;">${r.type}</span>
            ${r.fatalities > 0 ? `<span class="dp-related-card-fatalities">${formatNumber(r.fatalities)} est. fatalities</span>` : ''}
          </div>
          <div class="dp-severity-bar">
            <div class="dp-severity-bar-track"><div class="dp-severity-bar-fill" style="width:${r.severity * 20}%;background:${rSColor};"></div></div>
            <span class="dp-severity-label" style="color:${rSColor};">${r.severity}/5</span>
          </div>
          ${shortDesc ? `<div class="dp-related-card-desc" style="margin-top:var(--space-2);">${shortDesc}</div>` : ''}
        </div>`;
    }).join('');
    relatedHTML = `
      <div class="dp-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Related Conflicts: ${c.country}
          <span class="dp-count-badge">${related.length}</span>
        </div>
        <div class="dp-related-grid">${cards}</div>
      </div>`;
  }

  // --- Current Status Connection ---
  const liveMatches = findRelatedLive(c.country, c.region, null);
  let liveHTML = '';
  if (liveMatches.length > 0) {
    const items = liveMatches.slice(0, 4).map(ld => `
      <div class="dp-live-activity-item">
        <span class="dp-live-dot"></span>
        <span>${badgeHTML(ld.severity)} <strong style="color:var(--color-text)">${ld.name}</strong> — ${(ld.conflictName || ld.description || '').substring(0, 80)}${(ld.conflictName || ld.description || '').length > 80 ? '...' : ''}</span>
      </div>`).join('');
    liveHTML = `
      <div class="dp-section">
        <div class="dp-section-title">
          <span class="dot-pulse" style="width:8px;height:8px;"></span>
          Current Activity in ${c.country}
          <span class="dp-count-badge">${liveMatches.length}</span>
        </div>
        <div class="dp-live-activity">
          <div class="dp-live-activity-header">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Active Conflict Zones
          </div>
          ${items}
        </div>
      </div>`;
  }

  return heroHTML + overviewHTML + partiesHTML + relatedHTML + liveHTML;
}

// ============================================================
// COUNTRY INTELLIGENCE BRIEFING
// ============================================================

/**
 * Build the HTML for a LIVE country intelligence briefing.
 * @param {string} countryName
 * @param {Object} matchData - from getCountrySeverityMap()
 */
function buildLiveCountryBriefingHTML(countryName, matchData) {
  const cats = window.ATTACK_CATEGORIES || {};
  const ws   = window.WEAPON_SYSTEMS || {};
  const conflicts = matchData.conflicts || [];

  // Severity helpers
  const sevColors = { critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e' };
  const worstSev  = matchData.severity || 'low';
  const headerColor = sevColors[worstSev] || '#6b7280';

  // Aggregate all attack types
  const allAttackTypes = [];
  conflicts.forEach(c => { (c.attackTypes || []).forEach(at => { if (!allAttackTypes.includes(at)) allAttackTypes.push(at); }); });

  // Aggregate all weapons
  const allWeapons = [];
  conflicts.forEach(c => { (c.weapons || []).forEach(w => { if (!allWeapons.includes(w)) allWeapons.push(w); }); });

  // Aggregate all URLs
  const allUrls = [];
  conflicts.forEach(c => { (c.urls || []).forEach(u => { if (!allUrls.includes(u)) allUrls.push(u); }); });

  // Total article count
  const totalArticles = conflicts.reduce((s, c) => s + (c.articles || c.count || 0), 0);

  // Threat assessment sentence
  const threatSentences = [];
  if (conflicts.length > 1) {
    threatSentences.push(`${countryName} hosts ${conflicts.length} active conflict hotspots with a worst-case severity of <strong style="color:${headerColor}">${worstSev.toUpperCase()}</strong>.`);
  } else if (conflicts.length === 1) {
    threatSentences.push(`${countryName} has 1 active conflict hotspot rated <strong style="color:${headerColor}">${worstSev.toUpperCase()}</strong>.`);
  }
  if (allWeapons.length > 0) threatSentences.push(`${allWeapons.length} distinct weapon system${allWeapons.length > 1 ? 's' : ''} identified across all operations.`);
  if (allAttackTypes.length > 0) threatSentences.push(`Attack vectors include: ${allAttackTypes.slice(0, 3).join(', ')}${allAttackTypes.length > 3 ? ` and ${allAttackTypes.length - 3} more` : ''}.`);

  // ---- 1. HEADER ----
  const attackBadges = allAttackTypes.map(at => {
    const cat = cats[at] || {};
    const col = cat.color || '#6b7280';
    return `<span class="cb-attack-badge" style="background:${col}22;color:${col};border:1px solid ${col}44;">${at}</span>`;
  }).join('');

  const statsRow = `
    <div class="cb-stat-row">
      <div class="cb-stat">
        <span class="cb-stat-num">${conflicts.length}</span>
        <span class="cb-stat-label">Hotspot${conflicts.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="cb-stat">
        <span class="cb-stat-num">${allWeapons.length}</span>
        <span class="cb-stat-label">Weapon Systems</span>
      </div>
      <div class="cb-stat">
        <span class="cb-stat-num">${allAttackTypes.length}</span>
        <span class="cb-stat-label">Attack Vectors</span>
      </div>
      <div class="cb-stat">
        <span class="cb-stat-num">${totalArticles.toLocaleString()}</span>
        <span class="cb-stat-label">Articles</span>
      </div>
    </div>`;

  const headerHTML = `
    <div class="cb-header" style="border-top:4px solid ${headerColor};">
      <div class="cb-header-top">
        <div>
          <div class="cb-country-name">${countryName}</div>
          <div class="cb-country-sub">Country Intelligence Briefing &mdash; Live Conflicts</div>
        </div>
        ${badgeHTML(worstSev)}
      </div>
      ${statsRow}
      ${attackBadges ? `<div class="cb-attack-badges-row">${attackBadges}</div>` : ''}
      <div class="cb-threat-assessment">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:2px;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        <span>${threatSentences.join(' ')}</span>
      </div>
    </div>`;

  // ---- 2. CONFLICT SITUATION OVERVIEW ----
  const conflictColors = ['#f97316','#a855f7','#06b6d4','#22c55e','#eab308','#3b82f6','#ec4899','#14b8a6'];
  const conflictCardsHTML = conflicts.map((c, i) => {
    const col = sevColors[c.severity] || '#6b7280';
    const tagColor = conflictColors[i % conflictColors.length];
    const safeId = `cbconf_${i}_${Date.now()}`;
    const safeOnclick = `this.closest('.cb-conflict-card').classList.toggle('expanded')`;
    const openDetailOnclick = `event.stopPropagation();openDetailPanel(((window.LIVE_CONFLICT_DATA||[]).find(x=>x.name===\`${(c.name||'').replace(/`/g,"'").replace(/"/g,'&quot;')}\`)||${JSON.stringify({name:c.name,severity:c.severity,description:c.description,casualties:c.casualties,country:c.country,region:c.region,conflictName:c.conflictName}).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026')}),\'live\')`;
    return `
      <div class="cb-conflict-card" style="--conflict-accent:${tagColor};">
        <div class="cb-conflict-card-header" onclick="${safeOnclick}">
          <div class="cb-conflict-card-title">
            <span class="cb-conflict-tag" style="background:${tagColor}22;color:${tagColor};border:1px solid ${tagColor}44;">${String.fromCharCode(65+i)}</span>
            <span class="cb-conflict-name">${c.name || c.conflictName || 'Unknown'}</span>
          </div>
          <div class="cb-conflict-card-meta">
            ${badgeHTML(c.severity || 'low')}
            <svg class="cb-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="cb-conflict-card-body">
          ${c.conflictName && c.conflictName !== c.name ? `<div class="cb-conflict-subname">${c.conflictName}</div>` : ''}
          <p class="cb-conflict-desc">${(c.description || 'No description available.').substring(0,300)}${(c.description||'').length>300?'...':''}</p>
          ${c.casualties ? `<div class="cb-conflict-casualties"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${c.casualties}</div>` : ''}
          <button class="cb-open-detail-btn" onclick="${openDetailOnclick}">View full detail &rarr;</button>
        </div>
      </div>`;
  }).join('');

  const overviewHTML = `
    <div class="cb-section">
      <div class="dp-section-title">
        <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        Conflict Situation Overview
        <span class="dp-count-badge">${conflicts.length}</span>
      </div>
      <div class="cb-conflict-list">${conflictCardsHTML}</div>
    </div>`;

  // ---- 3. UNIFIED TIMELINE ----
  const allEvents = [];
  conflicts.forEach((c, i) => {
    const tagColor = conflictColors[i % conflictColors.length];
    const label = String.fromCharCode(65+i);
    (c.dailyActivity || []).forEach(da => {
      allEvents.push({ date: da.date || '', event: da.event || '', conflictName: c.name || '', tagColor, label });
    });
  });
  // Sort descending by date string (ISO dates sort lexicographically)
  allEvents.sort((a, b) => b.date.localeCompare(a.date));

  let timelineHTML = '';
  if (allEvents.length > 0) {
    const eventItems = allEvents.map(ev => `
      <div class="cb-timeline-entry" style="border-left-color:${ev.tagColor};">
        <div class="cb-timeline-entry-header">
          <span class="cb-timeline-date">${ev.date}</span>
          <span class="cb-conflict-tag cb-conflict-tag-sm" style="background:${ev.tagColor}22;color:${ev.tagColor};border:1px solid ${ev.tagColor}44;">${ev.label}: ${(ev.conflictName).substring(0,30)}${ev.conflictName.length>30?'...':''}</span>
        </div>
        <div class="cb-timeline-event-text">${ev.event}</div>
      </div>`).join('');
    timelineHTML = `
      <div class="cb-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Unified Operations Timeline
          <span class="dp-count-badge">${allEvents.length}</span>
        </div>
        <div class="cb-timeline">${eventItems}</div>
      </div>`;
  }

  // ---- 4. WEAPONS INTELLIGENCE ----
  let weaponsHTML = '';
  if (allWeapons.length > 0) {
    const grouped = {};
    allWeapons.forEach(wName => {
      const sys = ws[wName];
      const cat = sys ? (sys.type || 'Other') : 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(wName);
    });
    const groupCards = Object.keys(grouped).map(cat => {
      const items = grouped[cat].map(wName => {
        const sys = ws[wName];
        const col = getWeaponColor(wName);
        const chips = sys ? [
          sys.origin ? `<span class="dp-weapon-chip"><strong>Origin</strong> ${sys.origin}</span>` : '',
          sys.range  ? `<span class="dp-weapon-chip"><strong>Range</strong> ${sys.range}</span>` : '',
          sys.warhead? `<span class="dp-weapon-chip"><strong>Warhead</strong> ${sys.warhead}</span>` : ''
        ].filter(Boolean).join('') : '<span class="dp-weapon-chip">No specs</span>';
        return `
          <div class="cb-weapon-card" style="border-left:3px solid ${col};">
            <div class="cb-weapon-name" style="color:${col};">${wName}</div>
            <div class="dp-weapon-meta">${chips}</div>
          </div>`;
      }).join('');
      return `
        <div class="cb-weapon-group">
          <div class="cb-weapon-group-label">${cat}</div>
          <div class="cb-weapon-grid">${items}</div>
        </div>`;
    }).join('');
    weaponsHTML = `
      <div class="cb-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Weapons Intelligence
          <span class="dp-count-badge">${allWeapons.length} systems</span>
        </div>
        ${groupCards}
      </div>`;
  }

  // ---- 5. ATTACK VECTOR ANALYSIS ----
  let attackVectorsHTML = '';
  if (allAttackTypes.length > 0) {
    const cards = allAttackTypes.map(at => {
      const cat = cats[at] || {};
      const col = cat.color || '#6b7280';
      const usedBy = conflicts.filter(c => (c.attackTypes||[]).includes(at)).map((c,i) => {
        const idx = conflicts.indexOf(c);
        const tagColor = conflictColors[idx % conflictColors.length];
        return `<span class="cb-conflict-tag cb-conflict-tag-sm" style="background:${tagColor}22;color:${tagColor};border:1px solid ${tagColor}44;">${String.fromCharCode(65+idx)}</span>`;
      }).join(' ');
      return `
        <div class="dp-attack-card" style="border-left:3px solid ${col};">
          <span class="dp-attack-icon">${cat.icon || '⚡'}</span>
          <div style="flex:1;">
            <div class="dp-attack-name" style="color:${col};">${at}</div>
            <div class="dp-attack-desc">${cat.desc || ''}</div>
            ${usedBy ? `<div style="margin-top:4px;">${usedBy}</div>` : ''}
          </div>
        </div>`;
    }).join('');
    attackVectorsHTML = `
      <div class="cb-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Attack Vector Analysis
          <span class="dp-count-badge">${allAttackTypes.length}</span>
        </div>
        <div class="dp-attack-grid">${cards}</div>
      </div>`;
  }

  // ---- 6. SOURCES & INTELLIGENCE ----
  let sourcesHTML = '';
  if (allUrls.length > 0) {
    const linkItems = allUrls.slice(0, 12).map(url => {
      let domain = url;
      try { domain = new URL(url).hostname.replace('www.',''); } catch(e) {}
      return `<a href="${url}" class="dp-source-link" target="_blank" rel="noopener noreferrer">
        <svg class="dp-source-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        <span><strong style="color:var(--color-text)">${domain}</strong></span>
      </a>`;
    }).join('');
    sourcesHTML = `
      <div class="cb-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Source Intelligence
          <span class="dp-count-badge">${totalArticles.toLocaleString()} articles</span>
        </div>
        <div class="dp-sources">${linkItems}</div>
      </div>`;
  }

  // ---- 7. RELATED HISTORICAL CONFLICTS ----
  const related = findRelatedHistorical(countryName, null, null);
  let relatedHistHTML = '';
  if (related.length > 0) {
    const cards = related.slice(0, 6).map(r => {
      const yearsStr = r.startYear + (r.endYear ? `\u2013${r.endYear}` : '\u2013Present');
      const typeColor = TYPE_COLORS[r.type] || '#6b7280';
      const sCol = getSevColor(r.severity);
      return `
        <div class="dp-related-card" onclick="openDetailPanel(window.HISTORICAL_CONFLICTS.find(x=>x.name===\`${r.name.replace(/`/g,"'").replace(/"/g,'&quot;')}\`), 'historical')">
          <div class="dp-related-card-header">
            <div class="dp-related-card-name">${r.name}</div>
            <span class="dp-related-card-years">${yearsStr}</span>
          </div>
          <div class="dp-related-card-meta">
            <span style="font-size:var(--text-xs);padding:1px 6px;border-radius:var(--radius-full);background:${typeColor}22;color:${typeColor};border:1px solid ${typeColor}44;">${r.type}</span>
            ${r.fatalities > 0 ? `<span class="dp-related-card-fatalities">${formatNumber(r.fatalities)} est. fatalities</span>` : ''}
          </div>
          <div class="dp-severity-bar">
            <div class="dp-severity-bar-track"><div class="dp-severity-bar-fill" style="width:${r.severity*20}%;background:${sCol};"></div></div>
            <span class="dp-severity-label" style="color:${sCol};">${r.severity}/5</span>
          </div>
        </div>`;
    }).join('');
    relatedHistHTML = `
      <div class="cb-section">
        <div class="dp-section-title">
          <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Historical Context
          <span class="dp-count-badge">${related.length}</span>
        </div>
        <div class="dp-related-grid">${cards}</div>
      </div>`;
  }

  return headerHTML + overviewHTML + timelineHTML + weaponsHTML + attackVectorsHTML + sourcesHTML + relatedHistHTML;
}

/**
 * Build the HTML for a HISTORICAL country intelligence briefing.
 * @param {string} countryName
 * @param {Object} matchData - {conflicts, count, severity}
 */
function buildHistCountryBriefingHTML(countryName, matchData) {
  const conflicts = matchData.conflicts || [];
  const sevToColor = { 5: '#dc2626', 4: '#f97316', 3: '#eab308', 2: '#22c55e', 1: '#22c55e' };
  const sevToLabel = { 5: 'critical', 4: 'high', 3: 'medium', 2: 'low', 1: 'low' };
  const worstSev   = matchData.severity || 1;
  const headerColor = sevToColor[worstSev] || '#6b7280';
  const headerLabel = sevToLabel[worstSev] || 'low';

  // Date range
  const startYears = conflicts.map(c => c.startYear).filter(Boolean);
  const endYears   = conflicts.map(c => c.endYear).filter(Boolean);
  const earliest   = startYears.length > 0 ? Math.min(...startYears) : '?';
  const latest     = endYears.length > 0 ? Math.max(...endYears) : 'Present';
  const dateRange  = `${earliest}\u2013${latest}`;

  // Total fatalities (may be numeric or string like "600,000+")
  const totalFatalities = conflicts.reduce((sum, c) => {
    if (typeof c.fatalities === 'number') return sum + c.fatalities;
    return sum;
  }, 0);

  // Ongoing / resolved count
  const ongoingCount  = conflicts.filter(c => !c.endYear || c.status === 'Ongoing').length;
  const resolvedCount = conflicts.length - ongoingCount;

  // ---- ACTIVE NOW banner ----
  const liveMatches = findRelatedLive(countryName, null, null);
  let activeBannerHTML = '';
  if (liveMatches.length > 0) {
    const sevColors2 = { critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    const items = liveMatches.slice(0, 4).map(ld => {
      const lc = sevColors2[ld.severity] || '#6b7280';
      return `
        <div class="cb-active-item" onclick="openDetailPanel(((window.LIVE_CONFLICT_DATA||[]).find(x=>x.name===\`${(ld.name||'').replace(/`/g,"'").replace(/"/g,'&quot;')}\`)||{}),\'live\')">
          <span class="dot-pulse" style="width:8px;height:8px;flex-shrink:0;"></span>
          ${badgeHTML(ld.severity)}
          <span class="cb-active-item-name">${ld.name}</span>
        </div>`;
    }).join('');
    activeBannerHTML = `
      <div class="cb-active-banner">
        <div class="cb-active-banner-title">
          <span class="dot-pulse" style="width:10px;height:10px;"></span>
          ACTIVE CONFLICT ZONE &mdash; ${liveMatches.length} live hotspot${liveMatches.length !== 1 ? 's' : ''} detected
        </div>
        <div class="cb-active-items">${items}</div>
      </div>`;
  }

  // ---- HEADER ----
  const statsRow = `
    <div class="cb-stat-row">
      <div class="cb-stat">
        <span class="cb-stat-num">${conflicts.length}</span>
        <span class="cb-stat-label">Conflicts</span>
      </div>
      <div class="cb-stat">
        <span class="cb-stat-num">${ongoingCount}</span>
        <span class="cb-stat-label">Ongoing</span>
      </div>
      <div class="cb-stat">
        <span class="cb-stat-num">${resolvedCount}</span>
        <span class="cb-stat-label">Resolved</span>
      </div>
      <div class="cb-stat">
        <span class="cb-stat-num">${totalFatalities > 0 ? formatNumber(totalFatalities) : 'N/A'}</span>
        <span class="cb-stat-label">Fatalities</span>
      </div>
    </div>`;

  const headerHTML = `
    ${activeBannerHTML}
    <div class="cb-header" style="border-top:4px solid ${headerColor};">
      <div class="cb-header-top">
        <div>
          <div class="cb-country-name">${countryName}</div>
          <div class="cb-country-sub">Country Intelligence Briefing &mdash; Historical Conflicts</div>
        </div>
        <span class="badge badge-${headerLabel}">${headerLabel.toUpperCase()}</span>
      </div>
      <div class="cb-header-date-range">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>${dateRange}</span>
      </div>
      ${statsRow}
    </div>`;

  // ---- CONFLICT CARDS ----
  const sortedConflicts = [...conflicts].sort((a,b) => (a.startYear||0) - (b.startYear||0));
  const conflictCardsHTML = sortedConflicts.map((c, i) => {
    const col = sevToColor[c.severity] || '#6b7280';
    const lbl = sevToLabel[c.severity] || 'low';
    const yearsStr = c.startYear + (c.endYear ? `\u2013${c.endYear}` : '\u2013Present');
    const statusColor = c.status === 'Ongoing' ? 'var(--color-critical)' : c.status === 'Frozen' ? 'var(--color-medium)' : 'var(--color-low)';
    const parties = (c.parties || []).map(p => `<span class="dp-party-chip">${p}</span>`).join('');
    const safeOnclick = `this.closest('.cb-conflict-card').classList.toggle('expanded')`;
    const openDetailOnclick = `event.stopPropagation();openDetailPanel(window.HISTORICAL_CONFLICTS.find(x=>x.name===\`${(c.name||'').replace(/`/g,"'").replace(/"/g,'&quot;')}\`)||{},\'historical\')`;
    return `
      <div class="cb-conflict-card" style="--conflict-accent:${col};">
        <div class="cb-conflict-card-header" onclick="${safeOnclick}">
          <div class="cb-conflict-card-title">
            <span class="cb-hist-year-badge">${yearsStr}</span>
            <span class="cb-conflict-name">${c.name}</span>
          </div>
          <div class="cb-conflict-card-meta">
            <span class="badge badge-${lbl}">${lbl.toUpperCase()}</span>
            ${c.type ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:${TYPE_COLORS[c.type]||'#6b7280'}22;color:${TYPE_COLORS[c.type]||'#9ca3af'};">${c.type}</span>` : ''}
            <svg class="cb-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="cb-conflict-card-body">
          <div class="cb-conflict-body-meta">
            ${c.status ? `<span class="badge" style="background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;">${c.status}</span>` : ''}
            ${c.fatalities > 0 ? `<span class="dp-related-card-fatalities">${formatNumber(c.fatalities)} est. fatalities</span>` : (c.fatalities ? `<span class="dp-related-card-fatalities">${c.fatalities} fatalities</span>` : '')}
          </div>
          <p class="cb-conflict-desc">${(c.description||'No description available.').substring(0,300)}${(c.description||'').length>300?'...':''}</p>
          ${parties ? `<div class="cb-parties-row">${parties}</div>` : ''}
          <button class="cb-open-detail-btn" onclick="${openDetailOnclick}">View full detail &rarr;</button>
        </div>
      </div>`;
  }).join('');

  const overviewHTML = `
    <div class="cb-section">
      <div class="dp-section-title">
        <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        Historical Conflict Records
        <span class="dp-count-badge">${conflicts.length}</span>
      </div>
      <div class="cb-conflict-list">${conflictCardsHTML}</div>
    </div>`;

  // ---- VISUAL TIMELINE (chronological bar) ----
  const minYear = earliest !== '?' ? earliest : (sortedConflicts[0]?.startYear || 1900);
  const maxYear = new Date().getFullYear();
  const span    = Math.max(maxYear - minYear, 1);

  const timelineBarsHTML = sortedConflicts.map((c, i) => {
    const col = sevToColor[c.severity] || '#6b7280';
    const startPct = ((c.startYear - minYear) / span * 100).toFixed(1);
    const endYear  = c.endYear || maxYear;
    const widthPct = Math.max(((endYear - c.startYear) / span * 100), 1).toFixed(1);
    const yearsStr = c.startYear + (c.endYear ? `\u2013${c.endYear}` : '\u2013');
    return `
      <div class="cb-timeline-bar-row">
        <div class="cb-timeline-bar-label">${c.name.substring(0,28)}${c.name.length>28?'...':''}</div>
        <div class="cb-timeline-bar-track">
          <div class="cb-timeline-bar-fill" style="margin-left:${startPct}%;width:${widthPct}%;background:${col};opacity:0.85;"
               title="${c.name} (${yearsStr})"></div>
        </div>
        <div class="cb-timeline-bar-years">${yearsStr}</div>
      </div>`;
  }).join('');

  const visualTimelineHTML = `
    <div class="cb-section">
      <div class="dp-section-title">
        <svg class="dp-section-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="12" x2="22" y2="12"/><polyline points="16 6 22 12 16 18"/></svg>
        Conflict Timeline
        <span class="dp-count-badge">${minYear}\u2013Present</span>
      </div>
      <div class="cb-timeline-bars">
        <div class="cb-timeline-bars-header">
          <span>${minYear}</span>
          <span>Present</span>
        </div>
        ${timelineBarsHTML}
      </div>
    </div>`;

  return headerHTML + overviewHTML + visualTimelineHTML;
}

/**
 * Open the country intelligence briefing in the detail panel.
 * @param {string} countryName
 * @param {Object} matchData
 * @param {'live'|'historical'} type
 */
function openCountryBriefing(countryName, matchData, type) {
  const panel   = document.getElementById('detail-panel');
  const overlay = document.getElementById('detail-overlay');
  const content = document.getElementById('detail-panel-content');
  if (!panel || !overlay || !content) return;

  content.innerHTML = type === 'live'
    ? buildLiveCountryBriefingHTML(countryName, matchData)
    : buildHistCountryBriefingHTML(countryName, matchData);

  content.scrollTop = 0;
  panel.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * Open the detail panel for a given conflict data object.
 * @param {Object} data - conflict data (live or historical)
 * @param {'live'|'historical'} type
 */
function openDetailPanel(data, type) {
  if (!data) return;
  const panel = document.getElementById('detail-panel');
  const overlay = document.getElementById('detail-overlay');
  const content = document.getElementById('detail-panel-content');
  if (!panel || !overlay || !content) return;

  content.innerHTML = type === 'live'
    ? buildLiveDetailHTML(data)
    : buildHistDetailHTML(data);

  content.scrollTop = 0;
  panel.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * Close the detail panel.
 */
function closeDetailPanel() {
  const panel = document.getElementById('detail-panel');
  const overlay = document.getElementById('detail-overlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/**
 * Initialize detail panel listeners (close button, overlay, Escape key).
 */
function initDetailPanel() {
  const closeBtn = document.getElementById('detail-close-btn');
  const overlay = document.getElementById('detail-overlay');

  if (closeBtn) closeBtn.addEventListener('click', closeDetailPanel);
  if (overlay) overlay.addEventListener('click', closeDetailPanel);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDetailPanel();
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
  initDetailPanel();

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
