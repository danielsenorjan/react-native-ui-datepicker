import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getWeekdays, getFontScale } from '../utils';
import {
  Styles,
  ClassNames,
  WeekdayFormat,
  CalendarComponents,
} from '../types';
import { WEEKDAYS_HEIGHT } from '../enums';

type WeekdaysProps = {
  locale: string;
  firstDayOfWeek: number;
  styles?: Styles;
  classNames?: ClassNames;
  weekdaysFormat?: WeekdayFormat;
  weekdaysHeight?: number;
  components?: CalendarComponents;
  isRTL: boolean;
};

const Weekdays = ({
  locale,
  firstDayOfWeek,
  styles = {},
  classNames = {},
  weekdaysFormat = 'min',
  weekdaysHeight = WEEKDAYS_HEIGHT,
  components = {},
  isRTL,
}: WeekdaysProps) => {
  // Grow the row with the OS font-scale setting so scaled labels are not
  // clipped by the fixed row height; cap the text at the same bound.
  const { fontScale, maxFontSizeMultiplier } = getFontScale();
  const style = useMemo(
    () => createDefaultStyles(Math.round(weekdaysHeight * fontScale), isRTL),
    [weekdaysHeight, fontScale, isRTL]
  );

  return (
    <View
      style={[style.container, styles.weekdays]}
      className={classNames.weekdays}
      testID="weekdays"
    >
      {getWeekdays(locale, firstDayOfWeek)?.map((weekday, index) => (
        <View
          key={index}
          style={[style.weekday, styles.weekday]}
          className={classNames.weekday}
        >
          {components.Weekday ? (
            components.Weekday(weekday)
          ) : (
            <Text
              style={styles?.weekday_label}
              className={classNames.weekday_label}
              numberOfLines={1}
              maxFontSizeMultiplier={maxFontSizeMultiplier}
            >
              {weekday.name[weekdaysFormat]}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

export default memo(Weekdays);

const createDefaultStyles = (weekdaysHeight: number, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      height: weekdaysHeight,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    weekday: {
      width: `${99.9 / 7}%`,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
