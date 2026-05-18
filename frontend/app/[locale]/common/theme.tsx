"use client";

import clsx from "clsx/lite";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { themeColorDark, themeColorLight } from "@/metadata.js";
import DropDown from "./dropdown";
import { IrasutoyaLikeBg } from "./irasutoyaLike.jsx";
import Moon from "@icon-park/react/lib/icons/Moon";
import Sun from "@icon-park/react/lib/icons/Sun";
import DownOne from "@icon-park/react/lib/icons/DownOne";

export type ThemeAppearance = "dark" | "light" | null;
export type ThemePreset = "default" | "beach" | "sunset" | "mono";
const THEME_APPEARANCE_KEY = "theme";
const THEME_PRESET_KEY = "theme-preset";
const PRESET_CLASSES = [
  "fn-theme-default",
  "fn-theme-beach",
  "fn-theme-sunset",
  "fn-theme-mono",
] as const;

export interface ThemeState {
  themeAppearance: ThemeAppearance;
  themePreset: ThemePreset;
  isDark: boolean;
  setThemeAppearance: (themeAppearance: ThemeAppearance) => void;
  setThemePreset: (themePreset: ThemePreset) => void;
}
const ThemeContext = createContext<ThemeState>({
  themeAppearance: null,
  themePreset: "default",
  isDark: false,
  setThemeAppearance: () => {},
  setThemePreset: () => {},
});
export const useTheme = () => useContext(ThemeContext);

function getCurrentThemeAppearance(): ThemeAppearance {
  const theme = localStorage?.getItem(THEME_APPEARANCE_KEY);

  return theme === "dark" || theme === "light" ? theme : null;
}
function getCurrentThemePreset(): ThemePreset {
  const preset = localStorage?.getItem(THEME_PRESET_KEY);

  switch (preset) {
    case "beach":
    case "sunset":
    case "mono":
      return preset;
    default:
      return "default";
  }
}
function currentThemeIsDark() {
  switch (getCurrentThemeAppearance()) {
    case "dark":
      return true;

    case "light":
      return false;

    default:
      return (
        window?.matchMedia("(prefers-color-scheme: dark)").matches || false
      );
  }
}
const applyTheme = () => {
  if (typeof document !== "undefined") {
    document.body.classList.add("fn-csr-ready");
    if (currentThemeIsDark()) {
      /* ダークテーマの時 */
      document.body.classList.add("dark");
    } else {
      /* ライトテーマの時 */
      document.body.classList.remove("dark");
    }
    document.body.classList.remove(...PRESET_CLASSES);
    if (getCurrentThemePreset() !== "default")
      document.body.classList.add(`fn-theme-${getCurrentThemePreset()}`);
    const metaThemeColor = document.querySelectorAll("meta[name=theme-color]");
    switch (getCurrentThemeAppearance()) {
      case "dark":
        metaThemeColor.forEach((e) => {
          e.setAttribute("content", themeColorDark);
        });
        break;
      case "light":
        metaThemeColor.forEach((e) => {
          e.setAttribute("content", themeColorLight);
        });
        break;
      default:
        metaThemeColor[0].setAttribute("content", themeColorLight);
        metaThemeColor[1].setAttribute("content", themeColorDark);
        break;
    }
  }
};

export function ThemeProvider(props: { children: ReactNode }) {
  const [themeAppearance, setThemeAppearanceState] =
    useState<ThemeAppearance>(null);
  const [themePreset, setThemePresetState] = useState<ThemePreset>("default");
  const [isDark, setIsDark] = useState<boolean>(false);
  const updateTheme = useCallback(() => {
    setThemeAppearanceState(getCurrentThemeAppearance());
    setThemePresetState(getCurrentThemePreset());
    const isDark = currentThemeIsDark();
    setIsDark(isDark);
    applyTheme();
  }, []);
  useLayoutEffect(() => {
    updateTheme();
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleStorage = (e: StorageEvent) => {
      if (e.key && ["theme", "theme-preset"].includes(e.key)) {
        updateTheme();
      }
    };
    mql.addEventListener("change", updateTheme);
    window.addEventListener("storage", handleStorage);
    return () => {
      mql.removeEventListener("change", updateTheme);
      window.removeEventListener("storage", handleStorage);
    };
  }, [updateTheme]);
  return (
    <ThemeContext.Provider
      value={{
        themeAppearance,
        themePreset,
        isDark,
        setThemeAppearance: (themeAppearance) => {
          if (themeAppearance !== null) {
            localStorage?.setItem(THEME_APPEARANCE_KEY, themeAppearance);
          } else {
            localStorage?.removeItem(THEME_APPEARANCE_KEY);
          }
          updateTheme();
        },
        setThemePreset: (themePreset) => {
          localStorage?.setItem(THEME_PRESET_KEY, themePreset);
          updateTheme();
        },
      }}
    >
      <div className="fn-fallback-bg" />
      <IrasutoyaLikeBg />
      {props.children}
    </ThemeContext.Provider>
  );
}

export function ThemeAppearanceSwitcher(props: {
  children: ReactNode;
  className?: string;
}) {
  const { themeAppearance, setThemeAppearance } = useTheme();
  const t = useTranslations("footer");

  return (
    <DropDown
      className={clsx("fn-link-1", props.className)}
      value={themeAppearance}
      options={[
        { value: "dark" as const, label: t("dark") },
        { value: "light" as const, label: t("light") },
        { value: null, label: t("default") },
      ]}
      onSelect={(value) => {
        if (value === "dark" || value === "light") {
          setThemeAppearance(value);
        } else {
          setThemeAppearance(null);
        }
      }}
    >
      {props.children}
    </DropDown>
  );
}

export function ThemePresetSwitcher(props: {
  children: ReactNode;
  className?: string;
}) {
  const { themePreset, setThemePreset } = useTheme();
  const t = useTranslations("footer");

  return (
    <DropDown
      className={clsx("fn-link-1", props.className)}
      value={themePreset}
      options={[
        { value: "default", label: t("presetDefault") },
        { value: "beach", label: t("beach") },
        { value: "sunset", label: t("sunset") },
        { value: "mono", label: t("mono") },
      ]}
      onSelect={(value) => {
        setThemePreset(value as ThemePreset);
      }}
    >
      {props.children}
    </DropDown>
  );
}

export function MenuThemeSwitcher() {
  const t = useTranslations("main.theme");
  const themeState = useTheme();
  return (
    <div className="flex flex-col gap-1">
      <p>
        {themeState.isDark ? (
          <Moon className="inline-block align-middle" />
        ) : (
          <Sun className="inline-block align-middle" />
        )}
        <span className="ml-1">{t("title")}:</span>
        <ThemeAppearanceSwitcher
          className={clsx(
            "relative inline-block align-top pr-6 text-center",
            "fn-link-1",
            "fn-input"
          )}
        >
          <div>
            {themeState.themeAppearance === "dark"
              ? t("dark")
              : themeState.themeAppearance === "light"
                ? t("light")
                : t("default")}
          </div>
          <DownOne
            className="absolute right-1 inset-y-0 h-max m-auto"
            theme="filled"
          />
          {["dark", "light", "default"].map((s) => (
            <span className="block h-0 overflow-hidden">{t(s)}</span>
          ))}
        </ThemeAppearanceSwitcher>
      </p>

      <p>
        {themeState.isDark ? (
          <Moon className="inline-block scale-y-0" />
        ) : (
          <Sun className="inline-block scale-y-0" />
        )}
        <span className="ml-1">{t("preset")}:</span>
        <ThemePresetSwitcher
          className={clsx(
            "relative inline-block align-top pr-6 text-center",
            "fn-link-1",
            "fn-input"
          )}
        >
          <div>
            {themeState.themePreset === "default"
              ? t("presetDefault")
              : t(themeState.themePreset)}
          </div>
          <DownOne
            className="absolute right-1 inset-y-0 h-max m-auto"
            theme="filled"
          />
          {["presetDefault", "beach", "sunset", "mono"].map((s) => (
            <span className="block h-0 overflow-hidden">{t(s)}</span>
          ))}
        </ThemePresetSwitcher>
      </p>
    </div>
  );
}
