import type { Analysis } from './types'
export interface TripRequest {
  origin: string
  destination: string
  departure_datetime: string
  load_weight_lb: number
  sample_spacing_miles: number
}
export async function analyzeTrip(payload: TripRequest): Promise<Analysis> {
  const response = await fetch('/api/route-analysis/', {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Route analysis failed')
  return data
}
