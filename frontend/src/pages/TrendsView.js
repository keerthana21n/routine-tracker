import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../services/api';
import './TrendsView.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function TrendsView() {
  const [categories, setCategories] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedField) {
      // Set default date range based on frequency when field changes
      if (dateRange === null) {
        setDateRange(getDefaultDateRange(selectedField.frequency));
      }
      loadTrendData();
    }
  }, [selectedField, dateRange]);

  // Get default date range based on frequency
  const getDefaultDateRange = (frequency) => {
    switch (frequency) {
      case 'daily':
        return '14'; // 2 weeks for daily
      case 'weekly':
        return '56'; // 8 weeks for weekly
      case 'bi-weekly':
        return '84'; // 12 weeks for bi-weekly
      case 'every 2 days':
        return '30'; // 30 days for every 2 days
      default:
        return '14';
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);

      // Find first available field from categories or subcategories
      if (data.length > 0) {
        for (const cat of data) {
          // Check direct fields first
          if (cat.fields && cat.fields.length > 0) {
            setSelectedField(cat.fields[0]);
            return;
          }
                // Check subcategory fields
          if (cat.subcategories && cat.subcategories.length > 0) {
            for (const subcat of cat.subcategories) {
              if (subcat.fields && subcat.fields.length > 0) {
                setSelectedField(subcat.fields[0]);
                return;
                }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTrendData = async () => {
    try {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd');

      const data = await api.getEntriesByRange(startDate, endDate);

      // Filter data for selected field
      const fieldData = data.filter(entry => entry.field_id === selectedField.id);

      // Prepare chart data
      const dates = [];
      const values = [];
      for (let i = parseInt(dateRange); i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dates.push(format(subDays(new Date(), i), 'MMM dd'));

        const entry = fieldData.find(e => e.date === date);
        if (selectedField.type === 'checkbox') {
          values.push(entry && (entry.value === 'true' || entry.value === true) ? 1 : 0);
        } else {
          values.push(entry ? parseFloat(entry.value) : 0);
        }
      }

      setChartData({
        labels: dates,
        datasets: [
          {
            label: selectedField.name,
            data: values,
            borderColor: 'rgb(102, 126, 234)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      });

      // Calculate statistics
      const total = values.reduce((sum, val) => sum + val, 0);
      const completed = values.filter(v => v > 0).length;

      // Calculate expected occurrences based on frequency
      const expectedOccurrences = calculateExpectedOccurrences(values.length, selectedField.frequency);
      const percentage = ((completed / expectedOccurrences) * 100).toFixed(1);
      const average = selectedField.type === 'number' ? (total / values.length).toFixed(1) : null;

      setStats({
        total,
        completed,
        expected: expectedOccurrences,
        percentage,
        average,
        streak: calculateStreakByFrequency(values, selectedField.frequency)
      });

    } catch (error) {
      console.error('Error loading trend data:', error);
    }
  };

  // Calculate expected occurrences based on frequency
  const calculateExpectedOccurrences = (totalDays, frequency) => {
    switch (frequency) {
      case 'daily':
        return totalDays;
      case 'weekly':
        return Math.floor(totalDays / 7);
      case 'bi-weekly':
        return Math.floor(totalDays / 14);
      case 'every 2 days':
        return Math.floor(totalDays / 2);
      default:
        return totalDays;
    }
  };

  // Calculate streak based on frequency
  const calculateStreakByFrequency = (values, frequency) => {
    if (!values || values.length === 0) return 0;

    switch (frequency) {
      case 'daily':
        return calculateDailyStreak(values);
      case 'weekly':
        return calculateWeeklyStreak(values);
      case 'bi-weekly':
        return calculateBiWeeklyStreak(values);
      case 'every 2 days':
        return calculateEvery2DaysStreak(values);
      default:
        return calculateDailyStreak(values);
    }
  };

  // Daily streak: consecutive days from most recent
  const calculateDailyStreak = (values) => {
    let streak = 0;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Weekly streak: consecutive weeks with at least one completion
  const calculateWeeklyStreak = (values) => {
    let streak = 0;
    for (let i = values.length - 1; i >= 0; i -= 7) {
      // Check if there's at least one completion in this week
      let weekHasCompletion = false;
      for (let j = i; j > i - 7 && j >= 0; j--) {
        if (values[j] > 0) {
          weekHasCompletion = true;
          break;
        }
      }
      if (weekHasCompletion) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Bi-weekly streak: consecutive bi-weekly periods with at least one completion
  const calculateBiWeeklyStreak = (values) => {
    let streak = 0;
    for (let i = values.length - 1; i >= 0; i -= 14) {
      // Check if there's at least one completion in this bi-weekly period
      let periodHasCompletion = false;
      for (let j = i; j > i - 14 && j >= 0; j--) {
        if (values[j] > 0) {
          periodHasCompletion = true;
          break;
        }
      }
      if (periodHasCompletion) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Every 2 days streak: consecutive 2-day periods with at least one completion
  const calculateEvery2DaysStreak = (values) => {
    let streak = 0;
    for (let i = values.length - 1; i >= 0; i -= 2) {
      // Check if there's at least one completion in this 2-day period
      let periodHasCompletion = false;
      for (let j = i; j > i - 2 && j >= 0; j--) {
        if (values[j] > 0) {
          periodHasCompletion = true;
          break;
        }
      }
      if (periodHasCompletion) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getStreakLabel = (frequency) => {
    switch (frequency) {
      case 'daily':
        return 'Day Streak';
      case 'weekly':
        return 'Week Streak';
      case 'bi-weekly':
        return 'Bi-Weekly Streak';
      case 'every 2 days':
        return '2-Day Period Streak';
      default:
        return 'Streak';
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="trends-view">
      <h2>📈 Trends & Analytics</h2>

      <div className="controls">
        <div className="control-group">
          <label>Select Routine:</label>
          <select
            value={selectedField?.id || ''}
            onChange={(e) => {
              const fieldId = parseInt(e.target.value);
              categories.forEach(cat => {
                // Check direct fields
                const field = cat.fields && cat.fields.find(f => f.id === fieldId);
                if (field) {
                  setSelectedField(field);
                  setDateRange(getDefaultDateRange(field.frequency));
                  return;
                }
                // Check subcategory fields
                if (cat.subcategories) {
                  cat.subcategories.forEach(subcat => {
                    const subcatField = subcat.fields && subcat.fields.find(f => f.id === fieldId);
                    if (subcatField) {
                      setSelectedField(subcatField);
                      setDateRange(getDefaultDateRange(subcatField.frequency));
                    }
                  });
                }
              });
            }}
            disabled={categories.length === 0}
          >
            {categories.length === 0 ? (
              <option value="">No routines yet - add some in Settings!</option>
          ) : (
              categories.map(category => (
                <React.Fragment key={category.id}>
                  {/* Direct category fields */}
                  {category.fields && category.fields.length > 0 && (
                    <optgroup label={category.name}>
                      {category.fields.map(field => (
                        <option key={field.id} value={field.id}>
                          {field.name}
                        </option>
                      ))}
                    </optgroup>
          )}
                  {/* Subcategory fields */}
                  {category.subcategories && category.subcategories.map(subcat => (
                    subcat.fields && subcat.fields.length > 0 && (
                      <optgroup key={subcat.id} label={`${category.name} - ${subcat.name}`}>
                        {subcat.fields.map(field => (
                          <option key={field.id} value={field.id}>
                            {field.name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  ))}
                </React.Fragment>
              ))
            )}
          </select>
    </div>

        <div className="control-group">
          <label>Time Period:</label>
          <select value={dateRange || ''} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="56">Last 8 weeks</option>
            <option value="84">Last 12 weeks</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{stats.streak}</div>
            <div className="stat-label">{getStreakLabel(selectedField.frequency)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.completed} / {stats.expected}</div>
            <div className="stat-label">Completed / Expected</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{stats.percentage}%</div>
            <div className="stat-label">Success Rate</div>
          </div>
          {stats.average && (
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-value">{stats.average}</div>
              <div className="stat-label">Average {selectedField.unit || 'Value'}</div>
            </div>
          )}
        </div>
      )}

      {chartData && (
        <div className="chart-container">
          {selectedField.type === 'checkbox' ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      )}
    </div>
  );
}

export default TrendsView;
