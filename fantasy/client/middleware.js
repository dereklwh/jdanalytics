/* global process */

const BOT_UA = /(Twitterbot|facebookexternalhit|Slackbot|LinkedInBot|Discordbot|WhatsApp|Applebot|Googlebot)/i

const API_BASE = process.env.VITE_API_URL || 'https://jdanalytics-api.onrender.com'

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  const url = new URL(request.url)

  // Only intercept /players/:id routes for bots
  const match = url.pathname.match(/^\/players\/(\d+)$/)
  if (!match || !BOT_UA.test(ua)) {
    return undefined // pass through to SPA
  }

  const playerId = match[1]

  // Fetch player data to populate OG tags
  let title = 'Player Profile'
  let description = 'NHL player stats and analytics'
  let ogImageUrl = `${API_BASE}/players/${playerId}/og-image`

  try {
    const res = await fetch(`${API_BASE}/players/${playerId}/detail`)
    if (res.ok) {
      const data = await res.json()
      const p = data.player || {}
      const s = data.season || {}
      const name = `${p.firstName || ''} ${p.lastName || ''}`.trim()
      const pos = p.position || ''
      const team = p.teamAbbr || ''

      title = `${name} — ${pos} · ${team}`

      if (data.season_type === 'goalie') {
        const svPct = s.save_pct != null ? Number(s.save_pct).toFixed(3) : '-'
        const gaa = s.goals_against_average != null ? Number(s.goals_against_average).toFixed(2) : '-'
        description = `${s.games_played ?? 0} GP · ${s.wins ?? 0} W · ${svPct} SV% · ${gaa} GAA`
      } else {
        description = `${s.games_played ?? 0} GP · ${s.points ?? 0} PTS · ${s.goals ?? 0} G · ${s.assists ?? 0} A`
      }

      const seasonId = s.season_id ? String(s.season_id) : ''
      if (seasonId.length === 8) {
        description += ` — ${seasonId.slice(0, 4)}-${seasonId.slice(4)} Season`
      }
    }
  } catch {
    // Proceed with defaults if API is unavailable
  }

  const playerUrl = `${url.origin}/players/${playerId}`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta property="og:title" content="${escapeAttr(title)}" />
  <meta property="og:description" content="${escapeAttr(description)}" />
  <meta property="og:image" content="${escapeAttr(ogImageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeAttr(playerUrl)}" />
  <meta property="og:type" content="profile" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeAttr(title)}" />
  <meta name="twitter:description" content="${escapeAttr(description)}" />
  <meta name="twitter:image" content="${escapeAttr(ogImageUrl)}" />
  <meta http-equiv="refresh" content="0;url=/players/${playerId}" />
  <title>${escapeAttr(title)}</title>
</head>
<body></body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export const config = {
  matcher: '/players/:id',
}
