import type { Checkpoint } from '../types'
import RiskBadge from './RiskBadge'
export default function CheckpointTable({checkpoints}: {checkpoints:Checkpoint[]}) {
  return <div className="table-wrap"><table><thead><tr><th>Checkpoint</th><th>ETA</th><th>Wind</th><th>Rain</th><th>Snow</th><th>Risk</th></tr></thead>
    <tbody>{checkpoints.map(c=><tr key={c.id}><td><b>#{c.id}</b><small>{c.distance_miles.toFixed(1)} mi</small></td>
      <td>{new Date(c.eta).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}<small>{new Date(c.eta).toLocaleDateString([], {month:'short',day:'numeric'})}</small></td>
      <td>{c.weather.wind_mph===null?'—':`${c.weather.wind_mph.toFixed(1)} mph`}</td>
      <td>{c.weather.rain_in_hr===null?'—':`${c.weather.rain_in_hr.toFixed(2)} in`}</td>
      <td>{c.weather.snow_in_hr===null?'—':`${c.weather.snow_in_hr.toFixed(2)} in`}</td><td><RiskBadge risk={c.risk}/></td></tr>)}</tbody></table></div>
}
