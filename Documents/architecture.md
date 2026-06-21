# Architecture — Design Decisions

## Overview

```
Raw CSV (Bronze)
    ↓  Python notebook (Pandas + Scikit-learn)
Cleaned CSV (Silver) + DQ report
    ↓  Python notebook (aggregation)
4 Parquet tables (Gold)
    ↓  AWS Athena (ODBC)
Power BI Desktop (star schema + DAX)
```

All data lives in `s3://manufacturing-analytics-aman-2026/` (ap-southeast-2, Sydney).

---

## Why Medallion Architecture

| Layer | Purpose | Guarantee |
|---|---|---|
| Bronze | Immutable raw source | Never modified. Re-run pipeline any time from scratch |
| Silver | Cleaned, validated, ML-enriched | All 8 DQ rules pass before data leaves this layer |
| Gold | Pre-aggregated for Power BI | Optimised for Athena query performance |

**Alternative considered:** Single-layer approach (clean in place). Rejected because it destroys the audit trail — you can't prove what the original data looked like or re-run cleaning with different parameters.

---

## Why AWS S3 + Athena

**S3:** Serverless, ~$0.023/GB/month, no instance to manage. For analytical workloads with infrequent queries, far cheaper than any database.

**Athena:** Serverless SQL on S3, $5 per TB scanned. Power BI connects via ODBC. No cluster to provision or pay for when idle.

**Alternatives considered:**
- RDS/PostgreSQL: requires running instance (~$0.02–0.10/hour), overkill for a read-mostly analytical dataset
- Redshift: $0.25/hour minimum, 10× more expensive than Athena for this query volume
- Direct S3 connection from Power BI: no SQL layer, no ability to filter at source

---

## Why Parquet not CSV for Gold

| Property | Parquet | CSV |
|---|---|---|
| Storage format | Columnar | Row-based |
| Compression | Built-in (Snappy) | None |
| Query: SELECT 3 of 23 cols | Reads 3 cols only | Reads all 23 cols |
| Athena performance | 5–10× faster | Baseline |
| File size | 3–5× smaller | Baseline |
| Native Athena support | Yes | Yes (slower) |

---

## Why Python + Pandas not Spark/Glue

At 3,000 rows, Spark is architectural overkill. Glue's minimum DPU takes 2–3 minutes to spin up and costs $0.44/DPU-hour with no free tier. The Pandas notebook runs in under 30 seconds on a laptop.

**Glue was attempted** for the Athena table crawler step and caused schema corruption — it pointed to stale S3 paths and created tables from old Parquet files. All 4 tables were rebuilt manually with explicit `CREATE EXTERNAL TABLE` statements.

---

## Why Isolation Forest for anomaly detection

Near-zero inter-feature correlations (EDA finding) rule out distance-based methods:
- **DBSCAN / KNN / LOF:** Rely on meaningful distances. Without correlations, all points are equidistant — these methods can't separate anomalies from normal points.
- **Isolation Forest:** Uses random partitioning. Anomalous points (sparse, extreme) are isolated in fewer random splits than dense normal points — works regardless of feature correlations. No normalisation required.

---

## Why K-Means for machine clustering

- Natural business mapping to 3 tiers (Critical / Monitor / Good) — k chosen by Elbow Method and validated against domain knowledge
- StandardScaler applied first — K-Means is distance-based, sensitive to feature scale
- Data-driven boundaries from actual data distribution — no arbitrary percentage cutoff needed
- `machine_category` column loaded directly from Gold fact table into Power BI

---

## Future pipeline (planned)

```
New CSV dropped to S3/bronze/
    ↓ S3 Event Notification
Lambda 1 — bronze_to_silver.py
    (cleaning + ML — same logic as notebook)
    ↓
Lambda 2 — silver_to_gold.py
    (aggregation + Parquet export)
    ↓ boto3: Athena MSCK REPAIR TABLE
Athena tables refreshed automatically
    ↓ Power BI scheduled refresh
Dashboard updated without manual steps
```

**Why Lambda not Glue:** Plain Python + Pandas copies from notebook with minimal changes. 1M requests/month free tier. Runs in seconds. No PySpark rewrite needed.
