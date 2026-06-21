# DAX Measures — Page 1 (Quality Overview Dashboard)

All measures live in the `Measures_table` (a placeholder table with one row: `{ 1 }`).

---

## Base measures

### Total Units Produced
```dax
Total Units Produced = SUM(gold_gold_fact_production[units_produced])
```
**What it does:** Adds up every unit produced across all selected filters.
**Business meaning:** The volume denominator — everything else is expressed per unit produced.

---

### Total Defects
```dax
Total Defects = SUM(gold_gold_fact_production[defects])
```
**What it does:** Sums defective units across the filter context.
**Business meaning:** Raw count of quality failures. Drives defect rate, DPMO, and all KPI arrows.

---

### Total Downtime Hours
```dax
Total Downtime Hours = SUM(gold_gold_fact_production[down_time_hours])
```
**Business meaning:** Total hours machines were stopped. High downtime signals maintenance problems or process bottlenecks.

---

### Total Rework Hours
```dax
Total Rework Hours = SUM(gold_gold_fact_production[rework_hours])
```
**Business meaning:** Hours spent fixing defective items before they could ship. A hidden labour cost — 1,831.9 hours across 2021–2025.

---

### Defect Rate %
```dax
Defect Rate % = DIVIDE([Total Defects], [Total Units Produced], 0)
```
**What it does:** Defects ÷ Units. Returns 0 if units = 0 (avoids divide-by-zero).
**Business meaning:** Primary KPI. Target ≤ 3.50%. Current 5-year average is 3.62% — above target.
**Why DIVIDE not `/`:** DIVIDE handles zero denominators gracefully without erroring.

---

### Scrap Rate %
```dax
Scrap Rate % = DIVIDE([Total Defects], [Total Units Produced], 0)
```
**What it does:** Currently identical formula to Defect Rate %.
**Known issue:** Should use `AVERAGEX(gold_gold_fact_production, gold_gold_fact_production[scrap_rate])` to reflect the actual scrap_rate column, which was independently cleaned and recalculated in Python (decimal typo fix + defects/units_produced recalculation). Both dashboard KPI cards currently show the same number. Documented and acknowledged.

---

## Previous year measures

All use `DATEADD` rather than `FILTER` — DATEADD works within the slicer filter context automatically.

```dax
Previous Year Units    = CALCULATE([Total Units Produced], DATEADD('DimDate'[Date], -1, YEAR))
Previous Year Defects  = CALCULATE([Total Defects],        DATEADD('DimDate'[Date], -1, YEAR))
Previous Year Scrap %  = CALCULATE([Scrap Rate %],         DATEADD('DimDate'[Date], -1, YEAR))
Previous Year Downtime = CALCULATE([Total Downtime Hours], DATEADD('DimDate'[Date], -1, YEAR))
```

**Why DATEADD not FILTER:** DATEADD shifts the entire date context by one year and respects the current slicer selection automatically. A manual FILTER approach would require hardcoding year numbers, breaking when new years are added to the data.

---

## Change % measures

```dax
Units Change %    = DIVIDE([Total Units Produced]  - [Previous Year Units],    [Previous Year Units],    0)
Defects Change %  = DIVIDE([Total Defects]         - [Previous Year Defects],  [Previous Year Defects],  0)
Scrap Change %    = DIVIDE([Scrap Rate %]           - [Previous Year Scrap %],  [Previous Year Scrap %],  0)
Downtime Change % = DIVIDE([Total Downtime Hours]  - [Previous Year Downtime], [Previous Year Downtime], 0)
```

**Business meaning:** Year-on-year percentage movement. What counts as "good" depends on the metric — see KPI arrows below.

---

## KPI arrow measures

UNICHAR codes: `9650` = ▲, `9660` = ▼, `8212` = —

**Direction logic — good vs bad differs by metric:**

| Metric | Increase | Decrease |
|---|---|---|
| Units | ▲ Good (green) | ▼ Bad (red) |
| Defects | ▼ Good (green) | ▲ Bad (red) |
| Scrap Rate | ▼ Good (green) | ▲ Bad (red) |
| Downtime | ▼ Good (green) | ▲ Bad (red) |

Units arrow (up = good):
```dax
Units KPI Arrow =
IF(ISBLANK([Previous Year Units]), BLANK(),
IF([Units Change %] > 0, UNICHAR(9650) & " " & FORMAT([Units Change %], "0.0%"),
IF([Units Change %] < 0, UNICHAR(9660) & " " & FORMAT(ABS([Units Change %]), "0.0%"),
UNICHAR(8212) & " 0.0%")))
```

Defects arrow (down = good — logic inverted vs Units):
```dax
Defects KPI Arrow =
IF(ISBLANK([Previous Year Defects]), BLANK(),
IF([Defects Change %] < 0, UNICHAR(9650) & " " & FORMAT(ABS([Defects Change %]), "0.0%"),
IF([Defects Change %] > 0, UNICHAR(9660) & " " & FORMAT([Defects Change %], "0.0%"),
UNICHAR(8212) & " 0.0%")))
```
*(Scrap and Downtime arrows follow identical inverted logic.)*

---

## Smart arrow measures — HASONEVALUE guard

```dax
Units KPI Arrow Smart    = IF(HASONEVALUE(DimDate[Year]), [Units KPI Arrow],    BLANK())
Defects KPI Arrow Smart  = IF(HASONEVALUE(DimDate[Year]), [Defects KPI Arrow],  BLANK())
Scrap KPI Arrow Smart    = IF(HASONEVALUE(DimDate[Year]), [Scrap KPI Arrow],    BLANK())
Downtime KPI Arrow Smart = IF(HASONEVALUE(DimDate[Year]), [Downtime KPI Arrow], BLANK())
```

**Why HASONEVALUE:** When "All years" is selected in the slicer, HASONEVALUE returns FALSE and the arrow shows blank. Comparing a 5-year aggregate to its "previous year" has no business meaning — showing an arrow would be misleading. This is a deliberate design decision, not a bug.

---

## KPI colour measures

```dax
Units KPI Colour =
IF(ISBLANK([Previous Year Units]),  "#808080",
IF([Units Change %] > 0,            "#00B050",
IF([Units Change %] < 0,            "#C00000", "#808080")))

Defects KPI Colour =
IF(ISBLANK([Previous Year Defects]), "#808080",
IF([Defects Change %] < 0,          "#00B050",
IF([Defects Change %] > 0,          "#C00000", "#808080")))
```

Colours: `#00B050` = green (good), `#C00000` = red (bad), `#808080` = grey (no data or no change).

---

## Dynamic metric selector

```dax
Selected Metric Value =
SWITCH(
    SELECTEDVALUE('Metric Selector'[Parameter]),
    "Units",      [Total Units Produced],
    "Defects",    [Total Defects],
    "Scrap Rate", [Scrap Rate %],
    "Downtime",   [Total Downtime Hours],
    BLANK()
)

Metric Selector = {
    ("Units",    NAMEOF('Measures_table'[Total Units Produced]), 0),
    ("Defects",  NAMEOF('Measures_table'[Total Defects]),        1),
    ("Scrap",    NAMEOF('Measures_table'[Scrap Rate %]),         2),
    ("Downtime", NAMEOF('Measures_table'[Total Downtime Hours]), 3)
}
```

**Business reason:** One chart shows four trend views via button selection. Saves dashboard real estate and lets analysts compare metric trends without navigating away.

---

## Selected year display

```dax
Selected Year =
IF(ISFILTERED(DimDate[Year]), MAX(DimDate[Year]), MAXX(ALL(DimDate), DimDate[Year]))
```

**What it does:** Shows current year in a card. Single year selected → MAX returns it. No filter → MAXX(ALL) returns the latest year in the dataset, so the card always shows something meaningful.
