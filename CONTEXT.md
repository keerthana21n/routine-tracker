# 📊 Routine Tracker - Complete Context Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Backend API](#backend-api)
6. [Frontend Architecture](#frontend-architecture)
7. [Key Features](#key-features)
8. [Code Implementation Details](#code-implementation-details)
9. [Setup & Installation](#setup--installation)
10. [Data Flow](#data-flow)

---

## Project Overview

A full-stack web application designed to track daily routines, habits, and self-care activities with comprehensive data visualization and analytics capabilities.

### Purpose
- Track multiple routine categories (Food, Exercise, Bodycare, etc.)
- Visualize progress with interactive charts
- Build better habits through data-driven insights
- Flexible configuration for personalized tracking needs

### Core Philosophy
- **Dynamic Configuration**: Everything is user-configurable through the UI
- **Flexible Tracking**: Support for both boolean (yes/no) and numeric tracking
- **Frequency Awareness**: Not just daily tracking - supports various schedules
- **Organization**: Hierarchical structure with categories and subcategories
- **Temporary Tracking**: Support for short-term tracking needs

---

## Tech Stack

### Backend
- **Runtime**: Node.js (v14+)
- **Framework**: Express.js (^4.18.2)
- **Database**: SQLite3 (^5.1.6)
- **Middleware**: 
  - CORS (^2.8.5)
  - Body-parser (^1.20.2)
- **Environment**: dotenv (^16.3.1)
- **Dev Tools**: nodemon (^3.0.1)

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Create React App (react-scripts 5.0.1)
- **Charts**: 
  - Chart.js (^4.4.0)
  - react-chartjs-2 (^5.2.0)
- **HTTP Client**: Axios (^1.6.0)
- **Date Handling**: date-fns (^2.30.0)
- **Styling**: Custom CSS (no framework)

---

## Project Structure

```
routine-tracker/
├── backend/
│   ├── server.js              # Express server & API routes
│   ├── package.json           # Backend dependencies
│   └── package-lock.json
│
├── frontend/
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── src/
│   │   ├── components/        # (Empty - could be used for shared components)
│   │   ├── pages/
│   │   │   ├── DailyTracker.js     # Daily entry form
│   │   │   ├── DailyTracker.css
│   │   │   ├── DailyTracker_old.js # Backup/old version
│   │   │   ├── TrendsView.js       # Analytics & charts
│   │   │   ├── TrendsView.css
│   │   │   ├── Settings.js         # Configuration management
│   │   │   └── Settings.css
│   │   ├── services/
│   │   │   └── api.js         # API service layer
│   │   ├── hooks/             # (Empty - could be used for custom hooks)
│   │   ├── App.js             # Main app component with navigation
│   │   ├── App.css
│   │   ├── index.js           # React entry point
│   │   └── index.css
│   ├── package.json           # Frontend dependencies
│   └── package-lock.json
│
├── database/
│   └── routine.db            # SQLite database (auto-generated)
│
├── README.md                 # User-facing documentation
├── .gitignore
└── CONTEXT.md               # This file - developer documentation

```

---

## Database Schema

### Tables Overview
The database uses a hierarchical structure to support flexible organization:

```
categories
    ↓
subcategories (optional)
    ↓
fields (trackable items)
    ↓
daily_entries (user data)
```

### 1. `categories` Table
Stores main groupings of routines.

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Example Data**:
- Food
- Exercise
- Bodycare
- Sleep
- Meditation

### 2. `subcategories` Table
Optional sub-groupings within categories.

```sql
CREATE TABLE subcategories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
)
```

**Example Data**:
- Skincare (under Bodycare)
- Haircare (under Bodycare)
- Cardio (under Exercise)
- Strength Training (under Exercise)

### 3. `fields` Table
Individual trackable items with rich metadata.

```sql
CREATE TABLE fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  subcategory_id INTEGER,           -- Optional
  field_name TEXT NOT NULL,
  field_type TEXT DEFAULT 'checkbox',  -- 'checkbox' or 'number'
  unit TEXT,                        -- For number fields (gm, ml, reps)
  frequency TEXT,                   -- daily, weekly, bi-weekly, every-2-days
  tags TEXT,                        -- Comma-separated tags
  is_temporary BOOLEAN DEFAULT 0,   -- 1 for temporary fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
)
```

**Example Data**:
| field_name | field_type | unit | frequency | tags | is_temporary |
|------------|------------|------|-----------|------|--------------|
| Morning Facewash | checkbox | NULL | daily | skincare,morning | 0 |
| Protein Intake | number | gm | daily | nutrition | 0 |
| Hair Growth Serum | checkbox | NULL | every-2-days | haircare | 1 |

### 4. `daily_entries` Table
Stores user's daily tracking data.

```sql
CREATE TABLE daily_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  field_id INTEGER,
  value TEXT,                       -- Stores 'true'/'false' for checkbox, number for numeric
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (field_id) REFERENCES fields(id)
)
```

**Data Examples**:
| date | field_id | value |
|------|----------|-------|
| 2024-01-15 | 1 | true |
| 2024-01-15 | 5 | 45 |
| 2024-01-15 | 12 | false |

---

## Backend API

### Server Configuration
- **Port**: 3001 (default) or `process.env.PORT`
- **CORS**: Enabled for all origins
- **Database Path**: `../database/routine.db`

### API Endpoints

#### 1. Get All Categories with Hierarchy
```http
GET /api/categories
```

**Response Structure**:
```json
[
  {
    "id": 1,
    "name": "Bodycare",
    "fields": [
      {
        "id": 10,
        "name": "Morning Routine",
        "type": "checkbox",
        "unit": null,
        "frequency": "daily",
        "tags": null,
        "isTemporary": false
      }
    ],
    "subcategories": [
      {
        "id": 1,
        "name": "Skincare",
        "fields": [
          {
            "id": 1,
            "name": "Morning Facewash",
            "type": "checkbox",
            "unit": null,
            "frequency": "daily",
            "tags": "skincare,morning",
            "isTemporary": false
          }
        ]
      }
    ]
  }
]
```

#### 2. Add New Category
```http
POST /api/categories
Content-Type: application/json

{
  "name": "Meditation"
}
```

**Response**:
```json
{
  "id": 4,
  "name": "Meditation"
}
```

#### 3. Add New Subcategory
```http
POST /api/subcategories
Content-Type: application/json

{
  "category_id": 2,
  "name": "Yoga"
}
```

**Response**:
```json
{
  "id": 5,
  "category_id": 2,
  "name": "Yoga"
}
```

#### 4. Add New Field
```http
POST /api/fields
Content-Type: application/json

{
  "category_id": 1,
  "subcategory_id": 1,
  "field_name": "Evening Moisturizer",
  "field_type": "checkbox",
  "unit": null,
  "frequency": "daily",
  "tags": "skincare,evening",
  "is_temporary": false
}
```

#### 5. Save Daily Entries
```http
POST /api/entries
Content-Type: application/json

{
  "date": "2024-01-15",
  "entries": [
    {
      "field_id": 1,
      "value": "true"
    },
    {
      "field_id": 5,
      "value": "45"
    }
  ]
}
```

**Note**: This endpoint:
1. Deletes all existing entries for the date
2. Inserts new entries
3. Ensures data consistency

#### 6. Get Entries for Specific Date
```http
GET /api/entries/2024-01-15
```

**Response**:
```json
[
  {
    "id": 1,
    "field_id": 1,
    "value": "true",
    "field_name": "Morning Facewash",
    "field_type": "checkbox",
    "unit": null,
    "category_name": "Bodycare",
    "subcategory_name": "Skincare"
  }
]
```

#### 7. Get Entries for Date Range
```http
GET /api/entries/range/2024-01-01/2024-01-15
```

**Response**: Array of entries with dates for trend analysis.

#### 8. Delete Field
```http
DELETE /api/fields/:id
```

#### 9. Delete Subcategory
```http
DELETE /api/subcategories/:id
```

---

## Frontend Architecture

### Application Structure

The app uses a simple tab-based navigation with three main views:

```javascript
// App.js - Main component
const [activeTab, setActiveTab] = useState('tracker');

// Three main views:
// 1. 'tracker' -> DailyTracker component
// 2. 'trends' -> TrendsView component  
// 3. 'settings' -> Settings component
```

### API Service Layer

**File**: `frontend/src/services/api.js`

```javascript
// Centralized API calls
const API_BASE_URL = 'http://localhost:3001/api';

export default {
  getCategories: () => axios.get(`${API_BASE_URL}/categories`),
  addCategory: (name) => axios.post(`${API_BASE_URL}/categories`, { name }),
  addSubcategory: (category_id, name) => axios.post(`${API_BASE_URL}/subcategories`, { category_id, name }),
  addField: (category_id, field_name, field_type, unit, frequency, tags, is_temporary, subcategory_id) => {
    // ... implementation
  },
  saveEntries: (date, entries) => axios.post(`${API_BASE_URL}/entries`, { date, entries }),
  getEntriesByDate: (date) => axios.get(`${API_BASE_URL}/entries/${date}`),
  getEntriesByRange: (startDate, endDate) => axios.get(`${API_BASE_URL}/entries/range/${startDate}/${endDate}`),
  deleteField: (id) => axios.delete(`${API_BASE_URL}/fields/${id}`),
  deleteSubcategory: (id) => axios.delete(`${API_BASE_URL}/subcategories/${id}`)
};
```

### Component Breakdown

#### 1. DailyTracker Component
**Purpose**: Daily data entry form

**Key Features**:
- Date picker (defaults to today)
- Dynamic form generation from database structure
- Checkbox and number input fields
- Frequency badges (📅 daily, 📆 weekly, etc.)
- "Select All" functionality for daily checkbox subcategories
- Temporary field indicators (⏳ Temp)
- Save functionality with loading state

**State Management**:
```javascript
const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
const [categories, setCategories] = useState([]);
const [entries, setEntries] = useState({}); // { fieldId: value }
const [loading, setLoading] = useState(false);
```

**Key Functions**:
- `loadCategories()` - Fetch category structure
- `loadEntries()` - Load existing entries for selected date
- `handleInputChange(fieldId, value)` - Update entry state
- `handleSelectAllSubcategory(subcategory)` - Toggle all fields in subcategory
- `handleSave()` - Save all entries to database

**Select All Logic**:
```javascript
// Only works if all fields are:
// 1. Daily frequency
// 2. Checkbox type

const canSelectAllSubcategory = (subcategory) => {
  return subcategory.fields.every(
    field => field.frequency === 'daily' && field.type === 'checkbox'
  );
};
```

#### 2. TrendsView Component
**Purpose**: Analytics and data visualization

**Key Features**:
- Field selector (dropdown with categories/subcategories)
- Date range selector (7, 14, 30, 90 days)
- Statistics cards:
  - 🔥 Current streak
  - ✅ Days completed
  - 📊 Success rate percentage
  - 📈 Average value (for number fields)
- Interactive charts:
  - Bar chart for checkboxes
  - Line chart for numbers

**Chart Configuration**:
```javascript
// Uses Chart.js with react-chartjs-2
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
```

**Streak Calculation**:
```javascript
const calculateStreak = (values) => {
  let streak = 0;
  // Count from most recent backwards
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] > 0) {
      streak++;
    } else {
      break; // Streak broken
    }
  }
  return streak;
};
```

#### 3. Settings Component
**Purpose**: Configuration management

**Key Features**:
- Add categories
- Add subcategories
- Add fields with full configuration:
  - Field type (checkbox/number)
  - Unit (for numbers)
  - Frequency scheduling
  - Tags
  - Temporary marking
- Delete fields and subcategories
- Visual organization with icons

**Form State Management**:
```javascript
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
```

**Icon Mapping**:
```javascript
const getSubcategoryIcon = (name) => {
  const iconMap = {
    'Skincare': '✨',
    'Haircare': '💆',
    'Bodycare': '🛁',
    'Oralcare': '🦷'
  };
  return iconMap[name] || '📋';
};
```

---

## Key Features

### 1. Hierarchical Organization
```
Category (e.g., Bodycare)
  ├── Direct Fields (e.g., "Morning Routine")
  └── Subcategories
      ├── Skincare
      │   ├── Morning Facewash
      │   ├── Morning Moisturizer
      │   └── ...
      └── Haircare
          ├── Hair Oil
          └── ...
```

### 2. Field Types

#### Checkbox Fields
- Binary tracking (completed/not completed)
- Displayed as custom checkboxes
- Visualized as bar charts
- Used for: habits, tasks, routines

#### Number Fields
- Numeric value tracking with units
- Input with unit display (gm, ml, reps, etc.)
- Visualized as line charts
- Used for: quantities, measurements, counts

### 3. Frequency Tracking

Supports various tracking frequencies:
- **Daily** (📅): Track every day
- **Weekly** (📆): Once per week
- **Bi-weekly** (🗓️): Every two weeks
- **Every 2 days** (⏰): Alternate days

Frequency badges help users identify tracking schedules.

### 4. Temporary Fields

Fields can be marked as temporary (⏳ Temp badge):
- Used for short-term tracking needs
- Visual indicator in UI
- Example: "Hair Growth Serum" - tracking a 3-month treatment

### 5. Tags System

Fields can have comma-separated tags:
- Helps organize related fields
- Examples: "skincare,morning", "nutrition,protein"
- Can be used for filtering (future enhancement)

### 6. Smart "Select All"

For subcategories with all daily checkboxes:
- Checkbox appears in subcategory header
- One click toggles all fields
- Saves time for routine tasks

### 7. Analytics Features

#### Streak Tracking
Calculates consecutive days of completion from most recent entry backwards.

#### Success Rate
Percentage of days completed within selected time range.

#### Average Values
For numeric fields, shows average value over time period.

#### Interactive Charts
- Hover for exact values
- Zoom capabilities
- Responsive design

---

## Code Implementation Details

### Backend Database Initialization

```javascript
function initDatabase() {
  // Creates tables in order (due to foreign key dependencies):
  // 1. categories
  // 2. subcategories (depends on categories)
  // 3. fields (depends on categories & subcategories)
  // 4. daily_entries (depends on fields)
  
  // Uses nested callbacks to ensure sequential creation
  // No default data - user adds everything through UI
}
```

### Frontend Data Loading Pattern

```javascript
// Common pattern across components:

useEffect(() => {
  loadCategories(); // Load on mount
}, []);

useEffect(() => {
  loadData(); // Reload when dependencies change
}, [selectedDate, selectedField, dateRange]);

const loadCategories = async () => {
  try {
    const data = await api.getCategories();
    setCategories(data);
  } catch (error) {
    console.error('Error loading categories:', error);
  }
};
```

### Entry State Management

Entries are stored in a flat object for easy lookup:

```javascript
// Structure: { fieldId: value }
const [entries, setEntries] = useState({});

// Example:
{
  1: 'true',      // Checkbox field (completed)
  2: 'false',     // Checkbox field (not completed)
  5: '45',        // Number field (45 gm)
  8: '250'        // Number field (250 ml)
}

// Update function:
const handleInputChange = (fieldId, value) => {
  setEntries(prev => ({
    ...prev,
    [fieldId]: value
  }));
};
```

### Save Entry Logic

```javascript
const handleSave = async () => {
  setLoading(true);
  try {
    // Convert object to array format for API
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
```

### Chart Data Preparation

```javascript
// For trends visualization
const loadTrendData = async () => {
  // 1. Fetch entries for date range
  const data = await api.getEntriesByRange(startDate, endDate);
  
  // 2. Filter for selected field
  const fieldData = data.filter(entry => entry.field_id === selectedField.id);
  
  // 3. Create array for each day (including days with no data)
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
  
  // 4. Create Chart.js dataset
  setChartData({
    labels: dates,
    datasets: [{
      label: selectedField.name,
      data: values,
      borderColor: 'rgb(102, 126, 234)',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.4,
      fill: true,
    }],
  });
};
```

---

## Setup & Installation

### Prerequisites
- Node.js v14 or higher
- npm or yarn

### Backend Setup

```bash
cd routine-tracker/backend
npm install
npm start
# Server runs on http://localhost:3001
```

**For development** (with auto-restart):
```bash
npm run dev
```

### Frontend Setup

```bash
cd routine-tracker/frontend
npm install
npm start
# App runs on http://localhost:3000
```

### Database
SQLite database is automatically created at:
```
routine-tracker/database/routine.db
```

No manual database setup required - tables are created on first run.

---

## Data Flow

### Daily Tracker Flow

```
User loads page
    ↓
Load categories structure (GET /api/categories)
    ↓
Load existing entries for selected date (GET /api/entries/:date)
    ↓
User fills/modifies form
    ↓
User clicks "Save"
    ↓
Convert entries object to array
    ↓
Send to backend (POST /api/entries)
    ↓
Backend deletes old entries for date
    ↓
Backend inserts new entries
    ↓
Success message to user
```

### Trends View Flow

```
User loads page
    ↓
Load categories structure (GET /api/categories)
    ↓
Auto-select first available field
    ↓
Calculate date range (based on selected period)
    ↓
Fetch entries for range (GET /api/entries/range/:start/:end)
    ↓
Filter data for selected field
    ↓
Generate array with value for each day (including zeros)
    ↓
Calculate statistics (streak, completion rate, average)
    ↓
Render chart and stats cards
    ↓
User changes field or date range → repeat from date range calculation
```

### Settings Flow

```
User loads page
    ↓
Load categories structure (GET /api/categories)
    ↓
Display all categories, subcategories, and fields
    ↓
User adds category/subcategory/field
    ↓
Send to backend (POST /api/categories or /api/subcategories or /api/fields)
    ↓
Reload categories to show new item
    ↓
User deletes field
    ↓
Confirm deletion
    ↓
Send to backend (DELETE /api/fields/:id)
    ↓
Reload categories to reflect deletion
```

---

## Design Patterns & Best Practices

### 1. Separation of Concerns
- **Backend**: Pure API layer, no UI logic
- **Frontend**: 
  - Services layer (`api.js`) for HTTP calls
  - Components focus on UI/UX
  - No direct axios calls in components

### 2. Single Source of Truth
- Database is the only source of truth
- Frontend always loads fresh data from backend
- No complex client-side caching (could be added as enhancement)

### 3. Optimistic UI Updates
- Forms show immediate feedback
- Loading states during async operations
- Error handling with user-friendly messages

### 4. Component Modularity
Each page component is self-contained:
- Own state management
- Own data loading
- Own styling (separate CSS files)

### 5. Flexible Data Model
- Dynamic schema driven by user configuration
- No hard-coded categories or fields
- Easy to extend with new field types

---

## Future Enhancement Opportunities

### High Priority
1. **User Authentication**: Multi-user support
2. **Data Export**: CSV/JSON export for backup
3. **Mobile Responsiveness**: Better mobile UI
4. **Offline Support**: PWA with service workers

### Medium Priority
5. **Reminders/Notifications**: Daily tracking reminders
6. **Goal Setting**: Target streaks or values
7. **Tag Filtering**: Filter fields by tags
8. **Custom Field Types**: Time, duration, rating scales
9. **Notes/Journal**: Add text notes to daily entries
10. **Bulk Operations**: Edit multiple days at once

### Low Priority
11. **Data Import**: Import from CSV
12. **Themes**: Dark mode support
13. **Sharing**: Share progress with others
14. **Achievements**: Gamification elements
15. **API Documentation**: Swagger/OpenAPI specs

---

## Common Use Cases

### Use Case 1: Skincare Routine Tracking
```
Category: Bodycare
  Subcategory: Skincare
    Fields:
      - Morning Facewash (checkbox, daily)
      - Morning Moisturizer (checkbox, daily)
      - Evening Facewash (checkbox, daily)
      - Weekly Exfoliation (checkbox, weekly)
```

### Use Case 2: Nutrition Tracking
```
Category: Food
  Direct Fields:
    - Protein Intake (number, gm, daily)
    - Water Intake (number, ml, daily)
    - Vitamin D (checkbox, daily)
```

### Use Case 3: Fitness Routine
```
Category: Exercise
  Subcategory: Strength Training
    Fields:
      - Push-ups (number, reps, daily)
      - Squats (number, reps, daily)
  Subcategory: Cardio
    Fields:
      - Running Distance (number, km, daily)
```

---

## Troubleshooting

### Common Issues

#### Backend won't start
- Check if port 3001 is already in use
- Ensure SQLite3 native module compiled correctly
- Run `npm rebuild sqlite3`

#### Frontend can't connect to backend
- Verify backend is running on port 3001
- Check `api.js` has correct `API_BASE_URL`
- Check browser console for CORS errors

#### Database locked error
- Close any SQLite browser tools
- Restart backend server
- Check file permissions on `routine.db`

#### Charts not rendering
- Check browser console for Chart.js errors
- Ensure data format matches Chart.js expectations
- Verify Chart.js components are registered

---

## Performance Considerations

### Current Performance
- **Database**: SQLite is fast for single-user scenarios
- **API**: Synchronous database operations (could be optimized)
- **Frontend**: Re-renders on state changes (React default behavior)

### Optimization Opportunities
1. **Backend**:
   - Implement database connection pooling
   - Add response caching for categories
   - Use prepared statements for bulk inserts
   - Implement pagination for large date ranges

2. **Frontend**:
   - Implement React.memo for expensive components
   - Add useMemo/useCallback where appropriate
   - Lazy load Chart.js
   - Debounce save operations

3. **Database**:
   - Add indexes on frequently queried columns
   - Implement database cleanup for old data
   - Consider compression for large datasets

---

## Security Considerations

### Current State
- No authentication implemented
- No authorization checks
- SQLite database file is unencrypted
- No input sanitization beyond SQL parameterization
- CORS enabled for all origins

### Security Enhancements Needed
1. Add user authentication (JWT, OAuth)
2. Implement authorization middleware
3. Add input validation and sanitization
4. Implement rate limiting
5. Configure CORS for specific origins
6. Add HTTPS in production
7. Implement database encryption
8. Add audit logging

---

## Testing Strategy

### Current State
No tests implemented.

### Recommended Testing Approach

#### Backend Testing
```javascript
// Unit Tests (Jest + Supertest)
- Test each API endpoint
- Test database operations
- Test error handling

// Integration Tests
- Test full data flow
- Test database migrations
- Test concurrent requests
```

#### Frontend Testing
```javascript
// Unit Tests (Jest + React Testing Library)
- Test component rendering
- Test user interactions
- Test state management

// Integration Tests
- Test API integration
- Test form submissions
- Test chart rendering

// E2E Tests (Cypress/Playwright)
- Test complete user workflows
- Test data persistence
- Test cross-browser compatibility
```

---

## API Response Examples

### GET /api/categories (Full Response)
```json
[
  {
    "id": 1,
    "name": "Bodycare",
    "fields": [
      {
        "id": 10,
        "name": "Daily Shower",
        "type": "checkbox",
        "unit": null,
        "frequency": "daily",
        "tags": null,
        "isTemporary": false
      }
    ],
    "subcategories": [
      {
        "id": 1,
        "name": "Skincare",
        "fields": [
          {
            "id": 1,
            "name": "Morning Facewash",
            "type": "checkbox",
            "unit": null,
            "frequency": "daily",
            "tags": "skincare,morning",
            "isTemporary": false
          },
          {
            "id": 2,
            "name": "Morning Moisturizer",
            "type": "checkbox",
            "unit": null,
            "frequency": "daily",
            "tags": "skincare,morning",
            "isTemporary": false
          }
        ]
      },
      {
        "id": 2,
        "name": "Haircare",
        "fields": [
          {
            "id": 5,
            "name": "Hair Oil",
            "type": "checkbox",
            "unit": null,
            "frequency": "weekly",
            "tags": "haircare",
            "isTemporary": false
          },
          {
            "id": 6,
            "name": "Hair Growth Serum",
            "type": "checkbox",
            "unit": null,
            "frequency": "every-2-days",
            "tags": "haircare,treatment",
            "isTemporary": true
          }
        ]
      }
    ]
  },
  {
    "id": 2,
    "name": "Food",
    "fields": [
      {
        "id": 11,
        "name": "Protein Intake",
        "type": "number",
        "unit": "gm",
        "frequency": "daily",
        "tags": "nutrition,protein",
        "isTemporary": false
      },
      {
        "id": 12,
        "name": "Water Intake",
        "type": "number",
        "unit": "ml",
        "frequency": "daily",
        "tags": "hydration",
        "isTemporary": false
      }
    ],
    "subcategories": []
  }
]
```

---

## Conclusion

This Routine Tracker application demonstrates:
- ✅ Full-stack JavaScript development
- ✅ RESTful API design
- ✅ Database schema design
- ✅ React state management
- ✅ Data visualization
- ✅ User-centric configuration
- ✅ Responsive UI design

The codebase is well-structured for:
- Easy feature additions
- Database schema evolution
- UI/UX improvements
- Scalability enhancements

---

**Last Updated**: 2024
**Version**: 1.0.0
**Maintainer**: Development Team
