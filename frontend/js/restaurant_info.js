let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiaWFtbWFuY2hhbmRhIiwiYSI6ImNqbG1uOW1lbjFhN3AzcG9hdjRqcDdhbWsifQ.vIrGZTNjCmfJeRYk-Eim9A',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      updateReviews(restaurant);
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  return new Promise((resolve, reject) => {
    if (self.restaurant) { // restaurant already fetched!
      return resolve(self.restaurant);
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
      error = 'No restaurant id in URL'
      return reject(error);
    } else {
      DBHelper.fetchRestaurantById(id, (error, restaurant) => {
        self.restaurant = restaurant;
        if (!restaurant) {
          return reject(error);
        }
        fillRestaurantHTML();
        DBHelper.fetchReviewByRestaurant(restaurant.id)
          .then((reviews) => {
            callback(null, restaurant);
            fillReviewsHTML(reviews);
            fillFavouritesHTML(restaurant.is_favorite);
            return resolve(self.restaurant);
          }).catch(err => {
            return reject(err);
          });
      });
    }
  });
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Photo extract of ${restaurant.name}'s restaurant`;
  image.title = restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';

  if (!reviews) return undefined;
  else container.appendChild(title);
  
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Remove all reviews HTML.
 */
const resetReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  container.innerHTML = "";
  const ul = document.createElement('ul');
  ul.id = 'reviews-list';
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.updatedAt).toLocaleDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Update reviews
*/
const updateReviews = (restaurant) => {
  let form = document.getElementById('post-review-form');
  form.addEventListener('submit', function(ev) {
    ev.preventDefault();
    submitReview();
  })
  document.addEventListener("update_reviews_list", (ev) => {
    resetReviewsHTML();
    DBHelper.fetchReviewByRestaurant(restaurant.id)
      .then((reviews) => {
        fillReviewsHTML(reviews);
      })
  });
  console.log('Review updated');
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Catch the restaurant review form action.
 */
const submitReview = () => {
  let review = {};
  let formElement = document.getElementById('post-review-form');
  let formElementID = document.getElementById('restaurant_id');
  formElementID.value = parseInt(getParameterByName('id'));
  formElement.appendChild(formElementID);
  for (let i = 0; i < formElement.length; ++i) {
    let fieldName = formElement[i].name;
    let value = formElement[i].value;
    if (fieldName === "" || value === "") continue;
    if (fieldName === "restaurant_id" || fieldName === "rating") {
      value = parseInt(value);
    }
    review[formElement[i].name] = value;
  }
  formElement.reset();
  DBHelper.sendReview(review);
}

/**
 * Manage Favorite button
 */
const favoriteToggle = () => {
  let favButton = document.getElementById('is-fav');
  favButton.classList.toggle('toggle-heart');

  let buttonState = favButton.getAttribute('aria-pressed');
  console.log(buttonState);
  let pressed = 'false';
  let labelText = 'Mark as favourite';
  
  if (buttonState === 'true') {
    pressed = 'false';
    labelText = 'Mark as favourite';
  } else {
    pressed = 'true';
    labelText = 'Remove favourite';
  }

  favButton.setAttribute('aria-pressed', pressed);
  favButton.setAttribute('aria-label', labelText);
  favButton.innerHTML = labelText;

  const id = getParameterByName('id');
  DBHelper.sendFavourite(id, pressed);
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillFavouritesHTML = (is_favorite) => {
  let favButton = document.getElementById('is-fav');
  let pressed = '';
  let labelText = '';

  if (is_favorite === 'true' || is_favorite === true) {
    pressed = 'true';
    labelText = 'Remove favourite';
    favButton.classList.add('toggle-heart');
  } else {
    pressed = 'false';
    labelText = 'Mark as favourite';
    favButton.classList.remove('toggle-heart');
  }

  favButton.setAttribute('aria-pressed', pressed);
  favButton.setAttribute('aria-label', labelText);
  favButton.innerHTML = labelText;
}

