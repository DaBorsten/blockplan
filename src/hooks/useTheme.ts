import ThemeContext from "@/context/ThemeContext";
import { useContext } from "react";

export default function useTheme() {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    throw new Error("ThemeContext is not provided");
  }

  return themeContext;
}
