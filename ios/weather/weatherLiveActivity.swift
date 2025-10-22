//
//  weatherLiveActivity.swift
//  weather
//
//  Created by Sara on 07/10/2025.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct weatherAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct weatherLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: weatherAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension weatherAttributes {
    fileprivate static var preview: weatherAttributes {
        weatherAttributes(name: "World")
    }
}

extension weatherAttributes.ContentState {
    fileprivate static var smiley: weatherAttributes.ContentState {
        weatherAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: weatherAttributes.ContentState {
         weatherAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: weatherAttributes.preview) {
   weatherLiveActivity()
} contentStates: {
    weatherAttributes.ContentState.smiley
    weatherAttributes.ContentState.starEyes
}
