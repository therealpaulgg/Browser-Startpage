// unused variable
// let forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?id=5317058&units=metric&APPID=9ec985f43b7fc537d4ab3d4953fb50ed"

const locationUrl = "https://www.geoip-db.com/json/"
const MAX_FETCH_RETRIES = 7

// HTML elements that will be modified
let div = document.getElementById("weather")

// In this version, there are spans inside the main header which each have their own content. 
let weatherContent = document.getElementById("weather-content")
let celsiusElement = document.getElementById("celsius")
let fahrenheitElement = document.getElementById("fahrenheit")
// Slash element is required because it may be hidden/unhidden. 
let slashElement = document.getElementById("slash")

let dateTimeP = document.getElementById("dateTimeP")
let sidebar = document.getElementById("sidebar")
// creation of weather icon
let weatherIcon = document.createElement("i")

// Variables for user settings
let degreeMode = localStorage.getItem("degreeMode")
let pickedDegreeRadio = degreeMode
let bothDegrees = localStorage.getItem("bothDegreesToggle")
let theme = localStorage.getItem("theme")
let pickedThemeRadio = theme

// variables for updating weather status
let sunrise
let sunset
let sunsetSwitch = false
let sunriseSwitch = false

let description
let weatherLocation

main()

/* FUNCTIONS */

async function main() {
	// look at changes in set weather
	loadSettings()
	let tenMinutesInMillis = 1000 * 10 * 60
	setIntervalAsync(setWeather, tenMinutesInMillis)
	await setWeather()
	setDateTime()
	time()

	setLinks()
	document.getElementById("content").style.display = "contents"
	document.getElementById("loading").style.display = "none"
}

function loadSettings() {
	if (degreeMode == null) {
		degreeMode = "celsius"
		pickedDegreeRadio = "celsius"
		localStorage.setItem("degreeMode", "celsius")
	}

	document.getElementById(`${degreeMode}Radio`).checked = true
	pickedDegreeRadio = degreeMode

	// if (degreeMode == "fahrenheit") {
	// 	document.getElementById("fahrenheitRadio").checked = true
	// 	pickedDegreeRadio = "fahrenheit"
	// } else {
	// 	document.getElementById("celsiusRadio").checked = true
	// 	pickedDegreeRadio = "celsius"
	// }

	if (typeof bothDegrees === "undefined") {
		bothDegrees = "no"
		localStorage.setItem("bothDegreesToggle", "no")
	}

	if (bothDegrees == "yes") {
		document.getElementById("bothDegreesToggle").checked = true
	}

	if (theme == null) {
		theme = "dark"
		pickedThemeRadio = theme
		localStorage.setItem("theme", theme)
	}

	document.body.classList.add(theme)
	if (document.getElementById(`${theme}Radio`) != null) {
		document.getElementById(`${theme}Radio`).checked = true
	}

}

function log(val) {
	console.log(val)
	return val
}

// setInterval function that can deal with async
function setIntervalAsync(fn, intervalInMillis) {
	fn().then(() => {
		setTimeout(() => setIntervalAsync(fn, intervalInMillis), intervalInMillis)
	})
}

async function getUserLocation() {
	let json = await getJson(locationUrl)
	return [json.country_code, json.postal]
}

async function setWeather() {
	let [country, postal] = await getUserLocation()
	let weatherData = await getWeatherJson(country, postal)
	let celsius = weatherData.main.temp
	let fahrenheit = (weatherData.main.temp * (9 / 5) + 32).toFixed(2)
	let primaryOption

	// Both the celsius and fahrenheit element should be filled with text.
	// It is easier to hide/unhide these elements rather than change their text content. 

	celsiusElement.textContent = `${celsius} °C`
	fahrenheitElement.textContent = `${fahrenheit} °F` 
	if (degreeMode == "celsius") {
		primaryOption = celsiusElement
		secondaryOption = fahrenheitElement
	} else {
		primaryOption = fahrenheitElement
		secondaryOption = celsiusElement
	}

	weatherLocation = weatherData.name
	description = weatherData.weather[0].description
	primaryOption.classList.remove("secondary")
	
	if (bothDegrees == "yes") {
		slashElement.classList.remove("hidden")
		secondaryOption.classList.remove("hidden")
		secondaryOption.classList.add("secondary")
	} else {
		// slash should be not visible
		slashElement.classList.add("hidden")
		secondaryOption.classList.add("hidden") 
		secondaryOption.classList.remove("secondary")
	}

	// rest of text content should be computed
	weatherContent.textContent = ` in ${weatherLocation} - ${description} `

	let weatherId = weatherData.weather[0].id
	let icon = weatherIconDict[weatherId].icon
	if (!(weatherId > 699 && weatherId < 800) && !(weatherId > 899 && weatherId < 1000)) {
		let date = new Date()
		if (date.getTime() / 1000 > weatherData.sys.sunset || date.getTime() / 1000 < weatherData.sys.sunrise) {
			icon = "night-" + icon
		} else {
			icon = "day-" + icon
		}
	}

	icon = "wi wi-" + icon
	weatherIcon.className += icon
	weatherContent.appendChild(weatherIcon)
	sunrise = weatherData.sys.sunrise
	sunset = weatherData.sys.sunset
}

function setDateTime() {
	let dateTime = new Date()
	let hrs = dateTime.getHours() < 10 ? `0${dateTime.getHours()}` : dateTime.getHours()
	let mins = dateTime.getMinutes() < 10 ? `0${dateTime.getMinutes()}` : dateTime.getMinutes()
	let secs = dateTime.getSeconds() < 10 ? `0${dateTime.getSeconds()}` : dateTime.getSeconds()
	dateTimeP.textContent = `${dateTime.toLocaleDateString()} - ${hrs}:${mins}:${secs}`
}

function time() {
	let dateTime = new Date()
	let hrs = timeFormat(dateTime.getHours())
	let mins = timeFormat(dateTime.getMinutes())
	let secs = timeFormat(dateTime.getSeconds())
	dateTimeP.textContent = `${dateTime.toLocaleDateString()} - ${hrs}:${mins}:${secs}`
	checkWeatherSwitch()
	setTimeout(time, 1000 - (new Date()).getMilliseconds())
}

function timeFormat(val) {
	return val < 10 ? `0${val}` : `${val}`
}

function checkWeatherSwitch() {
	if (!midnightCheck()) {
		let date = new Date()
		if (!sunsetSwitch || !sunriseSwitch) {
			if (date.getTime() / 1000 > sunrise && date.getTime() / 1000 < sunset && !sunriseSwitch) {
				setWeather()
				sunriseSwitch = true
			} else if (date.getTime() / 1000 > sunset && !sunsetSwitch) {
				setWeather()
				sunsetSwitch = true
			}
		}
	}
}

// does not call async functions, so removed async keyword
function midnightCheck() {
	let newDate = new Date()
	let newDateStr = newDate.toLocaleDateString()
	let newDateDay = newDateStr.split("/")[1]
	let oldDate = new Date()
	let oldDateStr = oldDate.toLocaleDateString()
	let oldDateDay = oldDateStr.split("/")[1]
	oldDate.setUTCMilliseconds(newDate.getTime() - 1000)
	if (newDateDay != oldDateDay) {
		setWeather()
		sunriseSwitch = false
		sunsetSwitch = false
		return true
	}
	return false
}

function setLinks() {
	let socialDiv = document.getElementById("social-links")
	let mediaDiv = document.getElementById("media-links")
	let productivityDiv = document.getElementById("productivity-links")
	let newsDiv = document.getElementById("news-links")

	let stuff = [{
			div: socialDiv,
			links: socialLinks
		},
		{
			div: mediaDiv,
			links: mediaLinks
		},
		{
			div: productivityDiv,
			links: productivityLinks
		},
		{
			div: newsDiv,
			links: newsLinks
		}
	]

	stuff.forEach((item) => {
		item.links.forEach((link) => {
			let string = `${link.name} @ `
			let element = document.createElement("p")
			let hyperlink = document.createElement("a")
			hyperlink.href = `${link.url}`
			hyperlink.textContent = `${link.url}`
			hyperlink.target = "_blank"
			hyperlink.rel = "noopener noreferrer"
			element.textContent = string
			element.appendChild(hyperlink)
			item.div.appendChild(element)
		})
	})
}

// refactored here
async function getWeatherJson(country, postal) {
	let weatherUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${postal},${country}&units=metric&APPID=9ec985f43b7fc537d4ab3d4953fb50ed`
	return await getJson(weatherUrl)
}

async function getJson(url) {
	let json = null
	let response = null
	for (let i = 0; i < MAX_FETCH_RETRIES && json == null; i++) {
		response = await fetch(url)
			.catch((error) => {
				console.log('An error occured while fetching weather data!')
				console.error(error)
				return {
					ok: false
				}
			})
		json = response.ok ? response.json() : null
	}
	return json
}

/* EVENT LISTENER FUNCTIONS */

function toggleSidebar(event) {
	event.stopPropagation()
	sidebar.classList.toggle("closed")
}

function temperatureToggle(event) {
	event.stopPropagation()
	let primaryOption
	let secondaryOption
	if (document.getElementById("fahrenheitRadio").checked) {
		// Fast exit if same radio button is clicked.
		if (pickedDegreeRadio == "fahrenheit") return
		degreeMode = "fahrenheit"
		pickedDegreeRadio = "fahrenheit"
		primaryOption = fahrenheitElement
		secondaryOption = celsiusElement
	} else {
		// Fast exit if same radio button is clicked.
		if (pickedDegreeRadio == "celsius") return
		degreeMode = "celsius"
		pickedDegreeRadio = "celsius"
		primaryOption = celsiusElement
		secondaryOption = fahrenheitElement
	}

	localStorage.setItem("degreeMode", degreeMode)

	primaryOption.classList.remove("secondary")

	if (bothDegrees == "yes") {
		slashElement.classList.remove("hidden")
		secondaryOption.classList.remove("hidden")
		secondaryOption.classList.add("secondary")
	} else {
		// Reset everything before changing status of other.
		fahrenheitElement.classList.remove("hidden")
		celsiusElement.classList.remove("hidden")
		slashElement.classList.add("hidden")
		secondaryOption.classList.add("hidden") 
		secondaryOption.classList.remove("secondary")
	}
}

function bothDegreesToggleFn(event) {
	let primaryOption
	let secondaryOption
	if (degreeMode == "celsius") {
		primaryOption = celsiusElement
		secondaryOption = fahrenheitElement
	} else {
		primaryOption = fahrenheitElement
		secondaryOption = celsiusElement
	}
	if (event.target.checked) {
		slashElement.classList.remove("hidden")
		primaryOption.classList.remove("hidden")
		primaryOption.classList.remove("secondary")
		secondaryOption.classList.remove("hidden")
		secondaryOption.classList.add("secondary")
		bothDegrees = "yes"
	} else {
		secondaryOption.classList.add("hidden")
		slashElement.classList.add("hidden")
		bothDegrees = "no"
	}
	localStorage.setItem("bothDegreesToggle", bothDegrees)
}

function toggleTheme(event) {
	event.stopPropagation()

	let radioBtn = event.target.id
	let newTheme = radioBtn.split("Radio")[0]

	if (document.getElementById(radioBtn) == null) {
		// set dark theme if something is broken
		theme = "dark"
		pickedThemeRadio = "dark"
		document.body.classList.remove(oldTheme)
		document.body.classList.add("dark")
	} else if (document.getElementById(radioBtn).checked) {
		if (pickedThemeRadio == newTheme) return
		let oldTheme = theme
		theme = newTheme
		pickedThemeRadio = newTheme
		document.body.classList.remove(oldTheme)
		document.body.classList.add(theme)
	}

	localStorage.setItem("theme", theme)
}

// This function exists so that if the user clicks somewhere else on the screen, 
// the sidebar collapses. Certain checks are needed to ensure it closes properly.

function bodyClick(event) {
	if (!isDescendant(sidebar, event.target) && event.target.id != "sidebar" && !sidebar.classList.contains("closed")) 
		sidebar.classList.toggle("closed")
}

// Credit: https://stackoverflow.com/questions/2234979/how-to-check-in-javascript-if-one-element-is-contained-within-another

function isDescendant(parent, child) {
	var node = child.parentNode;
	while (node != null) {
		if (node == parent) {
			return true;
		}
		node = node.parentNode;
	}
	return false;
} 

document.body.onclick = bodyClick