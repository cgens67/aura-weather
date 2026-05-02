package com.auraweather.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.auraweather.app.R

@Composable
fun WeatherScreen(viewModel: WeatherViewModel) {
    val weatherData by viewModel.weatherState.collectAsState()
    val bortleScale by viewModel.bortleScale.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val locationName by viewModel.locationName.collectAsState()
    
    var searchQuery by remember { mutableStateOf("") }
    var selectedTab by remember { mutableIntStateOf(0) }
    val keyboardController = LocalSoftwareKeyboardController.current

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
                    placeholder = { Text(stringResource(R.string.search_placeholder), color = Color.Gray) },
                    leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null, tint = Color.Gray) },
                    keyboardOptions = KeyboardOptions(
                        imeAction = ImeAction.Search
                    ),
                    keyboardActions = KeyboardActions(
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
                    Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFFD3E4FF))
                    }
                } else {
                    weatherData?.let { data ->
                        WeatherContent(data, bortleScale)
                    } ?: run {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text(stringResource(R.string.please_search), color = Color.Gray)
                        }
                    }
                }
            } else if (selectedTab == 1) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Rounded.Map, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(64.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Radar view coming in next update", color = Color.Gray)
                    }
                }
            } else {
                val savedCities by viewModel.savedCities.collectAsState()
                
                Text(
                    text = "Saved Cities",
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(savedCities) { city ->
                        Card(
                            onClick = {
                                viewModel.searchLocation(city)
                                selectedTab = 0
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1F22))
                        ) {
                            Row(
                                modifier = Modifier.padding(20.dp).fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = city, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Medium)
                                Icon(Icons.Rounded.ChevronRight, contentDescription = null, tint = Color.Gray)
                            }
                        }
                    }
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
                text = stringResource(R.string.app_name),
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
        IconButton(onClick = { /* Settings */ }) {
            Icon(Icons.Rounded.Settings, contentDescription = "Settings", tint = Color.White)
        }
    }
}

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
                text = "${stringResource(R.string.feels_like)} ${current.apparentTemperature.toInt()}°",
                color = Color.Gray
            )
        }
    }
}

@Composable
fun InfoGrid(current: CurrentWeather, bortleScale: Int?) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            InfoCard(Modifier.weight(1f), stringResource(R.string.humidity), "${current.humidity}%", Icons.Rounded.WaterDrop)
            InfoCard(Modifier.weight(1f), stringResource(R.string.wind_speed), "${current.windSpeed} km/h", Icons.Rounded.Air)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            InfoCard(Modifier.weight(1f), stringResource(R.string.uv_index), "${current.uvIndex}", Icons.Rounded.WbSunny)
            InfoCard(Modifier.weight(1f), stringResource(R.string.visibility), "${current.visibility} km", Icons.Rounded.Visibility)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            InfoCard(Modifier.weight(0.5f), stringResource(R.string.bortle_scale), "${bortleScale ?: "--"}", Icons.Rounded.Star)
            Box(Modifier.weight(0.5f))
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
