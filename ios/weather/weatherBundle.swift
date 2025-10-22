//
//  weatherBundle.swift
//  weather
//
//  Created by Sara on 07/10/2025.
//

import WidgetKit
import SwiftUI

@main
struct weatherBundle: WidgetBundle {
    var body: some Widget {
        WeatherWidget()
        weatherLiveActivity()
    }
}
