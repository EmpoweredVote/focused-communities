/**
 * `impact` is a Bayesian mean on a 1-9 band. It may be SHOWN — it is not a
 * Compass stance. The project rule about never showing 1-5 is about the
 * Compass's five positions, which are not a scale and have no midpoint; impact
 * is a different quantity in a different band. What it may never be is a
 * printed number: an unrated claim reads exactly 5, "5.6667" means nothing to a
 * reader, and a bare figure beside an argument invites being read as a score
 * someone assigned. A bar or a dot plus this word; the digits never ship.
 *
 * It lives here rather than next to one of its callers so the card and the
 * minimap bucket the same claim the same way. Two thresholds in two files
 * drift, and then one surface reads "moderate" where the other reads "high".
 */
export function impactWord(impact: number): 'low' | 'moderate' | 'high' {
  if (impact < 4) return 'low'
  if (impact > 6) return 'high'
  return 'moderate'
}
