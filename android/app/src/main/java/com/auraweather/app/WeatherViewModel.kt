package com.auraweather.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class WeatherState {
    object Loading : WeatherState()
    data class Success(val data: OpenMeteoResponse, val cityName: String) : WeatherState()
    data class Error(val message: String) : WeatherState()
}

class WeatherViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<WeatherState>(WeatherState.Loading)
    val uiState: StateFlow<WeatherState> = _uiState

    init {
        // Fetch weather for London entirely as default
        fetchWeather(51.5074, -0.1278, "London")
    }

    private fun fetchWeather(lat: Double, lon: Double, city: String) {
        viewModelScope.launch {
            _uiState.value = WeatherState.Loading
            try {
                val response = RetrofitClient.api.getWeather(lat, lon)
                _uiState.value = WeatherState.Success(response, city)
            } catch (e: Exception) {
                _uiState.value = WeatherState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
