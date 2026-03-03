/**
 * Override loadCountriesGeoJSON to use chunked part files.
 * This patch replaces the function after app.js loads.
 */
window._origLoadCountries = window.loadCountriesGeoJSON;
window.loadCountriesGeoJSON = async function() {
  if (window.STATE && window.STATE.countriesGeoJSON) return window.STATE.countriesGeoJSON;
  try {
    const TOTAL_PARTS = 14;
    const results = await Promise.all(
      Array.from({length: TOTAL_PARTS}, (_, i) =>
        fetch(`countries_part${i+1}.geojson`).then(r => r.json()).catch(() => ({type:"FeatureCollection",features:[]}))
      )
    );
    const allFeatures = results.flatMap(fc => fc.features || []);
    const geoJSON = { type: "FeatureCollection", features: allFeatures };
    if (window.STATE) window.STATE.countriesGeoJSON = geoJSON;
    return geoJSON;
  } catch(e) {
    console.warn("Failed to load countries GeoJSON:", e);
    const empty = { type: "FeatureCollection", features: [] };
    if (window.STATE) window.STATE.countriesGeoJSON = empty;
    return empty;
  }
};
