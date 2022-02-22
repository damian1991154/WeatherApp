// Variables
const geoURL = 'https://geocoding-api.open-meteo.com/v1';
const meteoURL = 'https://api.open-meteo.com/v1';
const sugestionsNum = 6;

// Elements
const bodyEl = document.querySelector('.body');
const weatherEl = document.querySelector('.weather');
const containerEl = document.querySelector('.container');
const sliderEl = document.querySelector('.slider-box--track');
const sliderButtonEl = sliderEl.querySelector('.slider-box--button');
const cityInputEl = document.querySelector('.city-input-field');
const cityAddIcon = document.querySelector('.weather-box-add-icon');
const heroBgc = document.querySelector('.hero-background');
const smallSpinnerEl = document.querySelector('.search-small-spinner');
const citySugestionsEl = document.querySelector('.city-input--box');
const citySugestionsList = citySugestionsEl.querySelector(
	'.city-input--box-list'
);
const weatherBoxAdd = document.querySelector('.weather-box-add');
const deleteWeatherBoxEl = document.querySelector('.weather-box-delete-box');
const menuButtonEl = document.querySelector('.menu-icon');
const menuBoxEl = document.querySelector('.menu');

const userInfoEl = document.querySelector('.user-info');
const userInfoCloseEl = document.querySelector('.user-info-close');

const chevronDownIcon = '<polyline points="6 9 12 15 18 9" />';
const chevronUpIcon = '<polyline points="6 15 12 9 18 15" />';
const windIcon = `<path d="M5 8h8.5a2.5 2.5 0 1 0 -2.34 -3.24" />
	<path d="M3 12h15.5a2.5 2.5 0 1 1 -2.34 3.24" />
	<path d="M4 16h5.5a2.5 2.5 0 1 1 -2.34 3.24" />`;
const windDirIcon = `<path d="M3 14l11 -11" />
	<path d="M10 3h4v4" />
	<path d="M10 17v4h4" />
	<path d="M21 10l-11 11" />`;
const dropletIcon = `<path d="M6.8 11a6 6 0 1 0 10.396 0l-5.197 -8l-5.2 8z" />`;
const dropletHalfIcon = `<path d="M6.8 11a6 6 0 1 0 10.396 0l-5.197 -8l-5.2 8z" />
	<path d="M6 14h12" />`;
const barIcon = `<line x1="4" y1="20" x2="20" y2="20" />
	<line x1="12" y1="14" x2="12" y2="4" />
	<line x1="12" y1="14" x2="16" y2="10" />
	<line x1="12" y1="14" x2="8" y2="10" />`;
const eyeIcon = `<circle cx="12" cy="12" r="2" />
	<path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7"/>`;

let sugestionCityObjArr = [];
let arrayCityObjects = [];
let chosenCityId = 0;

class City {
	constructor(
		id,
		name,
		latitude,
		longitude,
		updateTime,
		dailyStatObject,
		hourlyStatObject,
		timezone
	) {
		this.id = id;
		this.name = name;
		this.latitude = latitude;
		this.longitude = longitude;
		this.updateTime = updateTime;
		this.dailyStatObject = dailyStatObject;
		this.hourlyStatObject = hourlyStatObject;
		this.timezone = timezone;
	}
}

//////////////////////////////////////////////////////////////
// CITY BOX FUNCTIONS
//////////////////////////////////////////////////////////////
const closeUserInformation = function () {
	userInfoEl.classList.remove('user-info--on');
};

const showUserInformation = function (message, durationTime = 4) {
	userInfoEl.classList.add('user-info--on');

	const messegeEl = document.querySelector('.user-info-text');
	messegeEl.textContent = message;

	setTimeout(closeUserInformation, durationTime * 1000);
};

const collapseWeatherBox = function () {
	// get all weather-box--on class elements
	const weatherBox = document.querySelectorAll('.weather-box');

	// iterate trough all elements
	weatherBox.forEach((el) => {
		// rotate arrow only for previous active weather-box
		if (el.classList.contains('weather-box--on')) {
			rotateArrow(el);
		}

		// remove weather-box--on class for all elements
		el.classList.remove('weather-box--on');
	});
};

const rotateArrow = function (parentEl) {
	// looking for arrow as a child of argument element
	const arrowEl = parentEl.querySelector('.expand-arrow-icon');

	// add or remove class for arrow
	arrowEl.classList.toggle('expand-arrow-icon--up');
};

const expandWeatherBox = function (domElement) {
	// if element is active already, collapse only this element - the same element was clicked
	if (domElement.classList.contains('weather-box--on')) {
		domElement.classList.remove('weather-box--on');
	} else {
		// else, collapse all element - other element was clicked
		collapseWeatherBox();
		domElement.classList.add('weather-box--on');
	}

	// rotate arrow
	rotateArrow(domElement);
};

const backgroundSearchSpinner = function (mode) {
	if (mode === 'on') {
		heroBgc.classList.add('hero-background--on');
	} else {
		heroBgc.classList.remove('hero-background--on');
	}
};

const getIconCode = function (className, polyline) {
	const markup = `
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="icon icon-tabler ${className} weather-box--temp-box-min-icon"
		width="30"
		height="30"
		viewBox="0 0 24 24"
		stroke-width="1"
		stroke="#000000"
		fill="none"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		${polyline}
	</svg>`;

	return markup;
};

const transformToDate = function (stringDate) {
	// 2022-02-17T16:54
	const date = stringDate.split('T')[0];
	const time = stringDate.split('T')[1];

	const dateArr = date.split('-');
	const timeArr = time.split(':');

	const dateNumArr = [
		parseInt(dateArr[0], 10),
		parseInt(dateArr[1], 10) - 1,
		parseInt(dateArr[2], 10),
	];
	const timeNumArr = [parseInt(timeArr[0], 10), parseInt(timeArr[1], 10)];

	return new Date(...dateNumArr, ...timeArr, 0);
};

const compareDates = function (stringDate1, stringDate2) {
	const date1 = transformToDate(stringDate1);
	const date2 = transformToDate(stringDate2);

	return date2 - date1;
};

const checkIfDateIsBetween = function (dateStart, dateEnd, dateToCheck) {
	const timeAfterStart = compareDates(dateStart, dateToCheck);
	const timeAfterEnd = compareDates(dateEnd, dateToCheck);

	if (timeAfterStart >= 0 && timeAfterEnd < 0) return true;
	// else if (timeAfterStart < 0) console.log('Before Start');
	// else if (timeAfterStart > 0) console.log('Before End');
};

const getWeatherIconOrDesc = function (cityWeatherObject, mode) {
	let folder, timeOfDay, iconName, desc;

	const allWeatherSvgFolders = {
		'0_1': { icon: 'clearIcon', desc: 'Clear sky' },
		'2_': { icon: 'smallCloud', desc: 'Partly cloudy' },
		'3_': { icon: 'cloudIcon', desc: 'Overcast' },
		'45_48': { icon: 'fogIcon', desc: 'Fog' },
		'51_53_55': { icon: 'fewRainIcon', desc: 'Drizzle' },
		'56_57_66_67': { icon: 'frozenRainIcon', desc: 'Freezing rain' },
		'61_80': { icon: 'smallRain', desc: 'Light rain' },
		'63_81': { icon: 'averageRain', desc: 'Moderate rain' },
		'65_82': { icon: 'veryBigRain', desc: 'Rain shower' },
		'71_73_75_77_85_86': { icon: 'snowIcon', desc: 'Snowy' },
		'95_96_99': { icon: 'stormIcon', desc: 'Thunderstorm' },
	};

	for (const [key, value] of Object.entries(allWeatherSvgFolders)) {
		const keyNameArr = key.split('_');

		if (
			keyNameArr.includes(
				cityWeatherObject.hourlyStatObject.weathercode.toString()
			)
		) {
			folder = key;
			iconName = allWeatherSvgFolders[key] = value.icon;
			desc = allWeatherSvgFolders[key] = value.desc;
		}
	}

	if (
		checkIfDateIsBetween(
			cityWeatherObject.dailyStatObject.sunrise,
			cityWeatherObject.dailyStatObject.sunset,
			cityWeatherObject.updateTime
		)
	) {
		timeOfDay = 'day';
	} else timeOfDay = 'night';

	if (mode === 'icon') return `svg/${folder}/${timeOfDay}/${iconName}.svg`;
	else return desc;
};

const saveWeatherBoxArray = function () {
	localStorage.setItem('citiesArray', JSON.stringify(arrayCityObjects));
};

const recreateAllSavedUserWeatherBoxes = function (savedCitiesArray) {
	savedCitiesArray.forEach((cityEl) => {
		createNewWeatherBox(cityEl);
	});
};

const createNewWeatherBox = function (cityInfoObject) {
	const htmlMarkup = `
		<div class="weather-box-front">
			<div class="close-box weather-box-delete-box"></div>
			<h2 class="weather-box--name">${cityInfoObject.name}</h2>
			<img class="weather-box--icon" src="${getWeatherIconOrDesc(
				cityInfoObject,
				'icon'
			)}" />
			<p class="weather-box--temp">${
				cityInfoObject.hourlyStatObject.temperature_2m
			}<span>&#x2103;</span></p>
			<p class="weather-box--desc">${getWeatherIconOrDesc(cityInfoObject, 'desc')}</p>
			<div class="weather-box--temp-box">
				<div class="weather-box--temp-box-min">
					${getIconCode('icon-tabler-chevron-down', chevronDownIcon)}
					<p class="weather-box--temp-box-min-temp">
					${cityInfoObject.dailyStatObject.temperature_2m_min} <span>&#x2103;</span>
					</p>
				</div>
				<div class="weather-box--temp-box-max">
					${getIconCode('icon-tabler-chevron-up', chevronUpIcon)}
					<p class="weather-box--temp-box-max-temp">
					${cityInfoObject.dailyStatObject.temperature_2m_max} <span>&#x2103;</span>
					</p>
				</div>
			</div>
		</div>
		<div class="weather-box-back">
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-wind', windIcon)}
				<p class="weather-box-back--item-value">${
					cityInfoObject.hourlyStatObject.windspeed_10m
				} <span>km/h</span></p>
			</div>
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-arrows-double-ne-sw', windDirIcon)}
				<p class="weather-box-back--item-value">
				${cityInfoObject.dailyStatObject.winddirection_10m_dominant} <span>&#176;</span>
				</p>
			</div>
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-droplet', dropletIcon)}
				<p class="weather-box-back--item-value">${
					cityInfoObject.hourlyStatObject.relativehumidity_2m
				} <span>%</span></p>
			</div>
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-droplet-half-2', dropletHalfIcon)}
				<p class="weather-box-back--item-value">${
					cityInfoObject.dailyStatObject.precipitation_sum
				} <span>mm</span></p>
			</div>
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-arrow-bar-to-down', barIcon)}
				<p class="weather-box-back--item-value">${
					cityInfoObject.hourlyStatObject.pressure_msl
				} <span>hPa</span></p>
			</div>
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-eye', eyeIcon)}
				<p class="weather-box-back--item-value">${
					cityInfoObject.hourlyStatObject.apparent_temperature
				} <span>&#x2103;</span></p>
			</div>

			<div class="weather-box-back--item">
				<p class="weather-box-back--item-time-label">Last update:</p>
				<p class="weather-box-back--item-time-value">
					${cityInfoObject.updateTime.replace('T', ' ')}
				</p>
			</div>
		</div>
		<div class="expand-arrow">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="icon icon-tabler icon-tabler-chevron-up expand-arrow-icon"
				width="30"
				height="30"
				viewBox="0 0 24 24"
				stroke-width="1"
				stroke="#000000"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path stroke="none" d="M0 0h24v24H0z" fill="none" />
				<polyline points="6 9 12 15 18 9" />
			</svg>
		</div>`;

	// creating new node element
	const newNode = document.createElement('div');

	// adding class name to new node
	newNode.className = 'weather-box';

	// adding another class with animation of fade in
	newNode.classList.add('weather-box--add');

	newNode.dataset.id = cityInfoObject.id;

	// filling new node element with htmlMarkup variable
	newNode.innerHTML = htmlMarkup;

	// inserting new node with htmlMarkup BEFORE Wather Box Add (that why we use insertBefore() than insertAdjacentHTML())
	weatherEl.insertBefore(newNode, weatherBoxAdd);

	setTimeout(function () {
		newNode.classList.remove('weather-box--add');
	}, 300);
};

const updateWeatherBox = function (boxToUpdate, cityInfoObject) {
	boxToUpdate.innerHTML = '';

	const htmlMarkup = `
		<div class="weather-box-front">
			<div class="close-box weather-box-delete-box"></div>
			<h2 class="weather-box--name">${cityInfoObject.name}</h2>
			<img class="weather-box--icon" src="${getWeatherIconOrDesc(
				cityInfoObject,
				'icon'
			)}" />
			<p class="weather-box--temp">${
				cityInfoObject.hourlyStatObject.temperature_2m
			}<span>&#x2103;</span></p>
			<p class="weather-box--desc">${getWeatherIconOrDesc(cityInfoObject, 'desc')}</p>
			<div class="weather-box--temp-box">
				<div class="weather-box--temp-box-min">
					${getIconCode('icon-tabler-chevron-down', chevronDownIcon)}
					<p class="weather-box--temp-box-min-temp">
					${cityInfoObject.dailyStatObject.temperature_2m_min} <span>&#x2103;</span>
					</p>
				</div>
				<div class="weather-box--temp-box-max">
					${getIconCode('icon-tabler-chevron-up', chevronUpIcon)}
					<p class="weather-box--temp-box-max-temp">
					${cityInfoObject.dailyStatObject.temperature_2m_max} <span>&#x2103;</span>
					</p>
				</div>
			</div>
		</div>
		<div class="weather-box-back">
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-wind', windIcon)}
				<p class="weather-box-back--item-value">${
					cityInfoObject.hourlyStatObject.windspeed_10m
				} <span>km/h</span></p>
			</div>
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-arrows-double-ne-sw', windDirIcon)}
				<p class="weather-box-back--item-value">
				${cityInfoObject.dailyStatObject.winddirection_10m_dominant} <span>&#176;</span>
				</p>
			</div>
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-droplet', dropletIcon)}
				<p class="weather-box-back--item-value">${
					cityInfoObject.hourlyStatObject.relativehumidity_2m
				} <span>%</span></p>
			</div>
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-droplet-half-2', dropletHalfIcon)}
				<p class="weather-box-back--item-value">${
					cityInfoObject.dailyStatObject.precipitation_sum
				} <span>mm</span></p>
			</div>
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-arrow-bar-to-down', barIcon)}
				<p class="weather-box-back--item-value">${
					cityInfoObject.hourlyStatObject.pressure_msl
				} <span>hPa</span></p>
			</div>
			<div class="weather-box-back--item">
				${getIconCode('icon-tabler-eye', eyeIcon)}
				<p class="weather-box-back--item-value">${
					cityInfoObject.hourlyStatObject.apparent_temperature
				} <span>&#x2103;</span></p>
			</div>

			<div class="weather-box-back--item">
				<p class="weather-box-back--item-time-label">Last update:</p>
				<p class="weather-box-back--item-time-value">
					${cityInfoObject.updateTime.replace('T', ' ')}
				</p>
			</div>
		</div>
		<div class="expand-arrow">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="icon icon-tabler icon-tabler-chevron-up expand-arrow-icon"
				width="30"
				height="30"
				viewBox="0 0 24 24"
				stroke-width="1"
				stroke="#000000"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path stroke="none" d="M0 0h24v24H0z" fill="none" />
				<polyline points="6 9 12 15 18 9" />
			</svg>
		</div>`;

	boxToUpdate.insertAdjacentHTML('afterbegin', htmlMarkup);
};

// function updating information about weather in City Object
const updateCityObjectValues = function (objectTo, objectFrom) {
	objectTo.id = objectFrom.id;
	objectTo.id = objectFrom.id;
	objectTo.name = objectFrom.name;
	objectTo.latitude = objectFrom.latitude;
	objectTo.longitude = objectFrom.longitude;
	objectTo.updateTime = objectFrom.updateTime;
	objectTo.dailyStatObject = objectFrom.dailyStatObject;
	objectTo.hourlyStatObject = objectFrom.hourlyStatObject;
	objectTo.timezone = objectFrom.timezone;
};

const updateAllWeatherBoxes = function () {
	// hide mobile menu
	menuBoxEl.classList.remove('menu--on');

	// get current information about weather for every saved in arrayCityObjects place
	arrayCityObjects.forEach((updateEl) => {
		try {
			// get new information about weather for every city for current in from cities array
			getCurrentWeather(updateEl.id, arrayCityObjects).then((data) => {
				// parsing response from Weather API to new City object to pass it as parameter for update function
				const updatedCityObj = parseWeatherResponse(data, updateEl.id);

				// getting all HTML WeatherBox nodes
				const allHtmlWeatherBoxesNodeList =
					document.querySelectorAll('.weather-box');

				// converting NodeList to Array (because of using find() method)
				const allHtmlWeatherBoxesArr = Array.from(allHtmlWeatherBoxesNodeList);

				// get city to update from existing HTML Boxes
				const curUpdateBox = allHtmlWeatherBoxesArr.find(
					(updateBox) => updateBox.dataset.id === updateEl.id
				);

				// update information about weather for current HTML box
				updateWeatherBox(curUpdateBox, updatedCityObj);

				// update information for current city object in arrayCityObjects also
				updateCityObjectValues(updateEl, updatedCityObj);
			});
		} catch (err) {
			console.log(`Error from updateAllWeatherBoxes function: ${err}`);
		}
	});
};

const deleteWeatherBoxFromCityArray = function (weatherBox) {
	const deleteWeatherBoxID = weatherBox.dataset.id;

	const arrayWithoutEl = arrayCityObjects.filter(
		(el) => el.id !== deleteWeatherBoxID
	);

	arrayCityObjects = arrayWithoutEl;
};

// function removes weather box from layout
const deleteWeatherBox = function (weatherBoxDelete) {
	console.log(weatherBoxDelete);
	deleteWeatherBoxFromCityArray(weatherBoxDelete);

	// before removing, adding class with animation of fade out
	weatherBoxDelete.classList.add('weather-box--delete');
	setTimeout(function () {
		weatherBoxDelete.remove();
	}, 300);

	saveWeatherBoxArray();
};

const deleteAllWeatherBoxes = function () {
	// hide mobile menu
	menuBoxEl.classList.remove('menu--on');

	arrayCityObjects.forEach((deleteEl) => {
		// getting all HTML WeatherBox nodes
		const allHtmlWeatherBoxesNodeList =
			document.querySelectorAll('.weather-box');

		// converting NodeList to Array (because of using find() method)
		const allHtmlWeatherBoxesArr = Array.from(allHtmlWeatherBoxesNodeList);

		// get city to update from existing HTML Boxes
		const curDeleteBox = allHtmlWeatherBoxesArr.find(
			(deleteBox) => deleteBox.dataset.id === deleteEl.id
		);

		deleteWeatherBox(curDeleteBox);
	});
};

const resetSearchingSettings = function () {
	// clear pervious sugestion object array
	sugestionCityObjArr.length = 0;

	// reset searching input value
	cityInputEl.value = '';

	// chosenCityId
	chosenCityId = 0;

	// removing active class from add new box plus icon
	cityAddIcon.classList.remove('weather-box-add-icon--on');
};
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
// THEME CHANGE FUNCTIONS
//////////////////////////////////////////////////////////////

// function to setting and saving theme
const setTheme = function (themeName) {
	// save name of theme in local storage
	localStorage.setItem('theme', themeName);

	if (themeName === 'theme-light')
		sliderButtonEl.classList.add('slider-box--button-light');
	else sliderButtonEl.classList.remove('slider-box--button-light');

	// set theme for site
	document.documentElement.className = themeName;
};

// function change theme based on current set theme
const toggleTheme = function () {
	// if current theme is dark
	if (localStorage.getItem('theme') === 'theme-dark') {
		// set light theme
		setTheme('theme-light');
	} else {
		// set dark theme
		setTheme('theme-dark');
	}
};

// function invoke immdiately with setting theme based on local storage settings
(function () {
	if (localStorage.getItem('theme') === 'theme-dark') {
		// set light theme
		setTheme('theme-dark');
	} else {
		// set dark theme
		setTheme('theme-light');
	}
})();

//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
// CITY INPUT AND ADDING FUNCTIONS
//////////////////////////////////////////////////////////////

// function check if city input is not empty and if not, getting cities from API for entered value.
// Create also expandable sugestion list for results
const checkIfCityNameIsReady = function (cityInputObj) {
	// in input is not empty
	if (cityInputObj.target.value) {
		// check if first letter is upper case, if not make it
		if (
			cityInputObj.target.value[0] == cityInputObj.target.value[0].toLowerCase()
		) {
			// getting current value of input
			let currentInputValue = cityInputObj.target.value;

			// transforming input value to lower case
			currentInputValue = currentInputValue.toLowerCase();

			// setting value to current value but with first letter bigger
			cityInputObj.target.value =
				currentInputValue[0].toUpperCase() + currentInputValue.slice(1);
		}

		// if length of input value is bigger than 1 letter
		if (cityInputObj.target.value.length > 1) {
			// retrieve data on the value currently entered
			getCityList(cityInputObj.target.value)
				.then((result) => {
					// if data is availible, create and add cities to sugestions list
					createSuggestionsList(result);
				})
				.catch((error) => {
					const errInfo = `
						<p class="infoMessage">Server connection error</p>`;

					insertElementToHTML(errInfo, citySugestionsList);
					citySugestionsList.classList.add('city-input--box-list--on');
				});
		}
	} else {
		// if input is empty, collapse sugestions list box
		citySugestionsList.classList.remove('city-input--box-list--on');

		// 1s after box is collapsed, erese sugestionsList content
		setTimeout(function () {
			citySugestionsList.innerHTML = '';
		}, 1000);

		resetSearchingSettings();
	}
};

// function inserting passed element into another element (destinationEl)
const insertElementToHTML = function (element, destinationEl) {
	destinationEl.innerHTML = '';
	destinationEl.insertAdjacentHTML('afterbegin', element);
};

// function creating sugestion list for entered city input value
const createSuggestionsList = function (searchResult) {
	let htmlInject = ``;

	// getting result as an array
	const resultsArr = searchResult.results;

	// if array is empty, show information 'Not found'
	if (!resultsArr) {
		const newSuggestion = `
		<li class="sugestionItem">
			<p class="city">City not found!</p>
			<p class="admin"></p>
		</li>`;

		htmlInject = newSuggestion;
	} else {
		// getting only #{sugestionsNum} number of result array
		const sugestionsArr = resultsArr.slice(0, sugestionsNum);

		// clear pervious sugestion object array
		sugestionCityObjArr.length = 0;

		// iterating trough sugestionArr
		sugestionsArr.forEach((resultItem) => {
			// if country code is empty
			let countryCode = resultItem.country_code;
			if (!countryCode) countryCode = '-';

			// if administration is empty
			let administration = resultItem.admin1;
			if (!administration) administration = '-';

			// create HTML markupo for new UL list element with id for every city
			const newSuggestion = `
			<li class="sugestionItem" data-id="${resultItem.id}">
				<p class="city">${resultItem.name}</p>
				<p class="admin">${administration} (${countryCode})</p>
			</li>`;

			// add new markup to global markup
			htmlInject += newSuggestion;

			// adding current item of result to sugestion object array.
			// Is using for hold data about every city that was added to sugestion HTML list
			createSugestionsObjectList(resultItem);
		});
	}

	// inserts global markup for sugestion list to parent element
	insertElementToHTML(htmlInject, citySugestionsList);

	// expands sugestion list element
	citySugestionsList.classList.add('city-input--box-list--on');
};

// function adding to sugestion object array new item
const createSugestionsObjectList = function (item) {
	const newCityObject = {
		id: item.id,
		name: item.name,
		latitude: item.latitude,
		longitude: item.longitude,
		timezone: item.timezone,
	};

	sugestionCityObjArr.push(newCityObject);
};
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
// ASYNCHRONUS FUNCTIONS
//////////////////////////////////////////////////////////////

const getCityList = async function (cityName) {
	try {
		res = await fetch(`${geoURL}/search?name=${cityName}`);
		const data = await res.json();
		return data;
	} catch (err) {
		console.log(`Function getCityList error: ${err}`);
		throw err;
	} finally {
	}
};

const getCurrentWeather = async function (cityID, cityArraySource) {
	try {
		backgroundSearchSpinner('on');
		const chosenCityObject = cityArraySource.find((el) => el.id == cityID);

		if (!chosenCityObject) return;

		const timezone = chosenCityObject.timezone.replace('/', '%2F');

		res = await fetch(
			`${meteoURL}/forecast?latitude=${chosenCityObject.latitude}&longitude=${chosenCityObject.longitude}&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,pressure_msl,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,winddirection_10m_dominant&daily=temperature_2m_min&timezone=${timezone}`
		);
		const data = await res.json();
		return data;
	} catch (err) {
		console.log(`Function getCurrentWeather error: ${err}`);
		throw err;
	} finally {
		backgroundSearchSpinner('off');
	}
};

//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
// FUNCTIONS PARSING WEATHER RESPONSE
//////////////////////////////////////////////////////////////

const getValueFromObjectArrays = function (object, keysArr, valuesArr, key) {
	const keyOrderInArr = object[keysArr].indexOf(key);

	return object[valuesArr][keyOrderInArr];
};

// function set all common parameters and returns function that need only one, unique parameter
const getStatExtractingFunction = function (object, keysArr, key) {
	return function (valuesArr) {
		// getting order number of key in key array
		let keyOrderInArr = object[keysArr].indexOf(key);

		if (!keyOrderInArr || keyOrderInArr < 0) keyOrderInArr = 0;

		// getting value from values array based on order key (arrays have the same length)
		return object[valuesArr][keyOrderInArr];
	};
};

const parseWeatherResponse = function (responseToParse, cityID) {
	// get current date and time
	const today = new Date();

	// today.toISOString() = 2022-02-16T11:58:06.611Z
	const dateFormatted = today.toISOString().split('T')[0];

	let currentHour = today.getHours();
	const currentMinute = today.getMinutes();

	const updateTimeFormatted = `${dateFormatted}T${currentHour}:${currentMinute}`;

	if (currentMinute > 30) currentHour++;

	const hourString = currentHour.toString().padStart(2, '0');

	const hourFormatted = `${dateFormatted}T${hourString}:00`;

	// getting only daily part of object
	const dailyStat = responseToParse.daily;

	// invoking function that return new function with common parameters as below set (for every daily stat)
	const functionToGetDailyStats = getStatExtractingFunction(
		dailyStat,
		'time',
		dateFormatted
	);

	// container object for stats
	const dailyStatObject = {
		precipitation_sum: functionToGetDailyStats('precipitation_sum'),
		temperature_2m_max: functionToGetDailyStats('temperature_2m_max'),
		temperature_2m_min: functionToGetDailyStats('temperature_2m_min'),
		sunrise: functionToGetDailyStats('sunrise'),
		sunset: functionToGetDailyStats('sunset'),
		winddirection_10m_dominant: functionToGetDailyStats(
			'winddirection_10m_dominant'
		),
	};

	// 2022-02-17T06:45
	// 2022-02-17T16:54

	// getting only hourly part of object
	const hourlyStat = responseToParse.hourly;

	// invoking function that return new function with common parameters as below set (for every hourly stat)
	const functionToGetHourlyStats = getStatExtractingFunction(
		hourlyStat,
		'time',
		hourFormatted
	);

	// container object for stats
	const hourlyStatObject = {
		temperature_2m: functionToGetHourlyStats('temperature_2m'),
		apparent_temperature: functionToGetHourlyStats('apparent_temperature'),
		windspeed_10m: functionToGetHourlyStats('windspeed_10m'),
		relativehumidity_2m: functionToGetHourlyStats('relativehumidity_2m'),
		pressure_msl: functionToGetHourlyStats('pressure_msl'),
		weathercode: functionToGetHourlyStats('weathercode'),
	};

	let cityInfoSource;

	// before checking if city object is from sugestion list, checking if city object exist already in city array
	const updatedCityObj = arrayCityObjects.find((el) => el.id === cityID);

	// if object is true, it means that we update city information, because city is already exist in city array
	if (updatedCityObj) cityInfoSource = updatedCityObj;
	// else, we create new city from sugestion list
	else cityInfoSource = sugestionCityObjArr.find((el) => el.id == cityID);

	const newCity = new City(
		cityID,
		cityInfoSource.name,
		responseToParse.latitude,
		responseToParse.longitude,
		updateTimeFormatted,
		dailyStatObject,
		hourlyStatObject,
		cityInfoSource.timezone
	);

	// arrayCityObjects.push(newCity);
	return newCity;
};

//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
// LISTNERS
//////////////////////////////////////////////////////////////
const weatherCollapseListner = function () {
	containerEl.addEventListener('click', function (e) {
		const target = e.target.closest('.weather-box');

		if (target) return;
		collapseWeatherBox();
	});
};

const weatherExpandListner = function () {
	weatherEl.addEventListener('click', function (e) {
		const target = e.target.closest('.weather-box');

		if (!target) return;

		if (e.target.classList.contains('weather-box-delete-box')) {
			const weatherBox = e.target.closest('.weather-box');
			deleteWeatherBox(weatherBox);
		} else {
			expandWeatherBox(target);
		}
	});
};

const themeChangeListner = function () {
	sliderEl.addEventListener('click', function () {
		toggleTheme();
	});
};

const cityInputListner = function () {
	cityInputEl.addEventListener('input', function (e) {
		// function checks if city name was entered, search it and create sugestion list
		checkIfCityNameIsReady(e);
	});
};

// listner of plus icon in box-add
const cityAddIconListner = function () {
	cityAddIcon.addEventListener('click', function () {
		const searchAddingCity = arrayCityObjects.find(
			(city) => city.id === chosenCityId
		);

		// if this city id already is in cities array
		if (searchAddingCity) {
			showUserInformation(
				'You cannot add this city because it already exist in Your city list!'
			);

			resetSearchingSettings();
			return;
		}

		if (cityAddIcon.classList.contains('weather-box-add-icon--on')) {
			getCurrentWeather(chosenCityId, sugestionCityObjArr).then((data) => {
				// parsing result to City instance object with all information about weather
				const newCityObject = parseWeatherResponse(data, chosenCityId);

				// adding new city to all cities array
				arrayCityObjects.push(newCityObject);

				createNewWeatherBox(newCityObject);

				resetSearchingSettings();

				saveWeatherBoxArray();
			});
		}
	});
};

const cityFromSugestionListner = function () {
	citySugestionsList.addEventListener('click', function (e) {
		// get from target element item with class .sugestionItem that is closest to it
		const sugestionListItem = e.target.closest('.sugestionItem');

		// get id of chosen city from HTML dataset
		const chosenCityID = sugestionListItem.dataset.id;

		const chosenCityName = sugestionListItem.querySelector('.city');

		cityInputEl.value = chosenCityName.innerHTML;

		chosenCityId = chosenCityID;

		// collapse sugestion list element
		citySugestionsList.classList.remove('city-input--box-list--on');

		setTimeout(function () {
			cityAddIcon.classList.add('weather-box-add-icon--on');
		}, 200);
	});
};

menuButtonEl.addEventListener('click', function () {
	menuBoxEl.classList.toggle('menu--on');
	bodyEl.classList.toggle('body-disable');
});

userInfoCloseEl.addEventListener('click', function () {
	userInfoEl.classList.remove('user-info--on');
});

weatherExpandListner();
weatherCollapseListner();
themeChangeListner();
cityInputListner();
cityAddIconListner();
cityFromSugestionListner();

(function () {
	if (localStorage.getItem('citiesArray')) {
		const citiesArray = JSON.parse(localStorage.getItem('citiesArray'));

		arrayCityObjects = citiesArray;
		recreateAllSavedUserWeatherBoxes(arrayCityObjects);
	}
})();

// update information about cities when browser reload
updateAllWeatherBoxes();
