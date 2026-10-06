import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

const SITE = "https://multicule.com";
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max);

/** Approximate AP composite-to-score cutoffs (percent of weighted composite). Cutoffs shift yearly. */
type Cutoffs = [number, number, number, number]; // min % for 5, 4, 3, 2
function toApScore(pct: number, c: Cutoffs): number {
  if (pct >= c[0]) return 5;
  if (pct >= c[1]) return 4;
  if (pct >= c[2]) return 3;
  if (pct >= c[3]) return 2;
  return 1;
}

interface Section { label: string; earned: number; max: number; weight: number }
function apResult(subject: string, slug: string, sections: Section[], cutoffs: Cutoffs) {
  const composite = sections.reduce((sum, s) => sum + (clamp(s.earned, s.max) / s.max) * s.weight, 0);
  const pct = round(composite, 1);
  const score = toApScore(pct, cutoffs);
  const weakest = [...sections].sort((a, b) => a.earned / a.max - b.earned / b.max)[0];
  return {
    subject,
    predictedScore: score,
    compositePercent: pct,
    pointsToNextScore: score < 5 ? round(cutoffs[5 - score - 1] - pct, 1) : 0,
    sections: sections.map((s) => ({
      section: s.label,
      earned: clamp(s.earned, s.max),
      max: s.max,
      weightPercent: s.weight,
    })),
    weakestSection: weakest.label,
    note: "Estimate only. College Board sets cutoffs each year; these use recent historical ranges.",
    calculator: `${SITE}/${slug}/`,
  };
}

export default defineToolPlugin({
  id: "multicule-calculators",
  name: "Multicule Calculators",
  description:
    "Deterministic calculators for agents: AP exam score predictions (World History, Calculus AB, English Language, Seminar), Australian contractor pay vs salary, and alcohol dilution.",
  tools: (tool) => [
    tool({
      name: "multicule_ap_world_history_score",
      label: "AP World History Score",
      description:
        "Predict an AP World History: Modern score (1-5) from practice-test results: MCQ correct (of 55), SAQ points (of 9), DBQ (of 7), LEQ (of 6).",
      parameters: Type.Object({
        mcqCorrect: Type.Number({ description: "Multiple-choice questions correct, 0-55." }),
        saqPoints: Type.Number({ description: "Total short-answer points, 0-9." }),
        dbqPoints: Type.Number({ description: "Document-based question score, 0-7." }),
        leqPoints: Type.Number({ description: "Long essay score, 0-6." }),
      }),
      execute: (p) =>
        apResult("AP World History: Modern", "ap-world-history-score-calculator", [
          { label: "Multiple choice", earned: p.mcqCorrect, max: 55, weight: 40 },
          { label: "Short answer", earned: p.saqPoints, max: 9, weight: 20 },
          { label: "DBQ", earned: p.dbqPoints, max: 7, weight: 25 },
          { label: "LEQ", earned: p.leqPoints, max: 6, weight: 15 },
        ], [70, 57, 43, 28]),
    }),

    tool({
      name: "multicule_ap_calculus_ab_score",
      label: "AP Calculus AB Score",
      description:
        "Predict an AP Calculus AB score (1-5) from MCQ correct (of 45) and total free-response points (of 54, six questions x 9).",
      parameters: Type.Object({
        mcqCorrect: Type.Number({ description: "Multiple-choice questions correct, 0-45." }),
        frqPoints: Type.Number({ description: "Total free-response points, 0-54." }),
      }),
      execute: (p) =>
        apResult("AP Calculus AB", "ap-calculus-ab-score-calculator", [
          { label: "Multiple choice", earned: p.mcqCorrect, max: 45, weight: 50 },
          { label: "Free response", earned: p.frqPoints, max: 54, weight: 50 },
        ], [63, 50, 38, 25]),
    }),

    tool({
      name: "multicule_ap_english_language_score",
      label: "AP English Language Score",
      description:
        "Predict an AP English Language and Composition (AP Lang) score (1-5) from MCQ correct (of 45) and the three essay scores (each 0-6).",
      parameters: Type.Object({
        mcqCorrect: Type.Number({ description: "Multiple-choice questions correct, 0-45." }),
        synthesisEssay: Type.Number({ description: "Synthesis essay score, 0-6." }),
        rhetoricalAnalysisEssay: Type.Number({ description: "Rhetorical analysis essay score, 0-6." }),
        argumentEssay: Type.Number({ description: "Argument essay score, 0-6." }),
      }),
      execute: (p) =>
        apResult("AP English Language and Composition", "ap-english-language-and-composition-score-calculator", [
          { label: "Multiple choice", earned: p.mcqCorrect, max: 45, weight: 45 },
          {
            label: "Essays",
            earned: clamp(p.synthesisEssay, 6) + clamp(p.rhetoricalAnalysisEssay, 6) + clamp(p.argumentEssay, 6),
            max: 18,
            weight: 55,
          },
        ], [72, 58, 44, 30]),
    }),

    tool({
      name: "multicule_ap_seminar_score",
      label: "AP Seminar Score",
      description:
        "Predict an AP Seminar score (1-5) from each component as a percentage: Performance Task 1 (team), Performance Task 2 (individual), and the end-of-course exam.",
      parameters: Type.Object({
        task1Percent: Type.Number({ description: "Performance Task 1 result, 0-100%." }),
        task2Percent: Type.Number({ description: "Performance Task 2 result, 0-100%." }),
        examPercent: Type.Number({ description: "End-of-course exam result, 0-100%." }),
      }),
      execute: (p) =>
        apResult("AP Seminar", "ap-seminar-score-calculator", [
          { label: "Performance Task 1", earned: p.task1Percent, max: 100, weight: 20 },
          { label: "Performance Task 2", earned: p.task2Percent, max: 100, weight: 35 },
          { label: "End-of-course exam", earned: p.examPercent, max: 100, weight: 45 },
        ], [75, 62, 45, 30]),
    }),

    tool({
      name: "multicule_contractor_pay",
      label: "Contractor Pay (Australia)",
      description:
        "Convert an Australian contractor hourly or daily rate into an equivalent employee salary, accounting for superannuation, unpaid leave and billable days. Optionally compare against a salary offer.",
      parameters: Type.Object({
        rate: Type.Number({ description: "Contract rate in AUD (excluding GST)." }),
        rateType: Type.Union([Type.Literal("hourly"), Type.Literal("daily")], {
          description: "Whether the rate is per hour or per day.",
        }),
        hoursPerDay: Type.Optional(Type.Number({ description: "Billable hours per day. Default 7.6." })),
        billableDays: Type.Optional(
          Type.Number({ description: "Billable days per year after leave, holidays and gaps. Default 220." }),
        ),
        superRatePercent: Type.Optional(Type.Number({ description: "Superannuation guarantee rate. Default 12." })),
        compareSalary: Type.Optional(
          Type.Number({ description: "Optional employee base salary (excl. super) to compare against." }),
        ),
      }),
      execute: (p) => {
        const hours = p.hoursPerDay ?? 7.6;
        const days = p.billableDays ?? 220;
        const sup = (p.superRatePercent ?? 12) / 100;
        const daily = p.rateType === "hourly" ? p.rate * hours : p.rate;
        const annualGross = daily * days;
        const equivalentBaseSalary = annualGross / (1 + sup);
        const result: Record<string, unknown> = {
          dailyRate: round(daily),
          annualContractIncome: round(annualGross, 0),
          equivalentBaseSalary: round(equivalentBaseSalary, 0),
          equivalentSuper: round(annualGross - equivalentBaseSalary, 0),
          gstRegistrationRequired: annualGross >= 75000,
          assumptions: { hoursPerDay: hours, billableDays: days, superRatePercent: sup * 100 },
          note: "Before tax, insurance and business costs. GST registration is required at $75,000+ turnover.",
          calculator: `${SITE}/contractor-pay-calculator/`,
        };
        if (p.compareSalary) {
          const breakEvenDaily = (p.compareSalary * (1 + sup)) / days;
          result.comparison = {
            salary: p.compareSalary,
            breakEvenDailyRate: round(breakEvenDaily),
            breakEvenHourlyRate: round(breakEvenDaily / hours),
            contractAheadBy: round(equivalentBaseSalary - p.compareSalary, 0),
          };
        }
        return result;
      },
    }),

    tool({
      name: "multicule_alcohol_dilution",
      label: "Alcohol Dilution",
      description:
        "Calculate how much water to add to a spirit to reach a target ABV. Formula: water = volume x (startABV / targetABV - 1). Volume unit is preserved.",
      parameters: Type.Object({
        volume: Type.Number({ description: "Starting volume of spirit (any unit: ml, L, oz)." }),
        startAbv: Type.Number({ description: "Starting alcohol by volume, %." }),
        targetAbv: Type.Number({ description: "Target alcohol by volume, %. Must be lower than startAbv." }),
        unit: Type.Optional(Type.String({ description: "Unit label for the volume, e.g. ml, L, oz. Default ml." })),
      }),
      execute: (p) => {
        const unit = p.unit ?? "ml";
        if (p.targetAbv <= 0 || p.targetAbv >= p.startAbv) {
          return { error: "targetAbv must be greater than 0 and lower than startAbv." };
        }
        const water = p.volume * (p.startAbv / p.targetAbv - 1);
        return {
          waterToAdd: round(water),
          finalVolumeApprox: round(p.volume + water),
          unit,
          note: "Alcohol and water contract slightly when mixed, so the final volume will be a little lower. Add water gradually.",
          calculator: `${SITE}/alcohol-dilution-calculator/`,
        };
      },
    }),
  ],
});
