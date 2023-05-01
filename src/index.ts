import fetch from "node-fetch"
import { DateTime } from "luxon"
import notifier from "node-notifier"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface PrayerTime {
  name: string
  time: string
}

interface PrayerTimeResponse {
  data: {
    timings: {
      Fajr: string
      Dhuhr: string
      Asr: string
      Maghrib: string
      Isha: string
    }
  }
}

const isPrayerTimesResponse = (data: any): data is PrayerTimeResponse => {
  if (!data || !data.data || !data.data.timings) {
    return false
  }

  const timings = data.data.timings

  return (
    typeof timings.Fajr === "string" &&
    typeof timings.Dhuhr === "string" &&
    typeof timings.Asr === "string" &&
    typeof timings.Maghrib === "string" &&
    typeof timings.Isha === "string"
  )
}

const getPrayerTimes = async (
  city: string,
  country: string,
  method: number
): Promise<PrayerTime[]> => {
  const url = new URL("http://api.aladhan.com/v1/timingsByCity")
  url.searchParams.append("city", city)
  url.searchParams.append("country", country)
  url.searchParams.append("method", method.toString())

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
  }

  const responseData = await response.json()

  if (!isPrayerTimesResponse(responseData)) {
    throw new Error("Unexpected response format")
  }

  const timings = responseData.data.timings

  const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const

  return prayers.map((prayer) => ({
    name: prayer,
    time: DateTime.fromISO(timings[prayer], {
      zone: "Europe/Helsinki",
    }).toLocaleString(DateTime.TIME_SIMPLE),
  }))
}

const notify = (prayerTime: PrayerTime) => {
  notifier.notify({
    title: "Prayer Time",
    message: `It's time for ${prayerTime.name} prayer (${prayerTime.time})`,
    icon: path.join(__dirname, "prayer.jpg"),
    sound: true,
    wait: true,
  })
}

;(async () => {
  console.log("Running the server")
  try {
    const city = "Helsinki"
    const country = "Finland"
    const method = 2

    const prayerTimes = await getPrayerTimes(city, country, method)

    // Notify when it's time for each prayer
    prayerTimes.forEach((prayerTime) => {
      const prayerTimeDateTime = DateTime.fromISO(prayerTime.time, {
        zone: "Europe/Helsinki",
      })

      const nowDateTime = DateTime.now().setZone("Europe/Helsinki")

      if (prayerTimeDateTime <= nowDateTime) {
        notify(prayerTime)
      } else {
        const timeDiff = prayerTimeDateTime.diff(nowDateTime, "milliseconds")

        setTimeout(() => {
          if (DateTime.now().setZone("Europe/Helsinki") >= prayerTimeDateTime) {
            notify(prayerTime)
          }
        }, timeDiff.milliseconds)
      }
    })

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prayerTimes }),
    }
  } catch (error: unknown) {
    console.error(error)

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    }
  }
})()
