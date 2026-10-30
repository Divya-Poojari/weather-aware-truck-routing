import { Clock3, Navigation, ShieldAlert, CheckCircle2 } from 'lucide-react'
import type { Route } from '../types'
import RiskBadge from './RiskBadge'
export default function RouteCard({route, selected, recommended, onClick}: {route:Route;selected:boolean;recommended:boolean;onClick:()=>void}) {
  const h=Math.floor(route.duration_minutes/60), m=route.duration_minutes%60
  const worst=route.checkpoints.reduce((a,c)=>['Low','Moderate','High','Severe','No Travel','Unknown'].indexOf(c.risk)>['Low','Moderate','High','Severe','No Travel','Unknown'].indexOf(a)?c.risk:a,'Low' as any)
  return <button className={`route-card ${selected?'active':''}`} onClick={onClick}>
    <div className="route-card-top"><div className="route-name"><span className="route-number">{route.rank}</span><div><b>{route.name}</b>{recommended&&<span className="recommended-label"><CheckCircle2 size={12}/> BEST MATCH</span>}</div></div><RiskBadge risk={worst}/></div>
    <div className="route-stats"><span><Navigation size={14}/>{route.distance_miles.toFixed(0)} mi</span><span><Clock3 size={14}/>{h}h {m}m</span><span><ShieldAlert size={14}/>{route.severe_miles.toFixed(0)} severe mi</span></div>
    <div className="route-bar"><span style={{width:`${Math.min(100,route.average_risk_score/4*100)}%`}}/></div>
    <div className="route-card-bottom"><span>High: {route.high_miles.toFixed(1)} mi</span><span>Avg risk: {route.average_risk_score.toFixed(2)}/4</span><span>ETA {new Date(route.eta).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div>
  </button>
}
