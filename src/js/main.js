const weatherUrl = "https://api.openweathermap.org/data/2.5/weather?id=5317058&units=metric&APPID=9ec985f43b7fc537d4ab3d4953fb50ed"
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?id=5317058&units=metric&APPID=9ec985f43b7fc537d4ab3d4953fb50ed"

let div = document.getElementById("weather")
let weatherP = document.createElement("h2")
let dateP = document.createElement("h2")
let timeP = document.createElement("h2")

main()

async function main() {
	let date = new Date()
	let weatherData = await getWeatherJson()
	weatherP.textContent = `${weatherData.main.temp} °C in ${weatherData.name} - ${weatherData.weather[0].description}`
	dateP.textContent = `${date.toLocaleDateString()}`
	let hrs = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
	let mins = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
	let secs = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()
	timeP.textContent = `${hrs}:${mins}:${secs}`
	div.appendChild(weatherP)
	div.appendChild(timeP)
	div.appendChild(dateP)
	updateTime()
}

let timerId = setInterval(time, 1000)

async function time() {
	let date = new Date()
	let hrs = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
	let mins = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
	let secs = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()
	timeP.textContent = `${hrs}:${mins}:${secs}`
}

async function getWeatherJson() {
		let json = await fetch(weatherUrl)
				.then((response) => {
						if (response.ok) {
								return response.json()
						}
				})
		return json
}

var divider = document.getElementById("links")

links.forEach((item) => {
	var string = `${item.name} @ ${item.url}`
	var element = document.createElement("p")
	element.textContent = string
	divider.appendChild(element)
})