import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type LogoAnimationProps = {
  size?: number;
  color?: string;
  onAnimationComplete?: () => void;
};

const VIEWBOX_SIZE = 120;
const STROKE_WIDTH = 6;
const LAYER_COUNT = 6;

export default function LogoAnimation({
  size = 120,
  color = '#000',
  onAnimationComplete,
}: LogoAnimationProps) {
  const opacityValues = useRef(
    Array.from({ length: LAYER_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    opacityValues.forEach((value) => value.setValue(0));

    const animation = Animated.stagger(
      150,
      opacityValues.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        })
      )
    );

    animation.start(({ finished }) => {
      if (finished) {
        onAnimationComplete?.();
      }
    });

    return () => {
      animation.stop();
    };
  }, [onAnimationComplete, opacityValues]);

  const renderLayer = (index: number, content: React.ReactNode) => (
    <Animated.View
      key={index}
      style={[styles.layer, { opacity: opacityValues[index] }]}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
        {content}
      </Svg>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {renderLayer(
        0,
        <>
          <Rect
            x={14}
            y={46}
            width={20}
            height={16}
            rx={2}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <Rect
            x={35}
            y={42}
            width={50}
            height={24}
            rx={3}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <Rect
            x={86}
            y={46}
            width={20}
            height={16}
            rx={2}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <Path
            d="M60 18 V42"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
        </>
      )}

      {renderLayer(
        1,
        <>
          <Path
            d="M43 50 H53 V62 H47 V56 H53"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Circle cx={57} cy={56} r={3.5} fill={color} />
          <Path
            d="M77 50 H67 V62 H73 V56 H67"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Circle cx={63} cy={56} r={3.5} fill={color} />
        </>
      )}

      {renderLayer(
        2,
        <Path
          d="M48 82 Q60 94 72 82"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          fill="none"
        />
      )}

      {renderLayer(
        3,
        <>
          <Path
            d="M14 54 H6 V44"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M106 54 H114 V44"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}

      {renderLayer(
        4,
        <Circle
          cx={60}
          cy={12}
          r={7}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
      )}

      {renderLayer(
        5,
        <>
          <Circle cx={6} cy={44} r={5} fill={color} />
          <Circle cx={114} cy={44} r={5} fill={color} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
