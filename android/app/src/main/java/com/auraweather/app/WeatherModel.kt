package com.auraweather.app

import com.google.gson.annotations.SerializedName

data class WeatherResponse(
    @SerializedName("current") val current: CurrentWeather,
    @SerializedName("hourly") val hourly: HourlyWeather,
    @SerializedName("daily") val daily: DailyWeather
)

data class CurrentWeather(
    @SerializedName("temperature_2m") val temperature: Double,
    @SerializedName("apparent_temperature") val apparentTemperature: Double,
    @SerializedName("relative_humidity_2m") val humidity: Int,
    @SerializedName("precipitation") val precipitation: Double,
    @SerializedName("wind_speed_10m") val windSpeed: Double,
    @SerializedName("visibility") val visibility: Double,
    @SerializedName("uv_index") val uvIndex: Double,
    @SerializedName("weather_code") val weatherCode: Int
)

data class HourlyWeather(
    @SerializedName("time") val time: List<String>,
    @SerializedName("temperature_2m") val temperatures: List<Double>,
    @SerializedName("weather_code") val weatherCodes: List<Int>
)

data class DailyWeather(
    @SerializedName("time") val time: List<String>,
    @SerializedName("temperature_2m_max") val maxTemps: List<Double>,
    @SerializedName("temperature_2m_min") val minTemps: List<Double>,
    @SerializedName("weather_code") val weatherCodes: List<Int>,
    @SerializedName("sunrise") val sunrise: List<String>,
    @SerializedName("sunset") val sunset: List<String>
)
