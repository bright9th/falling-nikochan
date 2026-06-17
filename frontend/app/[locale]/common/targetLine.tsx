import { AnimationMode } from "@/play/clientPage";
import clsx from "clsx/lite";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "./theme";
interface Props {
  className?: string;
  style?: object;
  // shadowが広がるアニメーションの開始位置
  // TargetLineの左端からの画面上のx座標距離(px), またはleft: calc({} - 100%)に入れられる文字列
  barFlash?: number | string;
  left: number | string;
  right: number | string;
  bottom: number | string;
  animationMode: AnimationMode;
  getCurrentTimeSec: () => number | undefined;
}
export default function TargetLine(props: Props) {
  const { isDark } = useTheme();
  const [spreadShadow, setSpreadShadow] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const barAnim = useRef<Animation | undefined>(undefined);
  const shadowRef = useRef<HTMLDivElement>(null);
  const shadowAnim = useRef<Animation | undefined>(undefined);
  const triggerTime = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (props.animationMode !== "time") return;
    if (shadowRef.current) {
      const a = shadowRef.current.animate(
        [
          {
            transformOrigin: "center",
            scale: "0 1",
            opacity: 1,
          },
          {
            transformOrigin: "center",
            scale: "1 1",
            opacity: 0,
          },
        ],
        {
          duration: 400,
          fill: "forwards",
          easing: "linear",
        }
      );
      a.pause();
      a.currentTime = 400; // idle state
      shadowAnim.current = a;
    }
    if (barRef.current) {
      const a = barRef.current.animate(
        [
          {
            backgroundColor: "rgb(251 191 36 / 0.7)", // amber-400/70
          },
          {
            backgroundColor: isDark
              ? "rgb(255 255 255 / 0.35)"
              : "rgb(0 0 0 / 0.35)",
          },
        ],
        {
          duration: 400,
          fill: "forwards",
          easing: "linear",
        }
      );
      a.pause();
      a.currentTime = 400;
      barAnim.current = a;
    }
  }, [props.animationMode]);

  const flashPos = useRef<number | string>(0);
  const prevBarFlash = useRef<number | string | undefined>(undefined);
  useEffect(() => {
    console.log(props.barFlash);
    if (props.barFlash !== undefined) {
      flashPos.current = props.barFlash;
    }
    if (props.animationMode === "state") {
      if (props.barFlash !== undefined) {
        // なぜかrequestAnimationFrameだけではdelayが足りない
        const t = setTimeout(() =>
          requestAnimationFrame(() => {
            setSpreadShadow(true);
          })
        );
        return () => {
          clearTimeout(t);
        };
      } else {
        const t = setTimeout(() => {
          setSpreadShadow(false);
        }, 400);
        return () => {
          setSpreadShadow(false);
          clearTimeout(t);
        };
      }
    }
    // time mode
    if (
      props.barFlash !== undefined &&
      props.barFlash !== prevBarFlash.current
    ) {
      triggerTime.current = props.getCurrentTimeSec?.();
    }
    prevBarFlash.current = props.barFlash;
  }, [props.barFlash, props.animationMode, props.getCurrentTimeSec]);

  if (props.animationMode === "time" && triggerTime.current !== undefined) {
    const elapsedMs =
      ((props.getCurrentTimeSec?.() ?? triggerTime.current + 0.4) -
        triggerTime.current) *
      1000;
    const t = Math.max(0, Math.min(400, elapsedMs));
    if (shadowAnim.current) shadowAnim.current.currentTime = t;
    if (barAnim.current) barAnim.current.currentTime = t;
  }

  return (
    <div
      ref={barRef}
      className={clsx(
        "absolute h-0.5 overflow-x-clip",
        props.animationMode === "state" && "transition-all",
        props.animationMode === "state" &&
          (props.barFlash !== undefined
            ? "bg-amber-400/70 duration-0"
            : "bg-black/35 dark:bg-white/35 duration-500"),
        props.className
      )}
      style={{
        left: props.left,
        right: props.right,
        bottom: props.bottom,
        ...props.style,
      }}
    >
      <div
        key={props.animationMode} // lazy remount
        ref={shadowRef}
        className={clsx(
          "absolute inset-y-0 rounded-[50%]",
          "shadow-[0_0_1rem_0.05rem] shadow-yellow-400",
          props.animationMode === "state" &&
            "origin-center transition ease-linear",
          props.animationMode === "state" &&
            (spreadShadow
              ? "scale-x-100 opacity-0 duration-400"
              : "scale-x-0 opacity-100 duration-0")
          // props.barFlash === undefined && spreadShadow
          //   ? "opacity-0"
          //   : "opacity-100",
          // props.barFlash === undefined && !spreadShadow && "hidden"
        )}
        style={{
          left:
            typeof flashPos.current === "number"
              ? `calc(${flashPos.current}px - 100%)`
              : `calc(${flashPos.current ?? "0px"} - 100%)`,
          width: "200%",
        }}
      />
    </div>
  );
}
