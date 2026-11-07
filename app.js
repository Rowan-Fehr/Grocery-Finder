// ---------- Dark / light mode ----------
var root = document.documentElement;
var themeBtn = document.getElementById("theme-btn");

function savedTheme() {
  try { return localStorage.getItem("theme"); } catch (e) { return null; }
}
function currentTheme() { return root.getAttribute("data-theme") || "light"; }
function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "dark" ? "Light" : "Dark";
  if (tileLayer) tileLayer.setUrl(tileUrl());
  if (typeof googleTheme === "function") googleTheme();
}

themeBtn.addEventListener("click", function () {
  var next = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// ---------- Percent loading bar ----------
// The free services don't report their own progress, so the bar moves
// through real steps (find postal code, find stores, draw map) and
// creeps forward inside each step while waiting.
var progressBox = document.getElementById("progress");
var progressFill = document.getElementById("progress-fill");
var progressPct = document.getElementById("progress-pct");
var progressLabel = document.getElementById("progress-label");
var progressValue = 0, progressCeiling = 0, progressTimer = null;

function drawProgress() {
  var pct = Math.floor(progressValue);
  progressFill.style.width = pct + "%";
  progressPct.textContent = pct + "%";
}
function progressStep(from, ceiling, label) {
  progressBox.hidden = false;
  progressLabel.textContent = label;
  progressValue = Math.max(progressValue, from);
  progressCeiling = ceiling;
  drawProgress();
  if (!progressTimer) {
    progressTimer = setInterval(function () {
      progressValue += (progressCeiling - progressValue) * 0.06;
      drawProgress();
    }, 60);
  }
}
function progressDone() {
  clearInterval(progressTimer); progressTimer = null;
  progressValue = 100; progressLabel.textContent = "Done"; drawProgress();
  setTimeout(function () { progressBox.hidden = true; progressValue = 0; drawProgress(); }, 450);
}
function progressFail() {
  clearInterval(progressTimer); progressTimer = null;
  progressBox.hidden = true; progressValue = 0; drawProgress();
}

// ---------- Postal code to location ----------
async function getJson(url, ms) {
  var res = await fetchWithTimeout(url, { headers: { "Accept": "application/json" } }, ms);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

// Asks two free services at the same time: the exact postal code
// (OpenStreetMap) and the area from the first 3 characters (Zippopotam).
// Uses the exact one if it's found, otherwise the area.
async function locatePostalCode(code) {
  var full = code.slice(0, 3) + " " + code.slice(3);
  var area = code.slice(0, 3);

  var exactP = getJson("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&postalcode=" + encodeURIComponent(full), 8000)
    .then(function (d) { return d && d.length ? { lat: +d[0].lat, lon: +d[0].lon, exact: true } : null; })
    .catch(function () { return null; });

  var areaP = getJson("https://api.zippopotam.us/ca/" + area, 8000)
    .then(function (d) { return d && d.places && d.places.length ? { lat: +d.places[0].latitude, lon: +d.places[0].longitude, exact: false } : null; })
    .catch(function () { return null; });

  return (await exactP) || (await areaP);
}

// ---------- Map ----------
var map = null, tileLayer = null, pinLayer = null, storePins = [];

function tileUrl() {
  return currentTheme() === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
}

function ensureMap(lat, lon) {
  if (typeof L === "undefined") {
    document.getElementById("map").hidden = true;
    document.getElementById("map-fallback").hidden = false;
    return false;
  }
  if (!map) {
    map = L.map("map", { center: [lat, lon], zoom: 13, scrollWheelZoom: false, zoomControl: true });
    tileLayer = L.tileLayer(tileUrl(), {
      subdomains: "abcd",
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    pinLayer = L.layerGroup().addTo(map);
    map.on("click", function () { map.scrollWheelZoom.enable(); });
  }
  return true;
}

function drawMap(lat, lon, stores, radius) {
  if (USE_GOOGLE) {
    return googleDrawMap(lat, lon, stores, radius).catch(function (e) {
      console.warn(e);
      errorEl.textContent = e.message;
    });
  }
  if (!ensureMap(lat, lon)) return;
  map.invalidateSize();
  map.setView([lat, lon], 13, { animate: false });
  pinLayer.clearLayers();
  storePins = [];

  var circle = L.circle([lat, lon], {
    radius: radius * 1000,
    color: getComputedStyle(root).getPropertyValue("--accent").trim(),
    weight: 1,
    fillOpacity: 0.05
  }).addTo(pinLayer);

  L.marker([lat, lon], {
    icon: L.divIcon({ className: "", html: '<div class="pin-you"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
    title: "You are here",
    zIndexOffset: 1000
  }).bindPopup("<strong>You are here</strong>").addTo(pinLayer);

  stores.forEach(function (s, i) {
    var pin = L.marker([s.lat, s.lon], {
      icon: L.divIcon({ className: "", html: '<div class="pin-store">' + (i + 1) + "</div>", iconSize: [26, 26], iconAnchor: [13, 13] }),
      title: s.name
    });
    var popup = document.createElement("div");
    var b = document.createElement("strong");
    b.textContent = s.name;
    popup.appendChild(b);
    popup.appendChild(document.createElement("br"));
    popup.appendChild(document.createTextNode((s.address || "Address not listed") + " · " + s.km.toFixed(1) + " km "));
    var a = document.createElement("a");
    a.href = mapsUrl(s.lat, s.lon);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Directions";
    popup.appendChild(a);
    pin.bindPopup(popup);
    pin.on("click", function () { highlight(i, false); });
    pin.addTo(pinLayer);
    storePins.push(pin);
  });

  map.fitBounds(circle.getBounds(), { padding: [12, 12] });
}

function highlight(i, fromList) {
  document.querySelectorAll(".store-list li").forEach(function (li, j) { li.classList.toggle("active", j === i); });
  document.querySelectorAll(".pin-store").forEach(function (p) { p.classList.remove("active"); });
  var pin = storePins[i];
  if (!pin) return;
  if (pin.google) {
    if (fromList) openGooglePin(i);
    else {
      var row = document.querySelectorAll(".store-list li")[i];
      if (row) row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    return;
  }
  var el = pin.getElement && pin.getElement();
  if (el && el.firstChild) el.firstChild.classList.add("active");
  if (fromList) {
    map.panTo(pin.getLatLng());
    pin.openPopup();
  } else {
    var li = document.querySelectorAll(".store-list li")[i];
    if (li) li.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

// ---------- Page ----------
var form = document.getElementById("search-form");
var input = document.getElementById("postal-code");
var errorEl = document.getElementById("error");
var results = document.getElementById("results");
var list = document.getElementById("store-list");
var searchedFor = document.getElementById("searched-for");
var heading = document.getElementById("results-heading");
var buttons = [document.getElementById("search-btn"), document.getElementById("locate-btn")];
var lastSearch = null;

var pattern = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/;

function radiusKm() {
  return Number(document.querySelector('input[name="radius"]:checked').value);
}
function busy(on) { buttons.forEach(function (b) { b.disabled = on; }); }
function mapsUrl(lat, lon) {
  return "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lon;
}

async function showResults(lat, lon, label) {
  lastSearch = { lat: lat, lon: lon, label: label };
  var radius = radiusKm();
  errorEl.textContent = "";
  busy(true);
  progressStep(45, 92, "Finding stores within " + radius + " km");

  var found;
  try {
    found = await findStores(lat, lon, radius);
  } catch (e) {
    console.warn(e);
    progressFail();
    busy(false);
    errorEl.textContent = USE_GOOGLE
      ? "Google search failed: " + (e && e.message ? e.message : "check your API key in config.js.")
      : "Couldn't load stores right now. The free map service may be busy, so try again in a minute.";
    return;
  }
  progressStep(94, 99, "Drawing map");

  list.replaceChildren();
  heading.textContent = found.length
    ? found.length + (found.length === 1 ? " store" : " stores") + " within " + radius + " km"
    : "No stores within " + radius + " km";
  searchedFor.textContent = "Near " + label;

  if (!found.length) {
    var empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "None of the chosen chains are this close. Try a bigger distance.";
    list.appendChild(empty);
  }

  found.forEach(function (s, i) {
    var li = document.createElement("li");

    var num = document.createElement("span");
    num.className = "store-num";
    num.textContent = i + 1;

    var text = document.createElement("span");
    var name = document.createElement("span");
    name.className = "store-name";
    name.textContent = s.name;
    var addr = document.createElement("span");
    addr.className = "store-address";
    addr.textContent = s.address || "Address not listed";
    text.append(name, addr);

    var km = document.createElement("span");
    km.className = "store-km";
    km.textContent = s.km.toFixed(1) + " ";
    var unit = document.createElement("small");
    unit.textContent = "km";
    km.appendChild(unit);

    li.append(num, text, km);
    li.addEventListener("click", function () { highlight(i, true); });
    list.appendChild(li);
  });

  results.hidden = false;
  drawMap(lat, lon, found, radius);
  if (googleWarning) errorEl.textContent = googleWarning;
  progressDone();
  busy(false);
  heading.focus({ preventScroll: true });
}

input.addEventListener("input", function () { errorEl.textContent = ""; });

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  var code = input.value.toUpperCase().replace(/\s/g, "");
  errorEl.textContent = "";

  if (!pattern.test(code)) {
    errorEl.textContent = "That doesn't look like a Canadian postal code. Try something like V6K 1P2.";
    input.focus();
    return;
  }
  var pretty = code.slice(0, 3) + " " + code.slice(3);
  input.value = pretty;
  busy(true);
  progressValue = 0;
  progressStep(3, 40, "Finding " + pretty);

  var loc = await locatePostalCode(code);
  if (!loc) {
    progressFail();
    busy(false);
    errorEl.textContent = "Couldn't find that postal code. Check your internet, or use your current location.";
    return;
  }
  var label = loc.exact ? pretty : pretty + " (approximate, matched to area " + code.slice(0, 3) + ")";
  await showResults(loc.lat, loc.lon, label);
});

document.getElementById("locate-btn").addEventListener("click", function () {
  errorEl.textContent = "";
  if (!navigator.geolocation) { errorEl.textContent = "Your browser can't share your location."; return; }
  busy(true);
  progressValue = 0;
  progressStep(3, 40, "Getting your location (allow it if your browser asks)");
  navigator.geolocation.getCurrentPosition(function (pos) {
    showResults(pos.coords.latitude, pos.coords.longitude, "your current location");
  }, function () {
    progressFail();
    busy(false);
    errorEl.textContent = "Location was blocked or unavailable. Use a postal code instead.";
  }, { timeout: 15000 });
});

// Changing the distance re-runs the last search (instant if it's smaller)
document.querySelectorAll('input[name="radius"]').forEach(function (r) {
  r.addEventListener("change", function () {
    if (lastSearch) showResults(lastSearch.lat, lastSearch.lon, lastSearch.label);
  });
});

// Shown when Google fails; the page then switches to the free data.
var googleWarning = "";
function onGoogleFailed(e) {
  googleWarning = "Google Maps didn't work (" + (e && e.message ? e.message : "unknown error") +
    "), so these results use free OpenStreetMap data instead.";
  document.getElementById("data-source").textContent = "Store locations from OpenStreetMap.";
}

if (USE_GOOGLE) {
  document.getElementById("data-source").textContent = "Store locations and map from Google Maps.";
}

// Start in the saved theme, or the computer's theme
applyTheme(savedTheme() || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
