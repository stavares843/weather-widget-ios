//
//  weather.swift
//  weather
//
//  Created by Sara on 07/10/2025.
//

import WidgetKit
import SwiftUI

// MARK: - Constants

private let APP_GROUP_ID = "group.com.weatherapp.shared"
private let WEATHER_KEY  = "widget_weather_data"

// MARK: - Data Models

struct WeatherData: Codable {
    let city: String
    let temp: Double
    let emoji: String
    let updatedAt: Date
}

struct WeatherEntry: TimelineEntry {
    let date: Date
    let city: String
    let temperature: Int
    let emoji: String
    let lastUpdated: Date

    static var placeholder: WeatherEntry {
        WeatherEntry(
            date: Date(),
            city: "Loading...",
            temperature: 0,
            emoji: "☀️",
            lastUpdated: Date()
        )
    }
}

// MARK: - Timeline Provider

struct WeatherProvider: TimelineProvider {

    func placeholder(in context: Context) -> WeatherEntry {
        .placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (WeatherEntry) -> Void) {
        if context.isPreview {
            completion(.placeholder)
            return
        }
        completion(loadWeatherData() ?? .placeholder)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WeatherEntry>) -> Void) {
        let now = Date()
        if let entry = loadWeatherData() {
            let next = Calendar.current.date(byAdding: .minute, value: 15, to: now)!
            completion(Timeline(entries: [entry], policy: .after(next)))
        } else {
            let next = Calendar.current.date(byAdding: .minute, value: 1, to: now)!
            completion(Timeline(entries: [.placeholder], policy: .after(next)))
        }
    }

    // MARK: - Load Weather Data

    private func loadWeatherData() -> WeatherEntry? {
        guard let ud = UserDefaults(suiteName: APP_GROUP_ID) else {
            print("❌ UserDefaults(suiteName:) is nil — check App Group entitlements/Team on BOTH targets.")
            return nil
        }

        let payloadData: Data?
        if let d = ud.data(forKey: WEATHER_KEY) {
            payloadData = d
        } else if let s = ud.string(forKey: WEATHER_KEY)?.data(using: .utf8) {
            payloadData = s
        } else {
            print("⚠️ No value for key '\(WEATHER_KEY)' in suite \(APP_GROUP_ID)")
            return nil
        }

        do {
            let decoder = JSONDecoder()

            // Handle ISO8601 with optional fractional seconds
            let isoFrac = ISO8601DateFormatter()
            isoFrac.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            decoder.dateDecodingStrategy = .custom { dec in
                let c = try dec.singleValueContainer()
                let s = try c.decode(String.self)
                if let d = isoFrac.date(from: s) { return d }
                if let d = ISO8601DateFormatter().date(from: s) { return d }
                throw DecodingError.dataCorrupted(.init(
                    codingPath: c.codingPath,
                    debugDescription: "Invalid ISO8601 date: \(s)"
                ))
            }

            let w = try decoder.decode(WeatherData.self, from: payloadData!)
            return WeatherEntry(
                date: Date(),
                city: w.city,
                temperature: Int(w.temp.rounded()),
                emoji: w.emoji,
                lastUpdated: w.updatedAt
            )
        } catch {
            print("❌ Decode failed: \(error). Raw JSON: \(String(data: payloadData!, encoding: .utf8) ?? "<non-utf8>")")
            return nil
        }
    }
}

// MARK: - Widget View

struct WeatherWidgetView: View {
    var entry: WeatherEntry

    var body: some View {
        ZStack {
            // Background gradient (full-bleed)
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.4, green: 0.7, blue: 1.0),
                    Color(red: 0.2, green: 0.5, blue: 0.9)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 8) {
                // City name
                Text(entry.city)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)

                // Weather emoji
                Text(entry.emoji)
                    .font(.system(size: 40))

                // Temperature
                Text("\(entry.temperature)°")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)

                // Last updated
                Text("Updated \(timeAgo(from: entry.lastUpdated))")
                    .font(.system(size: 10))
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding()
        }
        // NOTE: Removed extra clipShape/background to prevent white side padding
    }

    // MARK: - Helper Functions

    private func timeAgo(from date: Date) -> String {
        let minutes = Int(Date().timeIntervalSince(date) / 60)
        if minutes < 1 {
            return "just now"
        } else if minutes < 60 {
            return "\(minutes)m ago"
        } else {
            let hours = minutes / 60
            return "\(hours)h ago"
        }
    }
}

// MARK: - Widget Configuration

struct WeatherWidget: Widget {
    let kind: String = "weather"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherProvider()) { entry in
            WeatherWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .contentMarginsDisabled() // ⟵ Removes the white padding on sides
        .configurationDisplayName("Weather")
        .description("Shows your local weather at a glance")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - Preview

#Preview(as: .systemSmall) {
    WeatherWidget()
} timeline: {
    WeatherEntry(
        date: .now,
        city: "San Francisco, US",
        temperature: 72,
        emoji: "☀️",
        lastUpdated: Date().addingTimeInterval(-300)
    )
    WeatherEntry(
        date: .now,
        city: "New York, US",
        temperature: 65,
        emoji: "🌧️",
        lastUpdated: Date().addingTimeInterval(-600)
    )
}
