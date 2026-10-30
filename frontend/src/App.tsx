import { useMemo, useState } from 'react'
import { CloudSun, MapPinned, Gauge, ShieldCheck, AlertTriangle, ChevronDown, Info } from 'lucide-react'
import TripForm from './components/TripForm'
import RouteMap from './components/RouteMap'
import RouteCard from './components/RouteCard'
import CheckpointTable from './components/CheckpointTable'
import { analyzeTrip, type TripRequest } from './api'
import type { Analysis } from './types'

export default function App() {
  const [analysis,setAnalysis]=useState<Analysis|null>(null)
  const [selectedId,setSelectedId]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [forecastHour,setForecastHour]=useState(48)
  const [showCheckpoints,setShowCheckpoints]=useState(true)
  const selected=useMemo(()=>analysis?.routes.find(r=>r.id===selectedId),[analysis,selectedId])
  const run=async(payload:TripRequest)=>{
    setLoading(true);setError('');setAnalysis(null)
    try{
      const result=await analyzeTrip(payload)
      setAnalysis(result);setSelectedId(result.recommended_route_id);setForecastHour(48)
    }catch(e){setError(e instanceof Error?e.message:'Something went wrong. Please try again.')}
    finally{setLoading(false)}
  }
  return <div className="app">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><CloudSun size={21}/></div><div><b>RouteWise</b><span>WEATHER-AWARE TRUCK ROUTING</span></div></div>
      <div className="topbar-right"><span className="live-dot"/> WEATHER INTELLIGENCE <span className="top-divider"/> <span className="beta">BETA</span></div>
    </header>
    <main>
      <section className="hero"><div><div className="eyebrow"><span/> SMARTER ROUTES. SAFER JOURNEYS.</div><h1>Make every mile<br/><em>weather-aware.</em></h1><p>Compare routes using real forecast conditions, truck load weight, and estimated arrival times at every checkpoint.</p></div>
        <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-cloud"><CloudSun size={64}/></div><div className="hero-road">↗</div><span className="art-tag">LIVE FORECAST</span></div>
      </section>
      <div className="workspace">
        <aside className="sidebar"><TripForm onSubmit={run} loading={loading}/>
          <div className="rules-card"><div className="rules-title"><ShieldCheck size={16}/> Safety logic</div><p>Risk is classified per checkpoint using wind, rain, snow, and load-adjusted wind thresholds.</p><div className="rule-line"><span>≥55 mph wind</span><b>No Travel</b></div><div className="rule-line"><span>45–54 mph + load &gt;30k lb</span><b>No Travel</b></div><div className="rule-line"><span>35–44 mph + load &gt;40k lb</span><b>Severe</b></div></div>
        </aside>
        <section className="results">
          {error&&<div className="error-banner"><AlertTriangle size={18}/><div><b>Unable to calculate routes</b><span>{error}</span></div></div>}
          {!analysis&&!loading&&<div className="empty-state"><div className="empty-icon"><MapPinned size={30}/></div><h2>Your route intelligence starts here</h2><p>Enter your trip details to generate up to three route options, forecast weather checkpoints, and a safety-first recommendation.</p><div className="empty-steps"><span>01 <b>Enter trip</b></span><i/><span>02 <b>Compare weather</b></span><i/><span>03 <b>Choose route</b></span></div></div>}
          {loading&&<div className="loading-state"><div className="loader-ring"/><h2>Analyzing your journey</h2><p>Finding route alternatives and checking forecast conditions at each checkpoint. This can take a minute.</p><div className="loading-steps"><span>Geocoding locations</span><span>Building route alternatives</span><span>Sampling forecast weather</span><span>Scoring route safety</span></div></div>}
          {analysis&&<>
            <div className="results-heading"><div><span className="eyebrow">ROUTE ANALYSIS</span><h2>Trip overview</h2><p>{analysis.origin.label.split(',').slice(0,2).join(',')} <span>→</span> {analysis.destination.label.split(',').slice(0,2).join(',')}</p></div><span className="route-count">{analysis.routes.length} ROUTES FOUND</span></div>
            <div className="metric-row">
              <div className="metric"><span className="metric-icon blue"><MapPinned size={17}/></span><div><small>OPTIONS</small><b>{analysis.routes.length}</b></div></div>
              <div className="metric"><span className="metric-icon green"><ShieldCheck size={17}/></span><div><small>LOAD WEIGHT</small><b>{analysis.load_weight_lb.toLocaleString()} <small>lb</small></b></div></div>
              <div className="metric"><span className="metric-icon amber"><Gauge size={17}/></span><div><small>SAMPLING</small><b>{analysis.sample_spacing_miles} <small>miles</small></b></div></div>
            </div>
            <div className="section-head"><div><h3>Compare routes</h3><p>Ranked by safety first, then travel time</p></div></div>
            <div className="route-cards">{analysis.routes.map(r=><RouteCard key={r.id} route={r} selected={selectedId===r.id} recommended={r.id===analysis.recommended_route_id} onClick={()=>setSelectedId(r.id)}/>)}</div>
            <div className="map-panel">
              <div className="map-header"><div><h3><MapPinned size={17}/> Route & weather corridor</h3><p>Colored checkpoints indicate forecast risk along the selected route</p></div><div className="selected-route-tag">{selected?.name} selected</div></div>
              <div className="forecast-control"><div><span>FORECAST WINDOW</span><b>0–{forecastHour} hours</b></div><input type="range" min="0" max="48" step="1" value={forecastHour} onChange={e=>setForecastHour(Number(e.target.value))}/><div className="range-labels"><span>Departure</span><span>+24h</span><span>+48h</span></div></div>
              <RouteMap routes={analysis.routes} selectedId={selectedId} onSelect={setSelectedId} forecastHour={forecastHour}/>
            </div>
            {selected&&<div className="checkpoint-panel">
              <button className="checkpoint-toggle" onClick={()=>setShowCheckpoints(!showCheckpoints)}><div><h3>Weather checkpoints</h3><p>{selected.name} · {selected.checkpoints.length} sampled points</p></div><ChevronDown className={showCheckpoints?'rotated':''}/></button>
              {showCheckpoints&&<CheckpointTable checkpoints={selected.checkpoints}/>}
            </div>}
            <div className="recommendation-note"><Info size={16}/><span><b>Recommendation logic:</b> {analysis.recommendation_reason} Route recommendations are decision support, not a guarantee of safe road conditions.</span></div>
          </>}
        </section>
      </div>
    </main>
    <footer><span>ROUTEWISE © 2026</span><span>ROUTING: OSRM · GEOCODING: OPENSTREETMAP · WEATHER: OPEN-METEO</span><span>PLANNING SUPPORT ONLY</span></footer>
  </div>
}
