/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import React from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import styles from '../Style';
import { NativeFunction, getSDKEventEmitter, MobileSDKEvent, MeetingError } from '../utils/Bridge';
import { RNVideoRenderView } from '../components/RNVideoRenderView';
import { MuteButton } from '../components/MuteButton';
import { CameraButton } from '../components/CameraButton';
import { HangOffButton } from '../components/HangOffButton';
import { AttendeeItem } from '../components/AttendeeItem';

// Maps attendee Id to attendee Name
const attendeeNameMap = {};


//TODO:나중에참고
export class Meeting extends React.Component {
  constructor() {
    super();
    this.state = {
      attendees: [],
      videoTiles: [],
      mutedAttendee: [],
      selfVideoEnabled: false,//screenShareTile 이거 잘 이해안됨.
      meetingTitle: '',
      screenShareTile: null //screenShareTile 이거 잘 이해안됨.
    };
  }

  componentDidMount() {
    /**
     * Attendee Join and Leave handler
     */

    //TODO: MobileSDKEvent.OnAttendeesJoin 이벤트가 발생하면, 참석자가 들어온것이다.
    this.onAttendeesJoinSubscription = getSDKEventEmitter().addListener(MobileSDKEvent.OnAttendeesJoin, ({ attendeeId, externalUserId }) => {
      if (!(attendeeId in attendeeNameMap)) {
        // The externalUserId will be a format such as c19587e7#Alice
        attendeeNameMap[attendeeId] = externalUserId.split("#")[1];
      }
      this.setState((oldState) => ({ 
        ...oldState, 
        attendees: oldState.attendees.concat([attendeeId]) 
      }));
    });

    //TODO: MobileSDKEvent.OnAttendeesLeave 이벤트가 발생하면, 참석자가 나간것이다.
    this.onAttendeesLeaveSubscription = getSDKEventEmitter().addListener(MobileSDKEvent.OnAttendeesLeave, ({ attendeeId }) => {
      this.setState((oldState) => ({ 
        ...oldState,
        attendees: oldState.attendees.filter((attendeeToCompare => attendeeId != attendeeToCompare)) 
      }));
    });

    /**
     * Attendee Mute & Unmute handler
     */
    //TODO: MobileSDKEvent.OnAttendeesMute 이벤트가 발생하면, 참석자가 음소거 O.
    this.onAttendeesMuteSubscription = getSDKEventEmitter().addListener(MobileSDKEvent.OnAttendeesMute, attendeeId => {
      this.setState((oldState) => ({ 
        ...oldState, 
        mutedAttendee: oldState.mutedAttendee.concat([attendeeId]) 
      }));
    });

    //TODO: MobileSDKEvent.OnAttendeesUnmute 이벤트가 발생하면, 참석자가 음소거 X.
    this.onAttendeesUnmuteSubscription = getSDKEventEmitter().addListener(MobileSDKEvent.OnAttendeesUnmute, attendeeId => {
      this.setState((oldState) => ({ 
        ...oldState,
        mutedAttendee: oldState.mutedAttendee.filter((attendeeToCompare => attendeeId != attendeeToCompare)) 
      }));
    });

    /**
     * Video tile Add & Remove Handler
     */
    //TODO: MobileSDKEvent.OnAddVideoTile 이벤트가 발생하면, 비디오 타일 1명 추가?
    this.onAddVideoTileSubscription = getSDKEventEmitter().addListener(MobileSDKEvent.OnAddVideoTile, (tileState) => {
      if (tileState.isScreenShare) {
        this.setState(oldState => ({ 
          ...oldState, 
          screenShareTile: tileState.tileId
        }));
      } else {
        this.setState(oldState => ({ 
          ...oldState, 
          videoTiles: [...oldState.videoTiles, tileState.tileId],
          selfVideoEnabled: tileState.isLocal ? true : oldState.selfVideoEnabled
        }));
      }
    });

    //TODO: MobileSDKEvent.OnRemoveVideoTile 이벤트가 발생하면, 비디오 타일 1명 삭제?
    this.onRemoveVideoTileSubscription = getSDKEventEmitter().addListener(MobileSDKEvent.OnRemoveVideoTile, (tileState) => {
      if (tileState.isScreenShare) {
        this.setState(oldState => ({ 
          ...oldState, 
          screenShareTile: null
        }));
      } else {
        this.setState(oldState => ({ 
          ...oldState, 
          videoTiles: oldState.videoTiles.filter(tileIdToCompare => tileIdToCompare != tileState.tileId),
          selfVideoEnabled: tileState.isLocal ? false : oldState.selfVideoEnabled
        }));
      }

    });

    /**
     * Data message handler
     */
    //TODO: MobileSDKEvent.OnDataMessageReceive 이벤트가 발생하면, 데이터 메시지를 받은 것이다.
    this.onDataMessageReceivedSubscription = getSDKEventEmitter().addListener(MobileSDKEvent.OnDataMessageReceive, (dataMessage) => {
      const str = `Received Data message (topic: ${dataMessage.topic}) ${dataMessage.data} from ${dataMessage.senderAttendeeId}:${dataMessage.senderExternalUserId} at ${dataMessage.timestampMs} throttled: ${dataMessage.throttled}`;
      console.log(str);
      NativeFunction.sendDataMessage(dataMessage.topic, str, 1000);
    })
    

    /**
     * General Error handler
     */
    //TODO: MobileSDKEvent.OnError 이벤트가 발생하면, 에러를 받은 것이다.
    this.onErrorSubscription = getSDKEventEmitter().addListener(MobileSDKEvent.OnError, (errorType) => {
      switch(errorType) {
        case MeetingError.OnMaximumConcurrentVideoReached:
          Alert.alert("Failed to enable video", "maximum number of concurrent videos reached!");
          break;
        default:
          Alert.alert("Error", errorType);
          break;
      }
    });
  }

  componentWillUnmount() {
    if (this.onAttendeesJoinSubscription) {
      this.onAttendeesJoinSubscription.remove();
    }
    if (this.onAttendeesLeaveSubscription) {
      this.onAttendeesLeaveSubscription.remove();
    }
    if (this.onAttendeesMuteSubscription) {
      this.onAttendeesMuteSubscription.remove();
    }
    if (this.onAttendeesUnmuteSubscription) {
      this.onAttendeesUnmuteSubscription.remove();
    }
    if (this.onAddVideoTileSubscription) {
      this.onAddVideoTileSubscription.remove();
    }
    if (this.onRemoveVideoTileSubscription) {
      this.onRemoveVideoTileSubscription.remove();
    }
    if (this.onDataMessageReceivedSubscription) {
      this.onDataMessageReceivedSubscription.remove();
    }
    if (this.onErrorSubscription) {
      this.onErrorSubscription.remove();
    }
  }

  render() {
    const currentMuted = this.state.mutedAttendee.includes(this.props.selfAttendeeId);
    return (
      <View style={[styles.container, { justifyContent: 'flex-start' }]}>
        <Text style={styles.title}>{this.props.meetingTitle}</Text>
        <View style={styles.buttonContainer}>
          <MuteButton muted={currentMuted} onPress={() => NativeFunction.setMute(!currentMuted) }/>         
          <CameraButton disabled={this.state.selfVideoEnabled} onPress={() =>  NativeFunction.setCameraOn(!this.state.selfVideoEnabled)}/>
          <HangOffButton onPress={() => NativeFunction.stopMeeting()} />
        </View>
        <Text style={styles.title}>Video</Text>
        <View style={styles.videoContainer}>
          {
            //TODO: videoTiles 개수에 맞게 RNVideoRenderView가 그려짐. //videoTiles는 비디오 타일.
            this.state.videoTiles.length > 0 ? this.state.videoTiles.map(tileId => 
              <RNVideoRenderView style={styles.video} key={tileId} tileId={tileId} />
            ) : <Text style={styles.subtitle}>No one is sharing video at this moment</Text>
          }
        </View>
        {
            //TODO: screenShareTile이 있으면, 1개의 RNVideoRenderView가 그려짐. //내 비디오
          !!this.state.screenShareTile &&    
          <React.Fragment>
            <Text style={styles.title}>Screen Share</Text>
            <View style={styles.videoContainer}>
              <RNVideoRenderView style={styles.screenShare} key={this.state.screenShareTile} tileId={this.state.screenShareTile} />
            </View>
          </React.Fragment>
        }
        <Text style={styles.title}>Attendee</Text>
        {/* TODO:참석자들? */}
        <FlatList
          style={styles.attendeeList}
          data={this.state.attendees}
          renderItem={({ item }) => <AttendeeItem attendeeName={attendeeNameMap[item] ? attendeeNameMap[item] : item} muted={this.state.mutedAttendee.includes(item)}/>}
          keyExtractor={(item) => item}
        />
      </View>
    );
  }
}
