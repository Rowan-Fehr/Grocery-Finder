(async () => {
  if (!["www.walmart.ca", "walmart.ca"].includes(location.hostname)) {
    throw new Error("Open Walmart Canada and run this in that tab's console.");
  }

  const groups = {
    baking: "all purpose flour|baking powder|brown sugar|caster sugar|corn flour|cornstarch|flour|golden caster sugar|muscovado sugar|plain flour|puff pastry|shortcrust pastry|shortening|sugar|yeast",
    "herbs and spices": "all-purpose seasoning|allspice|bay leaf|bay leaves|black pepper|cajun|caraway seed|cardamom|cayenne pepper|chili powder|chilli flakes|chilli powder|chinese five spice powder|cinnamon|cinnamon stick|clove|cloves|coriander|cumin|cumin seeds|curry powder|dried mint|dried oregano|fajita seasoning|fennel seeds|garam masala|garlic powder|ground coriander|ground cumin|ground ginger|ground nutmeg|harissa spice|italian seasoning|kosher salt|marjoram|mustard powder|mustard seeds|nutmeg|oregano|paprika|pepper|red chilli flakes|red chilli powder|red pepper flakes|salt|sea salt|sesame seed|smoked paprika|star anise|summer savoury|sweet smoked paprika|turmeric",
    "condiments and oils": "apple cider vinegar|balsamic vinegar|barbeque sauce|beef gravy|canola oil|capers|chilli sauce|chimichurri sauce|clear honey|dijon mustard|enchilada sauce|extra virgin olive oil|fish sauce|garlic sauce|ground nut oil|honey|hotsauce|lemon juice|lime juice|mayonnaise|minced garlic|mirin|mustard|oil|olive oil|passata|peanut butter|red curry paste|red wine vinegar|rice vinegar|salsa|sesame seed oil|sherry vinegar|soy sauce|sunflower oil|sweet chilli sauce|tahini|tamarind paste|thai fish sauce|thai green curry paste|thai red curry paste|tomato ketchup|tomato puree|tomato sauce|vegetable oil|white vinegar|white wine vinegar|worcestershire sauce",
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
  const riceExclusions = /fried|meal|side dish|ready to heat|bistro express|cake|cereal|cups|pouch|noodle|flour|cracker/i;
  const exclusions = {
    butter: butterExclusions,
    "unsalted butter": butterExclusions,
    rice: riceExclusions,
    "basmati rice": riceExclusions,
    "brown rice": riceExclusions,
    "jasmine rice": riceExclusions,
    "sushi rice": /meal|ready to heat|roll|pouch/i,
    eggs: /quail|duck|boiled|peeled|chocolate|candy|liquid|whites|yolks/i,
    beef: /pork|stock|broth|gravy|jerky|meatball|burger|canned|frozen meal/i,
    chicken: /stock|broth|gravy|nugget|strips|soup|meal/i,
    "ground beef": /pork|burger|patties|seasoning|meatball|meal/i,
  };

  const ingredients = Object.entries(groups).flatMap(([category, list]) =>
    list.split("|").map((ingredient) => ({
      ingredient,
      category,
      search: aliases[ingredient] ?? ingredient,
    })),
  );

  const storageKey = "grocery-finder:walmart-ca:ingredients-366:v1";
  const previousKey = "grocery-finder:walmart-ca:ingredients-366";
  const saved = JSON.parse(
    localStorage.getItem(storageKey) ??
    localStorage.getItem(previousKey) ??
    '{"completed":{}}',
  );
  saved.completed["boiling water"] = [];

  const words = (text) =>
    (text.normalize("NFKD").toLowerCase().match(/[a-z0-9]+/g) ?? [])
      .map((word) => word.replace(/s$/, ""));

  function readPackage(name) {
    const metric = name.match(/\b(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i);
    const imperial = name.match(/\b(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(lb|oz)\b/i);
    const count = name.match(/\b(\d+)\s*(?:count|ct|ea|eggs?|pieces?|pk|pack)\b/i);
    const packOf = name.match(/\bpack of\s+(\d+)\b/i);
    const size = metric ?? imperial;

    if (!size) {
      const quantity = Number(count?.[1] ?? packOf?.[1]);
      return quantity > 0
        ? { packageQuantity: quantity, packageUnit: "count" }
        : null;
    }

    const unit = size[3].toLowerCase();
    const factor = { kg: 1000, l: 1000, lb: 453.59237, oz: 28.349523125 }[unit] ?? 1;
    const quantity = Number(size[2]) * Number(size[1] ?? packOf?.[1] ?? 1) * factor;
    if (!Number.isFinite(quantity) || quantity <= 0) return null;

    return {
      packageQuantity: Math.round(quantity * 100) / 100,
      packageUnit: unit === "ml" || unit === "l" ? "mL" : "g",
    };
  }

  async function searchProducts(search) {
    const url = new URL("/en/search", location.origin);
    url.searchParams.set("q", search);

    const openPage = new URL(location.href);
    const openSearch = openPage.searchParams.get("q")?.trim().toLowerCase();
    let page = document;

    if (openPage.pathname !== "/en/search" || openSearch !== search.toLowerCase()) {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Walmart returned HTTP ${response.status}`);
      page = new DOMParser().parseFromString(await response.text(), "text/html");
    }

    const linkSelector = 'a[href*="/ip/"]';
    const links = [...page.querySelectorAll(linkSelector)];

    if (
      (!links.length && page.querySelector("#px-captcha")) ||
      /robot or human|verify (?:that )?you are human|access denied/i.test(page.title)
    ) {
      throw new Error("Walmart returned a verification page");
    }

    const products = new Map();
    const searchWords = words(search);
    let readableCards = 0;

    for (const link of links) {
      const productUrl = new URL(link.getAttribute("href"), location.origin);
      if (
        productUrl.origin !== location.origin ||
        !/^\/(?:en\/|fr\/)?ip\//.test(productUrl.pathname)
      ) continue;

      const id = productUrl.pathname.split("/").filter(Boolean).at(-1);
      if (products.has(id)) continue;

      const hasOtherProduct = (element) =>
        [...element.querySelectorAll(linkSelector)].some((other) =>
          new URL(other.getAttribute("href"), location.origin).pathname !== productUrl.pathname,
        );

      let card = link.closest("[data-item-id], [data-testid='product-tile'], [data-testid='item-stack']");
      if (!card || hasOtherProduct(card)) {
        card = link;
        while (card.parentElement && card.parentElement !== page.body) {
          const parent = card.parentElement;
          if (hasOtherProduct(parent)) break;
          card = parent;
          if (/current price/i.test(card.textContent)) break;
        }
      }

      const text = [
        card.textContent,
        ...Array.from(card.querySelectorAll("[aria-label]"), (node) =>
          node.getAttribute("aria-label"),
        ),
      ].join(" ").replace(/\s+/g, " ");

      
      if (!price) continue;
      readableCards += 1;
      if (/\b(?:from|starting at|about|approximately|est\.)\s*\$/i.test(text)) continue;

      const title = card.querySelector('[data-automation-id="product-title"], [data-testid="product-title"]');
      const name = (
        title?.textContent ||
        link.getAttribute("aria-label") ||
        link.querySelector("img")?.getAttribute("alt") ||
        link.textContent
      ).trim();

      const size = readPackage(name);
      const priceCad = Number(price[1].replaceAll(",", ""));
      const nameWords = new Set(words(name));

      if (
        !size || !Number.isFinite(priceCad) || priceCad <= 0 ||
        exclusions[search]?.test(name) ||
        !searchWords.every((word) => nameWords.has(word))
      ) continue;

      const brand = card.querySelector(
        '[data-automation-id="product-brand"], [data-testid="product-brand"]',
      )?.textContent?.trim() || null;

      products.set(id, {
        name,
        brand,
        ...size,
        priceCad,
        unitPriceCad: Number((priceCad / size.packageQuantity).toFixed(8)),
        unitPriceBasis: size.packageUnit === "count" ? "per item" : `per ${size.packageUnit}`,
      });
    }

    if (!readableCards) {
      if (/\b(?:no results found|no products found|0 results)\b/i.test(page.body?.textContent ?? "")) {
        return [];
      }
      throw new Error("Walmart returned no readable product prices");
    }

    const sorted = [...products.values()].sort((a, b) => a.priceCad - b.priceCad);
    const sizes = new Set();
    const selected = [];

    for (const product of sorted) {
      const size = `${product.packageQuantity}:${product.packageUnit}`;
      if (sizes.has(size)) continue;
      sizes.add(size);
      selected.push(product);
      if (selected.length === 2) break;
    }

    return selected;
  }

  const pending = [...new Set(ingredients.map(({ search }) => search))]
    .filter((search) => !Object.hasOwn(saved.completed, search));

  const input = prompt(
    `${pending.length} searches remaining. Enter 1 to test or 0 to export saved results.`,
    pending.length ? "1" : "0",
  );
  if (input === null) return;
  const limit = Number(input);
  if (!/^\d+$/.test(input.trim()) || !Number.isSafeInteger(limit)) {
    throw new Error("Enter a whole number.");
  }

  for (const search of pending.slice(0, limit)) {
    try {
      const products = await searchProducts(search);
      saved.completed[search] = products;
      localStorage.setItem(storageKey, JSON.stringify(saved));
      console.log(`${search}: ${products.length} products kept`);
    } catch (error) {
      console.warn(`Stopped at ${search}: ${error.message}. Saved results will still export.`);
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  const snapshot = {
    retailer: "Walmart Canada",
    currency: "CAD",
    priceType: "Online snapshot; pickup branch unverified",
    ingredientsRequested: ingredients.length,
    ingredientsProcessed: ingredients.filter(({ search }) =>
      Object.hasOwn(saved.completed, search),
    ).length,
    products: ingredients.flatMap(({ ingredient, category, search }) =>
      (saved.completed[search] ?? []).map((product) => ({
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
  window.groceryFinderWalmartJson = json;

  const downloadUrl = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "walmart-366-prices.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

  console.log(
    `Exported ${snapshot.products.length} products from ${snapshot.ingredientsProcessed} of ${ingredients.length} ingredients.`,
  );
})().catch((error) => console.error(error.message));