;
import type { StockMovement } from '../../../types/inventory';
import { useAppSelector } from '../../../app/hooks';

interface StockMovementTableProps {
  movements: StockMovement[];
}

export const StockMovementTable: React.FC<StockMovementTableProps> = ({ movements }) => {
  const { products } = useAppSelector((state) => state.inventory);

  const getProductName = (id: string) => {
    return products.find(p => p.id === id)?.name || 'Unknown Product';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IN': return 'green';
      case 'OUT': return 'red';
      case 'ADJUSTMENT': return 'orange';
      default: return 'black';
    }
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Product</th>
          <th>Type</th>
          <th>Quantity</th>
          <th>Reason</th>
          <th>Reference</th>
          <th>Performed By</th>
        </tr>
      </thead>
      <tbody>
        {movements.map(movement => (
          <tr key={movement.id}>
            <td>{new Date(movement.createdAt).toLocaleDateString()}</td>
            <td>{getProductName(movement.productId)}</td>
            <td style={{ color: getTypeColor(movement.type) }}>
              {movement.type}
            </td>
            <td>{movement.quantity}</td>
            <td>{movement.reason}</td>
            <td>{movement.reference || '-'}</td>
            <td>{movement.performedBy}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};