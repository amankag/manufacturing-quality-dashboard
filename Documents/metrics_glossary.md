# Metrics Glossary — Manufacturing Quality Dashboard

Plain English explanation of every metric shown on the dashboard. For technical definitions see `dax_measures_page1.md` and `dax_measures_page2_sixsigma.md`.

---

## Page 1 — Production Quality Dashboard

### Defect Rate %
**What it is:** The percentage of units produced that had a defect.
**Formula:** Defects ÷ Units Produced
**Example:** 1,621 defects out of 47,148 units in 2024 = 3.44%
**Target:** ≤ 3.50% (set by the business)
**Dashboard value (5-year avg):** 3.62% — above target
**Good direction:** Down ▼ (lower defect rate = better quality)
**In plain English:** "Out of every 100 units we made, 3.62 had a defect."

---

### Scrap Rate %
**What it is:** The fraction of units scrapped (discarded as unusable) during production.
**Formula (as shown on dashboard):** Currently calculated the same as Defect Rate % (see known limitations). Ideally: Average scrap rate per production run.
**Dashboard value (5-year avg):** 3.62%
**Good direction:** Down ▼
**In plain English:** "The proportion of production that had to be thrown away or reworked beyond use."

---

### Units Produced
**What it is:** The total number of units that came off the production line in the selected period, including defective ones.
**Dashboard value (5-year total):** 231,373
**Good direction:** Up ▲ (more units = more output)
**In plain English:** "How much we made."

---

### Downtime Hours
**What it is:** The total number of hours machines were stopped — whether for planned maintenance, breakdowns, or changeovers.
**Dashboard value (5-year total):** 4,607.9 hours
**Worst year:** 2025 (576.6 hours)
**Best year:** 2022 (532.2 hours)
**Good direction:** Down ▼ (less downtime = more productive time)
**In plain English:** "How many hours the machines weren't running."

---

### YoY Change arrows (▲ ▼ --)
**What it is:** Year-over-year percentage change versus the same metric in the previous year.
**-- (em dash):** Shown when "All years" is selected — no single previous year to compare against.
**▲ with green colour:** Good improvement (e.g. Units going up, or Defects going down)
**▼ with red colour:** Getting worse (e.g. Defects going up, or Units going down)
**Note:** The direction of "good" differs by metric — a ▲ on Units is good, but a ▲ on Defects is bad. The dashboard colours encode this automatically.

---

### Machine Category (Critical / Monitor / Good)
**What it is:** A classification of each machine's overall performance, derived from K-Means clustering in Python using defect rate, downtime, and rework hours as features.
**Critical:** Machines consistently producing the highest defect rates — require immediate attention. Machines 15 and 18 are currently classified Critical.
**Monitor:** Machines with moderate defect rates — watch closely but not yet at crisis point.
**Good:** Machines performing at or below the 3.50% target — functioning as expected.
**Important note:** These categories are based on the full 5-year historical baseline and do not change when the year slicer is changed — they reflect a machine's overall track record, not its performance in a single year.

---

## Page 2 — Six Sigma Dashboard

### DPMO — Defects Per Million Opportunities
**What it is:** A standardised quality metric that scales the defect rate to "per million" so you can compare quality across factories or industries regardless of production volume.
**Formula:** (Defects ÷ Units Produced) × 1,000,000
**Dashboard value (5-year avg):** 36,100 DPMO
**Best year:** 2024 — 34,380 DPMO
**Worst year:** 2025 — 37,230 DPMO
**Industry benchmarks:**
- Six Sigma (world class): 3.4 DPMO
- 4 Sigma (good manufacturing): ~6,200 DPMO
- 3 Sigma (average manufacturing): ~66,800 DPMO
- **This factory: ~36,100 DPMO → between 3 and 4 Sigma**
**Good direction:** Down ▼
**In plain English:** "If we made one million units, about 36,100 of them would be defective."

---

### Sigma Level
**What it is:** A score from 1 to 6 that summarises process quality. Derived mathematically from DPMO. Higher is always better.
**Formula:** `0.8406 + √(29.37 − 2.221 × ln(DPMO))` — standard Six Sigma approximation
**Dashboard value (all years):** 3 (shown as rounded integer on KPI card)
**More precise value:** 3.30 Sigma (from Python notebook)
**What the levels mean:**
- **6 Sigma:** 3.4 DPMO — near-perfect (aerospace, medical devices)
- **5 Sigma:** 233 DPMO — excellent
- **4 Sigma:** 6,210 DPMO — good
- **3 Sigma:** 66,807 DPMO — average manufacturing
- **This factory: 3.30 Sigma** — slightly above average manufacturing
**Good direction:** Up ▲ (higher sigma = better quality)
**In plain English:** "On a scale of 1–6, our process quality scores 3.30 — adequate but with significant room for improvement."

---

### Process Yield %
**What it is:** The percentage of units that pass through production without any defect.
**Formula:** 1 − (Defects ÷ Units Produced) = 1 − Defect Rate
**Dashboard value (5-year avg):** 96.39%
**Best year:** 2024 — 96.56%
**Worst year:** 2025 — 96.28%
**Six Sigma target:** 99.99966% (essentially zero defects)
**Good direction:** Up ▲
**In plain English:** "96.39% of what we produce is defect-free. At Six Sigma, that number would be 99.9997%."

---

### Rework Hours
**What it is:** The number of hours spent fixing defective items so they can still be used or sold. Rework is waste — time and labour spent fixing things that should have been right first time.
**Dashboard value by year:** 357–379 hours per year (per individual year selected on dashboard)
**Good direction:** Down ▼ (less rework = fewer defects reaching the rework stage)
**In plain English:** "Hours of labour wasted fixing things that were made wrong."

---

### UCL — Upper Control Limit
**What it is:** The upper boundary on the SPC chart. Any month where defect rate rises above this line is statistically "out of control" — meaning the variation is too large to be explained by normal random chance alone.
**How it's calculated:** Mean monthly defect rate + 2 standard deviations, calculated across the full 2021–2025 baseline.
**This dashboard:** ±2σ limits (more sensitive early warning vs the standard ±3σ)
**Visual:** Red dashed upper line on the SPC chart. Flat across all years (does not change when year slicer is changed — by design).
**In plain English:** "The upper guardrail. Any month above this line is a signal to investigate, not just normal variation."

---

### LCL — Lower Control Limit
**What it is:** The lower boundary on the SPC chart. Months below this line are also out of control — unusually good performance that may indicate a measurement error or a process change worth replicating.
**How it's calculated:** Mean monthly defect rate − 2 standard deviations (floored at 0 — a negative defect rate is impossible).
**Visual:** Red dashed lower line on the SPC chart.
**In plain English:** "The lower guardrail. Surprisingly good months below this line are also worth investigating — to understand why and replicate it."

---

### Out of Control
**What it is:** A month where the defect rate breaches either the UCL or LCL.
**Visual:** Orange dots on the SPC chart overlay — only appear on months that breach the control limits.
**What to do:** An out-of-control point is a signal to investigate the root cause. It does not automatically mean something went wrong — but it means normal variation alone cannot explain it.
**In plain English:** "The orange dots on the SPC chart flag months that were statistically unusual and worth looking into."

---

### Cumulative Defect % (Pareto)
**What it is:** Used to build the Pareto chart of defect types. For each defect type (sorted from most to least frequent), shows what percentage of total defects it and all higher-ranked types account for cumulatively.
**Business use:** The 80/20 rule — typically 20% of defect types cause 80% of defects. Fixing the top 2–3 types gives the biggest quality improvement per unit of effort.
**In plain English:** "Shows which defect types to fix first to get the biggest bang for the buck."

---

## Quick reference card

| Metric | Good direction | 5-yr value | Target |
|---|---|---|---|
| Defect Rate % | ▼ Down | 3.62% | ≤ 3.50% |
| Scrap Rate % | ▼ Down | 3.62% | ≤ 3.50% |
| Units Produced | ▲ Up | 231,373 total | Maximise |
| Downtime Hours | ▼ Down | 4,607.9 total | Minimise |
| DPMO | ▼ Down | 36,100 | 3.4 (Six Sigma) |
| Sigma Level | ▲ Up | 3.30 | 6.0 (Six Sigma) |
| Process Yield % | ▲ Up | 96.39% | 99.9997% |
| Rework Hours | ▼ Down | ~366/yr avg | Minimise |
