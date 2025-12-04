import React, { useEffect, useRef, useState } from 'react'
import './Weather.css'
import wind_icon from '../assets/wind.png'
import snow_icon from '../assets/snow.png'
import rain_icon from '../assets/rain.png'
import humidity_icon from '../assets/humidity.png'
import drizzle_icon from '../assets/drizzle.png'
import cloud_icon from '../assets/cloud.png'
import clear_icon from '../assets/clear.png'

const Weather = () => {

    const inputRef = useRef()
    const [weatherData, setWeatherData] = useState(false);
    const [forecastData, setForecastData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [background, setBackground] = useState("linear-gradient(45deg, #2f4680, #500ae4)");

    const allIcons = {
        "01d": clear_icon, "01n": clear_icon,
        "02d": cloud_icon, "02n": cloud_icon,
        "03d": cloud_icon, "03n": cloud_icon,
        "04d": cloud_icon, "04n": cloud_icon,
        "09d": drizzle_icon, "09n": drizzle_icon,
        "10d": rain_icon, "10n": rain_icon,
        "11d": snow_icon, "11n": snow_icon,
        "13d": snow_icon, "13n": snow_icon,
        "50d": cloud_icon, "50n": cloud_icon,
    }

    const allBackgrounds = {
        "01d": "linear-gradient(135deg, #56CCF2, #2F80ED)",
        "01n": "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        "02d": "linear-gradient(135deg, #a8c0ff, #3f2b96)",
        "02n": "linear-gradient(135deg, #232526, #414345)",
        "03d": "linear-gradient(135deg, #a8c0ff, #3f2b96)",
        "03n": "linear-gradient(135deg, #232526, #414345)",
        "04d": "linear-gradient(135deg, #a8c0ff, #3f2b96)",
        "04n": "linear-gradient(135deg, #232526, #414345)",
        "09d": "linear-gradient(135deg, #373B44, #4286f4)",
        "09n": "linear-gradient(135deg, #141E30, #243B55)",
        "10d": "linear-gradient(135deg, #373B44, #4286f4)",
        "10n": "linear-gradient(135deg, #141E30, #243B55)",
        "11d": "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        "11n": "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        "13d": "linear-gradient(135deg, #E0EAFC, #CFDEF3)",
        "13n": "linear-gradient(135deg, #E0EAFC, #CFDEF3)",
        "50d": "linear-gradient(135deg, #3E5151, #DECBA4)",
        "50n": "linear-gradient(135deg, #3E5151, #DECBA4)",
    }

    const search = async (query) => {
        setLoading(true);
        setError(null);

        try {
            let weatherUrl, forecastUrl;

            if (typeof query === 'string') {
                if (query === '') {
                    setError("Please enter a city name");
                    setLoading(false);
                    return;
                }
                weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
                forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${query}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
            } else if (typeof query === 'object') {
                weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${query.lat}&lon=${query.lon}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
                forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${query.lat}&lon=${query.lon}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
            }

            const response = await fetch(weatherUrl);
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Error fetching data");
                setWeatherData(false);
                setLoading(false);
                return;
            }

            const iconCode = data.weather[0].icon;
            const icon = allIcons[iconCode] || clear_icon;
            const bg = allBackgrounds[iconCode] || "linear-gradient(45deg, #2f4680, #500ae4)";

            setBackground(bg);
            localStorage.setItem("lastCity", data.name);

            setWeatherData({
                humidity: data.main.humidity,
                windSpeed: data.wind.speed,
                temperature: Math.floor(data.main.temp),
                location: data.name,
                icon: icon
            });

            const forecastRes = await fetch(forecastUrl);
            const forecastJson = await forecastRes.json();

            if (forecastRes.ok) {
                const dailyData = forecastJson.list.filter((reading) =>
                    reading.dt_txt.includes("12:00:00")
                );
                setForecastData(dailyData.slice(0, 5));
            }

            if(typeof query === 'string') inputRef.current.value = "";

        } catch (error) {
            setWeatherData(false);
            setError("Error fetching weather data");
            console.error('Weather fetch error:', error);
        } finally {
            setLoading(false);
        }
    }

    // --- NEW: Function to handle clicking a forecast item ---
    const handleForecastClick = (day) => {
        // 1. Get the correct icon and background for the clicked day
        const iconCode = day.weather[0].icon;
        const icon = allIcons[iconCode] || clear_icon;
        const bg = allBackgrounds[iconCode] || "linear-gradient(45deg, #2f4680, #500ae4)";

        // 2. Update Background immediately
        setBackground(bg);

        // 3. Update the Main Weather Display with clicked day's data
        setWeatherData({
            humidity: day.main.humidity,
            windSpeed: day.wind.speed,
            temperature: Math.floor(day.main.temp),
            location: weatherData.location, // Keep the city name same as before
            icon: icon
        });
    }

    const searchByLocation = () => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    search({ lat: latitude, lon: longitude });
                },
                (error) => {
                    setLoading(false);
                    setError("Location access denied.");
                }
            );
        } else {
            setError("Geolocation is not supported.");
        }
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            search(inputRef.current.value);
        }
    }

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    search({ lat: latitude, lon: longitude });
                },
                (error) => {
                    const lastCity = localStorage.getItem("lastCity");
                    search(lastCity || 'Colombo');
                }
            );
        } else {
            const lastCity = localStorage.getItem("lastCity");
            search(lastCity || 'Colombo');
        }
    }, [])

    const getDayName = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    return (
        <div className='weather' style={{ backgroundImage: background }}>
            <div className='search-bar'>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder='Search City'
                    onKeyDown={handleKeyDown}
                />

                <div className="search-icon" onClick={() => search(inputRef.current.value)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>

                <div className="location-icon" onClick={searchByLocation}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="7" stroke="#555" strokeWidth="2" />
                        <circle cx="12" cy="12" r="2" fill="#555" />
                        <path d="M12 2V5" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 19V22" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M19 12H22" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M2 12H5" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </div>
            </div>

            {loading ? (
                <p className="loading-msg">Loading...</p>
            ) : error ? (
                <p className="error-msg">{error}</p>
            ) : weatherData ? (
                <>
                    <img src={weatherData.icon} alt='' className="weather-icon" />
                    <p className="temperature">{weatherData.temperature}°c</p>
                    <p className="location">{weatherData.location}</p>
                    <div className="weather-data">
                        <div className="col">
                            <img src={humidity_icon} alt='' />
                            <div>
                                <p>{weatherData.humidity} %</p>
                                <span>Humidity</span>
                            </div>
                        </div>
                        <div className="col">
                            <img src={wind_icon} alt='' />
                            <div>
                                <p>{weatherData.windSpeed} km/h</p>
                                <span>Wind</span>
                            </div>
                        </div>
                    </div>

                    <div className="forecast">
                        <h3>Next 5 Days</h3>
                        <div className="forecast-container">
                            {forecastData.map((day, index) => {
                                const dayIcon = allIcons[day.weather[0].icon] || clear_icon;
                                return (
                                    /* Added onClick event here */
                                    <div
                                        key={index}
                                        className="forecast-item"
                                        onClick={() => handleForecastClick(day)}
                                    >
                                        <p className="day">{getDayName(day.dt_txt)}</p>
                                        <img src={dayIcon} alt="" />
                                        <p className="temp">{Math.floor(day.main.temp)}°</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    )
}

export default Weather