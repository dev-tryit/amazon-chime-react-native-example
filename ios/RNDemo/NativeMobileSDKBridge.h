//
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
//TODO:IOS 종속성을 위해 추가된 파일 Functions that will be available in React Native through Native Module.
//IOS에서 직접적으로 Bridge 역할

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <AmazonChimeSDK/AmazonChimeSDK-Swift.h>

#define kMeetingId @"MeetingId"
#define kExternalMeetingId @"ExternalMeetingId"
#define kMediaRegion @"MediaRegion"

#define kAttendeeId @"AttendeeId"
#define kExternalUserId @"ExternalUserId"
#define kJoinToken @"JoinToken"

#define kMediaPlacement @"MediaPlacement"
#define kAudioFallbackUrl @"AudioFallbackUrl"
#define kAudioHostUrl @"AudioHostUrl"
#define kTurnControlUrl @"TurnControlUrl"
#define kSignalingUrl @"SignalingUrl"

@interface NativeMobileSDKBridge : RCTEventEmitter <RCTBridgeModule>
@end
