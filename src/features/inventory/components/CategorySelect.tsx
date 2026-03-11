;
// import { Category } from '../../../types/inventory';
import { useAppSelector } from '../../../app/hooks';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  includeAll?: boolean;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({ 
  value, 
  onChange, 
  required = false,
  includeAll = false 
}) => {
  const { categories } = useAppSelector((state) => state.inventory);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    >
      {includeAll && <option value="">All Categories</option>}
      {!includeAll && <option value="">Select Category</option>}
      {categories.map(category => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
};