/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import PropTypes from 'prop-types';
import React from 'react';
import { requireNativeComponent, findNodeHandle } from 'react-native';
import { NativeFunction } from '../utils/Bridge';

//TODO: 중요한 컴포넌트! Wrapper for the video tile UI component.
export class RNVideoRenderView extends React.Component {

  componentDidMount() {
    // 우리는 비디오 바인드하는데 딜레이를 줘야한다.
    // 왜냐하면 초기 렌더링이 발생하고 즉시, componentDidMount는 불릴 것이다.
    // 이것은 RCTUIManager가 해당 VideoView를 추가하기 *전*입니다. (ios는 네이티브의 viewForReactTag()가 View를 돌려줄것이다, android는 그걸 못하니깐, @ReactProp(name = "tileId") 활용)
    // 그래서, 우리는 이 함수가 완료된 이후에, bindVideoView를 발생시킬 필요가 있다.
    setTimeout(() => {
      //findNodeHandle를 통해서, 이 태그를 네이티브에서 찾을 수 있다. (TagId를 넘기는 것과 같다고 볼수있다.)
      NativeFunction.bindVideoView(findNodeHandle(this), this.props.tileId);
    });
  }

  componentWillUnmount() {
    NativeFunction.unbindVideoView(this.props.tileId);
  }

  render() {
    return <RNVideoRenderViewNative {...this.props} />;
  }
}

RNVideoRenderView.propTypes = {
  /**
   * A int value to identifier the Video view, will be used to bind video stream later
   */
  tileId: PropTypes.number,
};

var RNVideoRenderViewNative = requireNativeComponent('RNVideoView', RNVideoRenderView);
