// src/features/help/components/HelpForm.tsx
import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface Field {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'rich-text' | 'number' | 'checkbox' | 'file' | 'tags';
  required?: boolean;
  options?: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  defaultValue?: any;
  validation?: (value: any) => string | undefined;
  colSpan?: 'full' | 'half';
}

interface HelpFormProps {
  fields: Field[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

export default function HelpForm({
  fields,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  title
}: HelpFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const defaults: Record<string, any> = {};
      fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        } else if (field.type === 'checkbox') {
          defaults[field.name] = false;
        } else if (field.type === 'tags') {
          defaults[field.name] = [];
        }
      });
      setFormData(defaults);
    }
  }, [initialData, fields]);

  const validateField = (name: string, value: any): string | undefined => {
    const field = fields.find(f => f.name === name);

    if (field?.required && (value === undefined || value === '' || value === null)) {
      return `${field.label} is required`;
    }

    if (field?.validation) {
      return field.validation(value);
    }

    return undefined;
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error || ''
      }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field.name, formData[field.name]);
      if (error) newErrors[field.name] = error;
    });

    setErrors(newErrors);
    setTouched(fields.reduce((acc, field) => ({ ...acc, [field.name]: true }), {}));

    if (Object.keys(newErrors).length === 0) {
      await onSubmit(formData);
    }
  };

  const renderField = (field: Field) => {
    const value = formData[field.name] ?? '';
    const error = errors[field.name];
    const isTouched = touched[field.name];

    const baseInputClass = `w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isTouched && error ? 'border-red-500' : 'border-gray-300'
      }`;

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            className={baseInputClass}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            placeholder={field.placeholder}
            rows={4}
            className={baseInputClass}
          />
        );

      case 'rich-text':
        return (
          <div className={isTouched && error ? 'border border-red-500 rounded-lg' : ''}>
            <ReactQuill
              value={value}
              onChange={(content: any) => handleChange(field.name, content)}
              onBlur={() => handleBlur(field.name)}
              className="bg-white"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link', 'image'],
                  ['clean']
                ]
              }}
            />
          </div>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            onBlur={() => handleBlur(field.name)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        );

      case 'file':
        return (
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleChange(field.name, file);
            }}
            onBlur={() => handleBlur(field.name)}
            className="w-full text-xs sm:text-sm text-gray-500 file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        );

      case 'tags':
        const [inputValue, setInputValue] = useState('');
        return (
          <div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    e.preventDefault();
                    const newTags = [...(value || []), inputValue.trim()];
                    handleChange(field.name, newTags);
                    setInputValue('');
                  }
                }}
                placeholder="Type and press Enter to add"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {(value || []).map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const newTags = (value || []).filter((_: string, i: number) => i !== index);
                      handleChange(field.name, newTags);
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <input
            type={field.type || 'text'}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {title && (
        <div className="border-b border-gray-200 pb-3 sm:pb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {fields.map(field => (
          <div
            key={field.name}
            className={field.colSpan === 'full' ? 'md:col-span-2' : 'col-span-1'}
          >
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {renderField(field)}

            {touched[field.name] && errors[field.name] && (
              <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3 pt-3 sm:pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}