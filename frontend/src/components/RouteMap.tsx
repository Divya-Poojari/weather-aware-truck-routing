import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import type { Route, Risk } from '../types'
import RiskBadge from './RiskBadge'

const colors: Record<Risk,string> = {Low:'#20a477',Moderate:'#e3ad35',High:'#ed7a35',Severe:'#e64b55','No Travel':'#a72d45',Unknown:'#8492a6'}
function FitRoutes({routes}: {routes: Route[]}) {
  const map = useMap()
  useEffect(() => {
    const all = routes.flatMap(r=>r.geometry.map(([lon,lat])=>[lat,lon] as [number,number]))
    if (all.length) map.fitBounds(all, {padding:[35,35]})
  }, [routes, map])
  return null
}
export default function RouteMap({routes, selectedId, onSelect, forecastHour}: {
  routes: Route[]; selectedId: string; onSelect: (id:string)=>void; forecastHour: number
}) {
  const selected = routes.find(r=>r.id===selectedId)
  const points = selected?.checkpoints.filter(c=>{
    const hours=(new Date(c.eta).getTime()-new Date(routes[0]?.checkpoints[0]?.eta || Date.now()).getTime())/3600000
    return hours <= forecastHour && hours >= 0
  }) || []
  return <div className="map-shell">
    <MapContainer center={[20.5,78.9]} zoom={5} scrollWheelZoom className="route-map">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <FitRoutes routes={routes}/>
      {routes.map((route,i)=><Polyline key={route.id} positions={route.geometry.map(([lon,lat])=>[lat,lon])}
        pathOptions={{color: route.id===selectedId?'#64a7ff':['#a3afc2','#8b7be8'][i%2], weight:route.id===selectedId?6:3, opacity:route.id===selectedId?0.95:0.48, dashArray:route.id===selectedId?undefined:'8 9'}} eventHandlers={{click:()=>onSelect(route.id)}}/>)}
      {points.map(cp=><CircleMarker key={`heat-${cp.id}`} center={cp.coordinates} radius={19} pathOptions={{stroke:false,fillColor:colors[cp.risk],fillOpacity:.22}}/>)}
      {points.map(cp=><CircleMarker key={cp.id} center={cp.coordinates} radius={7} pathOptions={{color:'#fff',weight:2,fillColor:colors[cp.risk],fillOpacity:.98}}>
        <Popup><div className="map-popup"><b>Checkpoint {cp.id}</b><br/>{cp.distance_miles} mi · {new Date(cp.eta).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}<br/><RiskBadge risk={cp.risk}/><br/>Wind: {cp.weather.wind_mph?.toFixed(1) ?? '—'} mph<br/>Rain: {cp.weather.rain_in_hr?.toFixed(2) ?? '—'} in/hr<br/>Snow: {cp.weather.snow_in_hr?.toFixed(2) ?? '—'} in/hr</div></Popup>
      </CircleMarker>)}
    </MapContainer>
    <div className="map-legend"><b>Weather risk</b>{(['Low','Moderate','High','Severe','No Travel'] as Risk[]).map(r=><span key={r}><i style={{background:colors[r]}}/>{r}</span>)}</div>
    <div className="map-caption">Selected route checkpoints · Forecast window: 0–{forecastHour}h</div>
  </div>
}
