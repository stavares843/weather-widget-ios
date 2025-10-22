import Foundation
import WidgetKit

@objc(WidgetDataModule)
class WidgetDataModule: NSObject {
  
  private let appGroupId = "group.com.weatherapp.shared"
  private let widgetDataKey = "widget_weather_data"
  
  @objc
  func saveToAppGroup(_ data: String, resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupId) else {
      print("❌ WidgetDataModule: Failed to access App Group '\(appGroupId)'")
      rejecter("ERROR", "Failed to access App Group", nil)
      return
    }
    
    sharedDefaults.set(data, forKey: widgetDataKey)
    sharedDefaults.synchronize()
    print("✅ WidgetDataModule: Data saved to App Group")
    print("📦 Data: \(data)")
    
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
}