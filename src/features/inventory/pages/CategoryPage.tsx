import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import type { Category } from '../../../types/inventory';

export const CategoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.inventory);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      // Dispatch add action here
      setNewCategory({ name: '', description: '' });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingId(category.id);
  };

  const handleSaveEdit = (id: string) => {
    // Dispatch update action here
    setEditingId(null);
  };

  return (
    <div>
      <h1>Categories</h1>
      
      <div>
        <h2>Add New Category</h2>
        <input 
          type="text" 
          placeholder="Category Name" 
          value={newCategory.name}
          onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
        />
        <input 
          type="text" 
          placeholder="Description" 
          value={newCategory.description}
          onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
        />
        <button onClick={handleAddCategory}>Add Category</button>
      </div>

      <div>
        <h2>Category List</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Product Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id}>
                <td>
                  {editingId === category.id ? (
                    <input type="text" defaultValue={category.name} />
                  ) : (
                    category.name
                  )}
                </td>
                <td>
                  {editingId === category.id ? (
                    <input type="text" defaultValue={category.description} />
                  ) : (
                    category.description
                  )}
                </td>
                <td>{category.productCount}</td>
                <td>
                  {editingId === category.id ? (
                    <button onClick={() => handleSaveEdit(category.id)}>Save</button>
                  ) : (
                    <button onClick={() => handleEditCategory(category)}>Edit</button>
                  )}
                  <button>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryPage;