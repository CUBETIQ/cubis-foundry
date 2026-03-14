# Example: Turbo Module for Custom Camera with TypeScript Codegen

## Scenario

A team is building a document scanning feature in their React Native app. The built-in camera APIs do not provide sufficient control over autofocus, exposure, and real-time frame processing. They need a Turbo Module that exposes native camera controls to JavaScript with synchronous access via JSI, a TypeScript codegen spec for type-safe bindings, and platform implementations in Objective-C++ (iOS) and Kotlin (Android). The module must integrate with the new architecture (Fabric + Turbo Modules).

## Prompt

"Build a Turbo Module for camera control with functions to start/stop the camera, set focus point, adjust exposure compensation, and capture a frame as a base64 image. Use TypeScript codegen spec for type-safe bindings. Implement for both iOS (Objective-C++) and Android (Kotlin). The module should use JSI for synchronous access to camera state."

## Expected Output

### TypeScript Codegen Spec

```typescript
// specs/NativeDocScanner.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Camera lifecycle
  startCamera(surfaceId: number): Promise<boolean>;
  stopCamera(): void;

  // Camera controls (synchronous via JSI)
  setFocusPoint(x: number, y: number): void;
  setExposureCompensation(value: number): void;
  getExposureCompensation(): number;

  // Capture
  captureFrame(quality: number): Promise<string>; // returns base64

  // State
  isCameraActive(): boolean;

  // Events
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DocScanner');
```

### iOS Implementation (Objective-C++)

```objc
// ios/DocScannerModule.h
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#import <DocScannerSpec/DocScannerSpec.h>

@interface DocScannerModule : NSObject <NativeDocScannerSpec>
@end
```

```objc
// ios/DocScannerModule.mm
#import "DocScannerModule.h"
#import <AVFoundation/AVFoundation.h>
#import <React/RCTBridge+Private.h>

@interface DocScannerModule () <AVCaptureVideoDataOutputSampleBufferDelegate>
@property (nonatomic, strong) AVCaptureSession *captureSession;
@property (nonatomic, strong) AVCaptureDevice *captureDevice;
@property (nonatomic, strong) AVCaptureVideoDataOutput *videoOutput;
@property (nonatomic, assign) BOOL isActive;
@property (nonatomic, strong) CMSampleBufferRef latestBuffer;
@end

@implementation DocScannerModule

RCT_EXPORT_MODULE(DocScanner)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeDocScannerSpecJSI>(params);
}

- (void)startCamera:(double)surfaceId
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
    self.captureSession = [[AVCaptureSession alloc] init];
    self.captureSession.sessionPreset = AVCaptureSessionPresetHigh;

    self.captureDevice = [AVCaptureDevice defaultDeviceWithMediaType:AVMediaTypeVideo];
    NSError *error = nil;
    AVCaptureDeviceInput *input =
      [AVCaptureDeviceInput deviceInputWithDevice:self.captureDevice error:&error];

    if (error) {
      reject(@"CAMERA_ERROR", error.localizedDescription, error);
      return;
    }

    [self.captureSession addInput:input];

    self.videoOutput = [[AVCaptureVideoDataOutput alloc] init];
    [self.videoOutput setSampleBufferDelegate:self
                                       queue:dispatch_get_global_queue(0, 0)];
    [self.captureSession addOutput:self.videoOutput];

    [self.captureSession startRunning];
    self.isActive = YES;
    resolve(@(YES));
  });
}

- (void)stopCamera {
  [self.captureSession stopRunning];
  self.isActive = NO;
}

// Synchronous JSI -- no bridge serialization
- (void)setFocusPoint:(double)x y:(double)y {
  if ([self.captureDevice lockForConfiguration:nil]) {
    if ([self.captureDevice isFocusPointOfInterestSupported]) {
      self.captureDevice.focusPointOfInterest = CGPointMake(x, y);
      self.captureDevice.focusMode = AVCaptureFocusModeAutoFocus;
    }
    [self.captureDevice unlockForConfiguration];
  }
}

- (void)setExposureCompensation:(double)value {
  if ([self.captureDevice lockForConfiguration:nil]) {
    float clamped = MAX(self.captureDevice.minExposureTargetBias,
                        MIN((float)value, self.captureDevice.maxExposureTargetBias));
    [self.captureDevice setExposureTargetBias:clamped completionHandler:nil];
    [self.captureDevice unlockForConfiguration];
  }
}

- (NSNumber *)getExposureCompensation {
  return @(self.captureDevice.exposureTargetBias);
}

- (NSNumber *)isCameraActive {
  return @(self.isActive);
}

- (void)captureFrame:(double)quality
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  // Capture current frame from the video output buffer
  // Convert to JPEG and return base64
  resolve(@"base64_encoded_image_data");
}

@end
```

### Android Implementation (Kotlin)

```kotlin
// android/src/main/java/com/docscanner/DocScannerModule.kt
package com.docscanner

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import android.hardware.camera2.*
import android.util.Base64

@ReactModule(name = DocScannerModule.NAME)
class DocScannerModule(reactContext: ReactApplicationContext) :
    NativeDocScannerSpec(reactContext), TurboModule {

    private var cameraDevice: CameraDevice? = null
    private var captureSession: CameraCaptureSession? = null
    private var isActive = false
    private var exposureCompensation = 0.0

    companion object {
        const val NAME = "DocScanner"
    }

    override fun getName(): String = NAME

    override fun startCamera(surfaceId: Double, promise: Promise) {
        val cameraManager = reactApplicationContext
            .getSystemService(CameraManager::class.java)

        val cameraId = cameraManager.cameraIdList.firstOrNull { id ->
            val characteristics = cameraManager.getCameraCharacteristics(id)
            characteristics.get(CameraCharacteristics.LENS_FACING) ==
                CameraCharacteristics.LENS_FACING_BACK
        }

        if (cameraId == null) {
            promise.reject("CAMERA_ERROR", "No back camera found")
            return
        }

        cameraManager.openCamera(cameraId, object : CameraDevice.StateCallback() {
            override fun onOpened(camera: CameraDevice) {
                cameraDevice = camera
                isActive = true
                promise.resolve(true)
            }

            override fun onDisconnected(camera: CameraDevice) {
                camera.close()
                isActive = false
            }

            override fun onError(camera: CameraDevice, error: Int) {
                promise.reject("CAMERA_ERROR", "Camera error: $error")
            }
        }, null)
    }

    override fun stopCamera() {
        captureSession?.close()
        cameraDevice?.close()
        isActive = false
    }

    // Synchronous via JSI -- called directly without bridge
    override fun setFocusPoint(x: Double, y: Double) {
        // Configure autofocus region using MeteringRectangle
    }

    override fun setExposureCompensation(value: Double) {
        exposureCompensation = value
        // Apply to capture request builder
    }

    override fun getExposureCompensation(): Double = exposureCompensation

    override fun isCameraActive(): Boolean = isActive

    override fun captureFrame(quality: Double, promise: Promise) {
        // Capture frame from ImageReader, encode as base64
        promise.resolve("base64_encoded_image_data")
    }

    override fun addListener(eventName: String?) {}
    override fun removeListeners(count: Double) {}
}
```

### Package Registration

```kotlin
// android/src/main/java/com/docscanner/DocScannerPackage.kt
package com.docscanner

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.module.model.ReactModuleInfo

class DocScannerPackage : TurboReactPackage() {
    override fun getModule(name: String, context: ReactApplicationContext): NativeModule? {
        return if (name == DocScannerModule.NAME) DocScannerModule(context) else null
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                DocScannerModule.NAME to ReactModuleInfo(
                    DocScannerModule.NAME,
                    DocScannerModule.NAME,
                    false, false, true, false, true
                )
            )
        }
    }
}
```

### JavaScript Usage

```typescript
// hooks/useDocScanner.ts
import { useCallback, useRef, useState } from 'react';
import DocScanner from '../specs/NativeDocScanner';

export function useDocScanner() {
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(async (surfaceId: number) => {
    const result = await DocScanner.startCamera(surfaceId);
    setIsActive(result);
    return result;
  }, []);

  const stop = useCallback(() => {
    DocScanner.stopCamera(); // synchronous
    setIsActive(false);
  }, []);

  const setFocus = useCallback((x: number, y: number) => {
    DocScanner.setFocusPoint(x, y); // synchronous via JSI
  }, []);

  const capture = useCallback(async (quality = 0.8) => {
    return DocScanner.captureFrame(quality);
  }, []);

  // Synchronous read -- no async overhead
  const getExposure = useCallback(() => {
    return DocScanner.getExposureCompensation();
  }, []);

  return { start, stop, setFocus, capture, getExposure, isActive };
}
```

## Key Decisions

- **Turbo Module over legacy Native Module** -- JSI provides synchronous access to camera state (exposure, focus) without bridge serialization, which is critical for real-time camera controls that users adjust via gestures.
- **TypeScript codegen spec** -- generates type-safe C++ and Java/Kotlin bindings from the spec, catching type mismatches at build time rather than runtime.
- **Synchronous functions for controls, async for lifecycle** -- `setFocusPoint` and `getExposureCompensation` are synchronous because they must respond to touch events without frame drops. `startCamera` and `captureFrame` are async because they involve I/O.
- **Platform-specific camera APIs** -- uses AVFoundation on iOS and Camera2 on Android directly, providing full control over camera hardware that cross-platform abstractions do not expose.
- **TurboReactPackage registration** -- uses the new architecture package registration instead of `ReactPackage`, enabling lazy module initialization for faster app startup.
