import { useState } from 'react'
import { ArrowDownUp, CalendarClock, Truck, MapPin, Weight, Route as RouteIcon } from 'lucide-react'
import type { TripRequest } from '../api'

interface Props { onSubmit: (value: TripRequest) => void; loading: boolean }
const localDateTime = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0,16)
}
export default function TripForm({onSubmit, loading}: Props) {
  const [origin, setOrigin] = useState('Bengaluru, India')
  const [destination, setDestination] = useState('Hyderabad, India')
  const [departure, setDeparture] = useState(localDateTime())
  const [weight, setWeight] = useState('32000')
  const [spacing, setSpacing] = useState('25')
  const swap = () => { setOrigin(destination); setDestination(origin) }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({origin, destination, departure_datetime: new Date(departure).toISOString(), load_weight_lb: Number(weight), sample_spacing_miles: Number(spacing)})
  }
  return <form className="trip-form" onSubmit={submit}>
    <div className="form-heading"><div><span className="eyebrow">PLAN YOUR JOURNEY</span><h2>Trip details</h2></div><div className="form-icon"><Truck size={20}/></div></div>
    <label className="field-label"><MapPin size={14}/> Origin</label>
    <input value={origin} onChange={e=>setOrigin(e.target.value)} required placeholder="City, address or place"/>
    <div className="swap-row"><span className="field-label"><MapPin size={14}/> Destination</span><button type="button" className="swap-btn" onClick={swap} aria-label="Swap origin and destination"><ArrowDownUp size={15}/> Swap</button></div>
    <input value={destination} onChange={e=>setDestination(e.target.value)} required placeholder="City, address or place"/>
    <label className="field-label"><CalendarClock size={14}/> Departure date & time</label>
    <input type="datetime-local" value={departure} onChange={e=>setDeparture(e.target.value)} required/>
    <label className="field-label"><Weight size={14}/> Load weight <small>(lb)</small></label>
    <input type="number" min="0" step="100" value={weight} onChange={e=>setWeight(e.target.value)} required/>
    <label className="field-label"><RouteIcon size={14}/> Weather checkpoint spacing</label>
    <div className="segmented">
      {[10,25,50].map(v=><button type="button" key={v} className={spacing===String(v)?'selected':''} onClick={()=>setSpacing(String(v))}>{v} mi</button>)}
    </div>
    <button className="primary-btn" type="submit" disabled={loading}>{loading?<><span className="spinner"/> Analyzing routes…</>:<>Find safest routes <span>→</span></>}</button>
    <p className="form-footnote">Weather and route estimates are for planning support only.</p>
  </form>
}
