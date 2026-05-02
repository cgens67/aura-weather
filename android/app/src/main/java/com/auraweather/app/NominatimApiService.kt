package com.auraweather.app

import retrofit2.http.GET
import retrofit2.http.Query

data class GeocodingResponse(
    val lat: String,
    val lon: String,
    val display_name: String,
    val name: String?
)

interface NominatimApiService {
    @GET("search")
    suspend fun search(
        @Query("q") query: String,
        @Query("format") format: String = "json",
        @Query("limit") limit: Int = 1
    ): List<GeocodingResponse>
}
