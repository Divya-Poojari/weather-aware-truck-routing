import type { Risk } from '../types'
export default function RiskBadge({risk}: {risk: Risk}) {
  return <span className={`risk-badge risk-${risk.toLowerCase().replace(' ', '-')}`}>{risk}</span>
}
