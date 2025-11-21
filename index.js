let allRestaurants = [];

var map = L.map("map").setView([60.1699, 24.9384], 13);
// Reset sidebar when any marker popup is closed
map.on("popupclose", function () {
  window.unselectRestaurant();
});
let selectedRestaurant = null;
// open filter dropdown
const filterButton = document.querySelector(".filter_button");

filterButton.addEventListener("click", () => {
  document.getElementById("filterDropdown").classList.toggle("show");
});

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
  if (!event.target.matches(".filter_button")) {
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
    restaurants.forEach((restaurant) => {
      const restaurantName = restaurant.name;
      const restaurantAddress = restaurant.address;
      const restaurantLong = restaurant.location.coordinates[0];
      const restaurantLat = restaurant.location.coordinates[1];
      const popupHtml = `<h3>${restaurantName}</h3><p>${restaurantAddress}</p>`;
      const marker = L.marker([restaurantLat, restaurantLong])
        .addTo(map)
        .bindPopup(popupHtml);
      marker.on("click", () => {
        selectedRestaurant = restaurant;
        renderRestaurants();
      });
    });
    renderRestaurants();
  })
  .catch((err) => {
    modal.innerHTML = `<form method="dialog"><h2>Error</h2><p>${err.message}</p><button>Close</button></form>`;
    modal.showModal();
  });

// get user's location and display restaurants on map
navigator.geolocation.getCurrentPosition(function (pos) {
  const lat = pos.coords.latitude;
  const long = pos.coords.longitude;

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
});

// modal
const modal = document.querySelector("dialog");

const profileButton = document.querySelector("[data-open-profile]");
const profileCloseButton = document.querySelector("[data-close-modal]");

profileButton.addEventListener("click", () => {
  modal.showModal();
});

profileCloseButton.addEventListener("click", () => {
  modal.close();
});

// modal.showModal();

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

// show restaurants in sidebar
function renderRestaurants() {
  if (!container) return;
  container.innerHTML = "";
  let restaurantsToShow = allRestaurants;
  if (selectedRestaurant) {
    restaurantsToShow = [selectedRestaurant];
  }
  restaurantsToShow.forEach((r) => {
    const div = document.createElement("div");
    div.className = "restaurants_list_restaurant";
    // If only one restaurant is shown (marker selected), use selected-restaurant class for blue border
    if (restaurantsToShow.length === 1 && selectedRestaurant) {
      div.classList.add("selected-restaurant");
    }
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
    // toggle menu
    const menuDropdown = div.querySelector(".menu_dropdown");
    menuDropdown.addEventListener("click", () => {
      openMenu(r);
    });
    container.appendChild(div);
  });
}
// Unselect restaurant and show all again
window.unselectRestaurant = function () {
  selectedRestaurant = null;
  renderRestaurants();
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
    dayBtn.addEventListener("click", () => {
      dayBtn.classList.add("selected");
      weekBtn.classList.remove("selected");
      contentArea.innerHTML = dailyHtml;
      // Scroll restaurant card to top
      if (targetDiv && targetDiv.scrollIntoView) {
        targetDiv.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    weekBtn.addEventListener("click", () => {
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
