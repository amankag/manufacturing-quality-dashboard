# Data Dictionary — Gold Layer Tables

All tables queried via AWS Athena from `s3://manufacturing-analytics-aman-2026/gold/`.

---

## gold_fact_production — 2,990 rows × 23 columns

The central fact table. One row per production run. All Power BI KPI measures read from this table.

| Column | Type | Source | Description |
|---|---|---|---|
| `production_id` | BIGINT | Bronze (original) | Unique identifier per production run (1–3,000) |
| `date` | TIMESTAMP | Bronze → cleaned | Production date. Cast from object to datetime in Silver |
| `year` | BIGINT | Derived | Extracted from date |
| `month` | BIGINT | Derived | Extracted from date (1–12) |
| `day` | BIGINT | Derived | Extracted from date (1–31) |
| `product_type` | STRING | Bronze → cleaned | Product category. 27 misspellings corrected. Values: Automotive, Electronics, Furniture, Appliances, Textiles |
| `machine_id` | BIGINT | Bronze (original) | Machine identifier (1–20) |
| `shift` | STRING | Bronze (original) | Production shift. Values: Day, Night, Swing |
| `units_produced` | DOUBLE | Bronze → imputed | Units produced in the run. 54 nulls filled via group median |
| `defects` | DOUBLE | Bronze → recovered | Defective units. 349 nulls recovered arithmetically (scrap_rate × units_produced) |
| `scrap_rate` | DOUBLE | Bronze → cleaned → recalculated | Fraction of units scrapped. 3 decimal typos fixed (÷100). Recalculated as defects/units_produced after all cleaning |
| `rework_hours` | DOUBLE | Bronze → imputed | Hours spent reworking defective items. 512 nulls imputed |
| `down_time_hours` | DOUBLE | Bronze → imputed | Machine downtime hours. 409 nulls imputed |
| `maintenance_hours` | DOUBLE | Bronze → imputed | Scheduled maintenance hours. 300 nulls imputed |
| `quality_checks_failed` | DOUBLE | Bronze → imputed | Number of quality inspection failures. 293 nulls imputed |
| `production_time_hours` | DOUBLE | Bronze → imputed | Total production time. 138 nulls imputed |
| `energy_consumption_kwh` | DOUBLE | Bronze → imputed | Energy used in the run. 138 nulls imputed |
| `labour_cost_per_hour` | DOUBLE | Bronze (original) | Labour cost rate. No nulls in Bronze |
| `opportunities_per_unit` | DOUBLE | Bronze (original) | Defect opportunities per unit (~7.24 mean). Used in true DPMO calculation (not currently in DAX) |
| `defect_type` | STRING | Bronze → imputed | Type of defect. Business rule imputed: 'No Defect' where defects=0, product-appropriate type where defects>0. 27 distinct values |
| `machine_category` | STRING | ML (K-Means) | Machine performance cluster. Values: Critical, Monitor, Good. Derived from overall_defect_rate, avg_downtime, avg_rework per machine across all runs |
| `is_anomaly` | BIGINT | ML (Isolation Forest) | 1 = anomalous run, 0 = normal. 60 anomalies flagged (2.0%). Power BI filters to is_anomaly=0 for standard reporting |
| `anomaly_score` | DOUBLE | ML (Isolation Forest) | Raw IF score. More negative = more anomalous |

---

## gold_daily_kpis — 2,961 rows × 12 columns

Daily aggregates. Used for time-series trend charts in Power BI. One row per calendar day that had production activity.

| Column | Type | Description |
|---|---|---|
| `date` | TIMESTAMP | Production date (FK → DimDate) |
| `year` | BIGINT | Year |
| `month` | BIGINT | Month number |
| `day` | BIGINT | Day of month |
| `total_units` | DOUBLE | SUM(units_produced) for the day |
| `total_defects` | DOUBLE | SUM(defects) for the day |
| `avg_scrap_rate` | DOUBLE | MEAN(scrap_rate) for the day |
| `total_downtime_hours` | DOUBLE | SUM(down_time_hours) for the day |
| `total_rework_hours` | DOUBLE | SUM(rework_hours) for the day |
| `total_maintenance_hours` | DOUBLE | SUM(maintenance_hours) for the day |
| `total_energy_kwh` | DOUBLE | SUM(energy_consumption_kwh) for the day |
| `defect_rate` | DOUBLE | total_defects / total_units for the day |

Note: 39 fewer rows than production days because some dates had all rows removed during Silver cleaning.

---

## gold_machine_shift_kpis — 60 rows × 10 columns

Aggregated by machine × shift combination. 20 machines × 3 shifts = 60 rows. Used for the machine performance matrix in the Six Sigma dashboard.

**Important:** This table has no `date` column and does not respond to the year slicer in Power BI. Machine categories are based on the full historical baseline — by design.

| Column | Type | Description |
|---|---|---|
| `machine_id` | BIGINT | Machine identifier (1–20) (FK → DimMachine) |
| `shift` | STRING | Shift (Day/Night/Swing) (FK → DimShift) |
| `total_units` | DOUBLE | SUM(units_produced) across all runs for this machine-shift |
| `total_defects` | DOUBLE | SUM(defects) |
| `avg_scrap_rate` | DOUBLE | MEAN(scrap_rate) |
| `total_downtime_hours` | DOUBLE | SUM(down_time_hours) |
| `total_rework_hours` | DOUBLE | SUM(rework_hours) |
| `avg_quality_checks_failed` | DOUBLE | MEAN(quality_checks_failed) |
| `machine_category` | STRING | K-Means cluster label for this machine (Critical/Monitor/Good) |
| `defect_rate` | DOUBLE | total_defects / total_units |

---

## gold_monthly_product_kpis — 494 rows × 10 columns

Aggregated by year × month × product_type. Used for product-level trend analysis. 5 years × ~12 months × 5 products = theoretical max 300 — actual 494 because some month/product combinations span the 2020 and 2026 edge years retained in Gold.

| Column | Type | Description |
|---|---|---|
| `year` | BIGINT | Year |
| `month` | BIGINT | Month number |
| `product_type` | STRING | Product category (FK → DimProduct) |
| `total_units` | DOUBLE | SUM(units_produced) |
| `total_defects` | DOUBLE | SUM(defects) |
| `avg_scrap_rate` | DOUBLE | MEAN(scrap_rate) |
| `total_downtime_hours` | DOUBLE | SUM(down_time_hours) |
| `total_rework_hours` | DOUBLE | SUM(rework_hours) |
| `avg_production_time_hours` | DOUBLE | MEAN(production_time_hours) |
| `defect_rate` | DOUBLE | total_defects / total_units |

---

## Power BI dimension tables (manually created)

| Table | Key column | Values | Connects to |
|---|---|---|---|
| DimDate | date | All production dates + calculated columns | FACT_PRODUCTION, DAILY_KPIS |
| DimMachine | machine_id | 1–20 | FACT_PRODUCTION, MACHINE_SHIFT_KPIS |
| DimProduct | product_type | Automotive, Electronics, Furniture, Appliances, Textiles | FACT_PRODUCTION, MONTHLY_PRODUCT_KPIS |
| DimShift | shift | Day, Night, Swing | MACHINE_SHIFT_KPIS only (no direct fact link) |
| DimDefect | defect_type | 27 defect types including 'No Defect' | FACT_PRODUCTION |
