export type CalendarViews = 'day' | 'month' | 'year' | 'time';

export enum CalendarActionKind {
  SET_CALENDAR_VIEW = 'SET_CALENDAR_VIEW',
  CHANGE_CURRENT_DATE = 'CHANGE_CURRENT_DATE',
  CHANGE_CURRENT_YEAR = 'CHANGE_CURRENT_YEAR',
  CHANGE_SELECTED_DATE = 'CHANGE_SELECTED_DATE',
  CHANGE_SELECTED_RANGE = 'CHANGE_SELECTED_RANGE',
  CHANGE_SELECTED_MULTIPLE = 'CHANGE_SELECTED_MULTIPLE',
  SET_IS_RTL = 'SET_IS_RTL',
  RESET_STATE = 'RESET_STATE',
}

export const CONTAINER_HEIGHT = 300;
export const WEEKDAYS_HEIGHT = 25;

/**
 * Upper bound for the OS font-scale accessibility setting applied to the
 * picker's fixed-geometry elements (the time wheels and the weekday row).
 * These controls grow with the user's text-size preference up to this cap so
 * they stay fully legible without overflowing the picker. Both the container
 * heights and the text inside them are bounded by this same value so they
 * always grow in lockstep.
 */
export const MAX_FONT_SCALE = 1.5;
