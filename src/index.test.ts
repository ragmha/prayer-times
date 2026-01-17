import { getPrayerTimes } from "./index"

describe("getPrayerTimes", () => {
  it("returns an array of prayer times", async () => {
    const prayerTimes = await getPrayerTimes("Helsinki", "Finland", 2)

    expect(prayerTimes).toHaveLength(5)

    expect(prayerTimes[0]).toHaveProperty("name", "Fajr")
    expect(prayerTimes[0]).toHaveProperty("time")

    expect(prayerTimes[1]).toHaveProperty("name", "Dhuhr")
    expect(prayerTimes[1]).toHaveProperty("time")

    expect(prayerTimes[2]).toHaveProperty("name", "Asr")
    expect(prayerTimes[2]).toHaveProperty("time")

    expect(prayerTimes[3]).toHaveProperty("name", "Maghrib")
    expect(prayerTimes[3]).toHaveProperty("time")

    expect(prayerTimes[4]).toHaveProperty("name", "Isha")
    expect(prayerTimes[4]).toHaveProperty("time")
  })

  it("throws an error if the API response is not in the expected format", async () => {
    const getPrayerTimesPromise = getPrayerTimes(
      "InvalidCity",
      "InvalidCountry",
      2
    )

    await expect(getPrayerTimesPromise).rejects.toThrow(
      "Unexpected response format"
    )
  })

  it("throws an error if the API request fails", async () => {
    const getPrayerTimesPromise = getPrayerTimes("Helsinki", "Finland", 999)

    await expect(getPrayerTimesPromise).rejects.toThrow(
      "HTTP error 400: Bad Request"
    )
  })
})
