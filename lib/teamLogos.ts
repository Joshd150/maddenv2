// lib/teamLogos.ts
// This file defines the paths for team logos and development trait logos.

interface TeamLogoMap {
  [key: string]: string
}

interface DevTraitLogoMap {
  [key: string]: string
}

// Map team abbreviations to their logo paths
const teamLogos: TeamLogoMap = {
  ARI: "/images/teams/ari.png",
  ATL: "/images/teams/atl.png",
  BAL: "/images/teams/bal.png",
  BUF: "/images/teams/buf.png",
  CAR: "/images/teams/car.png",
  CHI: "/images/teams/chi.png",
  CIN: "/images/teams/cin.png",
  CLE: "/images/teams/cle.png",
  DAL: "/images/teams/dal.png",
  DEN: "/images/teams/den.png",
  DET: "/images/teams/det.png",
  GB: "/images/teams/gb.png",
  HOU: "/images/teams/hou.png",
  IND: "/images/teams/ind.png",
  JAX: "/images/teams/jax.png",
  KC: "/images/teams/kc.png",
  LV: "/images/teams/lv.png",
  LAC: "/images/teams/lac.png",
  LAR: "/images/teams/lar.png",
  MIA: "/images/teams/mia.png",
  MIN: "/images/teams/min.png",
  NE: "/images/teams/ne.png",
  NO: "/images/teams/no.png",
  NYG: "/images/teams/nyg.png",
  NYJ: "/images/teams/nyj.png",
  PHI: "/images/teams/phi.png",
  PIT: "/images/teams/pit.png",
  SF: "/images/teams/sf.png",
  SEA: "/images/teams/sea.png",
  TB: "/images/teams/tb.png",
  TEN: "/images/teams/ten.png",
  WAS: "/images/teams/was.png",
}

// Map development trait names to their logo paths
const devTraitLogos: DevTraitLogoMap = {
  Normal: "/images/dev-traits/normal.png",
  Star: "/images/dev-traits/star.png",
  Superstar: "/images/dev-traits/superstar.png",
  "X-Factor": "/images/dev-traits/xfactor.png",
}

export function getTeamLogo(teamAbbr: string): string {
  return teamLogos[(teamAbbr || "").toUpperCase()] || "/placeholder.svg?height=32&width=32"
}

export function getDevTraitLogoUrl(devTrait: string): string {
  return devTraitLogos[devTrait] || "/placeholder.svg?height=24&width=24"
}
