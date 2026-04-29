import React, { useState, useEffect } from 'react';
import { Select } from './select';
import { DatePicker } from './date-picker';
import { Input,Textarea } from '@/components/ui'
import './CollectionForm.css';

// 表单字段定义
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  value?: any;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  validation?: (value: any) => boolean | string;
}

// CollectionForm组件属性
interface CollectionFormProps {
  stage?: 'initial' | 'details' | 'confirmation';
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export const CollectionForm: React.FC<CollectionFormProps> = ({
  stage = 'initial',
  fields,
  onSubmit,
  onCancel,
  title = '补充信息',
  description = '请完善以下信息以继续'
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      if (field.value !== undefined) {
        initialData[field.name] = field.value;
      }
    });
    setFormData(initialData);
  }, [fields]);

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateField = (field: FormField, value: any): string | null => {
    // 必填验证
    if (field.required && (!value || value === '')) {
      return `${field.label}是必填项`;
    }

    // 自定义验证
    if (field.validation) {
      const validationResult = field.validation(value);
      if (validationResult !== true) {
        return typeof validationResult === 'string' ? validationResult : `${field.label}格式不正确`;
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('表单提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="collection-form-field">
            <label className="collection-form-label">
              {field.label}
              {field.required && <span className="collection-form-required">*</span>}
            </label>
            <Select
              value={value}
              onChange={(val: string) => handleFieldChange(field.name, val)}
              options={field.options || []}
              placeholder={field.placeholder}
              error={error}
            />
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="collection-form-field">
            <label className="collection-form-label">
              {field.label}
              {field.required && <span className="collection-form-required">*</span>}
            </label>
            <DatePicker
              value={value}
              onChange={(val: string) => handleFieldChange(field.name, val)}
              placeholder={field.placeholder}
              error={error}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="collection-form-field">
            <label className="collection-form-label">
              {field.label}
              {field.required && <span className="collection-form-required">*</span>}
            </label>
            <Textarea
              className="form-textarea"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              aria-invalid={!!error}
            />
            {error && <div className="collection-form-error">{error}</div>}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="collection-form-field">
            <label className="collection-form-label">
              {field.label}
              {field.required && <span className="collection-form-required">*</span>}
            </label>
            <Input
              className="form-input"
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              aria-invalid={!!error}
            />
            {error && <div className="collection-form-error">{error}</div>}
          </div>
        );

      case 'text':
      default:
        return (
          <div key={field.name} className="collection-form-field">
            <label className="collection-form-label">
              {field.label}
              {field.required && <span className="collection-form-required">*</span>}
            </label>
            <Input
              className="form-input"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              aria-invalid={!!error}
            />
            {error && <div className="collection-form-error">{error}</div>}
          </div>
        );
    }
  };

  return (
    <div className="collection-form-container">
      <div className="collection-form-header">
        <h3 className="collection-form-title">{title}</h3>
        {description && <p className="collection-form-description">{description}</p>}
      </div>

      <form onSubmit={handleSubmit} className="collection-form">
        <div className="collection-form-fields">
          {fields.map(renderField)}
        </div>

        <div className="collection-form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="collection-form-button collection-form-button-secondary"
              disabled={isSubmitting}
            >
              取消
            </button>
          )}
          <button
            type="submit"
            className="collection-form-button collection-form-button-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        </div>
      </form>
    </div>
  );
};
