# DAX Measures — Page 2 (Six Sigma Dashboard)

All measures live in `Six_Sigma_Measures = DATATABLE("Placeholder", STRING, {{""}})`.

---

## Core Six Sigma metrics

### DPMO
```dax
DPMO = DIVIDE([Total Defects], [Total Units Produced]) * 1000000
```
**What it does:** Defects Per Million Opportunities.
**Formula:** (Defects ÷ Units) × 1,000,000.
**Known limitation:** The denominator should technically be `Total Units × opportunities_per_unit` for true DPMO. The `opportunities_per_unit` column exists in the fact table but is not used here — simplification acknowledged. Current value: **36,156 DPMO** (2021–2025).
**Business meaning:** Allows comparison against industry benchmarks regardless of production volume.

---

### Sigma Level
```dax
Sigma Level = ROUND(0.8406 + SQRT(29.37 - 2.221 * LN([DPMO])), 2)
```
**What it does:** Converts DPMO to a Sigma level using the standard Six Sigma approximation formula.
**Current value:** **3.30 sigma** — industry target is 6 Sigma (3.4 DPMO). Manufacturing industry average is typically 3–4 Sigma.
**Why an approximation:** The exact Sigma conversion requires an inverse normal distribution function not natively available in DAX. This formula (from Minitab/ASQ standards) is the accepted approximation used in industry.

---

### Process Yield %
```dax
Process Yield % = 1 - DIVIDE([Total Defects], [Total Units Produced])
```
**What it does:** Percentage of units that pass without defect.
**Current value:** **96.38%** — Six Sigma target is 99.99966%.
**Business meaning:** The customer-facing quality number. "96.38% of what we produce is defect-free."

---

## Statistical Process Control (SPC) measures

### UCL — Upper Control Limit
```dax
UCL =
VAR baseline_avg =
    CALCULATE(
        AVERAGEX(ALL(DimDate[MonthYear]), [Defect Rate %]),
        FILTER(ALL(DimDate), DimDate[Year] >= 2021 && DimDate[Year] <= 2025))
VAR baseline_var =
    CALCULATE(
        AVERAGEX(ALL(DimDate[MonthYear]), POWER([Defect Rate %] - baseline_avg, 2)),
        FILTER(ALL(DimDate), DimDate[Year] >= 2021 && DimDate[Year] <= 2025))
RETURN baseline_avg + 2 * SQRT(baseline_var)
```

### LCL — Lower Control Limit
```dax
LCL =
-- Same baseline calculation as UCL
RETURN MAX(0, baseline_avg - 2 * SQRT(baseline_var))
```

**How it works:** Calculates the mean monthly defect rate and standard deviation across the full 2021–2025 baseline, then sets control limits at ±2 standard deviations.

**Two key design decisions:**

**Why ±2σ not ±3σ:** Standard SPC uses ±3σ (99.7% of points fall within). This dashboard uses ±2σ deliberately as an early warning system — it is more sensitive and flags potential issues sooner. Acknowledged limitation: higher false-alarm rate. Worth mentioning in interviews.

**Why ALL(DimDate):** Control limits must be calculated from the full baseline regardless of what year is selected in the slicer. Without `ALL()`, selecting "2024" would calculate UCL/LCL from only 2024 data — the bands would be too narrow and almost every point would appear "out of control." `ALL()` removes the slicer context so limits always reflect the 5-year baseline.

---

### Out of Control
```dax
Out of Control = IF([Defect Rate %] > [UCL] || [Defect Rate %] < [LCL], [Defect Rate %], BLANK())
```
**What it does:** Returns the defect rate value only for months that breach UCL or LCL. Returns BLANK otherwise.
**Business meaning:** Powers the orange dot overlay on the SPC chart. Months with orange dots are statistically unusual and warrant investigation.

---

## Pareto analysis

### Cumulative Defect %
```dax
Cumulative Defect % =
VAR current_type_defects =
    SUM(gold_gold_fact_production[defects])
VAR total_defects =
    CALCULATE(
        SUM(gold_gold_fact_production[defects]),
        ALL(gold_gold_fact_production[defect_type]))
VAR cumulative =
    CALCULATE(
        SUM(gold_gold_fact_production[defects]),
        FILTER(
            ALL(gold_gold_fact_production[defect_type]),
            CALCULATE(SUM(gold_gold_fact_production[defects])) >= current_type_defects))
RETURN DIVIDE(cumulative, total_defects)
```
**What it does:** For each defect type (sorted descending), calculates its cumulative share of total defects — enabling a Pareto chart (80/20 analysis).
**Business meaning:** Top two defect types (Scratch 10.43%, Mislabel 10.37%) account for over 25% of all failures. Fixing these two alone would have the highest return on investment.
**Note on logic:** The `>=` comparison includes all defect types with equal or higher defect counts. Works correctly as long as defect counts per type are not tied — which they are not in this dataset.

---

## Previous year measures (Page 2)

```dax
Previous Year DPMO   = CALCULATE([DPMO],            DATEADD(DimDate[date], -1, YEAR))
Previous Year Sigma  = CALCULATE([Sigma Level],      DATEADD(DimDate[date], -1, YEAR))
Previous Year Yield  = CALCULATE([Process Yield %],  DATEADD(DimDate[date], -1, YEAR))
Previous Year Rework = CALCULATE([Total Rework Hours], DATEADD(DimDate[date], -1, YEAR))
```

---

## Change % and KPI arrows (Page 2)

```dax
DPMO Change %   = DIVIDE([DPMO]              - [Previous Year DPMO],   [Previous Year DPMO],   0)
Sigma Change %  = DIVIDE([Sigma Level]       - [Previous Year Sigma],  [Previous Year Sigma],  0)
Yield Change %  = DIVIDE([Process Yield %]   - [Previous Year Yield],  [Previous Year Yield],  0)
Rework Change % = DIVIDE([Total Rework Hours]- [Previous Year Rework], [Previous Year Rework], 0)
```

**Direction of "good" on Page 2:**

| Metric | Increase | Decrease |
|---|---|---|
| DPMO | ▼ Bad (red) | ▲ Good (green) — fewer defects per million |
| Sigma Level | ▲ Good (green) | ▼ Bad (red) — higher sigma = better quality |
| Process Yield % | ▲ Good (green) | ▼ Bad (red) — more passing units |
| Rework Hours | ▼ Good (green) | ▲ Bad (red) — less rework = less waste |

All Smart arrow variants use the same `HASONEVALUE(DimDate[Year])` guard as Page 1 — blank when multiple years selected.

---

## Calculated column on DimDate

```dax
MonthStart = DATE(YEAR('DimDate'[date]), MONTH('DimDate'[date]), 1)
```
**What it does:** Creates the first day of each month from the date column.
**Why needed:** Used as the X-axis on the SPC line chart. Plotting by raw date creates a point per day (2,990 points). Plotting by MonthStart aggregates to monthly — 60 points across 5 years — which is readable as a control chart.
