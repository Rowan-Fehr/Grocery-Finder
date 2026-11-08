// ---------- Which chains to show ----------
// Edit this list to change which stores appear.
var CHAINS = [
  { name: "No Frills",     match: /no\s*frills/i },
  { name: "Superstore",    match: /superstore/i },
  { name: "Sobeys",        match: /sobeys/i },
  { name: "Walmart",       match: /walmart/i },
  { name: "T&T",           match: /\bT\s*(&|and)\s*T\b/i },
  { name: "IGA",           match: /\bIGA\b/i },
  { name: "Independent",   match: /independent/i },
  { name: "Save-On-Foods", match: /save[\s-]*on[\s-]*foods/i },
  { name: "Safeway",       match: /safeway/i }
];

// Same list, written the way the map server understands it.
var CHAIN_QUERY = "No ?Frills|Superstore|Sobeys|Walmart|T ?& ?T|T and T|IGA|Independent|Save-On|Save On|Safeway";

function chainOf(text) {
  if (!text) return null;
  for (var i = 0; i < CHAINS.length; i++) {
    if (CHAINS[i].match.test(text)) return CHAINS[i].name;
  }
  return null;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  var R = 6371, toRad = Math.PI / 180;
  var dLat = (lat2 - lat1) * toRad, dLon = (lon2 - lon1) * toRad;
  var a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fetch that gives up after `ms` milliseconds.
function fetchWithTimeout(url, options, ms, outerSignal) {
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, ms);
  if (outerSignal) outerSignal.addEventListener("abort", function () { ctrl.abort(); });
  options = Object.assign({}, options, { signal: ctrl.signal });
  return fetch(url, options).finally(function () { clearTimeout(timer); });
}

// ---------- Store lookup (OpenStreetMap, free, no key) ----------
var OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter"
];

// Remembers the last search so changing to a smaller distance is instant.
var storeCache = null;

async function overpassStores(lat, lon, radiusKm) {
  var key = lat.toFixed(4) + "," + lon.toFixed(4);
  if (storeCache && storeCache.key === key && radiusKm <= storeCache.radius) {
    return storeCache.stores.filter(function (s) { return s.km <= radiusKm; });
  }

  var r = Math.round(radiusKm * 1000);
  var around = "(around:" + r + "," + lat + "," + lon + ")";
  var shops = '["shop"~"supermarket|grocery|department_store|wholesale|general"]';
  // Only ask for our chains, so the answer is small and quick.
  var query = "[out:json][timeout:25];(" +
    "nwr" + shops + '["name"~"' + CHAIN_QUERY + '",i]' + around + ";" +
    "nwr" + shops + '["brand"~"' + CHAIN_QUERY + '",i]' + around + ";" +
    ");out center tags;";
  var body = "data=" + encodeURIComponent(query);

  // Ask every server at once and use whichever answers first.
  var stopOthers = new AbortController();
  var data = await Promise.any(OVERPASS_SERVERS.map(function (url) {
    return fetchWithTimeout(url, {
      method: "POST",
      body: body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    }, 20000, stopOthers.signal).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " from " + url);
      return res.json().then(function (d) {
        // A busy server can answer "OK" with a cut-off, empty result.
        if (d.remark) throw new Error("Server busy: " + d.remark);
        return d;
      });
    });
  }));
  stopOthers.abort();

  var seen = {};
  var stores = (data.elements || [])
    .map(function (el) {
      var t = el.tags || {};
      var sLat = el.lat != null ? el.lat : (el.center && el.center.lat);
      var sLon = el.lon != null ? el.lon : (el.center && el.center.lon);
      var street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
      var address = [street, t["addr:city"]].filter(Boolean).join(", ");
      var name = t.name || t.brand || "";
      return {
        name: name,
        chain: chainOf(name) || chainOf(t.brand),
        address: address,
        lat: sLat,
        lon: sLon
      };
    })
    .filter(function (s) { return s.lat != null && s.chain; })
    .map(function (s) { s.km = distanceKm(lat, lon, s.lat, s.lon); return s; })
    .filter(function (s) {
      var k = s.chain + "|" + s.lat.toFixed(3) + "|" + s.lon.toFixed(3);
      if (seen[k] || s.km > radiusKm) return false;
      seen[k] = true;
      return true;
    })
    .sort(function (a, b) { return a.km - b.km; });

  storeCache = { key: key, radius: radiusKm, stores: stores };
  return stores;
}

// ---------- Main search: OpenStreetMap's search service (Nominatim) ----------
// Searches each chain by name inside a box around you. The service allows
// one request per second, so 9 chains take about 9 seconds in total. To
// make that feel fast, every chain's stores are shown as soon as they arrive.
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function nominatimStores(lat, lon, radiusKm, onPartial, shouldStop) {
  var dLat = radiusKm / 111;
  var dLon = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  var box = [lon - dLon, lat + dLat, lon + dLon, lat - dLat].join(",");
  var stores = [], failures = 0, lastStart = 0;

  for (var i = 0; i < CHAINS.length; i++) {
    if (shouldStop()) break;
    var gap = 1000 - (Date.now() - lastStart);
    if (i > 0 && gap > 0) await wait(gap);
    if (shouldStop()) break;
    lastStart = Date.now();
    try {
      var url = "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=40&bounded=1&countrycodes=ca" +
        "&viewbox=" + box + "&q=" + encodeURIComponent(CHAINS[i].name);
      var res = await fetchWithTimeout(url, { headers: { "Accept": "application/json" } }, 10000);
      if (!res.ok) throw new Error("HTTP " + res.status);
      var list = await res.json();
      var found = list.map(function (p) {
        var name = p.name || (p.display_name || "").split(",")[0];
        var a = p.address || {};
        var street = [a.house_number, a.road].filter(Boolean).join(" ");
        var s = {
          name: name, chain: chainOf(name),
          address: [street, a.city || a.town || a.village].filter(Boolean).join(", "),
          lat: +p.lat, lon: +p.lon
        };
        s.km = distanceKm(lat, lon, s.lat, s.lon);
        return s;
      }).filter(function (s) { return s.chain && s.km <= radiusKm; });
      stores = mergeStores(stores, found);
    } catch (e) {
      failures++;
      console.warn("Search failed for", CHAINS[i].name, e);
    }
    if (!shouldStop()) onPartial(stores, i + 1);
  }
  if (failures === CHAINS.length) throw new Error("All chain searches failed");
  return stores;
}

// Joins two store lists, dropping the same store found twice (same chain, under 150 m apart).
function mergeStores(a, b) {
  var out = a.slice();
  b.forEach(function (s) {
    var dup = out.some(function (o) {
      return o.chain === s.chain && distanceKm(o.lat, o.lon, s.lat, s.lon) < 0.15;
    });
    if (!dup) out.push(s);
  });
  return out.sort(function (x, y) { return x.km - y.km; });
}

// ---------- Saved results ----------
// A search you've done before (same spot, same or smaller distance) loads
// instantly for 7 days, even after closing the browser.
var WEEK = 7 * 24 * 3600 * 1000;
function cacheKey(lat, lon) { return "gf:" + lat.toFixed(3) + "," + lon.toFixed(3); }
function readCache(lat, lon, radiusKm) {
  try {
    var c = JSON.parse(localStorage.getItem(cacheKey(lat, lon)) || "null");
    if (c && c.radius >= radiusKm && Date.now() - c.time < WEEK) {
      return c.stores.filter(function (s) { return s.km <= radiusKm; });
    }
  } catch (e) {}
  return null;
}
function writeCache(lat, lon, radiusKm, stores) {
  try {
    localStorage.setItem(cacheKey(lat, lon), JSON.stringify({ radius: radiusKm, time: Date.now(), stores: stores }));
  } catch (e) {}
}

// ---------- Find stores ----------
// Runs both searches at the same time. The chain search shows stores as it
// goes; if the store servers answer first, their full list is used straight away.
// onUpdate(stores, chainsChecked, totalChains) is called with partial results.
async function findStores(lat, lon, radiusKm, onUpdate) {
  onUpdate = onUpdate || function () {};
  var saved = readCache(lat, lon, radiusKm);
  if (saved) return saved;

  var stopped = false, partial = [];
  var chainSearch = nominatimStores(lat, lon, radiusKm, function (list, done) {
    partial = list;
    onUpdate(list, done, CHAINS.length);
  }, function () { return stopped; });

  // An empty answer from the busy servers isn't trusted; wait for the chain search instead.
  var serverSearch = overpassStores(lat, lon, radiusKm).then(function (list) {
    if (!list.length) throw new Error("Store servers returned nothing");
    return mergeStores(list, partial);
  });

  var stores;
  try {
    stores = await Promise.any([chainSearch, serverSearch]);
  } catch (e) {
    throw new Error("All store searches failed");
  } finally {
    stopped = true;
  }
  writeCache(lat, lon, radiusKm, stores);
  return stores;
}
