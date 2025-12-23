const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database setup
const dbPath = path.join(__dirname, '../database/routine.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating categories table:', err);
      return;
    }

    // Subcategories table
    db.run(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `, (err) => {
    if (err) {
        console.error('Error creating subcategories table:', err);
      return;
    }

      // Fields table - stores dynamic fields for each category
      db.run(`
        CREATE TABLE IF NOT EXISTS fields (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER,
          subcategory_id INTEGER,
          field_name TEXT NOT NULL,
          field_type TEXT DEFAULT 'checkbox',
          unit TEXT,
          frequency TEXT,
          tags TEXT,
          is_temporary BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id),
          FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
        )
      `, (err) => {
      if (err) {
          console.error('Error creating fields table:', err);
        return;
      }

        // Daily entries table
        db.run(`
          CREATE TABLE IF NOT EXISTS daily_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            field_id INTEGER,
            value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (field_id) REFERENCES fields(id)
          )
        `, (err) => {
    if (err) {
            console.error('Error creating daily_entries table:', err);
      return;
    }

          console.log('Database tables created successfully');
          // Insert default categories and fields only after all tables are created
          insertDefaultData();
        });
      });
    });
  });
}

function insertDefaultData() {
  // No default data - user will add everything through the UI
  console.log('Database initialized - ready for user input');
}

// ===== API ROUTES =====

// Get all categories with their subcategories and fields
app.get('/api/categories', (req, res) => {
  // First get all categories
  const categoriesQuery = 'SELECT id, name FROM categories ORDER BY id';

  db.all(categoriesQuery, [], (err, categoryRows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const categories = categoryRows.map(cat => ({
      id: cat.id,
      name: cat.name,
      fields: [],
      subcategories: []
    }));

    // Get all subcategories
    const subcategoriesQuery = 'SELECT id, category_id, name FROM subcategories ORDER BY category_id, id';

    db.all(subcategoriesQuery, [], (err, subcatRows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

      // Organize subcategories by category
      subcatRows.forEach(subcat => {
        const category = categories.find(c => c.id === subcat.category_id);
        if (category) {
          category.subcategories.push({
            id: subcat.id,
            name: subcat.name,
            fields: []
  });
        }
});

      // Get all fields
      const fieldsQuery = `
    SELECT
          id, category_id, subcategory_id, field_name,
          field_type, unit, frequency, tags, is_temporary
        FROM fields
        ORDER BY category_id, subcategory_id, id
  `;

      db.all(fieldsQuery, [], (err, fieldRows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

        // Organize fields
        fieldRows.forEach(field => {
          const category = categories.find(c => c.id === field.category_id);
          if (!category) return;

          const fieldData = {
            id: field.id,
            name: field.field_name,
            type: field.field_type,
            unit: field.unit,
            frequency: field.frequency,
            tags: field.tags,
            isTemporary: field.is_temporary === 1
          };

          if (field.subcategory_id) {
            // Field belongs to a subcategory
            const subcategory = category.subcategories.find(s => s.id === field.subcategory_id);
            if (subcategory) {
              subcategory.fields.push(fieldData);
            }
          } else {
            // Field belongs directly to category
            category.fields.push(fieldData);
          }
  });

        res.json(categories);
});
    });
  });
});

// Add new category
app.post('/api/categories', (req, res) => {
  const { name } = req.body;

  db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name });
  });
});

// Add new subcategory
app.post('/api/subcategories', (req, res) => {
  const { category_id, name } = req.body;

  db.run('INSERT INTO subcategories (category_id, name) VALUES (?, ?)', [category_id, name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, category_id, name });
  });
});

// Add new field to category or subcategory
app.post('/api/fields', (req, res) => {
  const { category_id, subcategory_id, field_name, field_type, unit, frequency, tags, is_temporary } = req.body;

  db.run(
    'INSERT INTO fields (category_id, subcategory_id, field_name, field_type, unit, frequency, tags, is_temporary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [category_id, subcategory_id || null, field_name, field_type, unit, frequency, tags, is_temporary ? 1 : 0],
    function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
      res.json({ id: this.lastID, category_id, subcategory_id, field_name, field_type, unit, frequency, tags, is_temporary });
    }
  );
});

// Save daily entry
app.post('/api/entries', (req, res) => {
  const { date, entries } = req.body;

  // Delete existing entries for the date
  db.run('DELETE FROM daily_entries WHERE date = ?', [date], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Insert new entries
    const stmt = db.prepare('INSERT INTO daily_entries (date, field_id, value) VALUES (?, ?, ?)');

    entries.forEach(entry => {
      stmt.run([date, entry.field_id, entry.value]);
});

    stmt.finalize();
    res.json({ message: 'Entries saved successfully' });
  });
});

// Get entries for a specific date
app.get('/api/entries/:date', (req, res) => {
  const { date } = req.params;

  const query = `
    SELECT
      de.id,
      de.field_id,
      de.value,
      f.field_name,
      f.field_type,
      f.unit,
      c.name as category_name,
      s.name as subcategory_name
    FROM daily_entries de
    JOIN fields f ON de.field_id = f.id
    JOIN categories c ON f.category_id = c.id
    LEFT JOIN subcategories s ON f.subcategory_id = s.id
    WHERE de.date = ?
  `;

  db.all(query, [date], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get entries for date range (for trends)
app.get('/api/entries/range/:startDate/:endDate', (req, res) => {
  const { startDate, endDate } = req.params;

  const query = `
    SELECT
      de.date,
      de.field_id,
      de.value,
      f.field_name,
      f.field_type,
      f.unit,
      c.name as category_name,
      s.name as subcategory_name
    FROM daily_entries de
    JOIN fields f ON de.field_id = f.id
    JOIN categories c ON f.category_id = c.id
    LEFT JOIN subcategories s ON f.subcategory_id = s.id
    WHERE de.date BETWEEN ? AND ?
    ORDER BY de.date ASC
  `;

  db.all(query, [startDate, endDate], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Delete field
app.delete('/api/fields/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM fields WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Field deleted successfully' });
  });
});

// Delete subcategory
app.delete('/api/subcategories/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM subcategories WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Subcategory deleted successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
