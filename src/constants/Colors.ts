/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#268E5A";
const tintColorDark = "#32ba76";

export const Colors = {
  light: {
    // Background Colors
    background: "#efefef",
    primary: "#f8f8f8",
    secondary: "#ffffff",

    button_background_bezeled: "#75BB8Da0",
    button_background_disabled: "#6f6f75",

    button_color_onTint: "#ffffff",

    tint: tintColorLight,

    text: "#11181C",
    lightText: "#999999",
    textInputBackground: "#cccccc",
    textInputColor: "#000000",
    textInputDisabled: "#aaaaaa",
    textInputPlaceholder: "#666666",
    textInputCursorColor: "#666666",

    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,

    listItemSelected: "#e7edff",

    warning: "#df3535",

    switchBackgroundColor: "#e9e9eb",

    // timetable
    timetableBackground: "#ffffffaa",
  },
  dark: {
    // Background Colors
    background: "#181818",
    primary: "#292929",
    secondary: "#373737",

    button_background_bezeled: "#24493070",
    button_background_disabled: "#6f6f75",

    button_color_onTint: "#000000",

    // Tint Color
    tint: tintColorDark,

    text: "#ECEDEE",
    lightText: "#c6c6c6",
    textInputBackground: "#444444",
    textInputColor: "#FFFFFF",
    textInputDisabled: "#5f5f5f",
    textInputPlaceholder: "#909090",
    textInputCursorColor: "#909090",

    // Bottom Tab Navigation
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,

    listItemSelected: "#292929",

    warning: "#df3535",

    switchBackgroundColor: "#39393d",

    // timetable
    timetableBackground: "#2d2d2daa",
  },
};
