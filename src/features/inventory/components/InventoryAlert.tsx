;
import type { Product } from '../../../types/inventory';

interface InventoryAlertProps {
  products: Product[];
}

export const InventoryAlert: React.FC<InventoryAlertProps> = ({ products }) => {
  if (products.length === 0) {
    return null;
  }

  return (
    <div style={{ border: '1px solid red', padding: '10px', margin: '10px 0' }}>
      <h3>⚠️ Low Stock Alert</h3>
      <p>The following products are running low on stock:</p>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            {product.name} - {product.stockQuantity} {product.unit} remaining
            (Threshold: {product.lowStockThreshold})
          </li>
        ))}
      </ul>
    </div>
  );
};