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

// Street address (or place name) to location, using OpenStreetMap.
async function locateAddress(text) {
  var d = await getJson("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&q=" + encodeURIComponent(text), 10000)
    .catch(function () { return null; });
  if (!d || !d.length) return null;
  var parts = (d[0].display_name || text).split(",").map(function (s) { return s.trim(); });
  if (/^\d+[A-Za-z]?$/.test(parts[0]) && parts[1]) parts.splice(0, 2, parts[0] + " " + parts[1]);
  var short = parts.slice(0, 3).join(", ");
  return { lat: +d[0].lat, lon: +d[0].lon, label: short };
}

// ---------- Map ----------
var map = null, tileLayer = null, pinLayer = null, storePins = [];

function tileUrl() {
  return currentTheme() === "dark"
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
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
      maxZoom: 16,
      attribution: 'Map tiles &copy; Esri, HERE, Garmin, OpenStreetMap contributors'
    }).addTo(map);
    pinLayer = L.layerGroup().addTo(map);
    map.on("click", function () { map.scrollWheelZoom.enable(); });
  }
  return true;
}

function drawMap(lat, lon, stores, radius, fit) {
  if (!ensureMap(lat, lon)) return;
  map.invalidateSize();
  if (fit) map.setView([lat, lon], 13, { animate: false });
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
      icon: L.divIcon({ className: "", html: '<div class="pin-store"><b>' + (i + 1) + "</b></div>", iconSize: [28, 28], iconAnchor: [14, 34], popupAnchor: [0, -30] }),
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

  if (fit) map.fitBounds(circle.getBounds(), { padding: [12, 12] });
}

function highlight(i, fromList) {
  document.querySelectorAll(".store-list li").forEach(function (li, j) { li.classList.toggle("active", j === i); });
  document.querySelectorAll(".pin-store").forEach(function (p) { p.classList.remove("active"); });
  var pin = storePins[i];
  if (!pin) return;
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
var input = document.getElementById("place");
var placeLabel = document.getElementById("place-label");
var totalCount = document.getElementById("total-count");
var totalNearest = document.getElementById("total-nearest");
var receiptDate = document.getElementById("receipt-date");
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

var searchId = 0;

async function showResults(lat, lon, label) {
  lastSearch = { lat: lat, lon: lon, label: label };
  var radius = radiusKm();
  var id = ++searchId;
  var shownOnce = false;
  errorEl.textContent = "";
  busy(true);
  progressStep(45, 52, "Finding stores within " + radius + " km");

  // Draw stores as soon as the first ones arrive, then keep adding.
  function update(stores, checked, total) {
    if (id !== searchId) return;
    var left = total - checked;
    progressStep(45 + Math.round(50 * checked / total), 45 + Math.round(50 * (checked + 1) / total),
      left ? "Checked " + checked + " of " + total + " chains" : "Finishing up");
    renderStores(lat, lon, stores, radius, label, left ? "Still checking " + left + " more " + (left === 1 ? "chain" : "chains") + "..." : "", !shownOnce);
    shownOnce = true;
  }

  var found;
  try {
    found = await findStores(lat, lon, radius, update);
  } catch (e) {
    if (id !== searchId) return;
    console.warn(e);
    progressFail();
    busy(false);
    errorEl.textContent = "Couldn't load stores right now. The free map service may be busy, so try again in a minute.";
    return;
  }
  if (id !== searchId) return;
  renderStores(lat, lon, found, radius, label, "", !shownOnce);
  progressDone();
  busy(false);
  if (!shownOnce) heading.focus({ preventScroll: true });
}

function renderStores(lat, lon, found, radius, label, stillLooking, fit) {
  var activeIndex = -1;
  list.querySelectorAll("li").forEach(function (li, j) { if (li.classList.contains("active")) activeIndex = j; });

  list.replaceChildren();
  heading.textContent = found.length
    ? found.length + (found.length === 1 ? " store" : " stores") + " within " + radius + " km"
    : (stillLooking ? "Looking within " + radius + " km" : "No stores within " + radius + " km");
  searchedFor.textContent = "Near " + label;
  receiptDate.textContent = new Date().toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
  totalCount.textContent = found.length;
  totalNearest.textContent = found.length ? found[0].km.toFixed(1) + " km" : "-";

  if (!found.length && !stillLooking) {
    var empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "None of the chosen chains are this close. Try a bigger distance.";
    list.appendChild(empty);
  }

  found.forEach(function (s, i) {
    var li = document.createElement("li");

    var num = document.createElement("span");
    num.className = "store-num";
    num.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);

    var line = document.createElement("span");
    line.className = "store-line";
    var name = document.createElement("span");
    name.className = "store-name";
    name.textContent = s.name;
    var leader = document.createElement("span");
    leader.className = "leader";
    var km = document.createElement("span");
    km.className = "store-km";
    km.textContent = s.km.toFixed(1) + " km";
    line.append(name, leader, km);

    var addr = document.createElement("span");
    addr.className = "store-address";
    addr.textContent = s.address || "Address not listed";

    li.append(num, line, addr);
    li.addEventListener("click", function () { highlight(i, true); });
    list.appendChild(li);
  });

  if (stillLooking) {
    var more = document.createElement("li");
    more.className = "empty checking";
    more.textContent = stillLooking;
    list.appendChild(more);
  }

  results.hidden = false;
  drawMap(lat, lon, found, radius, fit);
}

input.addEventListener("input", function () { errorEl.textContent = ""; });

// ---------- Postal code / Address switch ----------
function searchMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}
function applyMode() {
  var postal = searchMode() === "postal";
  input.classList.toggle("postal", postal);
  input.placeholder = postal ? "V6K 1P2" : "2525 W Broadway, Vancouver";
  input.autocomplete = postal ? "postal-code" : "street-address";
  input.maxLength = postal ? 7 : 120;
  placeLabel.textContent = postal ? "Postal code" : "Address";
}
document.querySelectorAll('input[name="mode"]').forEach(function (r) {
  r.addEventListener("change", function () {
    input.value = "";
    errorEl.textContent = "";
    applyMode();
    input.focus();
  });
});
applyMode();

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  errorEl.textContent = "";
  var loc, label;

  if (searchMode() === "address") {
    var text = input.value.trim();
    if (text.length < 4) {
      errorEl.textContent = "Type a street address, like 2525 W Broadway, Vancouver.";
      input.focus();
      return;
    }
    busy(true);
    progressValue = 0;
    progressStep(3, 40, "Finding the address");
    loc = await locateAddress(text);
    if (!loc) {
      progressFail();
      busy(false);
      errorEl.textContent = "Couldn't find that address. Add the city, or try the postal code.";
      return;
    }
    label = loc.label;
  } else {
    var code = input.value.toUpperCase().replace(/\s/g, "");
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
    loc = await locatePostalCode(code);
    if (!loc) {
      progressFail();
      busy(false);
      errorEl.textContent = "Couldn't find that postal code. Check your internet, or use your current location.";
      return;
    }
    label = loc.exact ? pretty : pretty + " (approximate, matched to area " + code.slice(0, 3) + ")";
  }
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

// Start in the saved theme, or the computer's theme
applyTheme(savedTheme() || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
