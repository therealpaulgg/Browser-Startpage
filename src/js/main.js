// unused variable
// let forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?id=5317058&units=metric&APPID=9ec985f43b7fc537d4ab3d4953fb50ed"

const locationUrl = "https://www.geoip-db.com/json/"
const MAX_FETCH_RETRIES = 7

// HTML elements that will be modified
let div = document.getElementById("weather")
let weatherP = document.getElementById("weatherP")
let dateTimeP = document.getElementById("dateTimeP")
// creation of weather icon
let weatherIcon = document.createElement("i")

// variables for updating weather status
let sunrise
let sunset
let sunsetSwitch = false
let sunriseSwitch = false

main()

/* FUNCTIONS */

async function main() {
	// look at changes in set weather
	let ten_minutes_in_millis = 1000 * 10 * 60
	setIntervalAsync(setWeather, ten_minutes_in_millis)
	await setWeather()
	setDateTime()
	time()

	setLinks()
	document.getElementById("content").style.display = "contents"
	document.getElementById("loading").style.display = "none"
}

function log(val) {
	console.log(val)
	return val
}

// setInterval function that can deal with async
function setIntervalAsync(fn, interval_in_millis) {
	fn().then(() => {
		setTimeout(() => setIntervalAsync(fn, interval_in_millis), interval_in_millis)
	})
}

async function getUserLocation() {
	let json = await getJson(locationUrl)
	return [json.country_code, json.postal]
}

async function setWeather() {
	let [country, postal] = await getUserLocation()
	let weatherData = await getWeatherJson(country, postal)
	let fahrenheit = (weatherData.main.temp * (9 / 5) + 32).toFixed(2)
	weatherP.textContent = `${fahrenheit} °F / ${weatherData.main.temp} °C in ${weatherData.name} - ${weatherData.weather[0].description} `
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
	weatherP.appendChild(weatherIcon)
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