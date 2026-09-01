import React from "react";
import { useWindowDimensions } from "react-native";
import Svg, {
  G,
  Line,
  Rect,
  Text as SvgText,
} from "react-native-svg";

export interface BarData {
  label: string;
  value: number;
  highlighted?: boolean;
}

interface Props {
  data: BarData[];
  color: string;
  mutedColor?: string;
  height?: number;
  width?: number;
}

export function BarChart({ data, color, mutedColor, height = 190, width }: Props) {
  const { width: screenW } = useWindowDimensions();
  const chartW = width ?? screenW - 64;
  const TOP = 22;
  const BOTTOM = 28;
  const areaH = height - TOP - BOTTOM;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const slotW = chartW / n;
  const barW = Math.max(Math.min(slotW * 0.55, 36), 8);
  const barColor = mutedColor ?? color;

  return (
    <Svg width={chartW} height={height}>
      {/* Baseline */}
      <Line
        x1={0} y1={TOP + areaH}
        x2={chartW} y2={TOP + areaH}
        stroke="#E3D8CC" strokeWidth={1}
      />

      {data.map((d, i) => {
        const barH = Math.max((d.value / maxVal) * areaH, d.value > 0 ? 5 : 0);
        const x = i * slotW + (slotW - barW) / 2;
        const y = TOP + areaH - barH;
        const fill = d.value > 0 ? (d.highlighted ? color : barColor) : "#E3D8CC";
        const opacity = d.value === 0 ? 0.4 : d.highlighted ? 1 : 0.72;

        return (
          <G key={i}>
            <Rect
              x={x}
              y={d.value > 0 ? y : TOP + areaH - 3}
              width={barW}
              height={d.value > 0 ? barH : 3}
              rx={Math.min(barW / 2.5, 6)}
              fill={fill}
              opacity={opacity}
            />
            {d.value > 0 && (
              <SvgText
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize={d.highlighted ? 11 : 10}
                fontWeight="bold"
                fill={color}
                opacity={d.highlighted ? 1 : 0.85}
              >
                {d.value}
              </SvgText>
            )}
            <SvgText
              x={x + barW / 2}
              y={height - 5}
              textAnchor="middle"
              fontSize={n > 8 ? 8 : 10}
              fill="#9CA3AF"
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
