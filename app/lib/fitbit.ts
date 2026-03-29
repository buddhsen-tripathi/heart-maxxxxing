// Google Fit REST API — tracks health trends across the rehab program

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_FIT_BASE = 'https://www.googleapis.com/fitness/v1/users/me'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ')

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

export interface HealthTrends {
  current: {
    restingHR?: number
    stepsToday?: number
    avgDailySteps?: number
    activeMinutes?: number
    sleepMinutes?: number
  }
  baseline: {
    avgRestingHR?: number
    avgDailySteps?: number
    avgActiveMinutes?: number
  }
  deltas: {
    restingHR?: number // negative = improvement
    dailySteps?: number // positive = improvement
    activeMinutes?: number // positive = improvement
  }
  totals: {
    totalSteps?: number
    totalActiveMinutes?: number
    totalDistance?: number // meters
    programDays?: number
  }
  profile?: { name: string; picture: string }
}

// ── OAuth ──

export function getAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID not set')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/fitbit/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCode(code: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/fitbit/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function refreshAccessToken(token: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  return res.json()
}

// ── Google Fit API ──

const DAY_MS = 86_400_000

async function aggregate(
  accessToken: string,
  dataTypeName: string,
  startMs: number,
  endMs: number,
  bucketMs: number,
) {
  const res = await fetch(`${GOOGLE_FIT_BASE}/dataset:aggregate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aggregateBy: [{ dataTypeName }],
      bucketByTime: { durationMillis: bucketMs },
      startTimeMillis: startMs,
      endTimeMillis: endMs,
    }),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error(`[GFit] ${dataTypeName} error ${res.status}:`, errText)
    throw new Error(`Google Fit error: ${res.status}`)
  }
  const json = await res.json()
  // Log raw response for debugging
  const bucketCount = json.bucket?.length || 0
  const pointCount = json.bucket?.reduce((sum: number, b: { dataset: Array<{ point: unknown[] }> }) =>
    sum + (b.dataset?.[0]?.point?.length || 0), 0) || 0
  console.log(`[GFit] ${dataTypeName}: ${bucketCount} buckets, ${pointCount} points`)
  if (pointCount > 0 && json.bucket?.[0]?.dataset?.[0]?.point?.[0]) {
    console.log(`[GFit] ${dataTypeName} sample point:`, JSON.stringify(json.bucket[0].dataset[0].point[0]))
  }
  return json
}

/** Extract daily int totals from aggregate buckets */
function dailyInts(buckets: Array<{ dataset: Array<{ point: Array<{ value: Array<{ intVal?: number }> }> }> }>): number[] {
  return buckets.map((b) => {
    let sum = 0
    for (const p of b.dataset?.[0]?.point || []) sum += p.value?.[0]?.intVal || 0
    return sum
  })
}

/** Extract daily float totals */
function dailyFloats(buckets: Array<{ dataset: Array<{ point: Array<{ value: Array<{ fpVal?: number }> }> }> }>): number[] {
  return buckets.map((b) => {
    let sum = 0
    for (const p of b.dataset?.[0]?.point || []) sum += p.value?.[0]?.fpVal || 0
    return sum
  })
}

/** Average of first N non-zero values (baseline period) */
function avgFirst(values: number[], n: number): number | undefined {
  const valid = values.slice(0, n).filter((v) => v > 0)
  if (valid.length === 0) return undefined
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

/** Average of last N non-zero values (current period) */
function avgLast(values: number[], n: number): number | undefined {
  const valid = values.slice(-n).filter((v) => v > 0)
  if (valid.length === 0) return undefined
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

// ── Main trends fetch ──

export async function fetchHealthTrends(
  accessToken: string,
  programStartDate?: string,
  programEndDate?: string,
): Promise<HealthTrends> {
  const now = Date.now()

  const programStart = programStartDate
    ? new Date(programStartDate).getTime()
    : new Date('2025-11-01').getTime()
  const dataStart = programStart
  const dataEnd = programEndDate
    ? new Date(programEndDate).getTime()
    : now
  const programDays = Math.max(1, Math.floor((dataEnd - programStart) / DAY_MS))

  console.log(`[GFit] Fetching data from ${new Date(dataStart).toISOString()} to ${new Date(dataEnd).toISOString()} (program day ${programDays})`)

  const [stepsRes, hrRes, activeMinsRes, distRes, sleepRes, profileRes] =
    await Promise.allSettled([
      aggregate(accessToken, 'com.google.step_count.delta', dataStart, dataEnd, DAY_MS),
      aggregate(accessToken, 'com.google.heart_rate.bpm', dataStart, dataEnd, DAY_MS),
      aggregate(accessToken, 'com.google.active_minutes', dataStart, dataEnd, DAY_MS),
      aggregate(accessToken, 'com.google.distance.delta', dataStart, dataEnd, DAY_MS),
      aggregate(accessToken, 'com.google.sleep.segment', dataEnd - DAY_MS, dataEnd, DAY_MS * 2),
      fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => (r.ok ? r.json() : null)),
    ])

  // ── Steps ──
  let stepsToday: number | undefined
  let avgDailyStepsCurrent: number | undefined
  let avgDailyStepsBaseline: number | undefined
  let totalSteps: number | undefined

  if (stepsRes.status === 'fulfilled') {
    const days = dailyInts(stepsRes.value.bucket || [])
    stepsToday = days[days.length - 1] || 0
    totalSteps = days.reduce((a, b) => a + b, 0)
    avgDailyStepsBaseline = avgFirst(days, 7)
    avgDailyStepsCurrent = avgLast(days, 7)
  }

  // ── Heart Rate ──
  let currentRestingHR: number | undefined
  let baselineRestingHR: number | undefined

  if (hrRes.status === 'fulfilled') {
    const buckets = hrRes.value.bucket || []
    // For each day, min HR ≈ resting HR (value[2] = min in aggregated HR)
    const dailyMinHR = buckets
      .map((b: { dataset: Array<{ point: Array<{ value: Array<{ fpVal?: number }> }> }> }) => {
        const points = b.dataset?.[0]?.point || []
        if (points.length === 0) return 0
        return Math.round(points[0].value?.[2]?.fpVal || points[0].value?.[0]?.fpVal || 0)
      })
      .filter((v: number) => v > 0)

    baselineRestingHR = avgFirst(dailyMinHR, 7)
    currentRestingHR = avgLast(dailyMinHR, 7)
  }

  // ── Active Minutes ──
  let activeMinutesToday: number | undefined
  let avgActiveBaseline: number | undefined
  let avgActiveCurrent: number | undefined
  let totalActiveMinutes: number | undefined

  if (activeMinsRes.status === 'fulfilled') {
    const days = dailyInts(activeMinsRes.value.bucket || [])
    activeMinutesToday = days[days.length - 1] || 0
    totalActiveMinutes = days.reduce((a, b) => a + b, 0)
    avgActiveBaseline = avgFirst(days, 7)
    avgActiveCurrent = avgLast(days, 7)
  }

  // ── Distance ──
  let totalDistance: number | undefined
  if (distRes.status === 'fulfilled') {
    const days = dailyFloats(distRes.value.bucket || [])
    totalDistance = Math.round(days.reduce((a, b) => a + b, 0))
  }

  // ── Sleep (today only) ──
  let sleepMinutes: number | undefined
  if (sleepRes.status === 'fulfilled') {
    const points = sleepRes.value.bucket?.[0]?.dataset?.[0]?.point || []
    let totalNanos = 0
    for (const p of points) {
      const stage = p.value?.[0]?.intVal
      if (stage && stage !== 3) {
        // exclude "out of bed" (3)
        totalNanos += parseInt(p.endTimeNanos) - parseInt(p.startTimeNanos)
      }
    }
    if (totalNanos > 0) sleepMinutes = Math.round(totalNanos / 1e9 / 60)
  }

  // ── Profile ──
  let profile: { name: string; picture: string } | undefined
  if (profileRes.status === 'fulfilled' && profileRes.value) {
    profile = {
      name: profileRes.value.name || '',
      picture: profileRes.value.picture || '',
    }
  }

  // ── Compute deltas ──
  const deltaHR =
    currentRestingHR != null && baselineRestingHR != null
      ? currentRestingHR - baselineRestingHR
      : undefined

  const deltaSteps =
    avgDailyStepsCurrent != null && avgDailyStepsBaseline != null
      ? avgDailyStepsCurrent - avgDailyStepsBaseline
      : undefined

  const deltaActive =
    avgActiveCurrent != null && avgActiveBaseline != null
      ? avgActiveCurrent - avgActiveBaseline
      : undefined

  return {
    current: {
      restingHR: currentRestingHR,
      stepsToday,
      avgDailySteps: avgDailyStepsCurrent,
      activeMinutes: activeMinutesToday,
      sleepMinutes,
    },
    baseline: {
      avgRestingHR: baselineRestingHR,
      avgDailySteps: avgDailyStepsBaseline,
      avgActiveMinutes: avgActiveBaseline,
    },
    deltas: {
      restingHR: deltaHR,
      dailySteps: deltaSteps,
      activeMinutes: deltaActive,
    },
    totals: {
      totalSteps,
      totalActiveMinutes,
      totalDistance,
      programDays,
    },
    profile,
  }
}
