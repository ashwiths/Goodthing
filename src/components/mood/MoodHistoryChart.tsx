import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { MoodLog } from '../../types/mood.types';
import { MOOD_OPTIONS } from '../../types/mood.types';
import { getDayName } from '../../utils/dateUtils';
import { useTheme } from '../../hooks/useTheme';
import { TEXT } from '../../constants/colors';

interface MoodHistoryChartProps {
  logs: MoodLog[]; // last 7 days
  dates: string[];  // last 7 YYYY-MM-DD strings
}

const CHART_W = 280;
const CHART_H = 120;
const BAR_GAP = 4;

export function MoodHistoryChart({ logs, dates }: MoodHistoryChartProps) {
  const { primary } = useTheme();
  const barW = (CHART_W - BAR_GAP * 6) / 7;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>7-Day Mood History</Text>
      <Svg width={CHART_W} height={CHART_H + 24}>
        {dates.map((date, i) => {
          const log    = logs.find((l) => l.loggedAt === date);
          const level  = log?.level ?? 0;
          const barH   = level ? (level / 5) * CHART_H : 4;
          const barY   = CHART_H - barH;
          const x      = i * (barW + BAR_GAP);
          const color  = level ? MOOD_OPTIONS[level - 1].color : 'rgba(255,255,255,0.1)';

          return (
            <React.Fragment key={date}>
              <Rect
                x={x} y={barY} width={barW} height={barH}
                rx={4} fill={color} opacity={log ? 0.9 : 0.25}
              />
              <SvgText
                x={x + barW / 2} y={CHART_H + 16}
                fontSize={9} textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
              >
                {getDayName(date)}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, alignItems: 'center' },
  title:     { color: TEXT.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', alignSelf: 'flex-start' },
});
