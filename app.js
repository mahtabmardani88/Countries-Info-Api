// This API: https://restcountries.com/v3.1/all?fields=name,flags
// in this website: https://restcountries.com/#api-endpoints-using-this-project
// ____________________________________________________________________________
const apiUrlBase = 'https://restcountries.com/v3.1/name/';
const apiUrlAll = 'https://restcountries.com/v3.1/all';

const ID_SEARCH_FORM = 'searchForm';
const ID_COUNTRY_INPUT = 'countryInput';
const ID_LOADING_MESSAGE = 'loadingMessage';
const ID_ERROR_MESSAGE = 'errorMessage';
const ID_COUNTRY_DATA = 'countryData';
const ID_MAP = 'map';
const CLASS_AUTOCOMPLETE_ITEMS = 'autocomplete-items';
const CLASS_AUTOCOMPLETE_ACTIVE = 'autocomplete-active';


let countryList = [];
let mapInstance = null;

async function getCountryData(countryName) {
    const apiUrl = `${apiUrlBase}${encodeURIComponent(countryName)}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.status || data.length === 0) {
            throw new Error('Country not found');
        }
        const country = data.find(c => c.name.common.toLowerCase() === countryName.toLowerCase());
        if (country) {
            displayCountryInfo(country);
            showCountryOnMap(country.latlng);
        } else {
            displayCountryInfo(data[0]);
            showCountryOnMap(data[0].latlng);
        }
    } catch (error) {
        showError(error);
    }
}

function displayCountryInfo(data) {
    document.getElementById(ID_LOADING_MESSAGE).textContent = '';
    document.getElementById(ID_ERROR_MESSAGE).textContent = '';
    const countryDataDiv = document.getElementById(ID_COUNTRY_DATA);
    countryDataDiv.innerHTML = `
        <img src="${data.flags.svg}" alt="${data.name.common} Flag">
        <h2>${data.name.common}</h2>
        <p>🏛️ Capital: ${data.capital ? data.capital[0] : 'N/A'}</p>
        <p>🌍 Region: ${data.region}</p>
        <p>📍 Subregion: ${data.subregion}</p>
        <p>👥 Population: ${data.population.toLocaleString()}</p>
        <p>🗣️ Languages: ${Object.values(data.languages).join(', ')}</p>
        <p>💰 Currencies: ${Object.values(data.currencies).map(currency => currency.name).join(', ')}</p>
        <p>🕒 Time Zones: ${data.timezones.join(', ')}</p>
    `;
}

function showError(error) {
    document.getElementById(ID_LOADING_MESSAGE).textContent = '';
    document.getElementById(ID_ERROR_MESSAGE).textContent = `Error: ${error.message}`;
}

const searchForm = document.getElementById(ID_SEARCH_FORM);
searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const countryName = document.getElementById(ID_COUNTRY_INPUT).value.trim();
    if (countryName) {
        if (countryList.includes(countryName.toLowerCase())) {
            document.getElementById(ID_LOADING_MESSAGE).textContent = 'Loading...';
            setTimeout(() => {
                getCountryData(countryName);
            }, 2000);
        } else {
            showError(new Error('Country not found'));
        }
    } else {
        showError(new Error('Please enter a country name'));
    }
});

async function fetchCountryList() {
    const apiUrl = apiUrlAll;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        countryList = data.map(country => country.name.common.toLowerCase());
        const countryNames = data.map(country => country.name.common);
        autocomplete(document.getElementById(ID_COUNTRY_INPUT), countryNames);
    } catch (error) {
        console.error('Error fetching countries:', error);
    }
}

function autocomplete(input, array) {
    let currentFocus;
    input.addEventListener('input', function() {
        let a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        a = document.createElement('DIV');
        a.setAttribute('id', this.id + 'autocomplete-list');
        a.setAttribute('class', CLASS_AUTOCOMPLETE_ITEMS);
        this.parentNode.appendChild(a);
        for (i = 0; i < array.length; i++) {
            if (array[i].substr(0, val.length).toUpperCase() === val.toUpperCase()) {
                b = document.createElement('DIV');
                b.innerHTML = '<strong>' + array[i].substr(0, val.length) + '</strong>';
                b.innerHTML += array[i].substr(val.length);
                b.innerHTML += "<input type='hidden' value='" + array[i] + "'>";
                b.addEventListener('click', function(e) {
                    input.value = this.getElementsByTagName('input')[0].value;
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });

    input.addEventListener('keydown', function(e) {
        let x = document.getElementById(this.id + 'autocomplete-list');
        if (x) x = x.getElementsByTagName('div');
        if (e.keyCode === 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode === 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode === 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add(CLASS_AUTOCOMPLETE_ACTIVE);
    }

    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove(CLASS_AUTOCOMPLETE_ACTIVE);
        }
    }

    function closeAllLists(elmnt) {
        const x = document.getElementsByClassName(CLASS_AUTOCOMPLETE_ITEMS);
        for (let i = 0; i < x.length; i++) {
            if (elmnt !== x[i] && elmnt !== input) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener('click', function(e) {
        closeAllLists(e.target);
    });
}

function showCountryOnMap(latlng) {
    if (mapInstance !== null) {
        mapInstance.remove();
    }
    const mapElement = document.getElementById(ID_MAP);
    if (mapElement) {
        mapElement.style.height = '400px';
        mapElement.style.width = '100%';

        mapInstance = L.map(ID_MAP).setView(latlng, 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(mapInstance);

        L.marker(latlng).addTo(mapInstance);
    }
}

fetchCountryList();
