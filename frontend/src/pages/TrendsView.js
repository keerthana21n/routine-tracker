import React, { useState, useEffect } from 'react';
import { format, subDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
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
  const [rangeValue, setRangeValue] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [selectedView, setSelectedView] = useState(null);
  const [xAxisGranularity, setXAxisGranularity] = useState('days');
  const [chartType, setChartType] = useState('heatmap');
  const [heatmapData, setHeatmapData] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const getDefaultRange = (granularity) => {
    switch (granularity) {
      case 'days': return 30;
      case 'weeks': return 12;
      case 'months': return 12;
      case 'years': return 5;
      default: return 30;
    }
  };

  useEffect(() => {
    if (rangeValue === null || rangeValue === undefined) {
      setRangeValue(getDefaultRange(xAxisGranularity));
    }
  }, [xAxisGranularity]);

  useEffect(() => {
    if (selectedView && rangeValue !== null) {
      if (chartType === 'heatmap') {
        loadHeatmapData();
      } else {
        loadTrendData();
      }
    }
  }, [rangeValue, selectedView, xAxisGranularity, chartType]);

  // Calculate streak based on field frequency
  const calculateStreak = (field, values, granularity) => {
    if (granularity === 'days') {
      // For daily view: count consecutive days from most recent
      let streak = 0;
      for (let i = values.length - 1; i >= 0; i--) {
        if (values[i].value > 0) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    } else {
      // For weeks/months/years: count consecutive periods with any completion
      let streak = 0;
      for (let i = values.length - 1; i >= 0; i--) {
        if (values[i].value > 0) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    }
  };

  // Calculate success rate based on field frequency
  const calculateSuccessRate = (field, values, granularity) => {
    if (granularity === 'days') {
      // For daily fields: percentage of days completed
      const completed = values.filter(v => v.value > 0).length;
      const total = values.length;
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    } else {
      // For aggregated views: percentage of periods with completions
      const periodsWithCompletion = values.filter(v => v.value > 0).length;
      const total = values.length;
      return total > 0 ? Math.round((periodsWithCompletion / total) * 100) : 0;
    }
  };

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  const getFieldColor = (index) => {
    const colors = [
      // Greyish Greens (higher contrast)
      { border: 'rgb(110, 135, 110)', bg: 'rgba(110, 135, 110, 0.2)' },
      { border: 'rgb(115, 140, 105)', bg: 'rgba(115, 140, 105, 0.2)' },
      { border: 'rgb(105, 130, 115)', bg: 'rgba(105, 130, 115, 0.2)' },

      // Greyish Yellows (higher contrast)
      { border: 'rgb(140, 140, 100)', bg: 'rgba(140, 140, 100, 0.2)' },
      { border: 'rgb(145, 143, 105)', bg: 'rgba(145, 143, 105, 0.2)' },
      { border: 'rgb(143, 141, 110)', bg: 'rgba(143, 141, 110, 0.2)' },

      // Greyish Oranges (higher contrast)
      { border: 'rgb(145, 120, 105)', bg: 'rgba(145, 120, 105, 0.2)' },
      { border: 'rgb(150, 125, 110)', bg: 'rgba(150, 125, 110, 0.2)' },
      { border: 'rgb(148, 128, 115)', bg: 'rgba(148, 128, 115, 0.2)' },

      // Greyish Browns (higher contrast)
      { border: 'rgb(135, 120, 110)', bg: 'rgba(135, 120, 110, 0.2)' },
      { border: 'rgb(133, 118, 105)', bg: 'rgba(133, 118, 105, 0.2)' },
      { border: 'rgb(140, 125, 115)', bg: 'rgba(140, 125, 115, 0.2)' },

      // Greyish Reds (higher contrast)
      { border: 'rgb(145, 110, 110)', bg: 'rgba(145, 110, 110, 0.2)' },
      { border: 'rgb(150, 115, 115)', bg: 'rgba(150, 115, 115, 0.2)' },
      { border: 'rgb(148, 118, 118)', bg: 'rgba(148, 118, 118, 0.2)' },

      // Greyish Blues (new addition)
      { border: 'rgb(110, 120, 140)', bg: 'rgba(110, 120, 140, 0.2)' },
      { border: 'rgb(115, 125, 145)', bg: 'rgba(115, 125, 145, 0.2)' },
      { border: 'rgb(108, 118, 138)', bg: 'rgba(108, 118, 138, 0.2)' },

      // Pure Greys
      { border: 'rgb(120, 120, 120)', bg: 'rgba(120, 120, 120, 0.2)' },
      { border: 'rgb(125, 125, 125)', bg: 'rgba(125, 125, 125, 0.2)' },
      { border: 'rgb(130, 130, 130)', bg: 'rgba(130, 130, 130, 0.2)' },
    ];
    return colors[index % colors.length];
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);

      // Auto-select 'all' by default
      if (data.length > 0) {
        setSelectedView('all');
      }

      if (rangeValue === null) {
        setRangeValue(getDefaultRange(xAxisGranularity));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadHeatmapData = async () => {
    try {
      const range = parseInt(rangeValue || getDefaultRange(xAxisGranularity));
      let actualRange = range;

      if (xAxisGranularity === 'years') {
        actualRange = range * 365;
      } else if (xAxisGranularity === 'months') {
        actualRange = range * 30;
      } else if (xAxisGranularity === 'weeks') {
        actualRange = range * 7;
      }

      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), actualRange), 'yyyy-MM-dd');
      const data = await api.getEntriesByRange(startDate, endDate);

      let fieldsToShow = [];

      if (selectedView === 'all') {
        // Show all fields from all categories and subcategories
        categories.forEach(category => {
          if (category.fields) {
            category.fields.forEach(f => fieldsToShow.push({ ...f, categoryName: category.name }));
          }
          if (category.subcategories) {
            category.subcategories.forEach(subcat => {
              if (subcat.fields) {
                subcat.fields.forEach(f => fieldsToShow.push({
                  ...f,
                  categoryName: category.name,
                  subcategoryName: subcat.name
                }));
              }
            });
          }
        });
      } else if (selectedView.startsWith('cat-')) {
        const categoryId = parseInt(selectedView.split('-')[1]);
        const category = categories.find(cat => cat.id === categoryId);
        if (category) {
          if (category.fields) fieldsToShow.push(...category.fields);
          if (category.subcategories) {
            category.subcategories.forEach(subcat => {
              if (subcat.fields) {
                subcat.fields.forEach(f => fieldsToShow.push({ ...f, subcategoryName: subcat.name }));
              }
            });
          }
        }
      } else if (selectedView.startsWith('sub-')) {
        const subcategoryId = parseInt(selectedView.split('-')[1]);
        let subcategory = null;
        categories.forEach(cat => {
          if (cat.subcategories) {
            const found = cat.subcategories.find(sub => sub.id === subcategoryId);
            if (found) subcategory = found;
          }
        });
        if (subcategory && subcategory.fields) {
          fieldsToShow = subcategory.fields;
        }
      }

      const checkboxFields = fieldsToShow.filter(f => f.type === 'checkbox');

      if (checkboxFields.length === 0) {
        setHeatmapData(null);
        return;
      }

      const heatmapFields = [];
      const now = new Date();

      if (xAxisGranularity === 'days') {
        // Daily view - show ALL checkbox fields (including weekly fields) with daily data
        checkboxFields.forEach((field, fieldIndex) => {
          const dailyValues = [];
          for (let i = actualRange; i >= 0; i--) {
            const date = format(subDays(now, i), 'yyyy-MM-dd');
            const entry = data.find(e => e.field_id === field.id && e.date === date);
            const completed = entry && (entry.value === 'true' || entry.value === true);
            dailyValues.push({
              date,
              value: completed ? 1 : 0,
              displayDate: format(subDays(now, i), 'MMM dd'),
              displayLabel: format(subDays(now, i), 'd')
            });
          }
          heatmapFields.push({
            field,
            values: dailyValues,
            color: getFieldColor(fieldIndex),
            granularity: 'days',
            maxValue: 1,
            streak: calculateStreak(field, dailyValues, 'days'),
            successRate: calculateSuccessRate(field, dailyValues, 'days')
          });
        });
      } else if (xAxisGranularity === 'weeks') {
        checkboxFields.forEach((field, fieldIndex) => {
          const weeklyValues = [];
          let currentWeekStart = startOfWeek(subDays(now, actualRange));
          let maxCount = 0;
          while (currentWeekStart <= now) {
            const weekEnd = endOfWeek(currentWeekStart);
            const weekNumber = getWeekNumber(currentWeekStart);
            let count = 0;

            for (let d = new Date(currentWeekStart); d <= weekEnd && d <= now; d.setDate(d.getDate() + 1)) {
              const dateStr = format(d, 'yyyy-MM-dd');
              const entry = data.find(e => e.field_id === field.id && e.date === dateStr);
              if (entry && (entry.value === 'true' || entry.value === true)) {
                count++;
              }
            }

            maxCount = Math.max(maxCount, count);
            weeklyValues.push({
              date: format(currentWeekStart, 'yyyy-MM-dd'),
              value: count,
              displayDate: format(currentWeekStart, 'MMM dd'),
              displayLabel: `W${weekNumber}`,
              weekNumber
            });
            currentWeekStart = new Date(currentWeekStart);
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
          }

          heatmapFields.push({
            field,
            values: weeklyValues,
            color: getFieldColor(fieldIndex),
            granularity: 'weeks',
            maxValue: maxCount || 1,
            streak: calculateStreak(field, weeklyValues, 'weeks'),
            successRate: calculateSuccessRate(field, weeklyValues, 'weeks')
          });
        });
      } else if (xAxisGranularity === 'months') {
        checkboxFields.forEach((field, fieldIndex) => {
          const monthlyValues = [];
          let currentMonthStart = startOfMonth(subDays(now, actualRange));
          let maxCount = 0;
          while (currentMonthStart <= now) {
            const monthEnd = endOfMonth(currentMonthStart);
            let count = 0;

            for (let d = new Date(currentMonthStart); d <= monthEnd && d <= now; d.setDate(d.getDate() + 1)) {
              const dateStr = format(d, 'yyyy-MM-dd');
              const entry = data.find(e => e.field_id === field.id && e.date === dateStr);
              if (entry && (entry.value === 'true' || entry.value === true)) {
                count++;
              }
            }

            maxCount = Math.max(maxCount, count);
            monthlyValues.push({
              date: format(currentMonthStart, 'yyyy-MM-dd'),
              value: count,
              displayDate: format(currentMonthStart, 'MMM yyyy'),
              displayLabel: format(currentMonthStart, 'MMM')
            });
            currentMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1);
          }

          heatmapFields.push({
            field,
            values: monthlyValues,
            color: getFieldColor(fieldIndex),
            granularity: 'months',
            maxValue: maxCount || 1,
            streak: calculateStreak(field, monthlyValues, 'months'),
            successRate: calculateSuccessRate(field, monthlyValues, 'months')
          });
        });
      } else if (xAxisGranularity === 'years') {
        checkboxFields.forEach((field, fieldIndex) => {
          const yearlyValues = [];
          const startYear = new Date(startDate).getFullYear();
          const endYear = now.getFullYear();
          let maxCount = 0;

          for (let year = startYear; year <= endYear; year++) {
            let count = 0;
            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31);

            for (let d = new Date(Math.max(yearStart, new Date(startDate))); d <= Math.min(yearEnd, now); d.setDate(d.getDate() + 1)) {
              const dateStr = format(d, 'yyyy-MM-dd');
              const entry = data.find(e => e.field_id === field.id && e.date === dateStr);
              if (entry && (entry.value === 'true' || entry.value === true)) {
                count++;
              }
            }

            maxCount = Math.max(maxCount, count);
            yearlyValues.push({
              date: format(yearStart, 'yyyy-MM-dd'),
              value: count,
              displayDate: `${year}`,
              displayLabel: `${year}`
            });
          }

          heatmapFields.push({
            field,
            values: yearlyValues,
            color: getFieldColor(fieldIndex),
            granularity: 'years',
            maxValue: maxCount || 1,
            streak: calculateStreak(field, yearlyValues, 'years'),
            successRate: calculateSuccessRate(field, yearlyValues, 'years')
          });
        });
      }

      setHeatmapData(heatmapFields);
    } catch (error) {
      console.error('Error loading heatmap data:', error);
    }
  };

  const aggregateDataByGranularity = (data, field, range, granularity) => {
    const days = parseInt(range);
    const now = new Date();

    if (granularity === 'days') {
      const values = [];
      for (let i = days; i >= 0; i--) {
        const date = format(subDays(now, i), 'yyyy-MM-dd');
        const entry = data.find(e => e.field_id === field.id && e.date === date);
        if (field.type === 'checkbox') {
          values.push(entry && (entry.value === 'true' || entry.value === true) ? 1 : 0);
        } else {
          values.push(entry ? parseFloat(entry.value) : 0);
        }
      }
      return values;
    } else if (granularity === 'weeks') {
      const weeks = [];
      let currentWeekStart = startOfWeek(subDays(now, days));
      const endDate = now;

      while (currentWeekStart <= endDate) {
        const weekEnd = endOfWeek(currentWeekStart);
        let weekTotal = 0;

        for (let d = new Date(currentWeekStart); d <= weekEnd && d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = format(d, 'yyyy-MM-dd');
          const entry = data.find(e => e.field_id === field.id && e.date === dateStr);
          if (field.type === 'checkbox') {
            if (entry && (entry.value === 'true' || entry.value === true)) weekTotal++;
          } else {
            weekTotal += entry ? parseFloat(entry.value) : 0;
          }
        }

        weeks.push(weekTotal);
        currentWeekStart = new Date(currentWeekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }
      return weeks;
    } else if (granularity === 'months') {
      const months = [];
      let currentMonthStart = startOfMonth(subDays(now, days));
      const endDate = now;

      while (currentMonthStart <= endDate) {
        const monthEnd = endOfMonth(currentMonthStart);
        let monthTotal = 0;

        for (let d = new Date(currentMonthStart); d <= monthEnd && d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = format(d, 'yyyy-MM-dd');
          const entry = data.find(e => e.field_id === field.id && e.date === dateStr);
          if (field.type === 'checkbox') {
            if (entry && (entry.value === 'true' || entry.value === true)) monthTotal++;
          } else {
            monthTotal += entry ? parseFloat(entry.value) : 0;
          }
        }

        months.push(monthTotal);
        currentMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1);
      }
      return months;
    } else if (granularity === 'years') {
      const years = [];
      const startYear = new Date(subDays(now, days)).getFullYear();
      const endYear = now.getFullYear();

      for (let year = startYear; year <= endYear; year++) {
        let yearTotal = 0;
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);

        for (let d = new Date(Math.max(yearStart, subDays(now, days))); d <= Math.min(yearEnd, now); d.setDate(d.getDate() + 1)) {
          const dateStr = format(d, 'yyyy-MM-dd');
          const entry = data.find(e => e.field_id === field.id && e.date === dateStr);
          if (field.type === 'checkbox') {
            if (entry && (entry.value === 'true' || entry.value === true)) yearTotal++;
          } else {
            yearTotal += entry ? parseFloat(entry.value) : 0;
          }
        }

        years.push(yearTotal);
      }
      return years;
    }
    return [];
  };

  const generateLabels = (range, granularity) => {
    const labels = [];
    const days = parseInt(range);
    const now = new Date();

    if (granularity === 'days') {
      for (let i = days; i >= 0; i--) {
        labels.push(format(subDays(now, i), 'MMM dd'));
      }
    } else if (granularity === 'weeks') {
      let currentWeekStart = startOfWeek(subDays(now, days));
      const endDate = now;

      while (currentWeekStart <= endDate) {
        labels.push(format(currentWeekStart, 'MMM dd'));
        currentWeekStart = new Date(currentWeekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }
    } else if (granularity === 'months') {
      let currentMonthStart = startOfMonth(subDays(now, days));
      const endDate = now;

      while (currentMonthStart <= endDate) {
        labels.push(format(currentMonthStart, 'MMM yyyy'));
        currentMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1);
      }
    } else if (granularity === 'years') {
      const startYear = new Date(subDays(now, days)).getFullYear();
      const endYear = now.getFullYear();

      for (let year = startYear; year <= endYear; year++) {
        labels.push(`${year}`);
      }
    }

    return labels;
  };

  const prepareFieldData = (field, data, range) => {
    return aggregateDataByGranularity(data, field, range, xAxisGranularity);
  };

  const loadTrendData = async () => {
    try {
      const range = parseInt(rangeValue || getDefaultRange(xAxisGranularity));
      let actualRange = range;

      if (xAxisGranularity === 'years') {
        actualRange = range * 365;
      } else if (xAxisGranularity === 'months') {
        actualRange = range * 30;
      } else if (xAxisGranularity === 'weeks') {
        actualRange = range * 7;
      }

      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), actualRange), 'yyyy-MM-dd');
      const data = await api.getEntriesByRange(startDate, endDate);

      let fieldsToShow = [];

      if (selectedView === 'all') {
        // Show all fields from all categories and subcategories
        categories.forEach(category => {
          if (category.fields) {
            category.fields.forEach(f => fieldsToShow.push({ ...f, categoryName: category.name }));
          }
          if (category.subcategories) {
            category.subcategories.forEach(subcat => {
              if (subcat.fields) {
                subcat.fields.forEach(f => fieldsToShow.push({
                  ...f,
                  categoryName: category.name,
                  subcategoryName: subcat.name
                }));
              }
            });
          }
        });
      } else if (selectedView.startsWith('cat-')) {
        const categoryId = parseInt(selectedView.split('-')[1]);
        const category = categories.find(cat => cat.id === categoryId);
        if (!category) return;

        if (category.fields) {
          category.fields.forEach(field => fieldsToShow.push({ ...field }));
        }
        if (category.subcategories) {
          category.subcategories.forEach(subcat => {
            if (subcat.fields) {
              subcat.fields.forEach(field => fieldsToShow.push({ ...field, subcategoryName: subcat.name }));
            }
          });
        }
      } else if (selectedView.startsWith('sub-')) {
        const subcategoryId = parseInt(selectedView.split('-')[1]);
        let subcategory = null;
        categories.forEach(cat => {
          if (cat.subcategories) {
            const found = cat.subcategories.find(sub => sub.id === subcategoryId);
            if (found) subcategory = found;
          }
        });
        if (!subcategory || !subcategory.fields) return;
        fieldsToShow = subcategory.fields;
      }

      if (fieldsToShow.length === 0) {
        setChartData(null);
        return;
      }

      const datasets = fieldsToShow.map((field, index) => {
        const values = prepareFieldData(field, data, actualRange);
        const color = getFieldColor(index);
        let label = field.name;
        if (selectedView === 'all') {
          if (field.subcategoryName) {
            label = `${field.categoryName} > ${field.subcategoryName} > ${field.name}`;
          } else {
            label = `${field.categoryName} > ${field.name}`;
          }
        } else if (field.subcategoryName) {
          label = `${field.name} (${field.subcategoryName})`;
        }
        return {
          label,
          data: values,
          borderColor: color.border,
          backgroundColor: color.bg,
          tension: 0.4,
          fill: false,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        };
      });

      const labels = generateLabels(actualRange, xAxisGranularity);
      setChartData({ labels, datasets });
    } catch (error) {
      console.error('Error loading trend data:', error);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#efefef',
          font: { size: 12, weight: 'bold' },
          padding: 10,
          usePointStyle: true,
        }
      },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 8, 0.95)',
        titleColor: '#8a8860',
        bodyColor: '#efefef',
        borderColor: '#6a6a40',
        borderWidth: 2,
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#3a3520', lineWidth: 1 },
        ticks: {
          color: '#d0d0c8',
          font: { size: 12, weight: '500' }
        }
      },
      x: {
        grid: { color: '#3a3520', lineWidth: 1 },
        ticks: {
          color: '#d0d0c8',
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
  };
  return (
    <div className="trends-view">
      <h2>📈 Trends & Analytics</h2>

      <div className="controls">
        <div className="control-group">
          <label>📁 View</label>
          <select value={selectedView || ''} onChange={(e) => setSelectedView(e.target.value)}>
            <option value="all">🌐 All Fields</option>
            {categories.map(cat => (
              <React.Fragment key={`cat-${cat.id}`}>
                <option value={`cat-${cat.id}`}>📂 {cat.name}</option>
                {cat.subcategories && cat.subcategories.map(subcat => (
                  <option key={`sub-${subcat.id}`} value={`sub-${subcat.id}`}>
                    &nbsp;&nbsp;&nbsp;└─ {subcat.name}
                  </option>
                ))}
              </React.Fragment>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>📏 Granularity</label>
          <select value={xAxisGranularity} onChange={(e) => {
            setXAxisGranularity(e.target.value);
            setRangeValue(getDefaultRange(e.target.value));
          }}>
            <option value="days">📆 Days</option>
            <option value="weeks">📅 Weeks</option>
            <option value="months">🗓️ Months</option>
            <option value="years">📅 Years</option>
          </select>
        </div>
        <div className="control-group">
          <label>🔢 Range</label>
          <input
            type="number"
            min="1"
            max="365"
            value={rangeValue || ''}
            onChange={(e) => setRangeValue(parseInt(e.target.value) || getDefaultRange(xAxisGranularity))}
            placeholder={`Last ${getDefaultRange(xAxisGranularity)} ${xAxisGranularity}`}
          />
        </div>

        <div className="control-group">
          <label>📊</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="line">📈 Line Chart</option>
            <option value="heatmap">🔥 Heatmap Calendar</option>
          </select>
        </div>
      </div>

      {chartType === 'heatmap' ? (
        heatmapData && heatmapData.length > 0 ? (
          <div className="heatmap-container">
            {heatmapData.map((fieldData, index) => (
              <div key={index} className="heatmap-field">
                <div className="heatmap-field-header">
                  <span className="heatmap-field-name">
                    {selectedView === 'all' ? (
                      fieldData.field.subcategoryName
                        ? `${fieldData.field.categoryName} > ${fieldData.field.subcategoryName} > ${fieldData.field.name}`
                        : `${fieldData.field.categoryName} > ${fieldData.field.name}`
                    ) : (
                      fieldData.field.subcategoryName
                        ? `${fieldData.field.name} (${fieldData.field.subcategoryName})`
                        : fieldData.field.name
                    )}
                  </span>
                  <span className="heatmap-field-stats">
                    {fieldData.granularity === 'days' ? (
                      <>
                        <span className="stat-badge streak">🔥{fieldData.streak}</span>
                        <span className="stat-badge success">✓{fieldData.successRate}%</span>
                        <span className="stat-text">{fieldData.values.filter(v => v.value > 0).length}/{fieldData.values.length}d</span>
                      </>
                    ) : (
                      <>
                        <span className="stat-badge streak">🔥{fieldData.streak}</span>
                        <span className="stat-badge success">✓{fieldData.successRate}%</span>
                        <span className="stat-text">{fieldData.values.reduce((sum, v) => sum + v.value, 0)}x</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="heatmap-grid">
                  {fieldData.values.map((day, dayIndex) => {
                    const intensity = day.value / fieldData.maxValue;
                    const rgb = fieldData.color.border.match(/\d+/g);
                    const bgColor = day.value > 0
                      ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.4 + (intensity * 0.6)})`
                      : 'rgba(30, 30, 30, 0.5)';
                    const borderOpacity = day.value > 0 ? 1 : 0.3;

                    return (
                      <div
                        key={dayIndex}
                        className={`heatmap-cell ${day.value > 0 ? 'completed' : 'incomplete'}`}
                        style={{
                          backgroundColor: bgColor,
                          borderColor: day.value > 0 ? fieldData.color.border : 'rgba(80, 80, 80, 0.4)',
                          borderWidth: day.value > 0 ? '2px' : '1.5px',
                          opacity: borderOpacity
                        }}
                        title={`${day.displayDate}: ${day.value} completion${day.value !== 1 ? 's' : ''}`}
                      >
                        {fieldData.granularity !== 'days' && day.value > 0 && (
                          <span className={`heatmap-cell-count ${fieldData.granularity !== 'days' ? 'small' : ''}`}>{day.value}</span>
                        )}
                        <span className="heatmap-cell-date">{day.displayLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data-message">
            <p>📊 No checkbox fields available for heatmap view</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Heatmap shows checkbox fields based on selected granularity</p>
          </div>
        )
      ) : (
        chartData && (
          <div className="chart-container-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        )
      )}
    </div>
  );
}

export default TrendsView;
