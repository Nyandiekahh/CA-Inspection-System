# FM & TV Inspection System

A comprehensive web-based inspection management system for the Communications Authority (CA) to conduct, manage, and generate professional reports for FM Radio and Television broadcast station inspections.

## 🏗️ System Architecture

### Backend (Django REST Framework)
- **Framework**: Django 4.2.7 with Django REST Framework 3.14.0
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: Token-based authentication with custom user model
- **API**: RESTful API with comprehensive endpoints
- **Document Generation**: Professional PDF/DOCX reports using ReportLab and python-docx

### Frontend (React)
- **Framework**: React 18.2.0 with modern hooks
- **Routing**: React Router DOM 6.30.1
- **State Management**: Zustand 4.5.7 for global state
- **Data Fetching**: TanStack React Query 5.77.0 with SWR 2.3.3
- **Forms**: React Hook Form 7.56.4 with Yup validation
- **Styling**: Tailwind CSS 3.4.17 with custom CA branding
- **UI Components**: Headless UI with Heroicons

## 📁 Project Structure

```
fm-tv-inspection-system/
├── backend/                          # Django backend
│   ├── apps/                         # Django applications
│   │   ├── authentication/           # Custom user management
│   │   ├── broadcasters/             # Broadcaster management
│   │   ├── towers/                   # Tower/mast information
│   │   ├── transmitters/             # Transmitter equipment
│   │   ├── antennas/                 # Antenna systems
│   │   ├── inspections/              # Main inspection forms
│   │   ├── reports/                  # Professional report generation
│   │   └── audit/                    # Audit trails and versioning
│   ├── config/                       # Django settings and URLs
│   ├── media/                        # Uploaded files and generated reports
│   ├── requirements.txt              # Python dependencies
│   └── manage.py                     # Django management script
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Page components
│   │   │   ├── inspection/           # 4-step inspection flow
│   │   │   └── reports/              # Report management
│   │   ├── services/                 # API integration
│   │   ├── store/                    # Zustand state management
│   │   └── hooks/                    # Custom React hooks
│   ├── public/                       # Static files
│   ├── package.json                  # NPM dependencies
│   └── tailwind.config.js            # Tailwind configuration
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites
- **Backend**: Python 3.8+, pip
- **Frontend**: Node.js 16+, npm
- **Optional**: PostgreSQL (for production)

### Backend Setup

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or
   venv\Scripts\activate     # Windows
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit .env with your settings
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   ```

5. **Database setup**
   ```bash
   python manage.py migrate
   python manage.py collectstatic
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   # or use the custom command
   python manage.py create_inspector --username admin --email admin@ca.go.ke --password admin123 --employee-id EMP001 --superuser
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   # Create .env file
   echo "REACT_APP_API_URL=http://127.0.0.1:8000/api" > .env
   ```

4. **Run development server**
   ```bash
   npm start
   ```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000/api
- **Django Admin**: http://127.0.0.1:8000/admin

### Demo Credentials
- **Admin**: username: `admin`, password: `admin123`
- **Inspector**: username: `inspector1`, password: `password123`

## 📋 Features Overview

### 🔐 Authentication & User Management
- **Custom User Model**: Extended Django user with CA-specific fields
- **Role-based Access**: Inspector, Admin, and Reviewer roles
- **Token Authentication**: Secure API access with token management
- **Profile Management**: User profile editing and employee ID tracking

### 📊 Dashboard
- **Statistics Overview**: Total inspections, drafts, completed, broadcasters
- **Recent Activity**: Latest inspections with status indicators
- **Quick Actions**: Direct access to common tasks
- **Responsive Design**: Mobile-optimized interface

### 🏢 Broadcaster Management
- **Comprehensive Database**: Complete broadcaster information storage
- **Contact Management**: Primary and technical contacts
- **Address Information**: Physical and postal addresses
- **Search & Filter**: Advanced filtering and search capabilities
- **Auto-population**: Automatic form filling from broadcaster database

### 📋 4-Step Inspection Process

#### Step 1: Administrative Information & General Data
- **Broadcaster Selection**: Searchable dropdown with auto-population
- **Contact Information**: Primary and technical contact details
- **Site Information**: Transmitting site details and coordinates
- **Physical Address**: Complete location information
- **Telecoms Operators**: Other operators on site tracking

#### Step 2: Tower/Mast Information
- **Tower Specifications**: Height, type, manufacturer details
- **Safety Compliance**: Lightning protection, grounding, aviation lights
- **Insurance Information**: Policy details and coverage
- **Load Specifications**: Wind load and weight capacity
- **Other Antennas**: Shared infrastructure tracking

#### Step 3: Transmitter Information
- **Exciter Details**: Manufacturer, model, power specifications
- **Amplifier Information**: Power output, frequency stability
- **Filter Systems**: Band pass and notch filters
- **Technical Specifications**: Harmonics suppression, spurious emissions
- **Studio-Transmitter Link**: STL equipment and signal description

#### Step 4: Antenna System & Final Information
- **Antenna Specifications**: Type, manufacturer, gain, polarization
- **Pattern Information**: Horizontal and vertical patterns
- **Tilt Systems**: Mechanical and electrical tilt configurations
- **System Performance**: ERP calculations and loss estimates
- **Final Observations**: Additional notes and technical personnel info

### 💾 Auto-Save & Data Integrity
- **Real-time Auto-save**: Automatic saving every 10 seconds
- **Progress Tracking**: Visual indicators for save status
- **Form Validation**: Client and server-side validation
- **Error Handling**: Graceful error recovery and user feedback
- **Draft Management**: Automatic draft saving and recovery

### 📄 Professional Report Generation

#### Enhanced Report Features
- **CA Template Compliance**: Official Communications Authority format
- **Professional Formatting**: Proper headers, sections, and structure
- **Multiple Formats**: PDF and Microsoft Word document generation
- **Auto-numbering**: Automatic reference number generation (CA/FSM/BC/XXX Vol. II)
- **Equipment Photos**: Categorized image management and inclusion

#### Report Structure
1. **Header Section**: Reference number, date, addressee information
2. **Site Information**: Location, coordinates, elevation details
3. **Tower/Mast Details**: Specifications and safety compliance
4. **Transmitter Equipment**: Detailed equipment information with photos
5. **Antenna System**: Technical specifications and performance data
6. **ERP Calculations**: Automated power calculations with compliance checking
7. **Observations**: Inspector findings and technical observations
8. **Conclusions**: Compliance status and violation summaries
9. **Recommendations**: Regulatory actions and improvement suggestions
10. **Signature Block**: Inspector information and official designation

#### Document Generation Process
1. **Report Structure Creation**: Initialize professional report template
2. **Image Management**: Category-based equipment photo upload
3. **Content Review**: ERP calculations and violation analysis
4. **Document Generation**: Professional PDF/DOCX creation
5. **Download Management**: Secure file delivery with proper naming

### 🧮 ERP (Effective Radiated Power) Calculations
- **Automatic Calculations**: ERP = 10*log₁₀(P) + G - L formula
- **Multiple Channels**: Support for TV multi-channel stations
- **Compliance Checking**: Automatic violation detection
- **Custom Parameters**: Configurable authorized limits
- **Visual Results**: Tabular display with compliance indicators

### 📊 Violation Detection & Analysis
- **Automated Detection**: Intelligent violation identification
- **Categories**: ERP violations, type approval issues, safety compliance
- **Severity Classification**: Major and minor violation categorization
- **Recommendation Engine**: Automatic corrective action suggestions
- **Compliance Status**: Overall station compliance assessment

### 🖼️ Image Management System
- **Categorized Upload**: Equipment-specific photo categories
- **Validation**: File type, size, and quality checks
- **Automatic Positioning**: Smart placement in generated reports
- **Batch Operations**: Multiple image upload with metadata
- **Storage Organization**: Structured file organization by report

### 🔍 Advanced Search & Filtering
- **Multi-criteria Search**: Search across all inspection fields
- **Date Range Filtering**: Time-based inspection filtering
- **Status Filtering**: Filter by completion status
- **Broadcaster Filtering**: Filter by broadcaster or location
- **Export Capabilities**: CSV and Excel export options

### 📋 Audit Trail & Version Control
- **Complete Audit Logs**: All changes tracked with timestamps
- **User Attribution**: Track who made what changes
- **Form Revisions**: Version control for inspection forms
- **Change History**: Detailed change tracking and rollback
- **IP and User Agent Tracking**: Security and compliance logging

### 📱 Mobile Responsiveness
- **Touch-friendly Interface**: Optimized for tablets and mobile devices
- **Progressive Web App**: PWA capabilities for offline access
- **Responsive Forms**: Mobile-optimized form layouts
- **Gesture Support**: Touch gestures for navigation
- **Offline Indicators**: Clear online/offline status

## 🛠️ Technical Implementation

### Backend Architecture

#### Models & Database Design
```python
# Key Models
- CAUser: Extended user model with CA-specific fields
- Broadcaster: Broadcaster information and contacts
- GeneralData: Site and general inspection data
- Inspection: Main inspection form with all fields flattened
- InspectionReport: Professional report generation
- ReportImage: Categorized image management
- ERPCalculation: Power calculation results
- AuditLog: Complete change tracking
```

#### API Endpoints
```
Authentication:
POST /api/auth/login/           # User login
GET  /api/auth/me/              # Current user info
POST /api/auth/logout/          # User logout

Broadcasters:
GET  /api/broadcasters/broadcasters/     # List broadcasters
POST /api/broadcasters/broadcasters/     # Create broadcaster
GET  /api/broadcasters/broadcasters/{id}/ # Get broadcaster details

Inspections:
GET  /api/inspections/inspections/       # List inspections
POST /api/inspections/inspections/       # Create inspection
PUT  /api/inspections/inspections/{id}/  # Update inspection
POST /api/inspections/inspections/{id}/auto-save/ # Auto-save

Reports:
POST /api/reports/create-from-inspection/{id}/ # Create report
POST /api/reports/reports/{id}/generate_documents/ # Generate docs
GET  /api/reports/reports/{id}/download_pdf/ # Download PDF
POST /api/reports/images/bulk_upload/    # Upload images
```

#### Document Generation
- **ReportLab**: High-quality PDF generation with CA formatting
- **python-docx**: Microsoft Word document creation
- **Template System**: Configurable report templates
- **Image Processing**: Automatic image resizing and optimization
- **Professional Formatting**: CA-compliant document structure

### Frontend Architecture

#### State Management
```javascript
// Zustand stores
- useAuthStore: Authentication and user state
- useFormStore: Multi-step form data and validation
- useUIStore: UI state and notifications

// React Query
- Caching: Intelligent data caching and synchronization
- Mutations: Optimistic updates and error handling
- Background Updates: Automatic data freshening
```

#### Form Handling
```javascript
// React Hook Form with Yup validation
- Multi-step Forms: Persistent state across steps
- Auto-save: Debounced automatic saving
- Validation: Client-side and server-side validation
- Error Recovery: Graceful error handling and recovery
```

#### Component Structure
```
Layout Components:
- Layout: Main application wrapper
- Navbar: Navigation with user info
- Sidebar: Application navigation
- ProtectedRoute: Authentication guard

Form Components:
- FormField: Reusable form inputs
- StepIndicator: Multi-step progress
- ValidationSummary: Error display
- AutoSaveIndicator: Save status

Utility Components:
- LoadingSpinner: Loading states
- Card: Content containers
- ProgressBar: Visual progress indicators
```

## 🔧 Configuration

### Backend Configuration (settings.py)

#### Database
```python
# Development (SQLite)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Production (PostgreSQL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}
```

#### Media & Static Files
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Report generation settings
REPORT_SETTINGS = {
    'MAX_IMAGE_SIZE': 5 * 1024 * 1024,  # 5MB
    'MAX_IMAGES_PER_REPORT': 20,
    'IMAGE_QUALITY': 85,
    'ERP_AUTHORIZED_LIMIT_KW': 10.0,
    'REFERENCE_FORMAT': 'CA/FSM/BC/{number:03d} Vol. II',
}
```

#### CORS & Security
```python
CORS_ALLOW_ALL_ORIGINS = True  # Development only
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
```

### Frontend Configuration

#### Environment Variables
```bash
REACT_APP_API_URL=http://127.0.0.1:8000/api
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
```

#### Tailwind CSS
```javascript
// Custom CA theme colors
colors: {
  ca: {
    blue: '#2563eb',
    light: '#dbeafe',
    dark: '#1e40af'
  }
}
```

## 🧪 Testing

### Backend Testing
```bash
# Run all tests
python manage.py test

# Test specific app
python manage.py test apps.inspections

# Coverage report
coverage run --source='.' manage.py test
coverage report
```

### Frontend Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Build and analyze bundle
npm run build
npm run analyze
```

### API Testing
```bash
# Use the provided test script
chmod +x test_backend.sh
./test_backend.sh
```

## 📦 Deployment

### Production Deployment

#### Backend (Django)
1. **Environment Setup**
   ```bash
   pip install -r requirements.txt
   export DJANGO_SETTINGS_MODULE=config.settings
   export DEBUG=False
   ```

2. **Database Migration**
   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```

3. **Web Server (Gunicorn + Nginx)**
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:8000
   ```

#### Frontend (React)
1. **Build Production Bundle**
   ```bash
   npm run build
   ```

2. **Serve Static Files**
   ```bash
   # Using serve
   npm install -g serve
   serve -s build -l 3000
   
   # Or using nginx
   # Point nginx document root to build/
   ```

### Docker Deployment
```dockerfile
# Example Dockerfile for backend
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "config.wsgi:application"]
```

### Environment Variables (Production)
```bash
# Backend
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:pass@localhost/dbname

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_ENVIRONMENT=production
```

## 🔒 Security Features

### Authentication & Authorization
- **Token-based Authentication**: Secure API access
- **Role-based Permissions**: Inspector, Admin, Reviewer roles
- **Session Management**: Automatic token refresh
- **Password Security**: Strong password requirements

### Data Protection
- **Input Validation**: Server and client-side validation
- **SQL Injection Protection**: Django ORM protection
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Cross-site request forgery prevention

### File Security
- **Upload Validation**: File type and size restrictions
- **Virus Scanning**: Optional antivirus integration
- **Secure Storage**: Protected file access
- **Access Control**: Role-based file access

### Audit & Compliance
- **Complete Audit Trail**: All actions logged
- **Data Retention**: Configurable retention policies
- **Backup Systems**: Automated backup procedures
- **Compliance Reporting**: Regulatory compliance tools

## 📊 Performance Optimization

### Backend Optimization
- **Database Indexing**: Optimized database queries
- **Query Optimization**: select_related and prefetch_related usage
- **Caching**: Redis/Memcached integration ready
- **API Pagination**: Efficient data loading

### Frontend Optimization
- **Code Splitting**: Lazy loading of routes and components
- **Image Optimization**: Automatic image compression
- **Bundle Analysis**: Webpack bundle optimization
- **Service Workers**: PWA caching strategies

### Database Performance
```python
# Optimized querysets
queryset = Inspection.objects.select_related(
    'broadcaster', 'inspector'
).prefetch_related(
    'reports', 'audit_logs'
)

# Database indexes
class Meta:
    indexes = [
        models.Index(fields=['created_at']),
        models.Index(fields=['status', 'inspection_date']),
    ]
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues
```bash
# Migration issues
python manage.py migrate --fake-initial

# Permission errors
chmod 755 manage.py
chown -R www-data:www-data media/

# Package conflicts
pip install --upgrade --force-reinstall package-name
```

#### Frontend Issues
```bash
# Node modules issues
rm -rf node_modules package-lock.json
npm install

# Build issues
npm run build -- --verbose

# Proxy issues (for development)
# Check package.json "proxy" setting
```

#### API Connection Issues
- **CORS**: Verify CORS settings in Django
- **Authentication**: Check token in localStorage/sessionStorage
- **Network**: Verify API URL in environment variables

### Debug Mode
```python
# Backend debugging
DEBUG = True
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

### Performance Monitoring
```javascript
// Frontend performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/login/
{
  "username": "string",
  "password": "string"
}
Response: {
  "user": {...},
  "token": "string"
}

GET /api/auth/me/
Headers: Authorization: Token <token>
Response: {
  "id": 1,
  "username": "string",
  "email": "string",
  ...
}
```

### Inspection Endpoints
```
GET /api/inspections/inspections/
Response: {
  "count": 100,
  "results": [...]
}

POST /api/inspections/inspections/
{
  "broadcaster": 1,
  "inspection_date": "2024-01-15",
  "status": "draft",
  ...
}

PUT /api/inspections/inspections/{id}/
{
  "status": "completed",
  ...
}
```

### Report Generation Endpoints
```
POST /api/reports/create-from-inspection/{inspection_id}/
Response: {
  "success": true,
  "report_id": "uuid",
  "violations_detected": 2
}

POST /api/reports/reports/{id}/generate_documents/
{
  "formats": ["pdf", "docx"],
  "include_images": true,
  "custom_observations": "string"
}
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- **Python**: Follow PEP 8 with Black formatting
- **JavaScript**: ESLint with React/Hooks rules
- **CSS**: BEM methodology with Tailwind utilities
- **Git**: Conventional commits format

### Testing Requirements
- Backend: Minimum 80% test coverage
- Frontend: Unit tests for utilities and components
- Integration: End-to-end testing for critical paths

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Communications Authority of Kenya**: For requirements and domain expertise
- **Django Community**: For the excellent web framework
- **React Community**: For the powerful frontend library
- **Open Source Contributors**: For the amazing libraries and tools

## 📞 Support

### Contact Information
- **Developer**: Development Team
- **Email**: support@ca.go.ke
- **Documentation**: [Internal Wiki]
- **Issue Tracker**: [GitHub Issues]

### Getting Help
1. Check this README for common solutions
2. Search existing issues in the repository
3. Create detailed issue with reproduction steps
4. Contact the development team for urgent issues

---

## 🏷️ Version Information

- **Current Version**: v1.0.0
- **Last Updated**: December 2024
- **Compatibility**: Django 4.2+, React 18+, Python 3.8+, Node.js 16+

---

*This system was developed to modernize and streamline the FM and TV broadcast station inspection process for the Communications Authority of Kenya, ensuring compliance with regulatory requirements while providing an efficient, user-friendly interface for inspectors and administrators.*
