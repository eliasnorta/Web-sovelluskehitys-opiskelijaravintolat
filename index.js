import { restaurants } from "./data.js";

var map = L.map("map").setView([0, 0], 1);

const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const tiles = L.tileLayer(tileUrl, { attribution });
tiles.addTo(map);

map.setView([60.1699, 24.9384], 13);

const modal = document.querySelector("dialog");

const profileButton = document.querySelector("[data-open-profile]");
const profileCloseButton = document.querySelector("[data-close-modal]");

profileButton.addEventListener("click", () => {
  modal.showModal();
});

profileCloseButton.addEventListener("click", () => {
  modal.close();
});

modal.showModal();

function renderRestaurants() {
  const container = document.querySelector(".sidebar_restaurants_list");
  if (!container) return;
  container.innerHTML = "";

  // assume `restaurants` (imported) is a well-formed array of objects
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
}

renderRestaurants();
