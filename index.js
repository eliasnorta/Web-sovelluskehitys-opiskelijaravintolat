// API Configuration
const API_BASE_URL = "https://media2.edu.metropolia.fi/restaurant/api/v1";
const RESTAURANTS_ENDPOINT = `${API_BASE_URL}/restaurants`;
const MENU_LANGUAGE = "fi";

// Leaflet map
var map = L.map("map").setView([0, 0], 1);

const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const tiles = L.tileLayer(tileUrl, { attribution });
tiles.addTo(map);

// map.setView([60.1699, 24.9384], 13);

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

  // loop through restaurants and add marker onto map that corresponds to location
  fetchData(RESTAURANTS_ENDPOINT)
    .then((restaurants) => {
      restaurants.forEach((restaurant) => {
        // table.appendChild(createRestaurantRow(restaurant));

        // const restaurant = restaurants[i];
        const restaurantName = restaurant.name;
        const restaurantAddress = restaurant.address;

        const restaurantLong = restaurant.location.coordinates[0];
        const restaurantLat = restaurant.location.coordinates[1];

        const popupHtml = `<h3>${restaurantName}</h3><p>${restaurantAddress}</p>`;
        L.marker([restaurantLat, restaurantLong])
          .addTo(map)
          .bindPopup(popupHtml);
      });
    })
    .catch((err) => {
      modal.innerHTML = `<form method="dialog"><h2>Error</h2><p>${err.message}</p><button>Close</button></form>`;
      modal.showModal();
    });
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

// show restaurants in sidebar
function renderRestaurants() {
  const container = document.querySelector(".sidebar_restaurants_list");
  if (!container) return;
  container.innerHTML = "";

  // assume `restaurants` (imported) is a well-formed array of objects
  fetchData(RESTAURANTS_ENDPOINT)
    .then((restaurants) => {
      restaurants.forEach((r) => {
        const div = document.createElement("div");
        div.className = "restaurants_list_restaurant";

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
          <img src="./public/dropdown-arrow.svg" alt="menu-dropdown-arrow" />
        </div>
      </div>
    `;

        container.appendChild(div);
      });
    })
    .catch((err) => {
      modal.innerHTML = `<form method="dialog"><h2>Error</h2><p>${err.message}</p><button>Close</button></form>`;
      modal.showModal();
    });
}

renderRestaurants();
