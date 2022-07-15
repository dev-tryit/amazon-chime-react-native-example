/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  Alert,
  Text
} from 'react-native';
import { Login } from './containers/Login';
import { Meeting } from './containers/Meeting';
import { createMeetingRequest } from './utils/Api';
import { getSDKEventEmitter, MobileSDKEvent, NativeFunction } from './utils/Bridge';
import styles from './Style';

//TODO:나중에참고
class App extends React.Component {
  constructor() {
    super();

    this.state = {
      isInMeeting: false,
      isLoading: false,
      meetingTitle: '',
      selfAttendeeId: ''
    }
  }

  componentDidMount() {
    this.onMeetingStartSubscription = getSDKEventEmitter().addListener(MobileSDKEvent.OnMeetingStart, () => {
      this.setState({ isInMeeting: true, isLoading: false });
    });

    this.onMeetingEndSubscription = getSDKEventEmitter().addListener(MobileSDKEvent.OnMeetingEnd, () => {
      this.setState({ isInMeeting: false, isLoading: false });
    });

    this.onErrorSubscription = getSDKEventEmitter().addListener(MobileSDKEvent.OnError, (message) => {
      Alert.alert("SDK Error", message);
    });
  }

  componentWillUnmount() {
    if (this.onMeetingEndSubscription) {
      this.onMeetingEndSubscription.remove();
    }
    if (this.onMeetingStartSubscription) {
      this.onMeetingStartSubscription.remove();
    }
    if (this.onErrorSubscription) {
      this.onErrorSubscription.remove();
    }
  }

  initializeMeetingSession = (meetingName, userName) => {
    this.setState({
      isLoading: true,
    })

    //TODO: 1. 일단 startMeeting이 중요
    
    //TODO: 7. 마지막 stopMeeting이 중요
    //TODO: createMeetingRequest를 통해 해당 meetingName, userName으로 접속.
    createMeetingRequest(meetingName, userName).then(meetingResponse => {
      this.setState({
        meetingTitle: meetingName,
        selfAttendeeId: meetingResponse.JoinInfo.Attendee.Attendee.AttendeeId
      })
      //TODO: NativeFunction.startMeeting, NativeFunction.stopMeeting, NativeFunction.bindVideoView, NativeFunction.unbindVideoView, NativeFunction.setMute, NativeFunction.setCameraOn 활용가능.
      //TODO: 서버에서 응답을 잘 주면, Meeting과 Attendee를 잘 넣으면 된다.
      /*TODO: 다음동작
      1. AMAJONE CHIME과 MeetingSession 연결
      2. Amazon Chime SDK events를 주시하고 있는 AudioVideoObserver 만들기.
      3. MeetingSession.AudioVideo.start() 시작.
      4. 미팅이 시작될 떄, 네이티브에 onAudioSessionStarted를 줄것임. -> RN은 OnMeetingStart 로 변환되서 받는다.
      */
      NativeFunction.startMeeting(meetingResponse.JoinInfo.Meeting.Meeting, meetingResponse.JoinInfo.Attendee.Attendee);
    }).catch(error => {
      Alert.alert("미팅을 찾을 수 없습니다.", `미팅을 찾을 수 없네요. 권한이 만료되었거나, 미팅이 끝났을 수 있습니다.\n ${error}`);
      this.setState({ isLoading: false });
    });
  }

  renderRoute() {
    if (this.state.isInMeeting) {
      return <Meeting meetingTitle={this.state.meetingTitle} selfAttendeeId={this.state.selfAttendeeId} />;
    } else {
      return <Login isLoading={this.state.isLoading} onSubmit={(meetingName, userName) => this.initializeMeetingSession(meetingName, userName)} />;
    }
  }

  render() {
    return (
      <React.Fragment>
        <StatusBar />
        <SafeAreaView>
          { this.renderRoute() }
        </SafeAreaView>
      </React.Fragment>
    );
  }
}
export default App;
