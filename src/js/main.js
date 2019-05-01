let weatherUrl// "https://api.openweathermap.org/data/2.5/weather?id=5317058&units=metric&APPID=9ec985f43b7fc537d4ab3d4953fb50ed"
let forecastUrl// "https://api.openweathermap.org/data/2.5/forecast?id=5317058&units=metric&APPID=9ec985f43b7fc537d4ab3d4953fb50ed"

const locationUrl = "https://www.geoip-db.com/json/"

// HTML elements that will be modified
let div = document.getElementById("weather")
let weatherP = document.getElementById("weatherP")
let dateTimeP = document.getElementById("dateTimeP")
// creation of weather icon
let weatherIcon = document.createElement("i")

// information on user's location
let country_code
let postal

// variables for updating weather status
let sunrise
let sunset
let sunsetSwitch = false
let sunriseSwitch = false
let oldUpdateTime

main()	

/* FUNCTIONS */

async function main() {
	await getUserLocation()
	weatherUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${postal},${country_code}&units=metric&APPID=9ec985f43b7fc537d4ab3d4953fb50ed`
	await setWeather()
	setDateTime()	
	setInterval(time, 1000)
	setLinks()
}


async function getUserLocation() {
	let json = await getJson(locationUrl)
	country_code = json.country_code
	postal = json.postal
}

async function setWeather() {
	let weatherData = await getWeatherJson()
	let fahrenheit = (weatherData.main.temp * (9/5) + 32).toFixed(2)
	weatherP.textContent = `${fahrenheit} °F / ${weatherData.main.temp} °C in ${weatherData.name} - ${weatherData.weather[0].description} `
	let weatherId = weatherData.weather[0].id
	let icon = weatherIconDict[weatherId].icon	
	if (!(weatherId > 699 && weatherId < 800) && !(weatherId > 899 && weatherId < 1000)) {
		let date = new Date()
		if (date.getTime() / 1000 > weatherData.sys.sunset || date.getTime() / 1000 < weatherData.sys.sunrise) {
			icon = "night-" + icon
		}
		else {
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
	let date = new Date()
	oldUpdateTime = date.getTime()
	let hrs = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
	let mins = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
	let secs = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()
	dateTimeP.textContent = `${date.toLocaleDateString()} - ${hrs}:${mins}:${secs}`
}

async function time() {
	let date = new Date()
	let hrs = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
	let mins = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
	let secs = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()
	dateTimeP.textContent = `${date.toLocaleDateString()} - ${hrs}:${mins}:${secs}`

	// if we have waited 10 minutes, update again
	if (date.getTime() - oldUpdateTime >= 1000 * 60 * 10) {
		setWeather()
		oldUpdateTime = date.getTime()
	}

	checkWeatherSwitch()
}

async function checkWeatherSwitch() {
	midnightCheck()
	let date = new Date()
	if (!sunsetSwitch || !sunriseSwitch) {
		if (date.getTime() / 1000 > sunrise && date.getTime() / 1000 < sunset && !sunriseSwitch) {
			setWeather()
			sunriseSwitch = true
		} else if (date.getTime() / 1000 > sunset && !sunsetSwitch) {
			setWeather()
			console.log(`${date.getTime() / 1000}, ${sunset}`)
			sunsetSwitch = true
		}
	}
}

async function midnightCheck() {
	let newDate = new Date()
	let newDateStr = newDate.toLocaleDateString()
	let newDateDay = newDateStr.split("/")[1]
	let oldDate = new Date()
	let oldDateStr = oldDate.toLocaleDateString()
	let oldDateDay = oldDateStr.split("/")[1]
	oldDate.setUTCMilliseconds(newDate.getTime() - 1000)
	if (newDateDay != oldDateDay) {
		setWeather()
		console.log("uhh")
		sunriseSwitch = false
		sunsetSwitch = false
	}
}

function setLinks() {
	let socialDiv = document.getElementById("social-links")
	let mediaDiv = document.getElementById("media-links")
	let productivityDiv = document.getElementById("productivity-links")
	let newsDiv = document.getElementById("news-links")

	let stuff = [
		{
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

async function getWeatherJson() {
		let json = await getJson(weatherUrl)
		return json
}

async function getJson(url) {
	let json = await fetch(url)
				.then((response) => {
						if (response.ok) {
								return response.json()
						}
				})
	return json
}