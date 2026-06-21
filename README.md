# Manufacturing Quality Analytics — Data Pipeline

**Bronze → Silver → Gold | Python · AWS S3 · Athena · Power BI**

A production-grade data engineering pipeline that ingests raw manufacturing data, applies systematic cleaning and ML enrichment, and delivers analytical Gold tables to a Power BI dashboard via AWS Athena.

---

## Project Overview

| Item | Detail |
|---|---|
| **Author** | Aman Kag |
| **Architecture** | AWS Medallion (Bronze → Silver → Gold) |
| **Storage** | AWS S3 (`ap-southeast-2`) |
| **Query Layer** | AWS Athena (ODBC) |
| **BI Tool** | Power BI Desktop |
| **Raw Dataset** | 3,000 rows × 22 columns |

---

## Stack

| Layer | Technology |
|---|---|
| Language | Python 3.10 (conda env: `manufacturing`) |
| Data | Pandas, NumPy, PyArrow |
| ML | Scikit-learn (Isolation Forest, K-Means) |
| Cloud | AWS S3, AWS Athena, Boto3, S3FS |
| Visualisation | Power BI Desktop, Matplotlib |

---

## Repository Structure

```
manufacturing-analytics/
│
├── Manufacturing_dataset_cleaning_Code.ipynb   # Main pipeline notebook
│
├── data/                        # Local data directory (git-ignored)
│   ├── bronze/                  # Raw source CSV
│   ├── silver/                  # Cleaned CSV + DQ report
│   └── gold/                    # Aggregated Parquet tables
│
└── README.md
```

> **Note:** The `data/` directory is git-ignored. Data lives in AWS S3.  
> The notebook supports both `local` and `s3` environments via the `ENV` toggle.

---

## Pipeline Stages

The notebook (`Manufacturing_dataset_cleaning_Code.ipynb`) runs end-to-end in one pass:

| # | Stage | Description |
|---|---|---|
| 1 | **Load Bronze** | Read raw CSV from S3 or local path |
| 2 | **EDA** | Profile nulls, distributions, categories, outliers |
| 3 | **Schema Standardisation** | Lowercase column names, snake_case, date casting |
| 4 | **Cleaning** | 10 targeted fixes (see below) |
| 5 | **Data Quality Validation** | 8-rule DQ report — all must PASS before proceeding |
| 6 | **Anomaly Detection** | Isolation Forest (unsupervised ML) |
| 7 | **Machine Clustering** | K-Means into 3 categories (Critical / Monitor / Good) |
| 8 | **Gold Aggregation** | 4 analytical tables for Power BI |
| 9 | **Export** | Hash-checked upload to S3 (skips unchanged files) |

---

## Data Cleaning — Silver Layer

10 cleaning steps applied to the raw Bronze data:

1. Schema standardisation (column names → lowercase snake_case)
2. Date type casting + year / month / day extraction
3. Scrap rate decimal entry error correction (`÷100` where `> 1.0`)
4. Product type misspelling correction (27 rows: `Furnitr → Furniture`, etc.)
5. Null imputation — 3-level group median (`product_type × shift → product_type → global`)
6. Defect count recovery — arithmetic (`scrap_rate × units_produced`)
7. Defect type — business rule inference
8. Scrap rate recalculation (`defects / units_produced`)
9. Physically impossible outlier removal (`scrap_rate ≥ 0.5`) — 10 rows removed
10. Negative value removal

**Bronze → Silver result:** 3,000 rows → 2,990 rows × 25 columns

---

## ML Models

### Isolation Forest — Anomaly Detection
- **Features:** `units_produced`, `defects`, `scrap_rate`, `rework_hours`, `down_time_hours`
- **Contamination:** 0.02 (~2% expected anomaly rate)
- **Output:** `is_anomaly` (0/1) and `anomaly_score` columns
- **Result:** 60 anomalies flagged — preserved in data, filtered in Power BI

### K-Means — Machine Clustering
- **Clusters:** 3 (`Critical` / `Monitor` / `Good`)
- **Output:** `machine_category` column
- **Scaler:** StandardScaler

---

## Gold Layer Tables

All tables exported to `s3://manufacturing-analytics-aman-2026/gold/{table}/{table}.parquet`

| Table | Rows | Grain |
|---|---|---|
| `gold_fact_production` | 2,990 | Row-level fact (star schema centre) |
| `gold_daily_kpis` | 2,961 | Daily aggregates |
| `gold_machine_shift_kpis` | 60 | Machine × Shift aggregates |
| `gold_monthly_product_kpis` | 494 | Month × Product Type aggregates |

---

## Key Dashboard KPIs (2021–2025)

| Metric | Value |
|---|---|
| Total Units Produced | 231,373 |
| Total Defects | 8,366 |
| Defect Rate | 3.62% (target ≤ 3.50%) |
| Process Yield | 96.38% |
| DPMO | 36,156 |
| Sigma Level | 3.30 |
| Total Rework Hours | 1,831.9 |
| Total Downtime Hours | 2,798.7 |

---

## Setup

### Prerequisites

```bash
# Create conda environment
conda create -n manufacturing python=3.10
conda activate manufacturing

# Install dependencies
pip install pandas numpy matplotlib scikit-learn pyarrow boto3 s3fs
```

### AWS Credentials

Configure AWS credentials locally — **never store keys in the notebook**:

```bash
aws configure
# AWS Access Key ID: <your key>
# AWS Secret Access Key: <your secret>
# Default region: ap-southeast-2
```

Credentials are read automatically from `~/.aws/credentials` via Boto3.

### Running the Notebook

1. Clone this repo
2. Set `ENV = "local"` in Section 1 for local development, or `ENV = "s3"` to read/write directly from AWS S3
3. Place the raw Bronze CSV at `data/bronze/manufacturing_dataset.csv` (local mode only)
4. Run all cells top to bottom

---

## AWS Architecture

```
Raw CSV
   │
   ▼
S3/bronze/          ← Bronze (immutable raw data)
   │
   ▼  [Python notebook]
S3/silver/          ← Silver (cleaned CSV + DQ report)
   │
   ▼  [Python notebook]
S3/gold/            ← Gold (4 Parquet tables)
   │
   ▼  [AWS Athena ODBC]
Power BI Desktop    ← Dashboard (2 pages, year slicer 2021–2025)
```

---

## Notes

- The S3 upload step uses MD5 hash-checking to skip unchanged files and avoid redundant write costs.
- Power BI dashboards filter to `is_anomaly = 0` for standard KPI reporting; anomalies are retained in Gold for investigation.
- All years (2020–2028) are retained in Gold — the Power BI year slicer constrains the view to 2021–2025.
