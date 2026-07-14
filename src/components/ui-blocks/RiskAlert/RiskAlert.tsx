/**
 * RiskAlert UI Block
 * 显示学习风险提示和建议
 */

import React from 'react';
import type { RiskAlertProps } from '@/types/uiBlocks';
import './RiskAlert.css';

interface RiskAlertComponentProps extends RiskAlertProps {
  title?: string;
}

export const RiskAlert: React.FC<RiskAlertComponentProps> = ({
  title = '风险提示',
  risks
}) => {
  if (!risks || risks.length === 0) {
    return null;
  }

  // 获取严重程度样式
  const getSeverityClass = (severity: string): string => {
    const severityMap: Record<string, string> = {
      high: 'severity-high',
      medium: 'severity-medium',
      low: 'severity-low'
    };
    return severityMap[severity] || 'severity-medium';
  };

  // 获取严重程度图标
  const getSeverityIcon = (severity: string): string => {
    const iconMap: Record<string, string> = {
      high: '🚨',
      medium: '⚠️',
      low: 'ℹ️'
    };
    return iconMap[severity] || '⚠️';
  };

  // 获取风险类型标签
  const getTypeLabel = (type: string): string => {
    const labelMap: Record<string, string> = {
      behind_schedule: '进度落后',
      time_pressure: '时间压力',
      low_performance: '表现不佳',
      conflict: '冲突'
    };
    return labelMap[type] || type;
  };

  // 获取最高风险等级
  const getHighestRiskLevel = (): string => {
    if (risks.some(r => r.severity === 'high')) return 'high';
    if (risks.some(r => r.severity === 'medium')) return 'medium';
    return 'low';
  };

  const highestRisk = getHighestRiskLevel();

  return (
    <div className={`risk-alert risk-alert-${highestRisk}`}>
      <div className="risk-alert-header">
        <div className="risk-alert-title-section">
          <span className="risk-alert-icon">
            {highestRisk === 'high' ? '🚨' : highestRisk === 'medium' ? '⚠️' : 'ℹ️'}
          </span>
          <h3 className="risk-alert-title">{title}</h3>
        </div>
        <div className="risk-alert-count">{risks.length} 项风险</div>
      </div>

      <div className="risk-alert-content">
        {risks.map((risk, index) => (
          <div
            key={index}
            className={`risk-item ${getSeverityClass(risk.severity)}`}
          >
            <div className="risk-item-header">
              <span className="risk-item-icon">{getSeverityIcon(risk.severity)}</span>
              <span className="risk-item-type">{getTypeLabel(risk.type)}</span>
              <span className={`risk-item-severity ${getSeverityClass(risk.severity)}`}>
                {risk.severity === 'high' && '高'}
                {risk.severity === 'medium' && '中'}
                {risk.severity === 'low' && '低'}
              </span>
            </div>

            <div className="risk-item-message">{risk.message}</div>

            {risk.suggestion && (
              <div className="risk-item-suggestion">
                <span className="suggestion-icon">💡</span>
                <span className="suggestion-text">{risk.suggestion}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 建议操作区 */}
      {highestRisk !== 'low' && (
        <div className="risk-alert-actions">
          <div className="action-tip">
            提示：点击"调整计划"可以根据当前情况重新规划学习任务
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAlert;
