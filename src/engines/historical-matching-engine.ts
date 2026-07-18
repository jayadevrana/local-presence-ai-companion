import entries from "@/data/historical/entries.json";
import type { EmotionalState, HistoricalEntry, HistoricalMatch } from "@/types/companion";

const historicalEntries = entries as HistoricalEntry[];

export function matchHistoricalEntries(args: {
  text: string;
  emotion?: EmotionalState;
  limit?: number;
}): HistoricalMatch[] {
  const input = args.text.toLowerCase();
  const emotion = args.emotion?.primary;

  return historicalEntries
    .map((entry) => {
      const themeScore = entry.themes.reduce(
        (total, theme) => total + (input.includes(theme.toLowerCase()) ? 0.22 : 0),
        0,
      );
      const roleScore = entry.strategicContexts.reduce(
        (total, context) => total + (input.includes(context.toLowerCase()) ? 0.18 : 0),
        0,
      );
      const emotionScore =
        emotion && entry.emotionalContexts.includes(emotion) ? 0.22 : 0;
      const score = themeScore + roleScore + emotionScore;
      return {
        entry,
        score,
        rationale: `theme:${themeScore.toFixed(2)} emotion:${emotionScore.toFixed(
          2,
        )} strategy:${roleScore.toFixed(2)}`,
      };
    })
    .filter((match) => match.score >= 0.2)
    .sort((left, right) => right.score - left.score)
    .slice(0, args.limit ?? 2);
}
