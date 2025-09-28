// JavaScript code for Weather Dashboard with Autocomplete Feature
const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');
const suggestionsContainer = document.querySelector('.suggestions-container');
const suggestionsList = document.querySelector('.suggestions-list');

const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');

const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-txt');

const forecastItemsContainer = document.querySelector('.forecast-items-container');

// Use your actual API key
const apikey = 'd7326756a2f009ed9bcd63157d73260d';

// Variables for autocomplete functionality
let searchTimeout;
let currentSuggestionIndex = -1;
let suggestions = [];

// Event listeners for the city input field
cityInput.addEventListener('input', () => {
    const query = cityInput.value.trim();
    
    // Clear the previous timeout to "debounce" the input
    clearTimeout(searchTimeout);
    
    if (query.length >= 2) {
        // Fetch suggestions after a 300ms delay
        searchTimeout = setTimeout(() => {
            fetchCitySuggestions(query);
        }, 300);
    } else {
        hideSuggestions();
    }
    
    // Reset suggestion navigation
    currentSuggestionIndex = -1;
});

cityInput.addEventListener('keydown', (event) => {
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission
        
        if (currentSuggestionIndex >= 0 && suggestions.length > 0) {
            // Select the highlighted suggestion
            const selectedCity = suggestionItems[currentSuggestionIndex].dataset.fullCity;
            updateWeatherInfo(selectedCity);
            cityInput.value = '';
            hideSuggestions();
        } else if (cityInput.value.trim() !== '') {
            // Use the typed value
            updateWeatherInfo(cityInput.value);
            cityInput.value = '';
            hideSuggestions();
        }
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        navigateSuggestions('down');
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        navigateSuggestions('up');
    } else if (event.key === 'Escape') {
        hideSuggestions();
        cityInput.blur();
    }
});

// Event listener for search button click
searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
        hideSuggestions();
    }
});

// Hide suggestions when clicking outside the input container
document.addEventListener('click', (event) => {
    if (!event.target.closest('.input-container')) {
        hideSuggestions();
    }
});

// -------------------- Autocomplete Functions --------------------

/**
 * Fetches city suggestions from the OpenWeatherMap Geocoding API.
 * @param {string} query The user's input string.
 */
async function fetchCitySuggestions(query) {
    const apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apikey}`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }
        
        const data = await response.json();
        suggestions = data;
        displaySuggestions(data);
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
        hideSuggestions();
    }
}

/**
 * Displays the list of city suggestions in the UI.
 * @param {Array<Object>} cities The array of city objects from the API.
 */
function displaySuggestions(cities) {
    if (cities.length === 0) {
        hideSuggestions();
        return;
    }
    
    suggestionsList.innerHTML = '';
    
    cities.forEach((city) => {
        const suggestionItem = document.createElement('li');
        suggestionItem.className = 'suggestion-item';
        
        // This is the key fix: We are now passing the full city name and country code
        // to the dataset attribute, ensuring the API call is accurate.
        suggestionItem.dataset.fullCity = `${city.name},${city.country}`;

        const displayCityName = city.name;
        const displayState = city.state ? `, ${city.state}` : '';
        const displayCountry = city.country ? `, ${city.country}` : '';

        suggestionItem.innerHTML = `<span class="suggestion-city">${displayCityName}${displayState}</span><span class="suggestion-country">${displayCountry}</span>`;

        suggestionItem.addEventListener('click', () => {
            const cityName = suggestionItem.dataset.fullCity;
            updateWeatherInfo(cityName);
            cityInput.value = '';
            hideSuggestions();
        });
        
        suggestionsList.appendChild(suggestionItem);
    });
    
    showSuggestions();
}

/** Shows the suggestions container. */
function showSuggestions() {
    suggestionsContainer.style.display = 'block';
}

/** Hides the suggestions container and resets the state. */
function hideSuggestions() {
    suggestionsContainer.style.display = 'none';
    currentSuggestionIndex = -1;
    clearSuggestionsHighlight();
}

/**
 * Handles keyboard navigation for suggestions.
 * @param {string} direction 'up' or 'down'.
 */
function navigateSuggestions(direction) {
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    
    if (suggestionItems.length === 0) return;
    
    clearSuggestionsHighlight();
    
    if (direction === 'down') {
        currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestionItems.length;
    } else if (direction === 'up') {
        currentSuggestionIndex = currentSuggestionIndex <= 0 
            ? suggestionItems.length - 1 
            : currentSuggestionIndex - 1;
    }
    
    suggestionItems[currentSuggestionIndex].classList.add('highlighted');
    
    suggestionItems[currentSuggestionIndex].scrollIntoView({
        block: 'nearest'
    });
}

/** Removes the highlight from all suggestion items. */
function clearSuggestionsHighlight() {
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.classList.remove('highlighted');
    });
}

// -------------------- Weather Data Functions --------------------

/**
 * Fetches weather data from the OpenWeatherMap API.
 * @param {string} endpoint The API endpoint ('weather' or 'forecast').
 * @param {string} city The city name.
 * @returns {Promise<Object>} The API response data.
 */
async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apikey}&units=metric`;

    try {
        const response = await fetch(apiUrl);
        return await response.json();
    } catch (error) {
        console.error("Fetch failed:", error);
        return { cod: "error", message: error.message };
    }
}

/**
 * Returns the weather icon filename based on the weather condition ID.
 * @param {number} id The weather condition code.
 * @returns {string} The filename for the corresponding weather icon.
 */
function getWeatherIcon(id) {
    if (id <= 232) return 'thunderstorm.svg';
    if (id <= 321) return 'drizzle.svg';
    if (id <= 531) return 'rain.svg';
    if (id <= 622) return 'snow.svg';
    if (id <= 781) return 'atmosphere.svg';
    if (id <= 800) return 'clear.svg';
    else return 'clouds.svg';
}

/**
 * Gets the current formatted date string.
 * @returns {string} The formatted date (e.g., "Wed, 07 Aug").
 */
function getCurrentDate() {
    const currentDate = new Date();
    const options = { weekday: 'short', month: 'short', day: '2-digit' };
    return currentDate.toLocaleDateString('en-GB', options);
}

/**
 * Updates the UI with current weather information for the given city.
 * @param {string} city The city name.
 */
async function updateWeatherInfo(city) {
    const weatherData = await getFetchData('weather', city);

    if (weatherData.cod !== 200) {
        showDisplaySection(notFoundSection);
        return;
    } 

    const {
        name: cityName,
        sys: { country: countryCode },
        main: { temp, humidity },
        weather: [{ id, main }],
        wind: { speed }
    } = weatherData;

    countryTxt.textContent = `${cityName}, ${countryCode}`;
    tempTxt.textContent = `${Math.round(temp)} °C`;
    conditionTxt.textContent = main;
    humidityValueTxt.textContent = `${humidity}%`;
    windValueTxt.textContent = `${speed} M/s`;
    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `Assets/weather/${getWeatherIcon(id)}`;

    await updateForecastInfo(city);
    showDisplaySection(weatherInfoSection);
}

/**
 * Updates the UI with the 5-day weather forecast.
 * @param {string} city The city name.
 */
async function updateForecastInfo(city) {
    const forecastData = await getFetchData('forecast', city);

    if (forecastData.cod !== '200') {
        console.error('Failed to fetch forecast data.');
        return;
    }

    forecastItemsContainer.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];

    // Filter forecast data for 12:00 PM on the next 5 days
    const forecastList = forecastData.list.filter(item => 
        !item.dt_txt.includes(today) && item.dt_txt.includes('12:00:00')
    );
    
    forecastList.forEach(item => {
        const { dt_txt: date, weather: [{ id }], main: { temp } } = item;
        const formattedDate = new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

        const forecastItem = `
            <div class="forecast-item">
                <h5 class="forecast-item-date regular-txt">${formattedDate}</h5>
                <img src="Assets/weather/${getWeatherIcon(id)}" class="forecast-item-img" alt="Forecast icon">
                <h5 class="forecast-item-temp regular-txt">${Math.round(temp)} °C</h5>
            </div>
        `;
        forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
    });
}

/**
 * Shows the specified section and hides all others.
 * @param {HTMLElement} sectionToShow The section to display.
 */
function showDisplaySection(sectionToShow) {
    [weatherInfoSection, searchCitySection, notFoundSection].forEach(sec => {
        sec.style.display = 'none';
    });
    sectionToShow.style.display = 'flex';
}