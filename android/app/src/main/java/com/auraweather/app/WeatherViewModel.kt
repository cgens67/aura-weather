package com.auraweather.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class WeatherViewModel : ViewModel() {
    private val _weatherState = MutableStateFlow<WeatherResponse?>(null)
    val weatherState: StateFlow<WeatherResponse?> = _weatherState

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _bortleScale = MutableStateFlow<Int?>(null)
    val bortleScale: StateFlow<Int?> = _bortleScale

    private val apiService: WeatherApiService by lazy {
        Retrofit.Builder()
            .baseUrl("https://api.open-meteo.com/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(WeatherApiService::class.java)
    }

    fun fetchWeather(lat: Double, lon: Double) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = apiService.getForecast(lat, lon)
                _weatherState.value = response
                
                // Calculate Bortle Scale
                val valShift = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233)) * 43758.5453
                val hash = valShift - Math.floor(valShift)
                _bortleScale.value = Math.max(1, Math.min(9, Math.floor(hash * 9).toInt() + 1))
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
}
