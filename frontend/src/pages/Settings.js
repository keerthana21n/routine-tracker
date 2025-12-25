import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Settings.css';

function Settings() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newField, setNewField] = useState({
    category_id: '',
    subcategory_id: '',
    field_name: '',
    field_type: 'checkbox',
    unit: '',
    frequency: 'daily',
    tags: '',
    is_temporary: false
  });
  const [newSubcategory, setNewSubcategory] = useState({
        category_id: '',
    name: ''
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [activeSubcategoryForm, setActiveSubcategoryForm] = useState(null);
  const [activeFieldForm, setActiveFieldForm] = useState({ categoryId: null, subcategoryId: null });

  useEffect(() => {
      loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await api.addCategory(newCategoryName);
      setNewCategoryName('');
      setShowAddCategory(false);
      loadCategories();
      alert('✅ Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('❌ Error adding category');
    }
  };

  const handleAddSubcategory = async (e, categoryId) => {
    e.preventDefault();
    if (!newSubcategory.name.trim()) return;

    try {
      await api.addSubcategory(categoryId, newSubcategory.name);
      setNewSubcategory({ category_id: '', name: '' });
      setActiveSubcategoryForm(null);
      loadCategories();
      alert('✅ Subcategory added successfully!');
    } catch (error) {
      console.error('Error adding subcategory:', error);
      alert('❌ Error adding subcategory');
    }
  };

  const handleAddField = async (e, categoryId, subcategoryId = null) => {
    e.preventDefault();
    if (!newField.field_name.trim()) return;

    try {
      await api.addField(
        categoryId,
        newField.field_name,
        newField.field_type,
        newField.unit || null,
        newField.frequency || null,
        newField.tags || null,
        newField.is_temporary,
        subcategoryId
  );
      setNewField({
        category_id: '',
        subcategory_id: '',
        field_name: '',
        field_type: 'checkbox',
        unit: '',
        frequency: 'daily',
        tags: '',
        is_temporary: false
      });
      setActiveFieldForm({ categoryId: null, subcategoryId: null });
      loadCategories();
      alert('✅ Field added successfully!');
    } catch (error) {
      console.error('Error adding field:', error);
      alert('❌ Error adding field');
}
  };

  const handleDeleteField = async (fieldId, fieldName) => {
    if (!window.confirm(`Are you sure you want to delete "${fieldName}"?`)) return;

    try {
      await api.deleteField(fieldId);
      loadCategories();
      alert('✅ Field deleted successfully!');
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('❌ Error deleting field');
    }
  };

  const getSubcategoryIcon = (name) => {
    const iconMap = {
      'Skincare': '✨',
      'Haircare': '💆',
      'Bodycare': '🛁',
      'Oralcare': '🦷'
    };
    return iconMap[name] || '📋';
  };

  const renderFieldRow = (field) => (
                            <div key={field.id} className="field-row">
                              <span className="field-info">
        <strong>{field.name}</strong>
                                <span className="field-details">
                                  <span className="field-type">
                                    {field.type === 'checkbox' ? '☑️' : `🔢 ${field.unit}`}
                                  </span>
          {field.isTemporary && (
            <span className="temp-badge" title="Temporary">⏳</span>
                                  )}
          {field.frequency && (
            <span className="field-frequency">
              {field.frequency === 'daily' && '📅'}
              {field.frequency === 'weekly' && '📆'}
              {field.frequency === 'bi-weekly' && '🗓️'}
              {field.frequency === 'every-2-days' && '⏰'}
                                </span>
      )}
          {field.tags && (
            <span className="field-tags">🏷️ {field.tags}</span>
          )}
      </span>
      </span>
        <button
        className="delete-button"
        onClick={() => handleDeleteField(field.id, field.name)}
        >
        🗑️
        </button>
          </div>
  );

  const renderFieldForm = (categoryId, subcategoryId = null) => (
    <form onSubmit={(e) => handleAddField(e, categoryId, subcategoryId)} className="inline-form">
            <input
              type="text"
        placeholder="Field name (e.g., 'Push-ups', 'Water intake')"
        value={newField.field_name}
        onChange={(e) => setNewField({...newField, field_name: e.target.value})}
              className="form-input"
                    required
                    autoFocus
                  />
      <select
        value={newField.field_type}
        onChange={(e) => setNewField({...newField, field_type: e.target.value})}
        className="form-input"
                    >
        <option value="checkbox">☑️</option>
        <option value="number">🔢</option>
      </select>

      {newField.field_type === 'number' && (
        <input
          type="text"
          placeholder="Unit (e.g., 'gm', 'ml', 'reps')"
          value={newField.unit}
          onChange={(e) => setNewField({...newField, unit: e.target.value})}
          className="form-input"
        />
              )}

      <select
        value={newField.frequency}
        onChange={(e) => setNewField({...newField, frequency: e.target.value})}
        className="form-input"
                          >
        <option value="daily">📅</option>
        <option value="weekly">📆</option>
        <option value="bi-weekly">🗓️</option>
        <option value="every-2-days">⏰</option>
      </select>

      <input
        type="text"
        placeholder="Tags (comma-separated, e.g., 'skincare,morning')"
        value={newField.tags}
        onChange={(e) => setNewField({...newField, tags: e.target.value})}
        className="form-input"
      />

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={newField.is_temporary}
          onChange={(e) => setNewField({...newField, is_temporary: e.target.checked})}
        />
        <span>⏳ Mark as temporary field</span>
      </label>

      <div className="form-actions">
        <button type="submit" className="submit-button" title="Add Field">✓</button>
        <button
          type="button"
          className="cancel-button"
          onClick={() => {
            setActiveFieldForm({ categoryId: null, subcategoryId: null });
            setNewField({
              category_id: '',
              subcategory_id: '',
              field_name: '',
              field_type: 'checkbox',
              unit: '',
              frequency: 'daily',
              tags: '',
              is_temporary: false
            });
          }}
          title="Cancel"
        >
          ✕
                          </button>
                        </div>
    </form>
  );

  return (
    <div className="settings">
      <h2>⚙️ Settings</h2>
      <p className="settings-description">
        Manage your routine categories and fields. Add new items to track!
      </p>

      <div className="settings-section">
        <div className="section-header">
          <h3>Categories & Fields</h3>
          <div className="action-buttons">
            <button
              className="add-button"
              onClick={() => setShowAddCategory(!showAddCategory)}
              title="Add Category"
            >
              ➕
            </button>
          </div>
        </div>
        {showAddCategory && (
          <form onSubmit={handleAddCategory} className="add-form">
            <input
              type="text"
              placeholder="New category name (e.g., 'Sleep', 'Meditation')"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="form-input"
            />
            <div className="form-actions">
              <button type="submit" className="submit-button" title="Add">✓</button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowAddCategory(false)}
                title="Cancel"
              >
                ✕
              </button>
            </div>
          </form>
        )}

        <div className="categories-list">
          {categories.map(category => (
            <div key={category.id} className="category-item">
              <div className="category-header-with-button">
                <h4>{category.name}</h4>
                <div className="inline-action-buttons">
                  <button
                    className="inline-add-button"
                    onClick={() => setActiveSubcategoryForm(activeSubcategoryForm === category.id ? null : category.id)}
                    title="Add Subcategory"
                  >
                    ➕📁
                  </button>
                  <button
                    className="inline-add-button"
                    onClick={() => setActiveFieldForm({ categoryId: category.id, subcategoryId: null })}
                    title="Add Field (no subcategory)"
                  >
                    ➕📝
                  </button>
                </div>
              </div>

              {activeSubcategoryForm === category.id && (
                <form onSubmit={(e) => handleAddSubcategory(e, category.id)} className="inline-form">
                  <input
                    type="text"
                    placeholder="Subcategory name (e.g., 'Skincare', 'Strength Training')"
                    value={newSubcategory.name}
                    onChange={(e) => setNewSubcategory({...newSubcategory, name: e.target.value})}
                    className="form-input"
                    required
                    autoFocus
                  />
                  <div className="form-actions">
                    <button type="submit" className="submit-button" title="Add">✓</button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setActiveSubcategoryForm(null);
                        setNewSubcategory({ category_id: '', name: '' });
                      }}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </form>
              )}

              {activeFieldForm.categoryId === category.id && activeFieldForm.subcategoryId === null && (
                renderFieldForm(category.id, null)
              )}

              {category.subcategories && category.subcategories.length > 0 ? (
                <>
                  {category.fields && category.fields.length > 0 && (
                    <div className="direct-fields-section">
                      <h5 className="direct-fields-header">📌 General Fields</h5>
                      <div className="fields-list">
                        {category.fields.map(field => renderFieldRow(field))}
                      </div>
                    </div>
                  )}

                  <div className="subcategories-container">
                    {category.subcategories.map(subcategory => (
                      <div key={subcategory.id} className="subcategory-section">
                        <div className="subcategory-header-with-button">
                          <h5 className="subcategory-header">
                            {getSubcategoryIcon(subcategory.name)} {subcategory.name}
                          </h5>
                          <button
                            className="inline-add-button small"
                            onClick={() => setActiveFieldForm({ categoryId: category.id, subcategoryId: subcategory.id })}
                            title="Add Field to this subcategory"
                          >
                            ➕
                          </button>
                        </div>

                        {activeFieldForm.categoryId === category.id && activeFieldForm.subcategoryId === subcategory.id && (
                          renderFieldForm(category.id, subcategory.id)
                        )}

                        <div className="fields-list">
                          {subcategory.fields.length === 0 ? (
                            <p className="no-fields">No fields in this subcategory yet.</p>
                          ) : (
                            subcategory.fields.map(field => renderFieldRow(field))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="fields-list">
                  {category.fields.length === 0 ? (
                    <p className="no-fields">No fields yet. Add one above!</p>
                  ) : (
                    category.fields.map(field => renderFieldRow(field))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="settings-info">
        <h4>💡 Tips:</h4>
        <ul>
          <li>Use <strong>Checkbox</strong> fields for tasks you complete (yes/no)</li>
          <li>Use <strong>Number</strong> fields for measurable quantities (weight, reps, ml, etc.)</li>
          <li>Add categories to organize related routines</li>
          <li>Use <strong>Subcategories</strong> to further organize fields within a category</li>
          <li>Delete fields that you no longer track</li>
          <li>Set <strong>Frequency</strong> to schedule how often you track each field</li>
          <li>Use <strong>Tags</strong> to group and filter related fields</li>
          <li>Mark fields as <strong>Temporary</strong> for short-term tracking</li>
        </ul>
      </div>
    </div>
  );
}

export default Settings;
