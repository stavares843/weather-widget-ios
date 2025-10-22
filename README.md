# Weather Widget iOS (Expo + iOS Widget)
A React Native (Expo) application with an iOS Widget Extension that displays current weather information and supports Live Activity updates. The project includes a native iOS widget target integrated with the JS app via a small native bridge.

## Features
- Expo-managed React Native app
- Current weather via API
- Location-based weather lookup (with user permission)
- iOS Widget Extension (WidgetKit) with shared data
- Live Activity support (ActivityKit)

## Setup
   - npm install
   - npx expo prebuild -p ios 

## Running the App
- Development:
  - npx expo start
  - iOS Simulator: press i when Metro starts, or open in Expo Go
- Prebuilt iOS (needed for widget):
  - npx expo prebuild -p ios
  - Open ios/WeatherApp.xcworkspace in Xcode
  - Select WeatherApp scheme and run on a simulator/device

<p align="center">
  <img src="https://github.com/user-attachments/assets/f3928328-2c93-4d8e-9fa4-68b3b831b304" 
       alt="Demo GIF" 
       height="700px" 
       style="border-radius:10px;"/>
</p>


## Notes
- WidgetDataModule.swift/.m exposes a module to JS for updating data accessible to the widget
- withWidgetModule.js config plugin ensures the module + targets are added during prebuild


## License
MIT
