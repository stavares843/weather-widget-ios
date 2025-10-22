const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withWidgetModule(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosRoot = path.join(config.modRequest.projectRoot, 'ios');
      const weatherAppDir = path.join(iosRoot, 'WeatherApp');
      
      // Ensure directory exists
      if (!fs.existsSync(weatherAppDir)) {
        fs.mkdirSync(weatherAppDir, { recursive: true });
      }
      
      // Create WidgetDataModule.swift
      const swiftContent = `import Foundation
import WidgetKit

@objc(WidgetDataModule)
class WidgetDataModule: NSObject {
  
  private let appGroupId = "group.com.weatherapp.shared"
  private let widgetDataKey = "widget_weather_data"
  
  @objc
  func saveToAppGroup(_ data: String, resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupId) else {
      print("❌ WidgetDataModule: Failed to access App Group '\\(appGroupId)'")
      rejecter("ERROR", "Failed to access App Group", nil)
      return
    }
    
    sharedDefaults.set(data, forKey: widgetDataKey)
    sharedDefaults.synchronize()
    print("✅ WidgetDataModule: Data saved to App Group")
    print("📦 Data: \\(data)")
    
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
      print("🔄 WidgetDataModule: Triggered widget reload")
    }
    
    resolver(true)
  }
  
  @objc
  func loadFromAppGroup(_ resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupId) else {
      rejecter("ERROR", "Failed to access App Group", nil)
      return
    }
    
    let data = sharedDefaults.string(forKey: widgetDataKey)
    resolver(data)
  }
  
  @objc
  func reloadWidgets(_ resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
      print("🔄 WidgetDataModule: Manual widget reload triggered")
      resolver(true)
    } else {
      rejecter("ERROR", "WidgetKit not available on iOS < 14.0", nil)
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}`;

      // Create WidgetDataModule.m
      const mContent = `#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetDataModule, NSObject)

RCT_EXTERN_METHOD(saveToAppGroup:(NSString *)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(loadFromAppGroup:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(reloadWidgets:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end`;

      // Write files
      fs.writeFileSync(path.join(weatherAppDir, 'WidgetDataModule.swift'), swiftContent);
      fs.writeFileSync(path.join(weatherAppDir, 'WidgetDataModule.m'), mContent);
      
      console.log('✅ Created WidgetDataModule files');
      console.log('⚠️  You must manually add these files to Xcode:');
      console.log('   1. Open ios/WeatherApp.xcworkspace in Xcode');
      console.log('   2. Right-click WeatherApp folder → Add Files');
      console.log('   3. Select WidgetDataModule.swift and WidgetDataModule.m');
      console.log('   4. Make sure "WeatherApp" target is checked');
      
      return config;
    },
  ]);
};
