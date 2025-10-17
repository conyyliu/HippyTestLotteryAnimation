import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Animation, AnimationSet } from "@hippy/react";

// 走一圈是8步
const STEP = 8;
// 格子走的顺序为顺时针绕圈
export const SEQUENCE = [0, 1, 2, 5, 8, 7, 6, 3];
// 走到对应 award_index 的格子对应从 0 开始走多少步
export const SEQUENCE2STEP = [0, 1, 2, 7, 3, 6, 5, 4];
export default function App() {
  const appearAniOpt = createOpacityAnimOpt(0, 1, 1000);
  const disappearAniOpt = createOpacityAnimOpt(1, 0, 1000);
  const [appearAni] = useState(new Animation(appearAniOpt));
  const [isShowResult, setIsShowResult] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [reachEnd, setReachEnd] = useState(false);
  const [showTime, setShowTime] = useState(0);
  const [showDelay, setShowDelay] = useState(0);

  const isDraw = useRef(false);

  const timer = useRef();
  const closeTimer = useRef();
  const timerId = useRef(null);

  // 目前已经走了多少步
  const drawCount = useRef(0);
  // 一共要走多少步
  const endCount = useRef(0);
  const stepCount = useRef(0);

  // 停止转圈，参数复位
  const handleStopLottery = useCallback(() => {
    timerId.current && clearTimeout(timerId.current);
    setActiveIndex(-1);
    drawCount.current = 0;
    endCount.current = 0;
    setShowDelay(0);
    setShowTime(0);
    isDraw.current = false;
    setIsShowResult(true);
  }, []);

  // 转圈动画参数计算
  const startDrawInterval = useCallback((time) => {
    let timer = time || 60;

    const diff = endCount.current - drawCount.current;
    if (endCount.current !== 0 && diff <= 5) {
      timer = 200;
      setReachEnd(true);
    }

    setShowDelay(timer * 0.2);
    setShowTime(timer * 0.8);
    timerId.current && clearTimeout(timerId.current);
    timerId.current = setTimeout(() => {
      if (endCount.current === 0 || drawCount.current < endCount.current) {
        drawCount.current++;
        setActiveIndex(SEQUENCE[drawCount.current % STEP]);

        startDrawInterval(timer);
      } else if (drawCount.current === endCount.current) {
        handleStopLottery();
      }
    }, timer);
  }, []);

  const close = () => {
    timer.current && clearTimeout(timer.current);
    appearAni.updateAnimation(disappearAniOpt);
    appearAni.start();

    closeTimer.current = setTimeout(() => {
      setIsShowResult(false);
    }, 200);
  };

  // 开始转圈
  const handleStartAround = useCallback(() => {
    if (isDraw.current) {
      return;
    }
    isDraw.current = true;
    setActiveIndex(0);
    startDrawInterval();
    setTimeout(() => setAwardIndex());
  }, []);

  // 设置转圈在6s后停止
  const setAwardIndex = () => {
    setTimeout(() => {
      const awardIdx = 3;
      endCount.current =
        drawCount.current + STEP * 4 - (drawCount.current % STEP) + SEQUENCE2STEP[awardIdx];

      stepCount.current = endCount.current - drawCount.current;
    }, 6000);
  };

  useEffect(() => {
    if (isShowResult) {
      appearAni.updateAnimation(appearAniOpt);
      appearAni.start();
      timer.current && clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        close();
      }, 3000);
    }

    return () => {
      timer.current && clearTimeout(timer.current);
      closeTimer.current && clearTimeout(closeTimer.current);
    };
  }, [isShowResult]);

  return (
    <View
      style={{
        backgroundColor: "#f0f0f0f0",
        flex: 1,
      }}
    >
      <View
        style={{
          backgroundColor: "red",
          width: 100,
          height: 100,
          justifyContent: "center",
          alignItems: "center",
          opacity: appearAni,
        }}
      >
        结果
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          flexWrap: "wrap",
          width: 180,
        }}
      >
        {new Array(9).fill("").map((_, index) => {
          if (index === 4) {
            return (
              <View
                style={{
                  backgroundColor: "rgba(153, 99, 255, 1)",
                  width: 50,
                  height: 50,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 10,
                  opacity: isDraw.current ? 0.5 : 1,
                }}
                onClick={handleStartAround}
              >
                click
              </View>
            );
          }

          return (
            <AwardItem
              index={index}
              activeIndex={activeIndex}
              showDelay={showDelay}
              fadeDelay={showTime}
              reachEnd={reachEnd}
            />
          );
        })}
      </View>
    </View>
  );
}

export function AwardItem({ index, activeIndex, showDelay, fadeDelay, reachEnd }) {
  const ani = useMemo(() => {
    return getBlinkAnimation(showDelay, fadeDelay, reachEnd);
  }, [showDelay, fadeDelay, reachEnd]);

  useEffect(() => {
    if (activeIndex === index) {
      ani.start();
    }
  }, [activeIndex, ani, index]);

  return (
    <View
      style={{
        backgroundColor: "#FFF8E580",
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
      }}
    >
      <View
        style={{
          borderWidth: 4,
          borderColor: "#F60",
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          width: 50,
          height: 50,
          opacity: ani,
        }}
      ></View>
      {index}
    </View>
  );
}

function getBlinkAnimation(showDelay, fadeDelay, reachEnd) {
  return new AnimationSet({
    children: [
      {
        animation: new Animation({
          mode: "timing",
          delay: showDelay || 0,
          startValue: 0,
          toValue: 1,
          duration: 50,
          timingFunction: "ease-in-out",
        }),
        follow: true,
      },
      {
        animation: new Animation({
          mode: "timing",
          delay: fadeDelay || 0,
          startValue: 1,
          toValue: 0,
          duration: reachEnd ? 200 : 80,
          timingFunction: "ease-in",
        }),
        follow: true,
      },
    ],
  });
}

const createOpacityAnimOpt = (s, t, duration) => ({
  startValue: s,
  toValue: t,
  duration,
  mode: "timing",
  delay: 0,
  timingFunction: "linear",
  repeatCount: 1,
});
