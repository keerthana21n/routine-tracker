import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import './DailyTracker.css';

function DailyTracker() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [selectedDate]);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadEntries = async () => {
    try {
      const data = await api.getEntriesByDate(selectedDate);
      const entriesMap = {};
      data.forEach(entry => {
        entriesMap[entry.field_id] = entry.value;
      });
      setEntries(entriesMap);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const handleInputChange = (fieldId, value) => {
    setEntries(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const entriesArray = Object.entries(entries).map(([field_id, value]) => ({
        field_id: parseInt(field_id),
        value: value.toString()
      }));

      await api.saveEntries(selectedDate, entriesArray);
      alert('✅ Entries saved successfully!');
    } catch (error) {
      console.error('Error saving entries:', error);
      alert('❌ Error saving entries');
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyBadge = (frequency) => {
    const badges = {
      'daily': { emoji: '📅', label: 'Daily' },
      'weekly': { emoji: '📆', label: 'Weekly' },
      'bi-weekly': { emoji: '🗓️', label: 'Bi-weekly' },
      'every-2-days': { emoji: '⏰', label: 'Every 2 days' }
    };
    return badges[frequency] || null;
  };

  const renderField = (field) => {
    const value = entries[field.id] || '';
    const frequencyBadge = getFrequencyBadge(field.frequency);

    if (field.type === 'checkbox') {
      return (
        <div className="field-wrapper">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
            />
            <span className="checkmark"></span>
            <span className="field-name-wrapper">
              {field.name}
              {field.isTemporary && <span className="temporary-badge">⏳ Temp</span>}
            </span>
          </label>
          {frequencyBadge && (
            <span className="frequency-badge" title={frequencyBadge.label}>
              {frequencyBadge.emoji}
            </span>
          )}
        </div>
      );
    } else if (field.type === 'number') {
      return (
        <div className="field-wrapper">
          <div className="number-field">
            <label>
              {field.name}
              {field.isTemporary && <span className="temporary-badge">⏳ Temp</span>}
            </label>
            <div className="number-input-wrapper">
              <input
                type="number"
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder="0"
              />
              {field.unit && <span className="unit">{field.unit}</span>}
            </div>
          </div>
          {frequencyBadge && (
            <span className="frequency-badge" title={frequencyBadge.label}>
              {frequencyBadge.emoji}
            </span>
          )}
        </div>
      );
    }
  };

  return (
    <div className="daily-tracker">
      <div className="tracker-header">
        <h2>Daily Tracker</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-picker"
        />
      </div>

      {categories.map(category => {
        // Group fields by tags for Bodycare category
        const groupedFields = {};
        if (category.name === 'Bodycare') {
          category.fields.forEach(field => {
            const tags = field.tags ? field.tags.split(',') : ['other'];
            const primaryTag = tags[0];
            if (!groupedFields[primaryTag]) {
              groupedFields[primaryTag] = [];
            }
            groupedFields[primaryTag].push(field);
          });
        }

        return (
          <div key={category.id} className="category-section">
            <h3>{category.name}</h3>

            {category.name === 'Bodycare' ? (
              // Render with subcategories for Bodycare
              Object.entries(groupedFields).map(([tag, fields]) => (
                <div key={tag} className="subcategory">
                  <h4 className="subcategory-title">
                    {tag === 'skincare' && '✨ Skincare'}
                    {tag === 'haircare' && '💆 Haircare'}
                    {tag === 'bodycare' && '🚿 Bodycare'}
                    {tag === 'other' && '📋 Other'}
                  </h4>
                  <div className="fields-grid">
                    {fields.map(field => (
                      <div key={field.id} className="field-item">
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Regular rendering for other categories
              <div className="fields-grid">
                {category.fields.map(field => (
                  <div key={field.id} className="field-item">
                    {renderField(field)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button
        className="save-button"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? '💾 Saving...' : '💾 Save Today\'s Data'}
      </button>
    </div>
  );
}

export default DailyTracker;
