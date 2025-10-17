import { useLoaderData, useSearchParams, useRouteError, isRouteErrorResponse } from "react-router";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import styles from "./weather.module.css";
import { CitySelector } from "../components/city-selector";
import citiesData from "../../src/data/world-cities.json";
import { useToast } from "../context/toast-context";
import { Button } from "@radix-ui/themes";

export function meta() {
  return [
    { title: "Weather Data" },
    { name: "description", content: "View weather information" },
  ];
}

interface WeatherData {
  generationtime_ms: number;
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
  };
}

interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  population: number;
}

// Get the first 10 cities directly from world-cities.json

export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const cityParam = url.searchParams.get("city");

    const cities = citiesData as City[];
    
    if (!cities || cities.length === 0) {
      throw new Error("No cities data available");
    }

    const defaultCity = cities[0];
    let latitude = defaultCity.latitude;
    let longitude = defaultCity.longitude;
    let cityName = `${defaultCity.name}, ${defaultCity.country}`;

    if (cityParam) {
      const [name, country] = cityParam.split(",");
      const city = [...cities.slice(0, 10)].find(
        (c) => c.name === name && c.country === country
      );
      if (city) {
        latitude = city.latitude;
        longitude = city.longitude;
        cityName = `${city.name}, ${city.country}`;
      }
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code,is_day&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto&forecast_days=7`;
    
    const response = await fetch(weatherUrl);

    if (!response.ok) {
      throw new Response(
        `Failed to fetch weather data: ${response.statusText}`,
        {
          status: response.status,
          statusText: response.statusText,
        }
      );
    }

    const weatherData: WeatherData = await response.json();
    
    // Validate weather data
    if (!weatherData.current || !weatherData.hourly) {
      throw new Error("Invalid weather data received from API");
    }

    return { 
      weatherData, 
      cityName, 
      cities: (citiesData as City[]).slice(0, 10) 
    };
  } catch (error) {
    console.error("Error in weather loader:", error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    throw new Response(
      error instanceof Error ? error.message : "Failed to load weather data",
      { status: 500 }
    );
  }
}

function getWeatherIcon(weatherCode: number, isDay: number): string {
  // Unicode weather icons based on WMO codes
  if (weatherCode === 0) {
    return isDay === 1 ? "☀️" : "🌙";
  } else if (weatherCode >= 1 && weatherCode <= 3) {
    return "☁️";
  } else if (
    (weatherCode >= 45 && weatherCode <= 48) ||
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82)
  ) {
    return "🌧️";
  } else if (
    (weatherCode >= 71 && weatherCode <= 77) ||
    (weatherCode >= 85 && weatherCode <= 86)
  ) {
    return "❄️";
  } else if (weatherCode >= 95 && weatherCode <= 99) {
    return "⛈️";
  }

  return isDay === 1 ? "☀️" : "🌙";
}

function getWeatherDescription(weatherCode: number): string {
  const weatherDescriptions: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  return weatherDescriptions[weatherCode] || "Unknown weather";
}

function formatTime(timeString: string): string {
  const date = new Date(timeString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getUVIndexLevel(uvIndex: number): { level: string; color: string } {
  if (uvIndex <= 2) return { level: "Low", color: "var(--green-9)" };
  if (uvIndex <= 5) return { level: "Moderate", color: "var(--yellow-9)" };
  if (uvIndex <= 7) return { level: "High", color: "var(--orange-9)" };
  if (uvIndex <= 10) return { level: "Very High", color: "var(--red-9)" };
  return { level: "Extreme", color: "var(--purple-9)" };
}

function getDayName(dateString: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function WeatherPage() {
  const { weatherData, cityName, cities } = useLoaderData() as {
    weatherData: WeatherData;
    cityName: string;
    cities: City[];
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const handleCityChange = (cityValue: string) => {
    try {
      const [cityName, country] = cityValue.split(",");
      if (!cityName || !country) {
        throw new Error("Invalid city format");
      }
      
      addToast({
        title: "City Changed",
        description: `Now showing weather for ${cityName}, ${country}`,
        duration: 3000,
      });
      setSearchParams({ city: cityValue });
    } catch (error) {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change city",
        duration: 3000,
      });
    }
  };

  const weatherIcon = getWeatherIcon(
    weatherData.current.weather_code,
    weatherData.current.is_day
  );
  const weatherDescription = getWeatherDescription(
    weatherData.current.weather_code
  );

  const todaySunrise = formatTime(weatherData.daily.sunrise[0]);
  const todaySunset = formatTime(weatherData.daily.sunset[0]);
  const todayUVIndex = weatherData.daily.uv_index_max[0];
  const uvInfo = getUVIndexLevel(todayUVIndex);

  // Calculate temperature trend (comparing today's max with tomorrow's max)
  const tempTrend =
    weatherData.daily.temperature_2m_max.length > 1
      ? weatherData.daily.temperature_2m_max[1] -
        weatherData.daily.temperature_2m_max[0]
      : 0;

  return (
    <div className={styles.container}>
      <header>
        <h1>Weather Information</h1>
      </header>

      <section aria-labelledby="city-selector-heading">
        <h2 id="city-selector-heading" className={styles.visuallyHidden}>
          Select City
        </h2>
        <div className={styles.citySelectorContainer}>
          <CitySelector
            value={cityName}
            onValueChange={handleCityChange}
            cities={cities}
          />
        </div>
      </section>

      <section aria-labelledby="current-weather-heading">
        <h2 id="current-weather-heading" className={styles.visuallyHidden}>
          Current Weather
        </h2>
        <div className={styles.weatherDisplay} role="region" aria-label={`Weather for ${cityName}`}>
          <div className={styles.location}>{cityName}</div>
          <div className={styles.weatherIcon} role="img" aria-label={weatherDescription}>{weatherIcon}</div>
          <div className={styles.temperature}>
            {weatherData.current.temperature_2m.toFixed(1)}°C
            {tempTrend !== 0 && (
              <span className={styles.tempTrend}>
                {tempTrend > 0 ? "↗" : "↘"}
                <span className={styles.tempTrendText}>
                  {Math.abs(tempTrend).toFixed(1)}°
                </span>
              </span>
            )}
          </div>
          <div className={styles.weatherDescription}>{weatherDescription}</div>

          <div className={styles.weatherDetails}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Wind Speed</div>
              <div className={styles.detailValue}>
                {weatherData.current.wind_speed_10m.toFixed(1)} km/h
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Humidity</div>
              <div className={styles.detailValue}>
                {weatherData.hourly.relative_humidity_2m[0]}%
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Sunrise</div>
              <div className={styles.detailValue}>🌅 {todaySunrise}</div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Sunset</div>
              <div className={styles.detailValue}>🌇 {todaySunset}</div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>UV Index</div>
              <div className={styles.detailValue}>
                <span className={styles.uvBadge} data-uv-level={uvInfo.level.toLowerCase().replace(" ", "-")}>
                  {todayUVIndex.toFixed(1)} - {uvInfo.level}
                </span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Rain Chance</div>
              <div className={styles.detailValue}>
                {weatherData.daily.precipitation_probability_max[0]}%
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="forecast-heading" className={styles.forecastSection}>
        <h2 id="forecast-heading">7-Day Forecast</h2>
        <div className={styles.forecastGrid}>
          {weatherData.daily.time.map((date, index) => {
            const dayIcon = getWeatherIcon(weatherData.daily.weather_code[index], 1);
            const dayName = getDayName(date, index);
            const maxTemp = weatherData.daily.temperature_2m_max[index];
            const minTemp = weatherData.daily.temperature_2m_min[index];
            const rainChance = weatherData.daily.precipitation_probability_max[index];

            return (
              <div key={date} className={styles.forecastCard}>
                <div className={styles.forecastDay}>{dayName}</div>
                <div className={styles.forecastIcon}>{dayIcon}</div>
                <div className={styles.forecastTemp}>
                  <span className={styles.forecastTempMax}>{maxTemp.toFixed(0)}°</span>
                  <span className={styles.forecastTempMin}>{minTemp.toFixed(0)}°</span>
                </div>
                {rainChance > 0 && (
                  <div className={styles.forecastRain}>💧 {rainChance}%</div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { addToast } = useToast();

  let errorMessage = "An unexpected error occurred";
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.data || error.statusText;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  useEffect(() => {
    addToast({
      title: "Weather Error",
      description: errorMessage,
      duration: 5000,
    });
  }, [errorMessage, addToast]);

  return (
    <div className={styles.container}>
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h1 className={styles.errorTitle}>
          {errorStatus === 404 ? "Weather Not Found" : "Weather Error"}
        </h1>
        <p className={styles.errorMessage}>{errorMessage}</p>
        <div className={styles.errorActions}>
          <Button asChild size="3">
            <Link to="/weather">Try Again</Link>
          </Button>
          <Button asChild variant="soft" size="3">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
