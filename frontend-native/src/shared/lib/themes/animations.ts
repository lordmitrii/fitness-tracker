import { Animated } from 'react-native';

export const animationDurations = {
  fast: 200, // fade-in
  normal: 600, // shake, slide-down-in
  slow: 1200, // spin-slow
  verySlow: 2200, // slide-up-out
};

export const easing = {
  easeOut: 'ease-out',
  linear: 'linear',
  cubicBezier: 'cubic-bezier(0.16, 1, 0.3, 1)', // Used in slide animations
};

export const createShakeAnimation = () => {
  const shakeValue = new Animated.Value(0);

  const shake = () => {
    shakeValue.setValue(0);
    Animated.sequence([
      Animated.timing(shakeValue, {
        toValue: -3,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeValue, {
        toValue: 3,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeValue, {
        toValue: -3,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeValue, {
        toValue: 3,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeValue, {
        toValue: -3,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeValue, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    shake,
    translateX: shakeValue,
  };
};

export const createFadeInAnimation = () => {
  const fadeValue = new Animated.Value(0);

  const fadeIn = () => {
    fadeValue.setValue(0);
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: animationDurations.fast,
      useNativeDriver: true,
    }).start();
  };

  return {
    fadeIn,
    opacity: fadeValue,
  };
};

export const createSlideDownAnimation = () => {
  const slideValue = new Animated.Value(-100);

  const slideDown = () => {
    slideValue.setValue(-100);
    Animated.timing(slideValue, {
      toValue: 0,
      duration: animationDurations.normal,
      easing: easing.cubicBezier as any,
      useNativeDriver: true,
    }).start();
  };

  return {
    slideDown,
    translateY: slideValue,
  };
};

export const createSpinAnimation = () => {
  const spinValue = new Animated.Value(0);

  const spin = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: animationDurations.slow,
        easing: easing.linear as any,
        useNativeDriver: true,
      })
    ).start();
  };

  const stop = () => {
    spinValue.stopAnimation();
  };

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return {
    spin,
    stop,
    rotate,
  };
};

