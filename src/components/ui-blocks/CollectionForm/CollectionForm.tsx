import React, { useState, useEffect } from 'react';
import { Select } from './select';
import { DatePicker } from './date-picker';
import { Input,Textarea } from '@/components/ui'
import './CollectionForm.css';

// 表单字段定义
export interface FormField {
  name: string;
  originalPath?: string;
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
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
  externalError?: string | null;
  stepIndex?: number;
  totalSteps?: number;
  showProgress?: boolean;
}

export const CollectionForm: React.FC<CollectionFormProps> = ({
  stage,
  fields,
  onSubmit,
  onCancel,
  title = '补充信息',
  description = '请完善以下信息以继续',
  isLoading = false,
  externalError = null,
  stepIndex = 0,
  totalSteps = 1,
  showProgress = false
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // 🆕 提交状态

  // 检查是否处于加载状态（内部或外部）
  const isFormDisabled = isSubmitting || isLoading;

  // 初始化表单数据
  useEffect(() => {
    const initialData: Record<string, any> = {};
    
    // ✅ 先检查是否需要初始化（避免无限循环）
    let needsInit = false;
    fields.forEach(field => {
      // 只在字段不存在时才初始化
      if (field.value !== undefined && formData[field.name] === undefined) {
        initialData[field.name] = field.value;
        needsInit = true;
      }
    });
    
    // ✅ 只有在真正需要初始化时才更新状态
    if (needsInit) {
      setFormData(initialData);
    }
  }, [fields]); // ✅ fields 变化时重新计算

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
      const submitData = fields.reduce<Record<string, any>>((acc, field) => {
        acc[field.originalPath || field.name] = formData[field.name];
        return acc;
      }, {});

      await onSubmit(submitData);
      setIsSubmitted(true); // 🆕 标记为已提交
    } catch (error) {
      console.error('表单提交失败:', error);
      setIsSubmitting(false); // 失败时不隐藏表单
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

  // 🆕 如果已提交，不显示表单（表单会自动消失）
  if (isSubmitted) {
    return null;
  }

  // 🆕 步骤进度显示
  const showStepProgress = showProgress && totalSteps > 1 && stage !== 'initial';

  return (
    <div className="collection-form-container">
      <div className="collection-form-header">
        <div className="collection-form-header-title">
          <h3 className="collection-form-title">{title}</h3>
          {showStepProgress && (
            <div className="collection-form-progress">
              <span className="collection-form-progress-current">{stepIndex + 1}</span>
              <span className="collection-form-progress-divider">/</span>
              <span className="collection-form-progress-total">{totalSteps}</span>
            </div>
          )}
        </div>
        {description && <p className="collection-form-description">{description}</p>}
      </div>

      {/* 外部错误显示 */}
      {externalError && (
        <div className="collection-form-external-error">
          ⚠️ {externalError}
        </div>
      )}

      {/* 🆕 步骤进度条 */}
      {showStepProgress && (
        <div className="collection-form-progress-bar-container">
          <div className="collection-form-progress-bar">
            <div
              className="collection-form-progress-bar-fill"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`collection-form ${isFormDisabled ? 'form-disabled' : ''}`}
      >
        <div className="collection-form-fields">
          {fields.map(renderField)}
        </div>

        <div className="collection-form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="collection-form-button collection-form-button-secondary"
              disabled={isFormDisabled}
            >
              取消
            </button>
          )}
          <button
            type="submit"
            className="collection-form-button collection-form-button-primary"
            disabled={isFormDisabled}
          >
            {isFormDisabled ? '提交中...' : '提交'}
          </button>
        </div>
      </form>
    </div>
  );
};
