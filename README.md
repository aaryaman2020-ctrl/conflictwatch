# ConflictWatch — Global Conflict Intelligence Map

Real-time interactive map tracking active military conflicts worldwide with severity rankings, weapon systems analysis, and historical data.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Live Conflict Map** — Interactive map with 49+ active conflict locations across 20+ countries
- **Attack Type Filtering** — Filter by airstrikes, missile strikes, drone strikes, artillery, ground assaults, naval, IED, cyber/EW, and more
- **Weapon Systems Tracking** — 30+ weapon systems catalogued with origin, range, and warhead data
- **Severity Ranking** — Critical / High / Medium / Low classification for each hotspot
- **Daily Activity Timeline** — Day-by-day operational updates for each conflict zone
- **Historical Conflicts** — 75 curated conflicts from the past 50 years (1975–2025)
- **Analytics Dashboard** — Charts for attack type distribution, weapon systems deployed, regional breakdown
- **Dark Theme** — Military-grade dark interface optimized for readability

## Active Conflicts Tracked

| Conflict | Locations | Status |
|----------|-----------|--------|
| Iran Retaliatory Strikes (Operation True Promise 4) | 13 | Critical |
| US-Israel Strikes on Iran | 8 | Critical |
| Russia-Ukraine War | 6 | Critical |
| Afghanistan-Pakistan Conflict | 5 | Critical |
| Gaza War | 3 | Critical |
| Sudanese Civil War | 3 | Critical |
| Myanmar Civil War | 3 | Critical |
| Eastern Congo (M23) | 3 | High |
| Red Sea / Yemen Crisis | 2 | Critical |
| Syria / ISIS Resurgence | 2 | High |
| South Sudan | 1 | High |

## Tech Stack

- **Mapping**: [Leaflet.js](https://leafletjs.com/) 1.9.4 with MarkerCluster
- **Charts**: [Chart.js](https://www.chartjs.org/) 4.4.4
- **Tiles**: CartoDB Dark Matter
- **Data Sources**: GDELT Project, ISW, ACLED, Critical Threats, HRW, Reuters, Al Jazeera, BBC, CNN
- **Hosting**: Static HTML/CSS/JS — no backend required

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/aaryaman2020-ctrl/conflictwatch.git
   ```
2. Open `index.html` in a browser — no build step required.

Or serve locally:
```bash
cd conflictwatch
python3 -m http.server 8080
# Visit http://localhost:8080
```

## Project Structure

```
├── index.html           # Main app — 3 tabs (Live, Historical, Analytics)
├── base.css             # CSS reset and base styles
├── style.css            # Dark theme, attack badges, weapon tags, layout
├── app.js               # Core application logic, map rendering, filtering
├── live-conflicts.js    # 49 live conflict data points with weapon/attack data
├── conflicts-data.js    # 75 historical conflicts (1975–2025)
└── README.md
```

## Data Structure

Each live conflict entry includes:
- GPS coordinates, severity level, and conflict name
- Attack types (Airstrike, Missile Strike, Drone Strike, etc.)
- Weapon systems used (with technical specs)
- Casualty reports and daily activity timeline
- Source URLs for verification

## License

MIT

## Disclaimer

This project aggregates publicly available conflict data from open-source intelligence (OSINT) and news sources for educational and research purposes. Data accuracy depends on source reliability. Always verify critical information through official channels.