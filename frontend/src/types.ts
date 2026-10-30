export type Risk = 'Low' | 'Moderate' | 'High' | 'Severe' | 'No Travel' | 'Unknown'
export interface Weather {
  wind_mph: number | null
  rain_in_hr: number | null
  snow_in_hr: number | null
  available: boolean
}
export interface Checkpoint {
  id: number
  distance_miles: number
  segment_miles: number
  coordinates: [number, number]
  eta: string
  weather: Weather
  risk: Risk
  risk_components: {wind: Risk; rain: Risk; snow: Risk}
}
export interface Route {
  id: string
  name: string
  rank: number
  distance_miles: number
  duration_minutes: number
  eta: string
  severe_miles: number
  high_miles: number
  no_travel_miles: number
  average_risk_score: number
  checkpoints: Checkpoint[]
  geometry: [number, number][]
  summary: string
}
export interface Analysis {
  origin: {lat: number; lon: number; label: string}
  destination: {lat: number; lon: number; label: string}
  departure_datetime: string
  load_weight_lb: number
  sample_spacing_miles: number
  routes: Route[]
  recommended_route_id: string
  recommendation_reason: string
  forecast_window_hours: number
  provider_notes: string[]
}
