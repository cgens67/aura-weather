package com.auraweather.app

data class OpenMeteoResponse(
    val current: CurrentWeather?,
    val hourly: HourlyWeather?,
    val daily: DailyWeather?
)

data class CurrentWeather(
    val time: String,
    val temperature_2m: Double,
    val relative_humidity_2m: Int,
    val is_day: Int,
    val weather_code: Int,
    val wind_speed_10m: Double
)

data class HourlyWeather(
    val time: List<String>,
    val temperature_2m: List<Double>,
    val weather_code: List<Int>
)

data class DailyWeather(
    val time: List<String>,
    val weather_code: List<Int>,
    val temperature_2m_max: List<Double>,
    val temperature_2m_min: List<Double>,
    val sunrise: List<String>,
    val sunset: List<String>
)
