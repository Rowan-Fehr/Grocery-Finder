(async () => {
  const groups = {
    baking: "all purpose flour|baking powder|brown sugar|caster sugar|corn flour|cornstarch|flour|golden caster sugar|muscovado sugar|plain flour|puff pastry|shortcrust pastry|shortening|sugar|yeast",
    "herbs and spices": "all-purpose seasoning|allspice|bay leaf|bay leaves|black pepper|cajun|caraway seed|cardamom|cayenne pepper|chili powder|chilli flakes|chilli powder|chinese five spice powder|cinnamon|cinnamon stick|clove|cloves|coriander|cumin|cumin seeds|curry powder|dried mint|dried oregano|fajita seasoning|fennel seeds|garam masala|garlic powder|ground coriander|ground cumin|ground ginger|ground nutmeg|harissa spice|italian seasoning|kosher salt|marjoram|mustard powder|mustard seeds|nutmeg|oregano|paprika|pepper|red chilli flakes|red chilli powder|red pepper flakes|salt|sea salt|sesame seed|smoked paprika|star anise|summer savoury|sweet smoked paprika|turmeric",
    "condiments and oils": "apple cider vinegar|balsamic vinegar|barbeque sauce|beef gravy|canola oil|capers|chilli sauce|chimichurri sauce|clear honey|dijon mustard|enchilada sauce|extra virgin olive oil|fish sauce|garlic sauce|ground nut oil|honey|hotsauce|lemon juice|lime juice|mayonnaise|minced garlic|mirin|mustard|oil|olive oil|passata|peanut butter|rapeseed oil|red curry paste|red wine vinegar|rice vinegar|salsa|sesame seed oil|sherry vinegar|soy sauce|sunflower oil|sweet chilli sauce|tahini|tamarind paste|thai fish sauce|thai green curry paste|thai red curry paste|tomato ketchup|tomato puree|tomato sauce|vegetable oil|white vinegar|white wine vinegar|worcestershire sauce",
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

  const ingredients = Object.entries(groups).flatMap(([category, list]) =>
    list.split("|").map((ingredient) => ({ ingredient, category })),
  );

  if (!["realcanadiansuperstore.ca", "www.realcanadiansuperstore.ca"].includes(location.hostname)) {
    throw new Error("Open the Real Canadian Superstore website first.");
  }

  const storageKey = "grocery-finder:superstore:ingredients-100:v1";
  const saved = JSON.parse(localStorage.getItem(storageKey) || "null") ?? {
    completed: {},
  };

  const aliases = {
    aubergine: "eggplant",
    courgettes: "zucchini",
    challots: "shallots",
    carrots: "carrot",
    "chicken breasts": "chicken breast",
    "basil leaves": "basil",
    "bay leaves": "bay leaf",
    "chilli powder": "chili powder",
    cloves: "clove",
    "barbeque sauce": "barbecue sauce",
    "clear honey": "honey",
    egg: "eggs",
    "egg wash": "eggs",
    "egg plants": "eggplant",
    "fresh basil": "basil",
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

  const butterExclusions = /plant|margarine|blend|clarified|alternative|spread|canola|garlic|herb|sauce|chicken/i;
  const riceExclusions = /fried|meal|side dish|ready to heat|bistro express|cakes|cereal|cups|pouch|noodle|flour|cracker/i;

  const exclusions = {
    butter: butterExclusions,
    "unsalted butter": butterExclusions,
    rice: riceExclusions,
    "basmati rice": riceExclusions,
    "brown rice": riceExclusions,
    "jasmine rice": riceExclusions,
    "sushi rice": /meal|ready to heat|roll|pouch/i,
    eggs: /quail|duck|boiled|peeled|chocolate|candy|liquid|whites|yolks/i,
    beef: /pork|stock|broth|gravy|jerky|meatballs|burgers|canned|frozen meal/i,
    chicken: /stock|broth|gravy|nuggets|strips|soup|meal/i,
    "ground beef": /pork|burgers?|patties|seasoning|meatballs|meal/i,
  };

  const searchFor = (ingredient) => aliases[ingredient] ?? ingredient;
  const words = (text) =>
    (text.normalize("NFKD").toLowerCase().match(/[a-z0-9]+/g) ?? [])
      .map((word) => word.replace(/s$/, ""));

  function readSize(value) {
    const match = String(value ?? "").match(
      /^\s*(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(kg|g|ml|l|ea|count)\b/i,
    );
    if (!match) return null;

    const [, packs, amount, rawUnit] = match;
    const unit = rawUnit.toLowerCase();
    const multiplier = unit === "kg" || unit === "l" ? 1000 : 1;
    const packageQuantity = Number(packs ?? 1) * Number(amount) * multiplier;
    if (!Number.isFinite(packageQuantity) || packageQuantity <= 0) return null;

    const packageUnit = ["ea", "count"].includes(unit)
      ? "count"
      : ["ml", "l"].includes(unit) ? "mL" : "g";

    return { packageQuantity, packageUnit };
  }

  // Store-specific reader. Reuse the ingredient catalog and export fields for other stores.
  async function readSuperstoreTiles(search) {
    const url = new URL("/en/search", location.origin);
    url.searchParams.set("search-bar", search);
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const page = new DOMParser().parseFromString(await response.text(), "text/html");
    const embedded = page.getElementById("__NEXT_DATA__");
    if (!embedded) throw new Error("Embedded product data missing");

    const data = JSON.parse(embedded.textContent);
    const components = data.props?.pageProps?.initialSearchData?.layout?.sections
      ?.mainContentCollection?.components ?? [];
    const grids = components.map(({ data }) => data)
      .filter((grid) => Array.isArray(grid?.productTiles));

    if (!grids.length) {
      const mainText = page.querySelector("main")?.textContent ?? "";
      if (/\b(?:no (?:products|results)(?: found| match)|0 results)\b/i.test(mainText)) return [];
      throw new Error("Unexpected search page");
    }

    return grids.flatMap((grid) => grid.productTiles);
  }

  async function searchProducts(search) {
    const products = new Map();
    const searchWords = words(search);

    for (const tile of await readSuperstoreTiles(search)) {
      const id = tile.productId;
      const name = tile.title?.trim();
      const size = readSize(tile.packageSizing);
      const priceCad = Number(tile.pricing?.price);

      if (
        !id || !name || !size || !Number.isFinite(priceCad) || priceCad <= 0 ||
        tile.pricingUnits?.weighted || /_KG$/i.test(id) ||
        !tile.link?.startsWith("/") || exclusions[search]?.test(name)
      ) continue;

      if (new URL(tile.link, location.origin).origin !== location.origin) continue;

      const nameWords = new Set(words(name));
      if (!searchWords.every((word) => nameWords.has(word))) continue;
      if (products.has(id) && products.get(id).priceCad <= priceCad) continue;

      products.set(id, {
        name,
        brand: tile.brand?.trim() || null,
        ...size,
        priceCad,
        unitPriceCad: Number((priceCad / size.packageQuantity).toFixed(8)),
        unitPriceBasis: size.packageUnit === "count" ? "per item" : `per ${size.packageUnit}`,
      });
    }

    const sorted = [...products.values()].sort(
      (a, b) => a.priceCad - b.priceCad || a.name.localeCompare(b.name),
    );
    const selected = [];
    const sizes = new Set();

    for (const product of sorted) {
      const size = `${product.packageQuantity}:${product.packageUnit}`;
      if (sizes.has(size)) continue;
      sizes.add(size);
      selected.push(product);
      if (selected.length === 2) break;
    }

    return selected;
  }

  saved.completed["boiling water"] = [];

  const pending = [...new Set(ingredients.map(({ ingredient }) => searchFor(ingredient)))]
    .filter((search) => search !== "olive oil" && !Object.hasOwn(saved.completed, search));

  const input = prompt(
    `${pending.length} searches remaining. How many this run? Enter 0 to export saved results.`,
    String(Math.min(25, pending.length)),
  );
  if (input === null) return;
  if (!/^\d+$/.test(input.trim())) throw new Error("Enter a whole number.");

  for (const search of pending.slice(0, Number(input))) {
    try {
      saved.completed[search] = await searchProducts(search);
      localStorage.setItem(storageKey, JSON.stringify(saved));
      console.log(`${search}: ${saved.completed[search].length} products kept`);
    } catch (error) {
      console.warn(`Stopped at ${search}: ${error.message}. Run again to resume.`);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  const snapshot = {
    retailer: "Real Canadian Superstore",
    currency: "CAD",
    priceType: "Online snapshot; pickup branch unverified",
    ingredientsRequested: ingredients.length,
    ingredientsProcessed: ingredients.filter(({ ingredient }) =>
      Object.hasOwn(saved.completed, searchFor(ingredient)),
    ).length,
    products: ingredients.flatMap(({ ingredient, category }) =>
      (saved.completed[searchFor(ingredient)] ?? []).map((product) => ({
        ingredient,
        category,
        name: product.name,
        brand: product.brand,
        packageQuantity: product.packageQuantity,
        packageUnit: product.packageUnit,
        priceCad: product.priceCad,
        unitPriceCad: product.unitPriceCad,
        unitPriceBasis: product.unitPriceBasis,
      })),
    ),
  };

  const json = JSON.stringify(snapshot, null, 2);
  window.groceryFinderSuperstoreJson = json;

  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "superstore-366-prices.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  console.log(
    `Exported ${snapshot.products.length} products from ${snapshot.ingredientsProcessed} of ${ingredients.length} ingredients.`,
  );
})().catch((error) => console.error(error.message));