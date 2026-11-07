// Paste this entire block into the Walmart.ca browser console.
// Red wine vinegar and rapeseed oil are removed. The list now has 364 ingredients.
// This keeps your fresh-scan progress and runs up to 20 pending searches each time.
// If the JSON download fails, run: copy(groceryFinderWalmartJson)

(async () => {
  if (!["www.walmart.ca", "walmart.ca"].includes(location.hostname)) {
    console.warn("Run this in the Walmart.ca tab.");
    return;
  }

  const groups = {
    baking: "all purpose flour|baking powder|brown sugar|caster sugar|corn flour|cornstarch|flour|golden caster sugar|muscovado sugar|plain flour|puff pastry|shortcrust pastry|shortening|sugar|yeast",
    "herbs and spices": "all-purpose seasoning|allspice|bay leaf|bay leaves|black pepper|cajun|caraway seed|cardamom|cayenne pepper|chili powder|chilli flakes|chilli powder|chinese five spice powder|cinnamon|cinnamon stick|clove|cloves|coriander|cumin|cumin seeds|curry powder|dried mint|dried oregano|fajita seasoning|fennel seeds|garam masala|garlic powder|ground coriander|ground cumin|ground ginger|ground nutmeg|harissa spice|italian seasoning|kosher salt|marjoram|mustard powder|mustard seeds|nutmeg|oregano|paprika|pepper|red chilli flakes|red chilli powder|red pepper flakes|salt|sea salt|sesame seed|smoked paprika|star anise|summer savoury|sweet smoked paprika|turmeric",
    "condiments and oils": "apple cider vinegar|balsamic vinegar|barbeque sauce|beef gravy|canola oil|capers|chilli sauce|chimichurri sauce|clear honey|dijon mustard|enchilada sauce|extra virgin olive oil|fish sauce|garlic sauce|ground nut oil|honey|hotsauce|lemon juice|lime juice|mayonnaise|minced garlic|mirin|mustard|oil|olive oil|passata|peanut butter|red curry paste|rice vinegar|salsa|sesame seed oil|sherry vinegar|soy sauce|sunflower oil|sweet chilli sauce|tahini|tamarind paste|thai fish sauce|thai green curry paste|thai red curry paste|tomato ketchup|tomato puree|tomato sauce|vegetable oil|white vinegar|white wine vinegar|worcestershire sauce",
    produce: "asparagus|aubergine|avocado|baby new potatoes|baby plum tomatoes|bamboo shoot|basil|basil leaves|bean sprouts|beetroot|broccoli|butternut squash|cabbage|carrot|carrots|celery|challots|cherry tomatoes|chilli|chives|chopped onion|chopped parsley|cilantro|coriander leaves|corn on the cob|courgettes|cucumber|dill|egg plants|fennel|fennel bulb|floury potatoes|fresh basil|freshly chopped parsley|garlic|garlic bulb|garlic clove|ginger|green beans|green chilli|green pepper|hispi (sweetheart) cabbage|horseradish|jalapeno|kaffir lime leaves|kale|leek|lemon|lemongrass|lemongrass stalks|lemons|lettuce|lime|lime leaves|little gem lettuce|mint|mushrooms|new potatoes|onion|onions|orange|pak choi|parsley|peas|plum tomatoes|potatoes|pumpkin|red cabbage|red chilli|red onions|red pepper|red potatoes|rocket|rosemary|russet potato|sage|savoy cabbage|scallions|scotch bonnet|shallots|shiitake mushrooms|small potatoes|spinach|spring onions|squash|stir-fry vegetables|swede|sweet potatoes|sweetcorn|thyme|tomato|tomatoes|turnips|water chestnut|white cabbage|yellow pepper",
    meat: "bacon|beef|beef brisket|chicken|chicken breast|chicken breasts|chicken drumsticks|chicken legs|chicken thighs|chicken wings|chorizo|corned beef|doner meat|flank steak|ground beef|ground pork|ham|lamb|lamb kidney|lamb leg|lamb loin chops|lamb mince|lamb shoulder|lean minced beef|minced beef|minced pork|pork|pork back ribs|pork chops|pork shoulder|pork tenderloin|sausages|sirloin steak",
    bakery: "baguette|bread|corn tortillas|crusty bread|flour tortilla|pita bread|rye bread|wholegrain bread",
    "rice, grains and pasta": "basmati rice|bowtie pasta|brown rice|brown rice noodle|couscous|farfalle|fettuccine|jasmine rice|linguine pasta|macaroni|noodles|penne rigate|quinoa|rice|rice noodles|spaghetti|sushi rice|udon noodles|vermicelli rice noodles",
    "canned and dry pantry": "beef stock|black beans|black olives|breadcrumbs|broad beans|brown lentils|butter beans|canned tomatoes|cannellini beans|chicken stock|chicken stock cube|chickpeas|chopped tomatoes|coconut cream|coconut milk|diced tomatoes|dried apricots|dried white beans|fish stock|french lentils|green olives|hot beef stock|kidney beans|lamb stock|lentils|peanuts|pine nuts|pineapple chunks|prunes|raisins|roasted peanut|roasted pepper|sauerkraut|tinned tomatos|toor dal|vegetable stock|vegetable stock cube|vine leaves|walnuts",
    "recipe staple": "boiling water|egg wash|water",
    dairy: "butter|cheddar cheese|cheese|cheese curds|cream|creme fraiche|cubed feta cheese|double cream|feta|ghee|goats cheese|gouda cheese|greek yogurt|heavy cream|milk|mozzarella|mozzarella balls|parmesan|parmesan cheese|parmigiano-reggiano|shredded mexican cheese|shredded monterey jack cheese|sour cream|swiss cheese|unsalted butter|whipping cream|yogurt",
    seafood: "clams|fish fillet|king prawns|prawns|raw king prawns|salmon|shrimp|smoked haddock|squid|tiger prawns|tuna|white fish",
    eggs: "egg|egg white|egg yolks|eggs",
    frozen: "fries",
    beverages: "dry sherry|dry white wine|orange juice|red wine|rice wine|sake|white wine",
    "cooking fats": "lard",
  };

  const aliases = {
    aubergine: "eggplant",
    "egg plants": "eggplant",
    courgettes: "zucchini",
    challots: "shallots",
    carrots: "carrot",
    "chicken breasts": "chicken breast",
    "basil leaves": "basil",
    "fresh basil": "basil",
    "bay leaves": "bay leaf",
    "chilli powder": "chili powder",
    cloves: "clove",
    "barbeque sauce": "barbecue sauce",
    "clear honey": "honey",
    egg: "eggs",
    "egg wash": "eggs",
    "fennel bulb": "fennel",
    "garlic bulb": "garlic",
    "garlic clove": "garlic",
    lemons: "lemon",
    onions: "onion",
    tomatoes: "tomato",
    "minced beef": "ground beef",
    "minced pork": "ground pork",
    "tinned tomatos": "canned tomatoes",
    "plain flour": "all purpose flour",
    rocket: "arugula",
    "spring onions": "scallions",
    swede: "rutabaga",
    water: "boiling water",
  };

  const butterExclusions = /\b(?:peanut|almond|plant|margarine|blend|clarified|spread|garlic|sauce)\b/i;
  const riceExclusions = /\b(?:fried|meal|side dish|cakes?|cereal|noodles?|flour|crackers?|ready to heat|ready to serve|microwaveable|microwavable)\b/i;

  const exclusions = {
    "all purpose flour": /bread mix|cake mix/i,
    rice: riceExclusions,
    "basmati rice": riceExclusions,
    "brown rice": riceExclusions,
    "jasmine rice": riceExclusions,
    "sushi rice": riceExclusions,
    milk: /\b(?:almond|oat|soy|coconut|chocolate|powder|condensed|evaporated)\b/i,
    eggs: /\b(?:quail|duck|chocolate|candy|boiled|liquid|whites|yolks)\b/i,
    butter: butterExclusions,
    "unsalted butter": butterExclusions,
    beef: /\b(?:pork|stock|broth|gravy|jerky|meatballs?|burgers?)\b/i,
    "ground beef": /\b(?:pork|burgers?|patties|seasoning|meatballs?|meal)\b/i,
    chicken: /\b(?:stock|broth|gravy|nuggets?|soup|meal)\b/i,
  };

  const ingredients = Object.entries(groups).flatMap(([category, names]) =>
    names.split("|").map((ingredient) => ({
      ingredient,
      category,
      search: aliases[ingredient] ?? ingredient,
    })),
  );

  const storageKey = "grocery-finder:walmart-ca:full-rescan-01";
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  const selector = 'a[href*="/ip/"]';
  const failures = [];
  

  saved["boiling water"] = [];
  localStorage.setItem(storageKey, JSON.stringify(saved));

  const words = (text) =>
    (text.normalize("NFKD").toLowerCase().match(/[a-z0-9]+/g) ?? [])
      .map((word) => word.replace(/s$/, ""));

  function packageSize(name, search) {
    const packOf = name.match(/\bpack of\s+(\d+)\b/i);

    if (search === "eggs") {
      const count = name.match(/\b(\d+)\s*(?:(?:extra\s+large|large|medium|small)\s+)?(?:eggs?|count|ct|pack)\b/i);
      const quantity = Number(count?.[1] ?? packOf?.[1]);
      return quantity > 0
        ? { packageQuantity: quantity, packageUnit: "count" }
        : null;
    }

    const size = name.match(/\b(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i)
      ?? name.match(/\b(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(lb)\b/i);

    if (!size) {
      const count = name.match(/\b(\d+)\s*(?:count|ct|ea|pieces?|pk|pack)\b/i);
      const quantity = Number(count?.[1] ?? packOf?.[1]);
      return quantity > 0
        ? { packageQuantity: quantity, packageUnit: "count" }
        : null;
    }

    const [, packs, amount, rawUnit] = size;
    const unit = rawUnit.toLowerCase();
    const factor = { kg: 1000, g: 1, ml: 1, l: 1000, lb: 453.59237 }[unit];
    const quantity = Number(amount) * Number(packs ?? packOf?.[1] ?? 1) * factor;

    if (!Number.isFinite(quantity) || quantity <= 0) return null;

    return {
      packageQuantity: Math.round(quantity * 100) / 100,
      packageUnit: unit === "ml" || unit === "l" ? "mL" : "g",
    };
  }

  async function searchPage(search) {
    const open = new URL(location.href);

    if (
      open.pathname === "/en/search" &&
      open.searchParams.get("q")?.trim().toLowerCase() === search &&
      document.querySelector(selector)
    ) {
      return document;
    }

    const url = new URL("/en/search", location.origin);
    url.searchParams.set("q", search);
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });

    if (!response.ok) {
      const error = new Error(`Walmart returned HTTP ${response.status}`);
      error.stopBatch = [403, 429].includes(response.status);
      throw error;
    }

    const page = new DOMParser().parseFromString(await response.text(), "text/html");

    if (
      /verify your identity|robot or human|access denied/i.test(page.title) ||
      (!page.querySelector(selector) && page.querySelector("#px-captcha"))
    ) {
      const error = new Error("Walmart returned a verification page");
      error.stopBatch = true;
      throw error;
    }

    if (new URL(response.url).pathname !== "/en/search") {
      throw new Error("Walmart redirected away from the search results");
    }

    return page;
  }

  function readProducts(page, search) {
    const products = new Map();
    const searchWords = words(search);
    let readablePrices = 0;

    for (const link of page.querySelectorAll(selector)) {
      const productUrl = new URL(link.getAttribute("href"), location.origin);
      if (productUrl.origin !== location.origin) continue;

      const path = productUrl.pathname;
      if (products.has(path)) continue;

      for (let card = link; card && card !== page.body; card = card.parentElement) {
        const otherProduct = [...card.querySelectorAll(selector)].some((other) =>
          new URL(other.getAttribute("href"), location.origin).pathname !== path,
        );
        if (otherProduct) break;

        const text = [
          card.textContent,
          ...Array.from(card.querySelectorAll("[aria-label]"), (el) =>
            el.getAttribute("aria-label")),
        ].join(" ").replace(/\s+/g, " ");

        const priceMatch = text.match(/current price\s*:?\s*(?:now\s*)?\$\s*([\d,]+\.\d{2})/i);
        if (!priceMatch) continue;

        readablePrices += 1;
        if (/\b(?:from|starting at|about|approximately)\s*\$/i.test(text)) break;

        const title = card.querySelector(
          '[data-automation-id="product-title"], [data-testid="product-title"]',
        );
        const imageName = link.querySelector("img")?.alt?.trim() ?? "";
        const name = title?.textContent?.trim() || imageName || link.textContent.trim();
        const nameWords = new Set(words(name));
        const size = packageSize(name, search) ?? packageSize(imageName, search);
        const priceCad = Number(priceMatch[1].replaceAll(",", ""));

        if (
          !size ||
          !searchWords.every((word) => nameWords.has(word)) ||
          exclusions[search]?.test(name) ||
          !Number.isFinite(priceCad) ||
          priceCad <= 0
        ) continue;

        const brand = card.querySelector(
          '[data-automation-id="product-brand"], [data-testid="product-brand"]',
        )?.textContent?.trim() || null;

        products.set(path, {
          name,
          brand,
          ...size,
          priceCad,
          unitPriceCad: Number((priceCad / size.packageQuantity).toFixed(8)),
          unitPriceBasis: size.packageUnit === "count" ? "per item" : `per ${size.packageUnit}`,
        });
        break;
      }
    }

    if (!readablePrices) {
      const pageText = page.body?.textContent ?? "";
      if (/\b(?:no results found|no products found|0 results)\b/i.test(pageText)) {
        return [];
      }
      throw new Error("Search page had no readable product prices");
    }

    const sizes = new Set();
    return [...products.values()]
      .sort((a, b) => a.priceCad - b.priceCad)
      .filter((product) => {
        const key = `${product.packageQuantity}:${product.packageUnit}`;
        if (sizes.has(key)) return false;
        sizes.add(key);
        return true;
      })
      .slice(0, 2);
  }

  const pending = [...new Set(ingredients.map(({ search }) => search))]
    .filter((search) => !Object.hasOwn(saved, search));

  const openSearch = new URL(location.href).searchParams.get("q")?.trim().toLowerCase();
  const openIndex = pending.indexOf(openSearch);
  if (location.pathname === "/en/search" && openIndex > 0) {
    pending.unshift(...pending.splice(openIndex, 1));
  }

  const alreadyProcessed = ingredients.filter(({ search }) =>
    Object.hasOwn(saved, search),
  ).length;

  const batch = pending;
  console.log(`Resuming at ${alreadyProcessed}/${ingredients.length}. This batch has ${batch.length} searches.`);

  let consecutiveFailures = 0;

  for (const [index, search] of batch.entries()) {
    try {
      const page = await searchPage(search);
      const products = readProducts(page, search);
      saved[search] = products;
      localStorage.setItem(storageKey, JSON.stringify(saved));
      consecutiveFailures = 0;
      console.log(`${index + 1}/${batch.length} ${search}: ${products.length} packages saved`);
    } catch (error) {
      failures.push({ search, reason: error.message });
      consecutiveFailures += 1;
      console.warn(`${search}: ${error.message}`);
      if (error.stopBatch || consecutiveFailures >= 3) break;
    }

    if (index + 1 < batch.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const pendingIngredients = ingredients
    .filter(({ search }) => !Object.hasOwn(saved, search))
    .map(({ ingredient }) => ingredient);

  const noMatchIngredients = ingredients
    .filter(({ search }) => search !== "boiling water" && saved[search]?.length === 0)
    .map(({ ingredient }) => ingredient);

  const products = ingredients.flatMap(({ ingredient, category, search }) =>
    (saved[search] ?? []).map((product) => ({
      ingredient,
      category,
      name: product.name,
      brand: product.brand ?? null,
      packageQuantity: product.packageQuantity,
      packageUnit: product.packageUnit,
      priceCad: product.priceCad,
      unitPriceCad: product.unitPriceCad,
      unitPriceBasis: product.unitPriceBasis,
    })),
  );

  const snapshot = {
    retailer: "Walmart Canada",
    currency: "CAD",
    priceType: "Online snapshot; pickup branch unverified",
    ingredientsRequested: ingredients.length,
    ingredientsProcessed: ingredients.length - pendingIngredients.length,
    pendingIngredients,
    noMatchIngredients,
    products,
  };

  window.groceryFinderWalmartJson = JSON.stringify(snapshot, null, 2);

  const file = new Blob([window.groceryFinderWalmartJson], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = "walmart-364-fresh-prices.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

  console.log(`Exported ${products.length} product rows. ${snapshot.ingredientsProcessed}/${ingredients.length} ingredients processed.`);
  if (failures.length) console.table(failures);
})().catch(console.error);