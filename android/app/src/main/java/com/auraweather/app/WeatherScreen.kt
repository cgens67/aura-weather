package com.auraweather.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun WeatherScreen(viewModel: WeatherViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF001D36)), // Dark blue background
        contentAlignment = Alignment.Center
    ) {
        when (state) {
            is WeatherState.Loading -> CircularProgressIndicator(color = Color.White)
            is WeatherState.Error -> Text(
                text = "Error: ${(state as WeatherState.Error).message}",
                color = Color.Red
            )
            is WeatherState.Success -> {
                val data = (state as WeatherState.Success).data
                val city = (state as WeatherState.Success).cityName

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = city,
                        color = Color.White,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF0061A4).copy(alpha = 0.5f), RoundedCornerShape(24.dp))
                            .padding(40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "${data.current?.temperature_2m}°",
                                color = Color.White,
                                fontSize = 80.sp,
                                fontWeight = FontWeight.Light
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "Wind: ${data.current?.wind_speed_10m} km/h • Humidity: ${data.current?.relative_humidity_2m}%",
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 16.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
