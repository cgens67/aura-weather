package com.auraweather.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun WeatherScreen(viewModel: WeatherViewModel) {
    val weatherData by viewModel.weatherState.collectAsState()
    val bortleScale by viewModel.bortleScale.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val locationName by viewModel.locationName.collectAsState()
    
    var searchQuery by remember { mutableStateOf("") }
    var selectedTab by remember { mutableIntStateOf(0) }
    val keyboardController = androidx.compose.ui.platform.LocalSoftwareKeyboardController.current

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = Color(0xFF131314),
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF1E1F22),
                contentColor = Color.White
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Rounded.Cloud, contentDescription = null) },
                    label = { Text("Weather") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFD3E4FF),
                        selectedTextColor = Color(0xFFD3E4FF),
                        indicatorColor = Color(0xFF004678),
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Rounded.Map, contentDescription = null) },
                    label = { Text("Radar") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFD3E4FF),
                        selectedTextColor = Color(0xFFD3E4FF),
                        indicatorColor = Color(0xFF004678),
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Rounded.LocationOn, contentDescription = null) },
                    label = { Text("Cities") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFD3E4FF),
                        selectedTextColor = Color(0xFFD3E4FF),
                        indicatorColor = Color(0xFF004678),
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray
                    )
                )
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
                .padding(top = 24.dp)
        ) {
            if (selectedTab == 0) {
                WeatherHeader(locationName)

                Spacer(modifier = Modifier.height(16.dp))

                // Search Bar
                TextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Search city...", color = Color.Gray) },
                    leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null, tint = Color.Gray) },
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        imeAction = androidx.compose.ui.text.input.ImeAction.Search
                    ),
                    keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                        onSearch = {
                            if (searchQuery.isNotEmpty()) {
                                viewModel.searchLocation(searchQuery)
                                keyboardController?.hide()
                            }
                        }
                    ),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color(0xFF1E1F22),
                        unfocusedContainerColor = Color(0xFF1E1F22),
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        cursorColor = Color.White,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(24.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(24.dp))

                if (isLoading) {
                    Box(modifier = Modifier.fillWeight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFFD3E4FF))
                    }
                } else {
                    weatherData?.let { data ->
                        WeatherContent(data, bortleScale)
                    } ?: run {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("Please search for a city", color = Color.Gray)
                        }
                    }
                }
            } else if (selectedTab == 1) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Radar coming soon", color = Color.White)
                }
            } else {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Saved cities coming soon", color = Color.White)
                }
            }
        }
    }
}

@Composable
fun WeatherHeader(locationName: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = locationName,
                style = MaterialTheme.typography.headlineMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Aura Weather",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
        IconButton(onClick = { /* Settings */ }) {
            Icon(Icons.Rounded.Settings, contentDescription = "Settings", tint = Color.White)
        }
    }
}

private fun Modifier.fillWeight(weight: Float) = this.then(Modifier.weight(weight))

@Composable
fun WeatherContent(data: WeatherResponse, bortleScale: Int?) {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(16.dp),
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            MainTempCard(data.current)
        }
        item {
            InfoGrid(data.current, bortleScale)
        }
    }
}

@Composable
fun MainTempCard(current: CurrentWeather) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(32.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1F22))
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "${current.temperature.toInt()}°",
                fontSize = 80.sp,
                fontWeight = FontWeight.Black,
                color = Color.White
            )
            Text(
                text = "Feels like ${current.apparentTemperature.toInt()}°",
                color = Color.Gray
            )
        }
    }
}

@Composable
fun InfoGrid(current: CurrentWeather, bortleScale: Int?) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            InfoCard(Modifier.weight(1f), "Humidity", "${current.humidity}%", Icons.Rounded.WaterDrop)
            InfoCard(Modifier.weight(1f), "Wind", "${current.windSpeed} km/h", Icons.Rounded.Air)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            InfoCard(Modifier.weight(1f), "UV Index", "${current.uvIndex}", Icons.Rounded.WbSunny)
            InfoCard(Modifier.weight(1f), "Visibility", "${current.visibility} km", Icons.Rounded.Visibility)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            InfoCard(Modifier.weight(0.5f), "Bortle Scale", "${bortleScale ?: "--"}", Icons.Rounded.Star)
            Box(Modifier.weight(0.5f)) // Spacer for grid alignment
        }
    }
}

@Composable
fun InfoCard(modifier: Modifier, title: String, value: String, icon: ImageVector) {
    Card(
        modifier = modifier.aspectRatio(1f),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1F22))
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Icon(icon, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(20.dp))
            Column {
                Text(text = value, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text(text = title, fontSize = 12.sp, color = Color.Gray)
            }
        }
    }
}
