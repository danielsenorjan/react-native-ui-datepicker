import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  StyleProp,
  TextStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  ViewStyle,
  View,
  ViewProps,
  FlatListProps,
  FlatList,
  Platform,
} from 'react-native';
import styles from './wheel-picker.style';
import WheelPickerItem from './wheel-picker-item';
import { PickerOption } from '../../../types';
import { getFontScale } from '../../../utils';

interface Props {
  value: number | string;
  options: PickerOption[];
  onChange: (index: number | string) => void;
  selectedIndicatorStyle?: StyleProp<ViewStyle>;
  itemTextStyle?: TextStyle;
  itemTextClassName?: string;
  itemStyle?: ViewStyle;
  selectedIndicatorClassName?: string;
  itemHeight?: number;
  containerStyle?: ViewStyle;
  containerProps?: Omit<ViewProps, 'style'>;
  scaleFunction?: (x: number) => number;
  rotationFunction?: (x: number) => number;
  opacityFunction?: (x: number) => number;
  visibleRest?: number;
  decelerationRate?: 'normal' | 'fast' | number;
  flatListProps?: Omit<FlatListProps<string | null>, 'data' | 'renderItem'>;
}

const WheelPicker: React.FC<Props> = ({
  value,
  options,
  onChange,
  selectedIndicatorStyle = {},
  containerStyle = {},
  itemStyle = {},
  itemTextStyle = {},
  selectedIndicatorClassName = '',
  itemTextClassName = '',
  itemHeight: baseItemHeight = 40,
  scaleFunction = (x: number) => 1.0 ** x,
  rotationFunction = (x: number) => 1 - Math.pow(1 / 2, x),
  opacityFunction = (x: number) => Math.pow(1 / 3, x),
  visibleRest = 2,
  decelerationRate = 'normal',
  containerProps = {},
  flatListProps = {},
}) => {
  const momentumStarted = useRef(false);
  // Gate onChange on a user-initiated drag. The FlatList emits
  // onMomentumScrollEnd for programmatic `scrollToIndex` calls and for the
  // `initialScrollIndex` layout pass too, which would otherwise fire
  // onChange(0) and clobber the displayed value on mount / view transitions.
  // See upstream issues #169 and #171.
  const userScrollActive = useRef(false);
  const selectedIndex = options.findIndex((item) => item.value === value);

  // Grow each row with the OS font-scale setting so scaled digits stay fully
  // visible. The whole wheel geometry below is derived from `itemHeight`, so
  // scaling this single value keeps the snap offsets, indicator and item
  // transforms internally consistent. `maxFontSizeMultiplier` caps the text at
  // the same bound, keeping the digit and its row in lockstep.
  const { fontScale, maxFontSizeMultiplier } = getFontScale();
  const itemHeight = Math.round(baseItemHeight * fontScale);

  const flatListRef = useRef<FlatList>(null);
  const [scrollY] = useState(new Animated.Value(selectedIndex * itemHeight));

  const containerHeight = (1 + visibleRest * 2) * itemHeight;
  const paddedOptions = useMemo(() => {
    const array: (PickerOption | null)[] = [...options];
    for (let i = 0; i < visibleRest; i++) {
      array.unshift(null);
      array.push(null);
    }
    return array;
  }, [options, visibleRest]);

  const offsets = useMemo(
    () => [...Array(paddedOptions.length)].map((_, i) => i * itemHeight),
    [paddedOptions, itemHeight]
  );

  const currentScrollIndex = useMemo(
    () => Animated.add(Animated.divide(scrollY, itemHeight), visibleRest),
    [visibleRest, scrollY, itemHeight]
  );

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = Math.min(
      itemHeight * (options.length - 1),
      Math.max(event.nativeEvent.contentOffset.y, 0)
    );

    let index = Math.floor(offsetY / itemHeight);
    const remainder = offsetY % itemHeight;
    if (remainder > itemHeight / 2) {
      index++;
    }

    if (index !== selectedIndex) {
      onChange(options[index]?.value || 0);
    }
  };

  const handleScrollBeginDrag = () => {
    userScrollActive.current = true;
  };

  const handleMomentumScrollBegin = () => {
    momentumStarted.current = true;
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    momentumStarted.current = false;
    if (!userScrollActive.current) return;
    userScrollActive.current = false;
    handleScrollEnd(event);
  };

  const handleScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    // Capture the offset value immediately
    const offsetY = event.nativeEvent.contentOffset?.y;

    // We'll start a short timer to see if momentum scroll begins
    setTimeout(() => {
      // If momentum scroll hasn't started within the timeout,
      // then it was a slow scroll that won't trigger momentum
      if (
        !momentumStarted.current &&
        offsetY !== undefined &&
        userScrollActive.current
      ) {
        userScrollActive.current = false;
        // Create a synthetic event with just the data we need
        const syntheticEvent = {
          nativeEvent: {
            contentOffset: { y: offsetY },
          },
        };
        handleScrollEnd(syntheticEvent as any);
      }
    }, 50);
  };

  useEffect(() => {
    if (selectedIndex < 0 || selectedIndex >= options.length) {
      throw new Error(
        `Selected index ${selectedIndex} is out of bounds [0, ${
          options.length - 1
        }]`
      );
    }
  }, [selectedIndex, options]);

  /**
   * Keep the physical scroll position in lockstep with `value`. We run this
   * on every render (no dep array) rather than on `selectedIndex` changes
   * only — when the parent clamps a user's out-of-range scroll back to the
   * previous value, `selectedIndex` stays the same but the user's momentum
   * has moved the FlatList off-position, and dep-gated effects miss it.
   */
  useEffect(() => {
    flatListRef.current?.scrollToOffset({
      offset: selectedIndex * itemHeight,
      animated: Platform.OS === 'ios',
    });
  });

  return (
    <View
      style={[styles.container, { height: containerHeight }, containerStyle]}
      {...containerProps}
    >
      <View
        style={[
          styles.selectedIndicator,
          selectedIndicatorStyle,
          {
            transform: [{ translateY: -itemHeight / 2 }],
            height: itemHeight,
          },
        ]}
        className={selectedIndicatorClassName}
      />
      <Animated.FlatList
        {...flatListProps}
        ref={flatListRef}
        nestedScrollEnabled
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        snapToOffsets={offsets}
        decelerationRate={decelerationRate}
        initialScrollIndex={selectedIndex}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        data={paddedOptions}
        keyExtractor={(item, index) =>
          item ? `${item.value}-${item.text}-${index}` : `null-${index}`
        }
        renderItem={({ item: option, index }) => (
          <WheelPickerItem
            key={`option-${index}`}
            index={index}
            option={option}
            style={itemStyle}
            textStyle={itemTextStyle}
            textClassName={itemTextClassName}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            height={itemHeight}
            currentScrollIndex={currentScrollIndex}
            scaleFunction={scaleFunction}
            rotationFunction={rotationFunction}
            opacityFunction={opacityFunction}
            visibleRest={visibleRest}
          />
        )}
      />
    </View>
  );
};

export default memo(WheelPicker);
