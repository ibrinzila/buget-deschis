import { AVAILABLE_YEARS, BUDGET_DATA, BUDGET_TREND } from './budget-data';

// Derived once from the curated budget-data tables so no page copy has to hard-
// code a year or a year-over-year delta. When a new fiscal year is added to
// BUDGET_DATA/BUDGET_TREND, everything downstream updates.

export interface BudgetMeta {
  latestYear: number;
  previousYear: number;
  earliestYear: number;
  yearsCovered: number;
  rangeLabel: string; // e.g. "2019–2024"

  totalApproved: number; // mil MDL, latest year
  totalActual: number;
  executionRate: number; // %, latest year

  // Year-over-year deltas (%). Positive = growth.
  approvedYoY: number | null;
  actualYoY: number | null;
  euFundsYoY: number | null;

  // Range-over-range growth (earliest → latest). Drives "budget grew by N%".
  approvedRangeGrowthPct: number;
  euFundsRangeMultiple: number; // e.g. 4.5 for "grew 4.5x"
}

function pctDelta(a: number, b: number): number {
  if (!b) return 0;
  return ((a - b) / b) * 100;
}

export function getBudgetMeta(): BudgetMeta {
  const years = [...AVAILABLE_YEARS].sort((a, b) => a - b);
  const earliest = years[0];
  const latest = years[years.length - 1];
  const previous = years[years.length - 2] ?? latest;

  const latestData = BUDGET_DATA[latest];
  const prevData = BUDGET_DATA[previous];

  const trendLatest = BUDGET_TREND.find((t) => t.year === latest);
  const trendPrev = BUDGET_TREND.find((t) => t.year === previous);
  const trendEarliest = BUDGET_TREND.find((t) => t.year === earliest);

  return {
    latestYear: latest,
    previousYear: previous,
    earliestYear: earliest,
    yearsCovered: years.length,
    rangeLabel: earliest === latest ? String(latest) : `${earliest}–${latest}`,

    totalApproved: latestData?.totalApproved ?? 0,
    totalActual: latestData?.totalActual ?? 0,
    executionRate: latestData?.executionRate ?? 0,

    approvedYoY:
      prevData && prevData !== latestData
        ? pctDelta(latestData?.totalApproved ?? 0, prevData.totalApproved)
        : null,
    actualYoY:
      prevData && prevData !== latestData
        ? pctDelta(latestData?.totalActual ?? 0, prevData.totalActual)
        : null,
    euFundsYoY:
      trendLatest && trendPrev && trendLatest !== trendPrev
        ? pctDelta(trendLatest.euFunds, trendPrev.euFunds)
        : null,

    approvedRangeGrowthPct:
      trendLatest && trendEarliest && trendLatest !== trendEarliest
        ? pctDelta(trendLatest.approved, trendEarliest.approved)
        : 0,
    euFundsRangeMultiple:
      trendLatest && trendEarliest && trendEarliest.euFunds > 0
        ? trendLatest.euFunds / trendEarliest.euFunds
        : 1,
  };
}
