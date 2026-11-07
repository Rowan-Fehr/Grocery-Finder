const form = document.querySelector("#search-form");
const input = document.querySelector("#postal-code");
const error = document.querySelector("#error");
const results = document.querySelector("#results");
const mapLink = document.querySelector("#map-link");
const displayPostalCode = document.querySelector("#display-postal-code");
const recipeHeading = document.querySelector("#recipe-heading");

const postalCodePattern =
  /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/;

input.addEventListener("input", () => {
  error.textContent = "";
  input.removeAttribute("aria-invalid");
  results.hidden = true;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const code = input.value.toUpperCase().replace(/\s/g, "");

  if (!postalCodePattern.test(code)) {
    error.textContent = "Enter a Canadian postal code, such as V5K 0A1.";
    input.setAttribute("aria-invalid", "true");
    results.hidden = true;
    input.focus();
    return;
  }

  const formattedCode = `${code.slice(0, 3)} ${code.slice(3)}`;
  const query = encodeURIComponent(`${formattedCode}, Canada`);

  input.value = formattedCode;
  displayPostalCode.textContent = formattedCode;
  mapLink.href = `https://www.google.com/maps/search/?api=1&query=${query}`;

  // Connect the recipe database here when it's ready.
  results.hidden = false;
  recipeHeading.focus();
});