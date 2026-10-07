# Multicule Calculators for OpenClaw

Deterministic calculator tools for OpenClaw agents. Instead of the model doing arithmetic in its head (and occasionally getting it wrong), your agent calls a tool and gets an exact, structured answer.

Built by [Multicule](https://multicule.com), a collection of free online calculators.

## Tools

| Tool | What it does |
|---|---|
| `multicule_ap_world_history_score` | Predicts an AP World History: Modern score (1–5) from MCQ, SAQ, DBQ and LEQ results |
| `multicule_ap_calculus_ab_score` | Predicts an AP Calculus AB score from MCQ and FRQ points |
| `multicule_ap_english_language_score` | Predicts an AP Lang score from MCQ and the three essay scores |
| `multicule_ap_physics_1_score` | Predicts an AP Physics 1 score from MCQ and the four FRQ types |
| `multicule_ap_seminar_score` | Predicts an AP Seminar score from both performance tasks and the exam |
| `multicule_ap_research_score` | Predicts an AP Research score from the academic paper and oral defense |
| `multicule_contractor_pay` | Converts an Australian contractor hourly/daily rate into an equivalent salary (super, billable days, GST threshold, break-even vs a salary offer) |
| `multicule_alcohol_dilution` | Calculates how much water to add to reach a target ABV |

Every result includes a link to the matching web calculator so users can double-check or explore further.

## Web versions

Prefer a browser? Each tool has a free web calculator with worked examples and score tables:

- [AP World History score calculator](https://multicule.com/ap-world-history-score-calculator/)
- [AP Calculus AB score calculator](https://multicule.com/ap-calculus-ab-score-calculator/)
- [AP English Language score calculator](https://multicule.com/ap-english-language-and-composition-score-calculator/)
- [AP Physics 1 score calculator](https://multicule.com/ap-physics-1-score-calculator/)
- [AP Seminar score calculator](https://multicule.com/ap-seminar-score-calculator/)
- [AP Research score calculator](https://multicule.com/ap-research-score-calculator/)
- [Contractor pay calculator (Australia)](https://multicule.com/contractor-pay-calculator/)
- [Alcohol dilution calculator](https://multicule.com/alcohol-dilution-calculator/)

## Install

```bash
openclaw plugins install clawhub:openclaw-multicule-calculators
```

No configuration or API keys needed. Everything runs locally.

## Example prompts

- "I got 40/55 on MCQ, 6 on SAQs, 5 on the DBQ and 4 on the LEQ. What AP World score is that?"
- "I've been offered $67/hour as a contractor in Sydney. How does that compare to a $100k salary?"
- "How much water do I add to 1 litre of 60% spirit to get 40%?"

## Notes

- AP predictions are estimates. The College Board sets score cutoffs each year; these use recent historical ranges.
- Contractor figures are before tax, insurance and business costs. Defaults: 7.6 hours/day, 220 billable days, 12% super.

## Development

Requires Node 24.16+ and OpenClaw 2026.5.17+.

```bash
npm install
npm run plugin:validate
openclaw plugins install ./
openclaw plugins inspect multicule-calculators --runtime
```

## License

MIT
