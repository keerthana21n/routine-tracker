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
  const [dateRange, setDateRange] = useState(null);
  const [chartData, setChartData] = useState(null);
  // New state for multi-view
  const [viewMode, setViewMode] = useState('category'); // 'category', 'subcategory'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [xAxisGranularity, setXAxisGranularity] = useState('days'); // 'days', 'weeks', 'months'

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (viewMode === 'category' && selectedCategory) {
      if (dateRange === null) setDateRange('30');
      loadCategoryTrendData();
    } else if (viewMode === 'subcategory' && selectedSubcategory) {
      if (dateRange === null) setDateRange('30');
      loadSubcategoryTrendData();
    }
  }, [dateRange, viewMode, selectedCategory, selectedSubcategory, xAxisGranularity]);

  const getFieldColor = (index) => {
    const colors = [
      { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.2)' },      // Bright Blue
      { border: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.2)' },      // Emerald Green
      { border: 'rgb(251, 146, 60)', bg: 'rgba(251, 146, 60, 0.2)' },      // Orange
      { border: 'rgb(217, 70, 239)', bg: 'rgba(217, 70, 239, 0.2)' },      // Fuchsia/Magenta
      { border: 'rgb(251, 191, 36)', bg: 'rgba(251, 191, 36, 0.2)' },      // Amber/Gold
      { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.2)' },        // Red
      { border: 'rgb(20, 184, 166)', bg: 'rgba(20, 184, 166, 0.2)' },      // Teal
      { border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.2)' },      // Purple
      { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.2)' },        // Lime Green
      { border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.2)' },      // Pink
      { border: 'rgb(147, 197, 253)', bg: 'rgba(147, 197, 253, 0.2)' },    // Light Blue
      { border: 'rgb(251, 113, 133)', bg: 'rgba(251, 113, 133, 0.2)' },    // Rose
      { border: 'rgb(74, 222, 128)', bg: 'rgba(74, 222, 128, 0.2)' },      // Light Green
      { border: 'rgb(252, 165, 165)', bg: 'rgba(252, 165, 165, 0.2)' },    // Light Red
      { border: 'rgb(196, 181, 253)', bg: 'rgba(196, 181, 253, 0.2)' },    // Lavender
      { border: 'rgb(253, 224, 71)', bg: 'rgba(253, 224, 71, 0.2)' },      // Yellow
    ];
    return colors[index % colors.length];
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);

      if (data.length > 0) {
        setSelectedCategory(data[0].id);
        if (data[0].subcategories && data[0].subcategories.length > 0) {
          setSelectedSubcategory(data[0].subcategories[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
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
    }

    return labels;
  };

  const prepareFieldData = (field, data, range) => {
    return aggregateDataByGranularity(data, field, range, xAxisGranularity);
  };

  const loadCategoryTrendData = async () => {
    try {
      const range = parseInt(dateRange || '30');
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), range), 'yyyy-MM-dd');
      const data = await api.getEntriesByRange(startDate, endDate);

      const category = categories.find(cat => cat.id === selectedCategory);
      if (!category) return;

      const fieldsInCategory = [];
      if (category.fields) {
        category.fields.forEach(field => fieldsInCategory.push({ ...field }));
      }
      if (category.subcategories) {
        category.subcategories.forEach(subcat => {
          if (subcat.fields) {
            subcat.fields.forEach(field => fieldsInCategory.push({ ...field, subcategoryName: subcat.name }));
          }
        });
      }
      if (fieldsInCategory.length === 0) {
        setChartData(null);
        return;
      }

      const datasets = fieldsInCategory.map((field, index) => {
        const values = prepareFieldData(field, data, range);
        const color = getFieldColor(index);
        const label = field.subcategoryName ? `${field.name} (${field.subcategoryName})` : field.name;

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

      const labels = generateLabels(range, xAxisGranularity);
      setChartData({ labels, datasets });
    } catch (error) {
      console.error('Error loading category trend data:', error);
    }
  };

  const loadSubcategoryTrendData = async () => {
    try {
      const range = parseInt(dateRange || '30');
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), range), 'yyyy-MM-dd');
      const data = await api.getEntriesByRange(startDate, endDate);

      let subcategory = null;
      categories.forEach(cat => {
        if (cat.subcategories) {
          const found = cat.subcategories.find(sub => sub.id === selectedSubcategory);
          if (found) subcategory = found;
        }
      });

      if (!subcategory || !subcategory.fields || subcategory.fields.length === 0) {
        setChartData(null);
        return;
      }

      const datasets = subcategory.fields.map((field, index) => {
        const values = prepareFieldData(field, data, range);
        const color = getFieldColor(index);

        return {
          label: field.name,
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

      const labels = generateLabels(range, xAxisGranularity);
      setChartData({ labels, datasets });
    } catch (error) {
      console.error('Error loading subcategory trend data:', error);
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
          <label>📊</label>
          <select value={viewMode} onChange={(e) => {
            setViewMode(e.target.value);
          }}>
            <option value="category">By Category</option>
            <option value="subcategory">By Subcategory</option>
            </select>
          </div>

        {viewMode === 'category' && (
          <div className="control-group">
            <label>📁</label>
            <select value={selectedCategory || ''} onChange={(e) => setSelectedCategory(parseInt(e.target.value))}>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}

        {viewMode === 'subcategory' && (
          <div className="control-group">
            <label>📂</label>
            <select value={selectedSubcategory || ''} onChange={(e) => setSelectedSubcategory(parseInt(e.target.value))}>
              {categories.map(cat =>
                cat.subcategories && cat.subcategories.map(subcat => (
                  <option key={subcat.id} value={subcat.id}>{cat.name} - {subcat.name}</option>
                ))
              )}
            </select>
          </div>
        )}

        <div className="control-group">
          <label>📅</label>
          <select value={dateRange || ''} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="56">Last 8 weeks</option>
            <option value="84">Last 12 weeks</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        <div className="control-group">
          <label>📏</label>
          <select value={xAxisGranularity} onChange={(e) => setXAxisGranularity(e.target.value)}>
            <option value="days">📆 Days</option>
            <option value="weeks">📅 Weeks</option>
            <option value="months">🗓️ Months</option>
          </select>
        </div>
      </div>

            {chartData && (
        <div className="chart-container-full">
          <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </div>
  );
}

export default TrendsView;
