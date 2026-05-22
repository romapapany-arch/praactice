urrentDisplayedCountries = [];  // текущий массив для отображения
    let fav    // ================== APP STATE ==================
    let allCountries = [];
    let corites = [];                  // избранные страны (объекты)
    let isDetailVisible = false;
    let showingFavorites = false;       // просмотр избранного
    let currentSort = "default";        // порядок сортировки: "default", "asc", "desc"

    // ================== DOM ELEMENTS ==================
    const countriesGrid = document.getElementById("countriesGrid");
    const detailView = document.getElementById("detailView");
    const controls = document.getElementById("controls");
    const statusMessage = document.getElementById("statusMessage");
    const searchInput = document.getElementById("searchInput");
    const regionSelect = document.getElementById("regionSelect");
    const sortSelect = document.getElementById("sortSelect");
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const favoritesToggle = document.getElementById("favoritesToggle");
    const favCountSpan = document.getElementById("favCount");

    // ================== LOCAL STORAGE HELPERS ==================
    function loadFavoritesFromStorage() {
      try {
        const stored = localStorage.getItem("favoriteCountries");
        favorites = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error("Failed to load favorites", e);
        favorites = [];
      }
      updateFavCount();
    }

    function saveFavoritesToStorage() {
      localStorage.setItem("favoriteCountries", JSON.stringify(favorites));
      updateFavCount();
    }

    function updateFavCount() {
      favCountSpan.textContent = favorites.length;
    }

    function isFavorite(countryAlpha) {
      return favorites.some(c => c.cca3 === countryAlpha);
    }

    function toggleFavorite(country) {
      const index = favorites.findIndex(c => c.cca3 === country.cca3);
      if (index >= 0) {
        favorites.splice(index, 1);
      } else {
        favorites.push(country);
      }
      saveFavoritesToStorage();
      // Перерисовать текущий вид с учетом изменений сердечек
      if (showingFavorites) {
        showFavoritesView();
      } else {
        displayCountries(currentDisplayedCountries);
      }
    }

    // ================== THEME ==================
    function setTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
      themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
      themeToggle.innerHTML = `${themeIcon.outerHTML} ${theme === "dark" ? "Light Mode" : "Dark Mode"}`;
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute("data-theme");
      setTheme(current === "dark" ? "light" : "dark");
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
    themeToggle.addEventListener("click", toggleTheme);

    // ================== SORTING ==================
    function sortCountries(countries, order) {
      const sorted = [...countries];
      if (order === "asc") {
        sorted.sort((a, b) => a.population - b.population);
      } else if (order === "desc") {
        sorted.sort((a, b) => b.population - a.population);
      }
      return sorted;
    }

    sortSelect.addEventListener("change", (e) => {
      if (isDetailVisible || showingFavorites) return;
      currentSort = e.target.value;
      if (currentDisplayedCountries.length > 0) {
        currentDisplayedCountries = sortCountries(currentDisplayedCountries, currentSort);
        displayCountries(currentDisplayedCountries);
      }
    });

    // ================== FETCH COUNTRIES ==================
    async function fetchAllCountries() {
      try {
        showLoading("Loading countries...");
        const res = await fetch("https://restcountries.com/v3.1/all");
        if (!res.ok) throw new Error("Failed to fetch countries");
        allCountries = await res.json();
        currentDisplayedCountries = [...allCountries];
        if (currentSort !== "default") {
          currentDisplayedCountries = sortCountries(currentDisplayedCountries, currentSort);
        }
        displayCountries(currentDisplayedCountries);
        hideStatus();
      } catch (err) {
        showError("Failed to load countries. Please try again later.");
        console.error(err);
      }
    }

    async function fetchCountriesByRegion(region) {
      if (!region) return fetchAllCountries();
      try {
        showLoading("Loading countries...");
        const res = await fetch(`https://restcountries.com/v3.1/region/${region}`);
        if (!res.ok) throw new Error("Region fetch failed");
        const data = await res.json();
        currentDisplayedCountries = data;
        if (currentSort !== "default") {
          currentDisplayedCountries = sortCountries(currentDisplayedCountries, currentSort);
        }
        displayCountries(currentDisplayedCountries);
        hideStatus();
      } catch (err) {
        showError("Could not load countries for this region.");
        console.error(err);
      }
    }

    async function searchCountries(query) {
      if (!query.trim()) {
        // Пустой запрос – возвращаем все (или с учетом региона)
        if (regionSelect.value) {
          fetchCountriesByRegion(regionSelect.value);
        } else {
          currentDisplayedCountries = [...allCountries];
          if (currentSort !== "default") {
            currentDisplayedCountries = sortCountries(currentDisplayedCountries, currentSort);
          }
          displayCountries(currentDisplayedCountries);
        }
        return;
      }
      try {
        showLoading("Searching...");
        const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("No results");
        const data = await res.json();
        currentDisplayedCountries = data;
        if (currentSort !== "default") {
          currentDisplayedCountries = sortCountries(currentDisplayedCountries, currentSort);
        }
        displayCountries(currentDisplayedCountries);
        hideStatus();
      } catch (err) {
        currentDisplayedCountries = [];
        displayCountries([]);
        showError("No countries found. Try a different name.");
      }
    }

    // ================== DISPLAY COUNTRIES (GRID) ==================
    function displayCountries(countries) {
      countriesGrid.innerHTML = "";
      if (countries.length === 0) {
        countriesGrid.innerHTML = '<p class="loading" style="grid-column:1/-1">No countries to display.</p>';
        return;
      }
      countries.forEach((country) => {
        const card = document.createElement("div");
        card.className = "country-card";
        const favActive = isFavorite(country.cca3) ? "active" : "";
        card.innerHTML = `
          <img src="${country.flags.svg}" alt="${country.name.common} flag" />
          <button class="fav-btn ${favActive}" data-alpha="${country.cca3}">
            ${favActive ? "❤️" : "🤍"}
          </button>
          <div class="card-info">
            <h2>${country.name.common}</h2>
            <p><span>Population:</span> ${country.population.toLocaleString()}</p>
            <p><span>Region:</span> ${country.region}</p>
            <p><span>Capital:</span> ${country.capital ? country.capital[0] : "N/A"}</p>
          </div>
        `;
        card.addEventListener("click", (e) => {
          if (e.target.classList.contains("fav-btn")) return;
          showDetail(country);
        });
        const favBtn = card.querySelector(".fav-btn");
        favBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleFavorite(country);
        });
        countriesGrid.appendChild(card);
      });
    }

    // ================== FAVORITES VIEW ==================
    function showFavoritesView() {
      showingFavorites = true;
      favoritesToggle.innerHTML = '← All Countries';
      controls.style.display = "none";   // скрываем поиск/фильтры/сортировку в избранном
      currentDisplayedCountries = favorites;
      // В избранном сортировка не применяется, но можно добавить при желании
      displayCountries(favorites);
      hideStatus();
    }

    function showAllCountriesView() {
      showingFavorites = false;
      favoritesToggle.innerHTML = `❤️ <span id="favCount">${favorites.length}</span> Favorites`;
      controls.style.display = "flex";
      // Восстанавливаем состояние с текущими фильтрами и сортировкой
      if (regionSelect.value) {
        fetchCountriesByRegion(regionSelect.value);
      } else if (searchInput.value.trim()) {
        searchCountries(searchInput.value.trim());
      } else {
        currentDisplayedCountries = [...allCountries];
        if (currentSort !== "default") {
          currentDisplayedCountries = sortCountries(currentDisplayedCountries, currentSort);
        }
        displayCountries(currentDisplayedCountries);
      }
    }

    favoritesToggle.addEventListener("click", () => {
      if (isDetailVisible) return;
      if (showingFavorites) {
        showAllCountriesView();
      } else {
        showFavoritesView();
      }
    });

    // ================== DETAIL VIEW ==================
    function showDetail(country) {
      countriesGrid.style.display = "none";
      controls.style.display = "none";
      detailView.style.display = "block";
      isDetailVisible = true;

      const nativeName = country.name.nativeName
        ? Object.values(country.name.nativeName)[0].common
        : country.name.common;
      const currencies = country.currencies
        ? Object.values(country.currencies).map(c => c.name).join(", ")
        : "N/A";
      const languages = country.languages
        ? Object.values(country.languages).join(", ")
        : "N/A";
      const topLevelDomain = country.tld ? country.tld.join(", ") : "N/A";

      let borderButtons = "";
      if (country.borders && country.borders.length > 0) {
        borderButtons = country.borders
          .map(code => `<button class="border-btn" data-alpha="${code}">${code}</button>`)
          .join("");
      } else {
        borderButtons = "<span>No border countries</span>";
      }

      detailView.innerHTML = `
        <button class="back-btn" id="backBtn">← Back</button>
        <div class="detail-content">
          <img class="detail-flag" src="${country.flags.svg}" alt="${country.name.common} flag" />
          <div class="detail-text">
            <h2>${country.name.common}</h2>
            <div class="detail-columns">
              <div class="detail-column">
                <p><span>Native Name:</span> ${nativeName}</p>
                <p><span>Population:</span> ${country.population.toLocaleString()}</p>
                <p><span>Region:</span> ${country.region}</p>
                <p><span>Sub Region:</span> ${country.subregion || "N/A"}</p>
                <p><span>Capital:</span> ${country.capital ? country.capital[0] : "N/A"}</p>
              </div>
              <div class="detail-column">
                <p><span>Top Level Domain:</span> ${topLevelDomain}</p>
                <p><span>Currencies:</span> ${currencies}</p>
                <p><span>Languages:</span> ${languages}</p>
              </div>
            </div>
            <div class="border-tags">
              <span>Border Countries:</span> ${borderButtons}
            </div>
          </div>
        </div>
      `;

      document.getElementById("backBtn").addEventListener("click", goBackToMain);
      document.querySelectorAll(".border-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const alpha = e.target.dataset.alpha;
          fetchAndShowCountryByCode(alpha);
        });
      });

      window.scrollTo(0, 0);
    }

    async function fetchAndShowCountryByCode(alphaCode) {
      try {
        showLoading("Loading country details...");
        const res = await fetch(`https://restcountries.com/v3.1/alpha/${alphaCode}`);
        if (!res.ok) throw new Error("Country not found");
        const data = await res.json();
        showDetail(data[0]);
        hideStatus();
      } catch (err) {
        showError("Could not load border country.");
        console.error(err);
      }
    }

    function goBackToMain() {
      detailView.style.display = "none";
      detailView.innerHTML = "";
      countriesGrid.style.display = "grid";
      isDetailVisible = false;
      if (!showingFavorites) {
        controls.style.display = "flex";
        displayCountries(currentDisplayedCountries); // currentDisplayedCountries уже отсортирован
      } else {
        showFavoritesView(); // вернуться в режим избранного, если были в нём
      }
      hideStatus();
      window.scrollTo(0, 0);
    }

    // ================== STATUS MESSAGES ==================
    function showLoading(message) {
      statusMessage.style.display = "block";
      statusMessage.textContent = message;
      statusMessage.className = "loading";
    }

    function showError(message) {
      statusMessage.style.display = "block";
      statusMessage.textContent = message;
      statusMessage.className = "error-msg";
    }

    function hideStatus() {
      statusMessage.style.display = "none";
    }

    // ================== EVENT LISTENERS (filters) ==================
    regionSelect.addEventListener("change", (e) => {
      if (isDetailVisible || showingFavorites) return;
      const region = e.target.value;
      if (region) {
        fetchCountriesByRegion(region);
      } else {
        fetchAllCountries();
      }
    });

    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      if (isDetailVisible || showingFavorites) return;
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        if (query) {
          searchCountries(query);
        } else {
          // очистка поиска – показать всё (с учетом региона и сортировки)
          if (regionSelect.value) {
            fetchCountriesByRegion(regionSelect.value);
          } else {
            currentDisplayedCountries = [...allCountries];
            if (currentSort !== "default") {
              currentDisplayedCountries = sortCountries(currentDisplayedCountries, currentSort);
            }
            displayCountries(currentDisplayedCountries);
          }
        }
      }, 300);
    });

    // ================== INITIAL LOAD ==================
    loadFavoritesFromStorage();
    fetchAllCountries();