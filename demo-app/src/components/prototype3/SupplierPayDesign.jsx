import ArchitectureDiagram from '../shared/ArchitectureDiagram';
import CodeBlock from '../shared/CodeBlock';
import DataTable from '../shared/DataTable';

export default function SupplierPayDesign() {
  const archNodes = [
    { label: 'Clover POS', description: 'Sales data ingestion', type: 'external' },
    { label: 'AI Procurement Agent', description: 'BOM + ML predictions', type: 'primary' },
    { label: 'Supplier Catalog', description: 'Products, pricing, terms', type: 'default' },
    { label: 'CommerceHub B2B', description: 'PO management', type: 'primary' },
    { label: 'Finxact', description: 'FIUSD ledger', type: 'primary' },
    { label: 'INDX', description: 'USD settlement', type: 'external' },
  ];

  const dataModelColumns = [
    { key: 'entity', label: 'Entity' },
    { key: 'fields', label: 'Key Fields' },
    { key: 'description', label: 'Description' },
  ];

  const dataModelRows = [
    { entity: 'MenuItem', fields: 'sku, name, category, avgDailySales', description: 'Clover POS menu items tracked for BOM mapping' },
    { entity: 'Ingredient', fields: 'name, unit, currentStock, reorderPoint, costPerUnit', description: 'Raw ingredients with inventory levels and reorder thresholds' },
    { entity: 'BOM', fields: 'menuItemId, ingredientId, quantity, unit', description: 'Bill of Materials linking menu items to ingredient consumption' },
    { entity: 'Supplier', fields: 'name, catalog, paymentTerms, currency, accountId', description: 'Supplier profiles with pricing and Finxact account links' },
    { entity: 'PurchaseOrder', fields: 'supplierId, items[], totalCost, discount, netAmount, status', description: 'Generated POs with line items and payment status' },
    { entity: 'Payment', fields: 'poId, fromAccount, toAccount, amount, currency, settlementTime', description: 'FIUSD payment records with settlement timestamps' },
  ];

  const supplierColumns = [
    { key: 'name', label: 'Supplier' },
    { key: 'category', label: 'Category' },
    { key: 'terms', label: 'Payment Terms' },
    { key: 'discount', label: 'Early-Pay Discount' },
    { key: 'moq', label: 'Min Order' },
  ];

  const supplierRows = [
    { name: 'Fresh Foods Inc.', category: 'Proteins & Dairy', terms: 'Net 30', discount: '2% net-24h', moq: '$100' },
    { name: 'Metro Dry Goods', category: 'Flour, Oil, Dry Goods', terms: 'Net 15', discount: '1.5% net-24h', moq: '$50' },
    { name: 'Valley Produce Co.', category: 'Fresh Vegetables', terms: 'Net 7', discount: '1% same-day', moq: '$75' },
  ];

  return (
    <div className="design-content">
      <section className="docs-section">
        <h2>System Architecture</h2>
        <ArchitectureDiagram
          title="Supplier Pay - End-to-End Flow"
          nodes={archNodes}
        />
        <p className="mt-md">
          Sales data flows from Clover POS into the AI Procurement Agent, which uses the BOM
          and ML models to predict ingredient needs. Purchase orders are routed through the
          CommerceHub B2B module, payments are executed via Finxact FIUSD ledger, and suppliers
          receive USD settlement through INDX in seconds.
        </p>
      </section>

      <section className="docs-section">
        <h2>Data Model</h2>
        <DataTable columns={dataModelColumns} data={dataModelRows} />
      </section>

      <section className="docs-section">
        <h2>ML Model: Ingredient Depletion Prediction</h2>
        <p>
          The depletion prediction model uses gradient boosting (XGBoost) trained on 30 days of
          sales history. Features include day-of-week patterns, rolling averages, and seasonal
          trends to predict when each ingredient will hit its reorder point.
        </p>
        <CodeBlock
          title="Model Features"
          language="json"
          code={`{
  "model": "GradientBoostingRegressor",
  "features": [
    "day_of_week",
    "is_weekend",
    "rolling_avg_7d",
    "rolling_avg_14d",
    "daily_consumption_rate",
    "current_stock_level",
    "days_since_last_order"
  ],
  "target": "days_until_depletion",
  "accuracy": "92.3% within 0.5 day margin",
  "update_frequency": "Every 6 hours with new sales data"
}`}
        />
      </section>

      <section className="docs-section">
        <h2>Supplier Integration</h2>
        <DataTable columns={supplierColumns} data={supplierRows} />
        <p className="mt-md">
          Each supplier has a mock API endpoint that accepts purchase orders in JSON format.
          The supplier API validates MOQs, confirms pricing, and returns an acceptance with
          estimated delivery time. Payment is then executed immediately via Finxact.
        </p>
        <CodeBlock
          title="Supplier PO Acceptance"
          language="json"
          code={`{
  "poId": "PO-001",
  "supplier": "Fresh Foods Inc.",
  "status": "ACCEPTED",
  "estimatedDelivery": "2025-05-15T08:00:00Z",
  "totalCost": 337.50,
  "earlyPayDiscount": {
    "percentage": 2.0,
    "deadline": "24 hours",
    "discountAmount": 6.75,
    "netAmount": 330.75
  },
  "paymentInstructions": {
    "accountId": "SUP_001",
    "currency": "FIUSD",
    "network": "Finxact"
  }
}`}
        />
      </section>
    </div>
  );
}
