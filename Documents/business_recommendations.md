# Business Recommendations — Manufacturing Quality Dashboard

**Based on:** Power BI dashboard screenshots (13/06/2026)
**Data window:** 2021–2025 (5 years, individual year selections)
**Verified figures:** 231,373 units produced · 8,366 defects · 3.62% defect rate

---

## Finding 1 — Defect rate is above the 3.50% target in 4 of 5 years

**What the dashboard shows:**

| Year | Units | Defects | Defect Rate | vs Target | DPMO |
|---|---|---|---|---|---|
| 2021 | 46,091 | 1,699 | 3.69% | ❌ Above | 36,860 |
| 2022 | 46,299 | 1,651 | 3.56% | ❌ Above | 35,650 |
| 2023 | 45,663 | 1,676 | 3.67% | ❌ Above | 36,700 |
| 2024 | **47,148** | **1,621** | **3.44%** | ✅ **Hit target** | **34,380** |
| 2025 | 46,173 | 1,719 | 3.72% | ❌ Above | 37,230 |
| **5-yr total** | **231,374** | **8,366** | **3.62%** | **❌ Above** | **36,100** |

2024 was the only year to hit the ≤ 3.50% target, achieving 3.44% — the best performance in the dataset. 2025 reversed this progress entirely, rising to 3.72%, the worst year on record. The 5-year Sigma Level is 3.30 — adequate but significantly below the Six Sigma target of 6.0.

**Business recommendation:** Investigate what changed operationally between 2024 and 2025. The 2024 improvement was genuine — DPMO dropped to 34,380 and Process Yield reached 96.56%. Identify what practices, maintenance schedules, or shift patterns drove that improvement and replicate them. The 2025 deterioration (DPMO 37,230, worst year) needs root cause analysis before it entrenches as the new normal.

---

## Finding 2 — Two defect types account for the largest share of all failures

**What the dashboard shows:**

Across all years, the Defects by Type donut chart consistently shows Mislabel and Scratch as the top two defect categories:
- 2021: Mislabel largest, Scratch visible
- 2022: Loose Assembly largest — shift in dominant type
- 2023: Mislabel largest, Scratch visible
- 2024: Scratch largest, Mislabel second
- 2025: Scratch largest, Mislabel second

Scratch and Mislabel together appear in the top 2 positions across 4 of 5 years, making them the most consistently dominant failure modes.

**Business recommendation:** Apply focused corrective action on Mislabel and Scratch defects before addressing the remaining 14+ defect types. The Pareto principle applies — fixing the top 2 categories gives the largest quality improvement per unit of effort. Mislabelling is typically a process control or operator training issue — a standardised labelling check at end of each shift is a low-cost, high-impact intervention. Scratch defects often indicate handling, tooling, or conveyor surface problems — a machine-level audit of workholding fixtures is warranted. The 2022 anomaly (Loose Assembly dominant) is also worth investigating — it may reflect a specific batch of assembly issues that year.

---

## Finding 3 — Critical machines perform worst on Swing shift, with 2023 showing an extreme spike

**What the dashboard shows (Six Sigma page, Machine Performance matrix):**

| Year | Critical — Swing | Critical — Day | Critical — Night |
|---|---|---|---|
| 2021 | 3.28% | 3.50% | 3.45% |
| 2022 | 2.67% | 3.67% | 3.12% |
| 2023 | **6.58%** | 3.61% | 4.80% |
| 2024 | 3.92% | 2.92% | 4.71% |
| 2025 | 4.50% | 3.79% | 4.03% |

In 2023, Critical machines on Swing shift reached 6.58% — the highest single shift/category value visible across the entire dataset. Machine 15 (Swing 4.71%) and Machine 18 (Day 4.61%, Night 4.22%, Swing 4.39%) are the two machines consistently classified as Critical across all years.

The SPC chart UCL and LCL lines are flat across all year selections — calculated on the full 2021–2025 baseline using ALL() in DAX so they represent the true process baseline regardless of which year is selected.

**Business recommendation:** Prioritise Machine 15 and Machine 18 for immediate maintenance audit. The Swing shift performance gap is particularly concerning — investigate whether Swing shift has less supervision, different maintenance handover procedures, or different raw material batches than Day shift. The 2023 Swing shift spike to 6.58% should be investigated with maintenance logs for that specific period. A targeted intervention on these two machines is likely to produce the most measurable quality improvement per dollar spent.

---

## Finding 4 — Product type quality is volatile year-on-year, with Furniture showing the most extreme spikes

**What the dashboard shows (Product Quality Performance table):**

| Product | 2021 | 2022 | 2023 | 2024 | 2025 | 5-yr avg |
|---|---|---|---|---|---|---|
| Electronics | 3.82% | 3.63% | 4.03% | 3.16% | 3.65% | 3.67% |
| Furniture | 3.61% | 3.63% | **4.30%** | 3.35% | 3.59% | **3.73%** (worst) |
| Appliances | 3.59% | 3.79% | 3.50% | 3.41% | **4.00%** | 3.60% |
| Textiles | 3.97% | 3.14% | 3.35% | 3.42% | 3.78% | 3.56% |
| Automotive | 3.46% | 3.66% | 3.41% | **3.85%** | 3.64% | **3.55%** (best) |

No product type consistently underperforms — the worst product changes every year. However Furniture has the highest 5-year average (3.73%) and produced the worst single-year figure (4.30% in 2023). The Defect Rate Trend by Product line chart for 2023 shows one line spiking sharply around Aug–Sep 2023 to approximately 10% before dropping back — the most extreme anomaly visible in any trend chart across all years.

**Business recommendation:** The lack of a consistent worst performer suggests a process-level issue shared across product types rather than a product-specific problem. However the 2023 Furniture spike to 4.30% (and the corresponding ~10% monthly spike) warrants specific investigation — cross-reference with maintenance records, operator shift rosters, and raw material receipt logs for Aug–Sep 2023. Furniture production's overlap with Critical machines (15 and 18) is worth checking — if Furniture runs disproportionately on those machines, the machine-level fix in Finding 3 may also resolve the Furniture quality issue.

---

## Finding 5 — Downtime is trending upward while quality is not improving

**What the dashboard shows:**

| Year | Downtime Hours | YoY | Defect Rate |
|---|---|---|---|
| 2021 | 560.3 | ▲ 2.7% | 3.69% |
| 2022 | 532.2 | ▲ 5.0% | 3.56% |
| 2023 | 559.3 | ▼ 5.1% | 3.67% |
| 2024 | 570.3 | ▼ 2.0% | 3.44% |
| 2025 | 576.6 | ▼ 1.1% | 3.72% |
| **Total** | **4,607.9** | — | — |

Downtime has trended from a 2022 low of 532.2 hours to a 2025 high of 576.6 hours — an 8.3% increase trough to peak. Meanwhile defect rates have not improved — 2025 is the worst year for both downtime and defect rate simultaneously. Rework hours have remained flat at 357–379 hours per year with no downward trend.

**Business recommendation:** The combination of rising downtime and rising defect rate in 2025 strongly suggests that downtime is reactive (fixing breakdowns) rather than preventive (preventing them). Shifting Machine 15 and Machine 18 to a preventive maintenance schedule — timed to the Swing shift changeover when performance is worst — is likely to simultaneously reduce unplanned downtime and defect rates. Total 5-year downtime of 4,607.9 hours represents a significant recoverable cost if even 20% can be converted from unplanned to planned.
