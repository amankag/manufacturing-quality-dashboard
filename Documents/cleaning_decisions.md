# Data Cleaning Decisions — Bronze to Silver

Every cleaning step below was motivated by a specific EDA finding. No step was applied speculatively.

**Result:** 3,000 rows (Bronze) → 2,990 rows × 25 columns (Silver). 10 rows removed, 3 columns added.

---

## Step 1 — Schema standardisation

**What was found:** Column names had inconsistent casing and spaces (e.g. `Production ID`, `Down time Hours`).

**What was done:** Stripped whitespace, replaced spaces with underscores, converted to lowercase snake_case. Cast `date` column from object to `datetime64`.

**Why:** Downstream tools (Pandas, Athena, Power BI) all handle snake_case more reliably. Inconsistent naming causes silent join failures and DAX formula errors.

---

## Step 2 — Scrap rate decimal typo fix

**What was found (EDA):** Three rows had `scrap_rate` values of 3.6, 4.1, and 2.7 — physically impossible (a scrap rate above 1.0 means more scrap than units produced). These were data entry errors where the decimal point was misplaced.

**What was done:** Divided by 100 for all rows where `scrap_rate > 1.0`.

**Why not delete:** The rest of the row data (machine, shift, units, defects) was valid. Deleting the rows would lose real production data. Dividing by 100 recovers the intended value exactly.

---

## Step 3 — Product type misspelling correction

**What was found (EDA):** 27 rows contained misspelt product types: `Furnitr`, `Furnture`, `Automotve`, `Elctronics`, `Electroncs`, `Applinces`, `Appliences`, `Texiles`, `Txtiles`.

**What was done:** Applied a dictionary `.replace()` mapping all 10 misspelling variants to their correct values.

**Why a dictionary not fuzzy matching:** The misspellings were consistent and finite. A hardcoded dictionary is transparent, reproducible, and fast. Fuzzy matching introduces probability-based decisions that are harder to audit.

---

## Step 4 — Null imputation (3-level group median)

**What was found (EDA):** 2,769 nulls across 12 numeric columns. Null distribution was random across shifts and years — ruling out systematic data collection failure.

**What was done:** Three-level imputation waterfall:
1. Group median by `product_type × shift` (most specific)
2. Group median by `product_type` only (fallback if group 1 has no non-null values)
3. Global median (final fallback)

**Why group median not mean:** Median is robust to outliers. Manufacturing data often has extreme values (machine failures, rushes) that would distort a mean-based imputation.

**Why group median not KNN imputation:** EDA correlation analysis showed near-zero inter-feature correlations (e.g., `defects` correlates 0.003 with `rework_hours`). KNN imputation requires meaningful distance relationships between features — without correlations, it degenerates to random neighbour selection and offers no advantage over group median.

---

## Step 5 — Defect count recovery (arithmetic)

**What was found:** 349 rows had null `defects` values, but both `scrap_rate` and `units_produced` were known for those rows.

**What was done:** Recovered defect counts arithmetically: `defects = scrap_rate × units_produced`.

**Why:** This is mathematically exact — no estimation or model required. The relationship `scrap_rate = defects / units_produced` is a definitional identity in the dataset, not a statistical approximation.

---

## Step 6 — Defect type business rule imputation

**What was found:** 131 rows had null `defect_type`. Of these, rows with `defects = 0` had no defect type by definition. Rows with `defects > 0` lacked a label.

**What was done:**
- `defects = 0` → assigned `'No Defect'`
- `defects > 0` → assigned a product-appropriate defect type from a domain map (e.g., Electronics → Short Circuit, Furniture → Scratch)

**Why a domain map not random assignment:** The domain map reflects real manufacturing knowledge — Electronics fail differently than Textiles. Random assignment would corrupt downstream defect-type analysis and the Pareto chart.

---

## Step 7 — Scrap rate recalculation

**What was done:** After all cleaning steps, recalculated `scrap_rate = defects / units_produced` for the entire dataset.

**Why:** Steps 5 and 6 changed defect counts for some rows. Keeping the original scrap_rate for those rows would create internal inconsistency. Recalculating from cleaned values ensures the column is always derivable from other columns — a consistency guarantee.

---

## Step 8 — Physically impossible outlier removal

**What was found:** 10 rows had `scrap_rate >= 0.5` (50% or more scrap) even after the decimal typo fix. These are physically implausible for a manufacturing line — a 50%+ reject rate would trigger an immediate line shutdown.

**What was done:** Removed these 10 rows entirely.

**Impact:** One of these rows was responsible for the anomalous spike visible in the June 2022 SPC chart before cleaning. Removing it resolved the spike.

**Why remove not cap:** Capping at an arbitrary threshold (e.g. 0.49) preserves bad data with a different bad value. These rows represent data recording failures, not real production events.

---

## Step 9 — Negative value removal

**What was found:** EDA pre-clean business logic check identified rows with negative `units_produced` or `defects` — physically impossible.

**What was done:** Removed all rows where any numeric production column was negative.

**Why:** Negative production values have no physical interpretation. They indicate data system errors (e.g., correction entries logged as negatives) not real production events.

---

## Step 10 — Anomaly detection and machine clustering (ML enrichment)

**What was done:** Two unsupervised ML models were run on the cleaned Silver data and their outputs added as new columns before export to Gold.

### Isolation Forest (anomaly detection)
- Features: `units_produced`, `defects`, `scrap_rate`, `rework_hours`, `down_time_hours`
- Parameters: `contamination=0.02`, `n_estimators=100`, `random_state=42`
- Output: `is_anomaly` (0/1), `anomaly_score`
- Result: 60 anomalies flagged (2.0% of dataset)
- Anomalous rows averaged 99.7 units, 10.1 defects, 0.138 scrap rate vs normal rows at 127.3 units, 4.5 defects, 0.040 scrap rate

**Why Isolation Forest not DBSCAN/KNN:** Near-zero inter-feature correlations mean distance-based methods provide no meaningful separation. Isolation Forest uses random partitioning — anomalous points are isolated in fewer splits regardless of feature correlations.

**Why flag not delete:** Anomalies carry analytical value. Unusual production events are exactly what quality teams want to investigate. Rows are flagged with `is_anomaly=1` and Power BI filters to `is_anomaly=0` for standard KPI reporting — but the records are preserved for drill-down.

### K-Means clustering (machine categorisation)
- Features: `overall_defect_rate`, `avg_downtime`, `avg_rework` (per machine)
- Parameters: `k=3`, `StandardScaler`, `n_init=10`, `random_state=42`
- Output: `machine_category` (Critical / Monitor / Good)
- k=3 selected via Elbow Method and natural business mapping (three performance tiers)

**Why StandardScaler:** K-Means is distance-based. Without scaling, `avg_downtime` (mean ~1.5 hours) would dominate over `overall_defect_rate` (mean ~0.036) purely because of scale, not importance.

**Why not hardcoded thresholds:** K-Means derives cluster boundaries from the actual data distribution — more robust and less arbitrary than any manually chosen percentage cutoff. The resulting `machine_category` column is loaded directly from the Gold fact table into Power BI.
