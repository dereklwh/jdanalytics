export const TEAM_COLORS = {
  ANA: { primary: "#F47A38", secondary: "#B9975B" },
  BOS: { primary: "#FFB81C", secondary: "#000000" },
  BUF: { primary: "#002654", secondary: "#FCB514" },
  CAR: { primary: "#CC0000", secondary: "#000000" },
  CBJ: { primary: "#002654", secondary: "#CE1126" },
  CGY: { primary: "#D2001C", secondary: "#FAAF19" },
  CHI: { primary: "#CF0A2C", secondary: "#000000" },
  COL: { primary: "#6F263D", secondary: "#236192" },
  DAL: { primary: "#006847", secondary: "#8F8F8C" },
  DET: { primary: "#CE1126", secondary: "#FFFFFF" },
  EDM: { primary: "#041E42", secondary: "#FF4C00" },
  FLA: { primary: "#041E42", secondary: "#C8102E" },
  LAK: { primary: "#111111", secondary: "#A2AAAD" },
  MIN: { primary: "#154734", secondary: "#A6192E" },
  MTL: { primary: "#AF1E2D", secondary: "#192168" },
  NJD: { primary: "#CE1126", secondary: "#000000" },
  NSH: { primary: "#FFB81C", secondary: "#041E42" },
  NYI: { primary: "#00539B", secondary: "#F47D30" },
  NYR: { primary: "#0038A8", secondary: "#CE1126" },
  OTT: { primary: "#C52032", secondary: "#000000" },
  PHI: { primary: "#F74902", secondary: "#000000" },
  PIT: { primary: "#FCB514", secondary: "#000000" },
  SEA: { primary: "#001628", secondary: "#99D9D9" },
  SJS: { primary: "#006D75", secondary: "#000000" },
  STL: { primary: "#002F87", secondary: "#FCB514" },
  TBL: { primary: "#002868", secondary: "#FFFFFF" },
  TOR: { primary: "#00205B", secondary: "#FFFFFF" },
  UTA: { primary: "#71AFE5", secondary: "#000000" },
  VAN: { primary: "#00205B", secondary: "#00843D" },
  VGK: { primary: "#B4975A", secondary: "#333F42" },
  WPG: { primary: "#041E42", secondary: "#004C97" },
  WSH: { primary: "#C8102E", secondary: "#041E42" },
}

export function getTeamColors(abbr) {
  return TEAM_COLORS[abbr] ?? { primary: "#334155", secondary: "#475569" }
}

export function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

export function getTeamLogoUrl(abbr) {
  if (!abbr) return null
  return `https://assets.nhle.com/logos/nhl/svg/${abbr.toUpperCase()}_light.svg`
}

const TEAM_ABBR_BY_NAME = {
  'anaheim ducks': 'ANA', 'boston bruins': 'BOS', 'buffalo sabres': 'BUF',
  'carolina hurricanes': 'CAR', 'columbus blue jackets': 'CBJ', 'calgary flames': 'CGY',
  'chicago blackhawks': 'CHI', 'colorado avalanche': 'COL', 'dallas stars': 'DAL',
  'detroit red wings': 'DET', 'edmonton oilers': 'EDM', 'florida panthers': 'FLA',
  'los angeles kings': 'LAK', 'minnesota wild': 'MIN', 'montreal canadiens': 'MTL', 'montréal canadiens': 'MTL',
  'new jersey devils': 'NJD', 'nashville predators': 'NSH', 'new york islanders': 'NYI',
  'new york rangers': 'NYR', 'ottawa senators': 'OTT', 'philadelphia flyers': 'PHI',
  'pittsburgh penguins': 'PIT', 'seattle kraken': 'SEA', 'san jose sharks': 'SJS',
  'st. louis blues': 'STL', 'st louis blues': 'STL', 'tampa bay lightning': 'TBL',
  'toronto maple leafs': 'TOR', 'utah hockey club': 'UTA', 'utah mammoth': 'UTA', 'vancouver canucks': 'VAN',
  'vegas golden knights': 'VGK', 'winnipeg jets': 'WPG', 'washington capitals': 'WSH',
}

export function teamAbbrFromName(name) {
  if (!name) return null
  return TEAM_ABBR_BY_NAME[name.toLowerCase()] ?? null
}
