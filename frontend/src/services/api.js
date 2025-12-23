import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = {
  // Categories and Fields
  getCategories: async () => {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    return response.data;
  },

  addCategory: async (name) => {
    const response = await axios.post(`${API_BASE_URL}/categories`, { name });
    return response.data;
  },

  addSubcategory: async (category_id, name) => {
    const response = await axios.post(`${API_BASE_URL}/subcategories`, { category_id, name });
    return response.data;
  },

  addField: async (category_id, field_name, field_type, unit = null, frequency = null, tags = null, is_temporary = false, subcategory_id = null) => {
    const response = await axios.post(`${API_BASE_URL}/fields`, {
      category_id,
      subcategory_id,
      field_name,
      field_type,
      unit,
      frequency,
      tags,
      is_temporary
    });
    return response.data;
  },

  deleteField: async (fieldId) => {
    const response = await axios.delete(`${API_BASE_URL}/fields/${fieldId}`);
    return response.data;
  },

  // Entries
  saveEntries: async (date, entries) => {
    const response = await axios.post(`${API_BASE_URL}/entries`, {
      date,
      entries
    });
    return response.data;
  },

  getEntriesByDate: async (date) => {
    const response = await axios.get(`${API_BASE_URL}/entries/${date}`);
    return response.data;
  },

  getEntriesByRange: async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/entries/range/${startDate}/${endDate}`);
    return response.data;
  }
};

export default api;
