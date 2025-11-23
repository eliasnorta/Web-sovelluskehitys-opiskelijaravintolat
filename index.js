// stores all restaurants fetched from API
let allRestaurants = [];

// set default view to Helsinki
var map = L.map("map").setView([60.1699, 24.9384], 13);
// Reset sidebar when any marker popup is closed
let isUpdatingMarkers = false; // Prevent infinite loop

map.on("popupclose", function () {
  if (!isUpdatingMarkers) {
    window.unselectRestaurant();
  }
});

let selectedRestaurant = null;
let filterCity = "all";
let filterProvider = "all";
let sortBy = "location_asc";
let mapMarkers = [];
let userLocation = { lat: 60.1699, lng: 24.9384 }; // Default to Helsinki center

// open filter dropdown
const filterButton = document.querySelector(".filter_button");

filterButton.addEventListener("click", () => {
  // Close sort dropdown if open
  sortDropdown.classList.remove("show");
  document.getElementById("filter_dropdown").classList.toggle("show");
});

const filterDropdown = document.getElementById("filter_dropdown");

// open sort dropdown
const sortButton = document.querySelector(".sort_button");

sortButton.addEventListener("click", () => {
  // Close filter dropdown if open
  filterDropdown.classList.remove("show");
  document.getElementById("sort_by_dropdown").classList.toggle("show");
});

const sortDropdown = document.getElementById("sort_by_dropdown");

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
  if (
    !event.target.matches(".filter_button") &&
    !filterDropdown.contains(event.target) &&
    !event.target.matches(".sort_button") &&
    !sortDropdown.contains(event.target)
  ) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
};

function handleOpenMenu(targetDiv) {
  targetDiv.classList.add("selected-restaurant");
  if (targetDiv && targetDiv.scrollIntoView) {
    targetDiv.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function handleCloseMenu(targetDiv) {
  targetDiv.classList.remove("selected-restaurant");
}
// API Configuration
const API_BASE_URL = "https://media2.edu.metropolia.fi/restaurant/api/v1";
const RESTAURANTS_ENDPOINT = `${API_BASE_URL}/restaurants`;
const MENU_LANGUAGE = "fi";

const pan_map = -100;

// pan map slighly to left by 10%
// const mapWidth = map.getSize().x;
map.panBy([pan_map, 0]);

const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const tiles = L.tileLayer(tileUrl, { attribution });
tiles.addTo(map);

// fetch restaurants data from api
async function fetchData(url, apiKey) {
  try {
    const response = await fetch(url, {
      headers: { "x-api-key": apiKey },
    });
    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// loop through restaurants and add marker onto map that corresponds to location
fetchData(RESTAURANTS_ENDPOINT)
  .then((restaurants) => {
    allRestaurants = restaurants;

    // Populate city filter dropdown with unique cities from API
    const uniqueCities = [
      ...new Set(restaurants.map((r) => r.city).filter((city) => city)),
    ];
    const citySelect = document.getElementById("city");
    // Clear existing options except "Kaikki"
    citySelect.innerHTML = '<option value="all">Kaikki</option>';
    // Add city options
    uniqueCities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });

    // Populate service provider filter dropdown with unique companies from API
    const uniqueCompanies = [
      ...new Set(
        restaurants.map((r) => r.company).filter((company) => company)
      ),
    ];
    const serviceProviderSelect = document.getElementById("serviceprovider");
    // Clear existing options except "Kaikki"
    serviceProviderSelect.innerHTML = '<option value="all">Kaikki</option>';
    // Add company options
    uniqueCompanies.forEach((company) => {
      const option = document.createElement("option");
      option.value = company;
      option.textContent = company;
      serviceProviderSelect.appendChild(option);
    });

    // Add event listeners for filter selects
    citySelect.addEventListener("change", (e) => {
      filterCity = e.target.value;
      filterRestaurants();
    });

    serviceProviderSelect.addEventListener("change", (e) => {
      filterProvider = e.target.value;
      filterRestaurants();
    });

    // Add event listeners for sort radio buttons
    const sortRadios = document.querySelectorAll('input[name="sort"]');
    sortRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          sortBy = e.target.value;
          renderRestaurants();
        }
      });
    });

    restaurants.forEach((restaurant) => {
      const restaurantName = restaurant.name;
      const restaurantAddress = restaurant.address;
      const restaurantLong = restaurant.location.coordinates[0];
      const restaurantLat = restaurant.location.coordinates[1];
      const popupHtml = `<h3>${restaurantName}</h3><p>${restaurantAddress}</p>`;
      const marker = L.marker([restaurantLat, restaurantLong])
        .addTo(map)
        .bindPopup(popupHtml);
      marker.restaurant = restaurant; // Store restaurant data with marker
      marker.on("click", () => {
        selectedRestaurant = restaurant;
        renderRestaurants();
      });
      mapMarkers.push(marker);
    });
    renderRestaurants();
  })
  .catch((err) => {
    profileModal.innerHTML = `<form method="dialog"><h2>Error</h2><p>${err.message}</p><button>Close</button></form>`;
    profileModal.showModal();
  });

// get user's location and display restaurants on map
navigator.geolocation.getCurrentPosition(function (pos) {
  const lat = pos.coords.latitude;
  const long = pos.coords.longitude;

  // Update user location for sorting
  userLocation = { lat: lat, lng: long };

  console.log(lat);
  console.log(long);

  const redIcon = L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  L.marker([lat, long], { icon: redIcon })
    .addTo(map)
    .bindPopup("Your location")
    .openPopup();
  map.setView([lat, long], 13);
  map.panBy([pan_map, 0]);

  // Re-render restaurants with updated user location for sorting
  renderRestaurants();
});

// Simple authentication check function
function isUserLoggedIn() {
  return localStorage.getItem("currentUser") !== null;
}

// Modal elements
const profileModal = document.querySelector("#profile_modal");
const loginModal = document.querySelector("#login_modal");
const registerModal = document.getElementById("register_modal");

const profileButton = document.querySelector("[data-open-profile]");
const profileCloseButtons = document.querySelectorAll("[data-close-modal]");

// Profile button click handler
profileButton.addEventListener("click", () => {
  if (isUserLoggedIn()) {
    // User is logged in, show profile modal
    profileModal.showModal();
  } else {
    // User is not logged in, show login modal
    loginModal.showModal();
  }
});

// Close modal buttons
profileCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    profileModal.close();
    loginModal.close();
    registerModal.close();
  });
});
// Add event listener for register modal button
const openRegisterModalBtn = document.getElementById("open_register_modal");
if (openRegisterModalBtn && registerModal) {
  openRegisterModalBtn.addEventListener("click", () => {
    loginModal.close();
    registerModal.showModal();
  });
}

// modal.showModal();
// loginModal.showModal();

// resize sidebar
const sidebar = document.getElementById("sidebar");
const handle = document.getElementById("sidebar-resize-handle");
let isResizing = false;

handle.addEventListener("mousedown", function (e) {
  isResizing = true;
  document.body.style.cursor = "ew-resize";
});

document.addEventListener("mousemove", function (e) {
  if (!isResizing) return;
  const newWidth = e.clientX - sidebar.getBoundingClientRect().left;
  sidebar.style.width = newWidth + "px";
});

document.addEventListener("mouseup", function () {
  isResizing = false;
  document.body.style.cursor = "";
});

async function getDailyMenuHtml(restaurantId) {
  try {
    const url = `${API_BASE_URL}/restaurants/daily/${restaurantId}/${MENU_LANGUAGE}`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(
        `Menu fetch failed: ${response.status} ${response.statusText}`
      );
    const data = await response.json();
    if (data.courses && data.courses.length > 0) {
      return `
        <h2 class="menu_title">Päivän menu:</h2>
        <ul class="menu_ul">${data.courses
          .map(
            (c) =>
              `<li class="menu_item">
                <div class="menu_item_title_row">
                  <div class="menu_item_title">
                    ${c.name}
                  </div>
                  <div class="menu_item_price">
                    ${c.price ? `<small>${c.price}</small>` : ""}
                  </div>
                </div>
                <div class="menu_indent">
                  <small class="menu_diets">${c.diets}</small>
                </div>
              </li>`
          )
          .join("")}</ul>
      `;
    }
    return "<p>No menu available for today.</p>";
  } catch (err) {
    return `<p>Error loading menu: ${err.message}</p>`;
  }
}

async function getWeeklyMenuHtml(restaurantId) {
  try {
    const url = `${API_BASE_URL}/restaurants/weekly/${restaurantId}/${MENU_LANGUAGE}`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(
        `Menu fetch failed: ${response.status} ${response.statusText}`
      );
    const data = await response.json();
    if (data.days && data.days.length > 0) {
      return `
      <h2 class="menu_title">Viikon menu:</h2>
      
      ${data.days
        .map(
          (day) => `
            <div class="weekly_menu_day">
              <h2>${day.date}</h2>
              <ul>
                ${day.courses
                  .map(
                    (c) => `
                      <li class="menu_item">
                        <div class="menu_item_title_row">
                          <div class="menu_item_title">
                            ${c.name}
                          </div>
                          <div class="menu_item_price">
                            ${c.price ? `<small>${c.price}</small>` : ""}
                          </div>
                        </div>
                        <div class="menu_indent">
                          <small class="menu_diets">${c.diets}</small>
                        </div>
                      </li>
                    `
                  )
                  .join("")}
              </ul>
            </div>
          `
        )
        .join("")}
    `;
    }
    return "<p>No weekly menu available.</p>";
  } catch (err) {
    return `<p>Error loading menu: ${err.message}</p>`;
  }
}

const container = document.querySelector(".sidebar_restaurants_list");

// Filter restaurants based on selected filters
function getFilteredRestaurants() {
  let filtered = allRestaurants.filter((restaurant) => {
    const matchesCity = filterCity === "all" || restaurant.city === filterCity;
    const matchesProvider =
      filterProvider === "all" || restaurant.company === filterProvider;
    return matchesCity && matchesProvider;
  });

  return sortRestaurants(filtered);
}

// Sort restaurants based on selected sort criteria
function sortRestaurants(restaurants) {
  if (!sortBy) return restaurants;

  return [...restaurants].sort((a, b) => {
    switch (sortBy) {
      case "location_asc": // Location ascending (closest first)
        return calculateDistance(a) - calculateDistance(b);
      case "location_desc": // Location descending (farthest first)
        return calculateDistance(b) - calculateDistance(a);
      case "name_asc": // Name A-Z
        return a.name.localeCompare(b.name);
      case "name_desc": // Name Z-A
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
}

// Calculate distance using exact same logic as previous assignment
function calculateDistance(restaurant) {
  const [lonA, latA] = restaurant.location.coordinates;
  return getDistance(userLocation.lat, userLocation.lng, latA, lonA);
}

function getDistance(lat1, lon1, lat2, lon2) {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
}

// Filter restaurants and update both sidebar and map
function filterRestaurants() {
  selectedRestaurant = null; // Clear marker selection when filtering
  renderRestaurants();
  updateMapMarkers();
}

// Update map markers visibility based on filters and selection
function updateMapMarkers() {
  isUpdatingMarkers = true; // Prevent infinite loop

  let restaurantsToShow;

  if (selectedRestaurant) {
    // If a restaurant is selected, show only that one
    restaurantsToShow = [selectedRestaurant];
  } else {
    // Otherwise show filtered restaurants
    restaurantsToShow = getFilteredRestaurants();
  }

  const visibleIds = new Set(restaurantsToShow.map((r) => r._id));

  mapMarkers.forEach((marker) => {
    if (visibleIds.has(marker.restaurant._id)) {
      marker.addTo(map);
      // If this is the selected restaurant, open its popup
      if (
        selectedRestaurant &&
        marker.restaurant._id === selectedRestaurant._id
      ) {
        marker.openPopup();
      } else {
        // Close popup for non-selected restaurants
        marker.closePopup();
      }
    } else {
      map.removeLayer(marker);
    }
  });

  isUpdatingMarkers = false; // Allow popup events again
}

// show restaurants in sidebar
function renderRestaurants() {
  if (!container) return;
  container.innerHTML = "";
  let restaurantsToShow = selectedRestaurant
    ? [selectedRestaurant]
    : getFilteredRestaurants();

  // Show "no results" message if no restaurants match filters
  if (restaurantsToShow.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #7c7c7c; margin-top: 20px;">Ei tuloksia</p>';
    return;
  }

  // Add "Show all" button if a specific restaurant is selected
  if (selectedRestaurant) {
    const showAllDiv = document.createElement("div");
    showAllDiv.className = "show-all-button";
    showAllDiv.style.cssText =
      "padding: 10px; text-align: center; background: #f0f0f0; margin-bottom: 10px; cursor: pointer; border-radius: 5px;";
    showAllDiv.innerHTML = "← Näytä kaikki ravintolat";
    showAllDiv.addEventListener("click", () => {
      selectedRestaurant = null;
      renderRestaurants();
      updateMapMarkers();
    });
    container.appendChild(showAllDiv);
  }

  restaurantsToShow.forEach((r) => {
    const div = document.createElement("div");
    div.className = "restaurants_list_restaurant";
    // If only one restaurant is shown (marker selected), use selected-restaurant class for blue border
    if (restaurantsToShow.length === 1 && selectedRestaurant) {
      div.classList.add("selected-restaurant");
    }
    // Add visual indicator that restaurant cards are clickable
    div.style.cursor = "pointer";
    const providerName = r.company || r.provider || "";
    div.innerHTML = `
      <div class="restaurant_title_row">
        <h3>${r.name}</h3>
        <img src="./public/${
          r.starred ? "star-selected.svg" : "star-unselected.svg"
        }" alt="like" />
      </div>
      <div class="restaurant_info_section_container">
        <div>
          <img src="./public/location.svg" alt="restaurant-location-icon" />
          <p>${
            r.postalCode && r.city
              ? r.address + ", " + r.city + ", " + r.postalCode
              : r.address
          }</p>
        </div>
        <div>
          <img src="./public/phone.svg" alt="restaurant-phone" />
          <p>${r.phone}</p>
        </div>
      </div>
      <div class="restaurant_service_provider_row">
        <div class="service_provider_logo">
          ${
            providerName.toLowerCase().includes("sodexo")
              ? '<img src="./public/Sodexo_logo.svg" alt="palveluntarjoaja" />'
              : providerName.toLowerCase().includes("compass")
              ? '<img src="./public/Compass_Group.svg" alt="palveluntarjoaja" />'
              : providerName
          }
        </div>
        <div class="menu_dropdown">
          <p>Menu</p>
          <img class="menu_dropdown_arrow" src="./public/dropdown-arrow.svg" alt="menu-dropdown-arrow" />
        </div>
      </div>
    `;
    // Make restaurant card clickable (but not the menu dropdown or menu buttons)
    div.addEventListener("click", (event) => {
      // Don't trigger selection if clicking on menu dropdown or menu content
      if (
        !event.target.closest(".menu_dropdown") &&
        !event.target.closest(".restaurant_menu_popup")
      ) {
        selectedRestaurant = r;
        renderRestaurants();
        updateMapMarkers();
      }
    });

    // toggle menu
    const menuDropdown = div.querySelector(".menu_dropdown");
    menuDropdown.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent triggering restaurant selection
      openMenu(r);
    });
    container.appendChild(div);
  });
}
// Unselect restaurant and show all again
window.unselectRestaurant = function () {
  selectedRestaurant = null;
  renderRestaurants();
  updateMapMarkers();
};

async function openMenu(restaurant) {
  // Close all other open menus except the one for this restaurant
  const divs = document.querySelectorAll(".restaurants_list_restaurant");
  let targetDiv = null;
  divs.forEach((div) => {
    const name = div.querySelector(".restaurant_title_row h3")?.textContent;
    if (name === restaurant.name) targetDiv = div;
  });
  if (!targetDiv) return;
  // Remove selected class from all cards
  divs.forEach((div) => div.classList.remove("selected-restaurant"));

  // Remove selected class from all cards
  divs.forEach((div) => div.classList.remove("selected-restaurant"));
  // Add selected class to the active card
  targetDiv.classList.add("selected-restaurant");

  document.querySelectorAll(".restaurant_menu_popup").forEach((popup) => {
    // If this is the menu for the clicked restaurant, skip for now
    if (popup.parentElement === targetDiv) return;
    popup.style.display = "none";
    const arrow = popup.parentElement.querySelector(".menu_dropdown_arrow");
    if (arrow) arrow.style.transform = "rotate(0deg)";
  });
  // Check if menu popup already exists
  let menuContent = targetDiv.querySelector(".restaurant_menu_popup");
  const arrow = targetDiv.querySelector(".menu_dropdown_arrow");

  // If menuContent exists, toggle visibility robustly
  if (menuContent) {
    if (menuContent._pending) {
      clearTimeout(menuContent._pending);
      menuContent._pending = null;
    }
    const isOpen = menuContent.style.display === "block";
    menuContent.style.display = isOpen ? "none" : "block";
    arrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
    if (isOpen) {
      handleCloseMenu(targetDiv);
    } else {
      handleOpenMenu(targetDiv);
    }
    return;
  }

  // Mark as pending to prevent race conditions
  menuContent = document.createElement("div");
  menuContent.className = "restaurant_menu_popup";
  menuContent.style.display = "block";
  menuContent._pending = true;
  arrow.style.transform = "rotate(180deg)";

  // Insert immediately, but fill content after both menus are loaded
  targetDiv.appendChild(menuContent);
  handleOpenMenu(targetDiv);

  // Fetch both menus in parallel
  Promise.all([
    getDailyMenuHtml(restaurant._id),
    getWeeklyMenuHtml(restaurant._id),
  ]).then(([dailyHtml, weeklyHtml]) => {
    // If menuContent was removed (user closed quickly), abort
    if (!targetDiv.contains(menuContent)) return;
    menuContent._pending = null;
    menuContent.innerHTML = `
      <div>
        <div class="menu_buttons">
          <button class="menu_day_button selected">päivä</button>
          <button class="menu_week_button">viikko</button>
        </div>
        <div class="menu_content_area">${dailyHtml}</div>
      </div>
    `;
    // Add event listeners to buttons
    const dayBtn = menuContent.querySelector(".menu_day_button");
    const weekBtn = menuContent.querySelector(".menu_week_button");
    const contentArea = menuContent.querySelector(".menu_content_area");
    dayBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent restaurant selection
      dayBtn.classList.add("selected");
      weekBtn.classList.remove("selected");
      contentArea.innerHTML = dailyHtml;
      // Scroll restaurant card to top
      if (targetDiv && targetDiv.scrollIntoView) {
        targetDiv.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    weekBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent restaurant selection
      weekBtn.classList.add("selected");
      dayBtn.classList.remove("selected");
      contentArea.innerHTML = weeklyHtml;
      // Scroll restaurant card to top
      if (targetDiv && targetDiv.scrollIntoView) {
        targetDiv.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

renderRestaurants();
