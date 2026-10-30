
import type { Analysis } from './types'

export interface TripRequest {
  origin: string
  destination: string
  departure_datetime: string
  load_weight_lb: number
  sample_spacing_miles: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export async function analyzeTrip(payload: TripRequest): Promise<Analysis> {
  const response = await fetch(`${API_BASE_URL}/api/route-analysis/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Route analysis failed')

  return data
}
