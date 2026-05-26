/**
 * 创建学习空间分步向导
 * 将复杂的创建流程拆分为5个步骤
 */

import React, { useState } from 'react';
import { useSpaceStore } from '../../../store/spaceStore';
import type { StudyGoal, Subject, TimeSchedule } from '../../../types/space';
import './CreateSpaceWizard.css';

type WizardStep = 'basic' | 'goal' | 'subjects' | 'schedule' | 'review';

// 表单数据类型定义
interface SpaceFormData {
  // 基础信息
  name: string;
  description: string;
  color: string;

  // 学习目标
  primaryGoal: string;
  secondaryGoals: string[];
  examDate: string;
  targetScore: number;

  // 学科
  subjects: Subject[];

  // 时间安排
  availableHoursPerDay: number;
  availableDays: string[];
  preferredTimeSlots: string[];
  restDays: string[];
  startDate: string;
}

interface CreateSpaceWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

// 步骤定义
const STEPS = [
  { id: 'basic' as WizardStep, title: '基础信息', icon: '📝', description: '设置空间基本信息' },
  { id: 'goal' as WizardStep, title: '学习目标', icon: '🎯', description: '定义学习目标和考试' },
  { id: 'subjects' as WizardStep, title: '学科设置', icon: '📚', description: '添加学习学科' },
  { id: 'schedule' as WizardStep, title: '时间安排', icon: '⏰', description: '设置学习时间表' },
  { id: 'review' as WizardStep, title: '确认创建', icon: '✅', description: '检查并创建' }
];

export const CreateSpaceWizard: React.FC<CreateSpaceWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const createSpace = useSpaceStore((state) => state.createSpace);

  // 表单数据
  const [formData, setFormData] = useState<SpaceFormData>({
    // 基础信息
    name: '',
    description: '',
    color: '#3b82f6',

    // 学习目标
    primaryGoal: '',
    secondaryGoals: [],
    examDate: '',
    targetScore: 85,

    // 学科
    subjects: [],

    // 时间安排
    availableHoursPerDay: 4,
    availableDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    preferredTimeSlots: ['晚上'],
    restDays: [],
    startDate: new Date().toISOString().split('T')[0]
  });

  // 验证当前步骤
  const validateStep = (step: WizardStep): boolean => {
    switch (step) {
      case 'basic':
        return formData.name.trim().length > 0 && formData.description.trim().length > 0;
      case 'goal':
        return formData.primaryGoal.trim().length > 0 &&
               formData.examDate.length > 0 &&
               formData.targetScore > 0;
      case 'subjects':
        return formData.subjects.length > 0;
      case 'schedule':
        return formData.availableHoursPerDay > 0 && formData.availableDays.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  // 获取当前步骤索引
  const getCurrentStepIndex = () => STEPS.findIndex(step => step.id === currentStep);

  // 下一步
  const handleNext = () => {
    if (!validateStep(currentStep)) {
      alert('请填写所有必填项');
      return;
    }

    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  // 上一步
  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  // 提交创建
  const handleSubmit = () => {
    try {
      const goal: StudyGoal = {
        primaryGoal: formData.primaryGoal,
        secondaryGoals: formData.secondaryGoals,
        examDate: new Date(formData.examDate),
        targetScore: formData.targetScore
      };

      const schedule: TimeSchedule = {
        availableHoursPerDay: formData.availableHoursPerDay,
        availableDays: formData.availableDays,
        preferredTimeSlots: formData.preferredTimeSlots,
        restDays: formData.restDays,
        startDate: new Date(formData.startDate)
      };

      createSpace({
        name: formData.name,
        description: formData.description,
        color: formData.color,
        goal,
        subjects: formData.subjects,
        schedule
      });

      onComplete?.();
    } catch (error) {
      console.error('创建学习空间失败:', error);
      alert('创建失败，请检查输入信息');
    }
  };

  return (
    <div className="wizard-container">
      {/* 步骤指示器 */}
      <div className="wizard-steps">
        {STEPS.map((step, index) => {
          const currentIndex = getCurrentStepIndex();
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;

          return (
            <div
              key={step.id}
              className={`wizard-step ${isCurrent ? 'wizard-step-current' : ''} ${isCompleted ? 'wizard-step-completed' : ''}`}
              onClick={() => {
                // 只允许点击已完成的步骤
                if (isCompleted) {
                  setCurrentStep(step.id);
                }
              }}
            >
              <div className="wizard-step-icon">
                {isCompleted ? '✓' : step.icon}
              </div>
              <div className="wizard-step-info">
                <div className="wizard-step-title">{step.title}</div>
                <div className="wizard-step-description">{step.description}</div>
              </div>
              {index < STEPS.length - 1 && (
                <div className="wizard-step-connector" />
              )}
            </div>
          );
        })}
      </div>

      {/* 步骤内容区域 */}
      <div className="wizard-content">
        {currentStep === 'basic' && (
          <BasicInfoStep
            data={formData}
            onChange={(data) => setFormData({ ...formData, ...data })}
          />
        )}
        {currentStep === 'goal' && (
          <GoalStep
            data={formData}
            onChange={(data) => setFormData({ ...formData, ...data })}
          />
        )}
        {currentStep === 'subjects' && (
          <SubjectsStep
            data={formData}
            onChange={(data) => setFormData({ ...formData, ...data })}
          />
        )}
        {currentStep === 'schedule' && (
          <ScheduleStep
            data={formData}
            onChange={(data) => setFormData({ ...formData, ...data })}
          />
        )}
        {currentStep === 'review' && (
          <ReviewStep data={formData} />
        )}
      </div>

      {/* 导航按钮 */}
      <div className="wizard-actions">
        <button
          className="wizard-button wizard-button-secondary"
          onClick={onCancel}
        >
          取消
        </button>

        <div className="wizard-actions-right">
          {currentStep !== 'basic' && (
            <button
              className="wizard-button wizard-button-secondary"
              onClick={handlePrevious}
            >
              上一步
            </button>
          )}

          {currentStep === 'review' ? (
            <button
              className="wizard-button wizard-button-primary"
              onClick={handleSubmit}
            >
              创建学习空间
            </button>
          ) : (
            <button
              className="wizard-button wizard-button-primary"
              onClick={handleNext}
            >
              下一步
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============= 步骤1：基础信息 =============
interface BasicInfoStepProps {
  data: SpaceFormData;
  onChange: (data: Partial<SpaceFormData>) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, onChange }) => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  // Tab键快速补全默认值
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const defaults: Record<string, string> = {
        name: '高等数学期末冲刺',
        description: '为期末考试做好全面准备，重点复习微积分、线性代数和概率统计，目标分数85分以上。',
        primaryGoal: '期末考试获得85分以上',
        examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30天后
        subjectName: '高等数学'
      };

      if (defaults[field]) {
        onChange({ [field]: defaults[field] });
      }
    }
  };

  return (
    <div className="wizard-step-content">
      <h3>基础信息</h3>

      <div className="form-group">
        <label className="form-label">空间名称 * (按Tab键快速填充)</label>
        <input
          type="text"
          className="form-input"
          placeholder="例如：高等数学期末冲刺"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          onKeyDown={(e) => handleKeyDown(e, 'name')}
        />
      </div>

      <div className="form-group">
        <label className="form-label">描述 * (按Tab键快速填充)</label>
        <textarea
          className="form-textarea"
          placeholder="简要描述这个学习空间的目标和内容..."
          rows={4}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          onKeyDown={(e) => handleKeyDown(e, 'description')}
        />
      </div>

      <div className="form-group">
        <label className="form-label">主题颜色</label>
        <div className="color-picker">
          {colors.map(color => (
            <button
              key={color}
              className={`color-option ${data.color === color ? 'color-option-selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onChange({ color })}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============= 步骤2：学习目标 =============
const GoalStep: React.FC<BasicInfoStepProps> = ({ data, onChange }) => {
  const [tempGoal, setTempGoal] = useState('');

  // Tab键快速补全默认值
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: string) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const defaults: Record<string, string> = {
        primaryGoal: '期末考试获得85分以上，掌握核心概念和解题技巧',
        examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      if (defaults[field]) {
        onChange({ [field]: defaults[field] });
      }
    }
  };

  const addSecondaryGoal = () => {
    if (tempGoal.trim()) {
      onChange({
        secondaryGoals: [...data.secondaryGoals, tempGoal.trim()]
      });
      setTempGoal('');
    }
  };

  const removeSecondaryGoal = (index: number) => {
    onChange({
      secondaryGoals: data.secondaryGoals.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="wizard-step-content">
      <h3>学习目标</h3>

      <div className="form-group">
        <label className="form-label">主要目标 * (按Tab键快速填充)</label>
        <input
          type="text"
          className="form-input"
          placeholder="例如：期末考试获得85分以上"
          value={data.primaryGoal}
          onChange={(e) => onChange({ primaryGoal: e.target.value })}
          onKeyDown={(e) => handleKeyDown(e, 'primaryGoal')}
        />
      </div>

      <div className="form-group">
        <label className="form-label">考试日期 * (按Tab键快速填充)</label>
        <input
          type="date"
          className="form-input"
          value={data.examDate}
          onChange={(e) => onChange({ examDate: e.target.value })}
          onKeyDown={(e) => handleKeyDown(e, 'examDate')}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="form-group">
        <label className="form-label">目标分数 *</label>
        <input
          type="number"
          className="form-input"
          min="0"
          max="100"
          value={data.targetScore}
          onChange={(e) => onChange({ targetScore: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">次要目标</label>
        <div className="goals-list">
          {data.secondaryGoals.map((goal: string, index: number) => (
            <div key={index} className="goal-item">
              <span>{goal}</span>
              <button
                className="goal-remove"
                onClick={() => removeSecondaryGoal(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="goal-input">
          <input
            type="text"
            className="form-input"
            placeholder="添加次要目标..."
            value={tempGoal}
            onChange={(e) => setTempGoal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSecondaryGoal()}
          />
          <button
            className="goal-add"
            onClick={addSecondaryGoal}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
};

// ============= 步骤3：学科设置 =============
const SubjectsStep: React.FC<BasicInfoStepProps> = ({ data, onChange }) => {
  const [newSubject, setNewSubject] = useState({
    name: '',
    currentLevel: 60,
    targetLevel: 85,
    weight: 0.5,
    weakPoints: [] as string[],
    strongPoints: [] as string[]
  });
  // Tab键快速补全默认值
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: string) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const defaults: Record<string, string | number> = {
        name: '高等数学',
        currentLevel: 60,
        targetLevel: 85,
        weight: 0.8
      };

      if (defaults[field] !== undefined) {
        setNewSubject({
          ...newSubject,
          [field]: defaults[field]
        });
      }
    }
  };

  // 快速添加示例学科
  const quickAddSampleSubject = () => {
    const sampleSubject: Subject = {
      name: '高等数学',
      currentLevel: 60,
      targetLevel: 85,
      weight: 0.8,
      weakPoints: ['微分方程', '线性代数基础'],
      strongPoints: ['极限计算', '函数求导']
    };

    onChange({
      subjects: [...data.subjects, sampleSubject]
    });
  };

  const addSubject = () => {
    if (newSubject.name.trim()) {
      onChange({
        subjects: [...data.subjects, { ...newSubject }]
      });
      setNewSubject({
        name: '',
        currentLevel: 60,
        targetLevel: 85,
        weight: 0.5,
        weakPoints: [],
        strongPoints: []
      });
    }
  };

  const removeSubject = (index: number) => {
    onChange({
      subjects: data.subjects.filter((_, i) => i !== index)
    });
  };
  return (
    <div className="wizard-step-content">
      <h3>学科设置</h3>

      <div className="subjects-list">
        {data.subjects.map((subject: Subject, index: number) => (
          <div key={index} className="subject-card">
            <div className="subject-header">
              <h4>{subject.name}</h4>
              <button
                className="subject-remove"
                onClick={() => removeSubject(index)}
              >
                删除
              </button>
            </div>
            <div className="subject-stats">
              <div className="subject-stat">
                <span className="subject-stat-label">当前水平</span>
                <span className="subject-stat-value">{subject.currentLevel}%</span>
              </div>
              <div className="subject-stat">
                <span className="subject-stat-label">目标水平</span>
                <span className="subject-stat-value">{subject.targetLevel}%</span>
              </div>
              <div className="subject-stat">
                <span className="subject-stat-label">重要程度</span>
                <span className="subject-stat-value">{Math.round(subject.weight * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="subject-form">
        <h4>添加学科</h4>

        {/* 快速添加按钮 */}
        <button
          className="wizard-button wizard-button-secondary"
          onClick={quickAddSampleSubject}
          style={{ marginBottom: '1rem' }}
        >
          ⚡ 快速添加示例学科
        </button>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">学科名称 * (按Tab键快速填充)</label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：高等数学"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, 'name')}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">当前水平 (按Tab键快速填充)</label>
            <input
              type="number"
              className="form-input"
              min="0"
              max="100"
              value={newSubject.currentLevel}
              onChange={(e) => setNewSubject({ ...newSubject, currentLevel: parseInt(e.target.value) || 0 })}
              onKeyDown={(e) => handleKeyDown(e, 'currentLevel')}
            />
          </div>
          <div className="form-group">
            <label className="form-label">目标水平 (按Tab键快速填充)</label>
            <input
              type="number"
              className="form-input"
              min="0"
              max="100"
              value={newSubject.targetLevel}
              onChange={(e) => setNewSubject({ ...newSubject, targetLevel: parseInt(e.target.value) || 0 })}
              onKeyDown={(e) => handleKeyDown(e, 'targetLevel')}
            />
          </div>
          <div className="form-group">
            <label className="form-label">重要程度 (按Tab键快速填充)</label>
            <input
              type="number"
              className="form-input"
              min="0"
              max="1"
              step="0.1"
              value={newSubject.weight}
              onChange={(e) => setNewSubject({ ...newSubject, weight: parseFloat(e.target.value) || 0 })}
              onKeyDown={(e) => handleKeyDown(e, 'weight')}
            />
          </div>
        </div>

        <button className="wizard-button wizard-button-primary" onClick={addSubject}>
          添加学科
        </button>
      </div>
    </div>
  );
};

// ============= 步骤4：时间安排 =============
const ScheduleStep: React.FC<BasicInfoStepProps> = ({ data, onChange }) => {
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const timeSlots = ['上午', '下午', '晚上'];

  const toggleDay = (day: string) => {
    const newDays = data.availableDays.includes(day)
      ? data.availableDays.filter(d => d !== day)
      : [...data.availableDays, day];
    onChange({ availableDays: newDays });
  };

  const toggleTimeSlot = (slot: string) => {
    const newSlots = data.preferredTimeSlots.includes(slot)
      ? data.preferredTimeSlots.filter(s => s !== slot)
      : [...data.preferredTimeSlots, slot];
    onChange({ preferredTimeSlots: newSlots });
  };

  const toggleRestDay = (day: string) => {
    const newRestDays = data.restDays.includes(day)
      ? data.restDays.filter(d => d !== day)
      : [...data.restDays, day];
    onChange({ restDays: newRestDays });
  };

  return (
    <div className="wizard-step-content">
      <h3>时间安排</h3>

      <div className="form-group">
        <label className="form-label">每日学习小时数 *</label>
        <input
          type="number"
          className="form-input"
          min="1"
          max="16"
          value={data.availableHoursPerDay}
          onChange={(e) => onChange({ availableHoursPerDay: parseInt(e.target.value) || 1 })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">可学习日期 *</label>
        <div className="day-selector">
          {weekDays.map(day => (
            <button
              key={day}
              className={`day-button ${data.availableDays.includes(day) ? 'day-button-selected' : ''} ${data.restDays.includes(day) ? 'day-button-rest' : ''}`}
              onClick={() => toggleDay(day)}
              disabled={data.restDays.includes(day)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">偏好时间段</label>
        <div className="time-slots">
          {timeSlots.map(slot => (
            <button
              key={slot}
              className={`time-slot-button ${data.preferredTimeSlots.includes(slot) ? 'time-slot-selected' : ''}`}
              onClick={() => toggleTimeSlot(slot)}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">休息日</label>
        <div className="day-selector">
          {weekDays.map(day => (
            <button
              key={day}
              className={`day-button ${data.restDays.includes(day) ? 'day-button-rest-selected' : ''}`}
              onClick={() => toggleRestDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">开始日期 *</label>
        <input
          type="date"
          className="form-input"
          value={data.startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>
  );
};

// ============= 步骤5：确认创建 =============
const ReviewStep: React.FC<{ data: SpaceFormData }> = ({ data }) => {
  return (
    <div className="wizard-step-content">
      <h3>确认创建</h3>

      <div className="review-section">
        <h4>📝 基础信息</h4>
        <div className="review-info">
          <div className="review-item">
            <span className="review-label">名称：</span>
            <span className="review-value">{data.name}</span>
          </div>
          <div className="review-item">
            <span className="review-label">描述：</span>
            <span className="review-value">{data.description}</span>
          </div>
        </div>
      </div>

      <div className="review-section">
        <h4>🎯 学习目标</h4>
        <div className="review-info">
          <div className="review-item">
            <span className="review-label">主要目标：</span>
            <span className="review-value">{data.primaryGoal}</span>
          </div>
          <div className="review-item">
            <span className="review-label">考试日期：</span>
            <span className="review-value">{data.examDate}</span>
          </div>
          <div className="review-item">
            <span className="review-label">目标分数：</span>
            <span className="review-value">{data.targetScore}分</span>
          </div>
        </div>
      </div>

      <div className="review-section">
        <h4>📚 学科设置</h4>
        <div className="review-subjects">
          {data.subjects.map((subject: Subject, index: number) => (
            <div key={index} className="review-subject">
              <strong>{subject.name}</strong>
              <span>当前：{subject.currentLevel}% → 目标：{subject.targetLevel}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="review-section">
        <h4>⏰ 时间安排</h4>
        <div className="review-info">
          <div className="review-item">
            <span className="review-label">每日学习：</span>
            <span className="review-value">{data.availableHoursPerDay}小时</span>
          </div>
          <div className="review-item">
            <span className="review-label">学习日期：</span>
            <span className="review-value">{data.availableDays.join(', ')}</span>
          </div>
          <div className="review-item">
            <span className="review-label">偏好时间：</span>
            <span className="review-value">{data.preferredTimeSlots.join(', ')}</span>
          </div>
          <div className="review-item">
            <span className="review-label">开始日期：</span>
            <span className="review-value">{data.startDate}</span>
          </div>
        </div>
      </div>

      <div className="review-confirm">
        <p>确认创建这个学习空间吗？创建后您可以随时编辑这些信息。</p>
      </div>
    </div>
  );
};
