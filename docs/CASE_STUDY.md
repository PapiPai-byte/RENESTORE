# ReneStore Business Analytics Case Study

## Company background

ReneStore is an e-commerce application for computers, laptops, tools, and accessories. The project combines a React frontend, Express API, Drizzle ORM, and PostgreSQL database.

## Problem statement

> ReneStore sells computer products but doesn't know which products and channels drive profit, can't reliably forecast demand, and has no data-driven plan for splitting its monthly marketing budget and inventory purchases.

**Business question:** How should ReneStore allocate its marketing budget and stock purchases to maximize profit next month?

## Objectives

1. Describe sales, customer, product, marketing, and inventory-purchase activity using database records.
2. Compare linear-regression and 3-month moving-average forecasts using a shared monthly order series.
3. Use observed campaign ROI and configurable budget bounds to produce an estimated marketing allocation, and use sales, stock, cost, and lead-time data to prioritize inventory review.
4. Present the data flow, caveats, and computed outputs in an interactive dashboard.

## Data description

The connected database audit found the following counts. These are row counts, not proof that the underlying records are authentic. Earlier seed/import paths generated data, so provenance must be confirmed before these rows are described as real or used as defense findings.

| Variable | Tables used | Audited row count | Date range | Data source |
|---|---|---:|---|---|
| Products | `products`, `suppliers` | 60 products | Not applicable | Enter the verified catalog source in the Case Study tab |
| Customers | `customers` | 61 | Registration dates are shown by the database-backed Case Study view | Enter the verified customer source in the Case Study tab |
| Orders / transactions | `orders`, `order_items`, `transactions` | 158 orders | 2025-01-05 to 2026-10-24 for orders | Enter the verified order/payment source in the Case Study tab |
| Marketing campaigns | `marketing_campaigns` | 65 | Campaign date range is shown by the database-backed Case Study view | Enter the verified advertising-platform/source records in the Case Study tab |
| Supplier inventory purchases | `inventory_purchases` | 60 | Purchase date range is shown by the database-backed Case Study view | Enter the verified supplier invoice/purchase source in the Case Study tab |

The Data Overview section of the admin dashboard displays current counts, dates, and whether each table meets the 50-row threshold. Counts should be refreshed after migrations or imports. The editable source descriptions are stored in the browser's local storage; document the actual origin and retain source evidence separately. The marketing analysis uses `marketing_campaigns`; `marketing_performance` is a separate legacy table and is not evidence that campaign data is authentic.

## Methodology

### Descriptive: what happened?

The dashboard derives revenue, profit, order counts, average order value, margin, customers, and stockout counts from the database. It visualizes monthly revenue/profit and breakdowns for products, categories, cities, payment methods, order statuses, marketing campaigns, customer segments, and inventory purchases. Marketing measures include click-through rate, conversion rate, cost per order, and return on investment where the source fields support those calculations. Statistical summaries include mean, median, standard deviation, minimum, and maximum.

### Predictive: what may happen?

The predictive step uses the descriptive monthly series. Linear regression is fitted on complete months, while a current incomplete month may be shown separately. The dashboard compares regression and a 3-month moving average using R² and RMSE, then generates consecutive future month labels for the selected horizon. Campaign ROI estimates and per-product stockout-risk estimates are based on observed historical records. A short or incomplete history limits the usefulness of these estimates.

### Prescriptive: what should be considered?

The budget optimizer solves a linear program: maximize estimated marketing profit using recent campaign-month ROI estimates, subject to the total budget and per-channel minimum and maximum values. The before/after comparison, estimated returns, and action list are scenario outputs; they are not guaranteed outcomes. Inventory recommendations calculate reorder points and economic order quantities from observed sales, costs, stock levels, and supplier lead-time history, subject to the entered purchase budget.

### Step-wise connection

**Descriptive outputs** (monthly sales, category and channel results) feed **Predictive models** (monthly forecasts, campaign ROI estimates, and demand risk), which inform **Prescriptive scenarios** (budget allocations and reorder quantities), leading to a **Decision Summary** for human review. See the Process Flow tab for the current database-derived values.

## Findings

Do not publish fixed findings until record provenance is verified and the latest database-backed dashboard has been reviewed. At defense time, record the current peak complete month, leading category/channel, regression R² and RMSE, model recommendation, optimized scenario allocation, and products flagged for reorder from the dashboard. Include the filters, selected horizon, budget, and channel bounds used so the scenario can be reproduced.

## Recommendations

Use the latest descriptive and predictive results to review the prescriptive budget scenario and inventory reorder list with the people responsible for advertising and purchasing. Validate campaign assumptions, supplier availability, unit costs, and operational constraints before acting. Record whether each recommended action was accepted and compare actual results with estimates in a later review period.

## Conclusion

ReneStore now has an analytics workflow that connects historical database summaries to forecasts and constrained budget/inventory scenarios. The workflow supports decisions only to the extent that the source records are accurate, sufficiently complete, and verifiably genuine.

## Limitations

- Existing row counts do not establish provenance; generated or otherwise unverified rows must not be presented as real data.
- Fewer observations and incomplete months reduce forecast reliability. R² describes fit to historical variation and does not guarantee future accuracy.
- The budget scenario assumes recent campaign ROI remains informative and does not model every channel interaction or external market change.
- Inventory estimates depend on recorded sales, costs, stock, purchase history, and lead times; missing supplier/product mappings can reduce reliability.
- Editable source notes are browser-local and are not a substitute for source documents or database-level audit trails.

## Reproducibility and print

Use the Data Overview and Case Study tabs to refresh record counts, date ranges, and source notes before presenting. The Case Study tab can be printed or saved as PDF from the browser. Do not copy the audited counts above as proof of authenticity; update this document when the verified dataset changes.
