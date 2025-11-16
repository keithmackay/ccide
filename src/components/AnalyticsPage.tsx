/**
 * Analytics Page Component for CCIDE
 * Displays message statistics, project-based filtering, and token usage
 */

import React, { useState, useEffect } from 'react';
import { getAnalyticsService } from '../services/AnalyticsService';
import { getProjectService } from '../services/ProjectService';
import { AnalyticsSummary, Project, Message } from '../types/models';

interface AnalyticsPageProps {
  onClose?: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onClose }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const analyticsService = getAnalyticsService();
  const projectService = getProjectService();

  useEffect(() => {
    loadData();
  }, [selectedProjectId, dateRange, customStartDate, customEndDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load projects
      const allProjects = await projectService.getAllProjects();
      setProjects(allProjects);

      // Calculate date range
      let startDate: number | undefined;
      let endDate: number | undefined;

      if (dateRange === '7d') {
        startDate = Date.now() - 7 * 24 * 60 * 60 * 1000;
      } else if (dateRange === '30d') {
        startDate = Date.now() - 30 * 24 * 60 * 60 * 1000;
      } else if (dateRange === 'custom') {
        if (customStartDate) {
          startDate = new Date(customStartDate).getTime();
        }
        if (customEndDate) {
          endDate = new Date(customEndDate).getTime();
        }
      }

      // Load analytics summary
      const projectId = selectedProjectId === 'all' ? undefined : selectedProjectId;
      const summaryData = await analyticsService.getAnalyticsSummary(
        projectId,
        startDate,
        endDate
      );

      // Enrich project names in summary
      summaryData.projectBreakdown = summaryData.projectBreakdown.map((item) => {
        const project = allProjects.find((p) => p.id === item.projectId);
        return {
          ...item,
          projectName: project?.name || item.projectId,
        };
      });

      setSummary(summaryData);

      // Load recent messages
      const recent = await analyticsService.getRecentMessages(10);
      setRecentMessages(recent);

      setLoading(false);
    } catch (err) {
      setError('Failed to load analytics data');
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await analyticsService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ccide-analytics-${Date.now()}.json`;
      a.click();
    } catch (err) {
      setError('Failed to export analytics data');
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(2)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(2)}K`;
    }
    return tokens.toString();
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>Analytics</h1>
        {onClose && (
          <button onClick={onClose} className="btn-close">
            ×
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <div className="filter-group">
          <label>Project:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Date Range:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <>
            <div className="filter-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label>End Date:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="filter-input"
              />
            </div>
          </>
        )}

        <button onClick={handleExport} className="btn btn-primary">
          Export Data
        </button>
      </div>

      {summary && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{formatNumber(summary.totalMessages)}</div>
              <div className="stat-label">Total Messages</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{formatTokens(summary.totalTokens)}</div>
              <div className="stat-label">Total Tokens</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{summary.projectBreakdown.length}</div>
              <div className="stat-label">Active Projects</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{summary.modelUsage.length}</div>
              <div className="stat-label">Models Used</div>
            </div>
          </div>

          <div className="analytics-sections">
            <div className="section">
              <h2>Project Breakdown</h2>
              {summary.projectBreakdown.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Messages</th>
                      <th>Tokens</th>
                      <th>Avg Tokens/Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.projectBreakdown
                      .sort((a, b) => b.tokenCount - a.tokenCount)
                      .map((item) => (
                        <tr key={item.projectId}>
                          <td>{item.projectName}</td>
                          <td>{formatNumber(item.messageCount)}</td>
                          <td>{formatTokens(item.tokenCount)}</td>
                          <td>
                            {formatNumber(
                              Math.round(item.tokenCount / item.messageCount)
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No project data available</p>
              )}
            </div>

            <div className="section">
              <h2>Model Usage</h2>
              {summary.modelUsage.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Messages</th>
                      <th>Tokens</th>
                      <th>Avg Tokens/Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.modelUsage
                      .sort((a, b) => b.tokens - a.tokens)
                      .map((item) => (
                        <tr key={item.model}>
                          <td>{item.model}</td>
                          <td>{formatNumber(item.count)}</td>
                          <td>{formatTokens(item.tokens)}</td>
                          <td>
                            {formatNumber(Math.round(item.tokens / item.count))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No model usage data available</p>
              )}
            </div>

            <div className="section">
              <h2>Recent Messages</h2>
              {recentMessages.length > 0 ? (
                <div className="messages-list">
                  {recentMessages.map((message) => {
                    const project = projects.find((p) => p.id === message.projectId);
                    return (
                      <div key={message.id} className="message-item">
                        <div className="message-header">
                          <span className="message-project">
                            {project?.name || message.projectId}
                          </span>
                          <span className="message-date">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                        <div className="message-content">
                          <div className="message-user">
                            <strong>User:</strong> {message.userMessage.substring(0, 100)}
                            {message.userMessage.length > 100 && '...'}
                          </div>
                          <div className="message-stats">
                            <span>{message.model}</span>
                            <span>{formatTokens(message.tokens)} tokens</span>
                            <span className={`status status-${message.status}`}>
                              {message.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-data">No messages recorded yet</p>
              )}
            </div>
          </div>

          {summary.dateRange && (
            <div className="date-info">
              Data from {formatDate(summary.dateRange.start)} to{' '}
              {formatDate(summary.dateRange.end)}
            </div>
          )}
        </>
      )}

      <style>{`
        .analytics-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .btn-close {
          font-size: 2rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          width: 2rem;
          height: 2rem;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          font-size: 1.2rem;
          color: #666;
        }

        .filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-group label {
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
          font-weight: bold;
        }

        .filter-select,
        .filter-input {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #007bff;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #666;
          margin-top: 0.5rem;
        }

        .analytics-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .section {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .section h2 {
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .data-table th {
          background: #f8f9fa;
          font-weight: bold;
        }

        .data-table tr:hover {
          background: #f8f9fa;
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message-item {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 1rem;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .message-project {
          font-weight: bold;
          color: #007bff;
        }

        .message-date {
          font-size: 0.875rem;
          color: #666;
        }

        .message-content {
          font-size: 0.875rem;
        }

        .message-user {
          margin-bottom: 0.5rem;
          color: #333;
        }

        .message-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #666;
        }

        .status {
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
        }

        .status-success {
          background: #d4edda;
          color: #155724;
        }

        .status-error {
          background: #f8d7da;
          color: #721c24;
        }

        .no-data {
          color: #666;
          text-align: center;
          padding: 2rem;
        }

        .date-info {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.875rem;
          color: #666;
        }

        .alert {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
        }
      `}</style>
    </div>
  );
};
