import os
from pathlib import Path
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production-only')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,0.0.0.0').split(',')

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_extensions',
]

LOCAL_APPS = [
    'apps.authentication',
    'apps.broadcasters',
    'apps.towers',
    'apps.transmitters',
    'apps.antennas',
    'apps.inspections',
    'apps.audit',
    'apps.reports',  # Added reports app
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',  # DISABLED FOR DEVELOPMENT
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'authentication.CAUser'

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
FILE_UPLOAD_PERMISSIONS = 0o644

# Django REST Framework - SIMPLIFIED WORKING VERSION
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
        # Custom renderers for file downloads
        'apps.reports.renderers.PDFRenderer',
        'apps.reports.renderers.DOCXRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}

# Report generation settings
REPORT_SETTINGS = {
    'MAX_IMAGE_SIZE': 5 * 1024 * 1024,  # 5MB per image
    'MAX_IMAGES_PER_REPORT': 20,  # Maximum images per report
    'ALLOWED_IMAGE_TYPES': [
        'image/jpeg', 'image/jpg', 'image/png', 
        'image/gif', 'image/webp', 'image/bmp'
    ],
    'IMAGE_QUALITY': 85,  # JPEG compression quality (1-100)
    'MAX_IMAGE_DIMENSIONS': (2048, 2048),  # Max width/height in pixels
    
    # PDF generation settings
    'DEFAULT_PAGE_MARGINS': {
        'top': 72,    # 1 inch = 72 points
        'bottom': 72,
        'left': 72,
        'right': 72
    },
    'DEFAULT_FONTS': {
        'body': 'Helvetica',
        'heading': 'Helvetica-Bold',
        'body_size': 10,
        'heading_size': 12,
        'title_size': 14
    },
    
    # ERP calculation settings
    'ERP_AUTHORIZED_LIMIT_KW': 10.0,
    'ERP_AUTHORIZED_LIMIT_DBW': 40.0,
    'DEFAULT_ANTENNA_GAIN_DBD': 11.0,
    'DEFAULT_SYSTEM_LOSSES_DB': 1.5,
    
    # Document generation paths
    'TEMPLATE_DIR': BASE_DIR / 'media' / 'templates',
    'GENERATED_REPORTS_DIR': BASE_DIR / 'media' / 'reports' / 'generated',
    'TEMP_DIR': BASE_DIR / 'media' / 'temp',
    
    # Report reference number format
    'REFERENCE_FORMAT': 'CA/FSM/BC/{number:03d} Vol. II',
    
    # Auto-generation settings
    'AUTO_DETECT_VIOLATIONS': True,
    'AUTO_GENERATE_CONCLUSIONS': True,
    'AUTO_GENERATE_RECOMMENDATIONS': True,
}

# Create required directories
for directory in [
    MEDIA_ROOT,
    REPORT_SETTINGS['TEMPLATE_DIR'],
    REPORT_SETTINGS['GENERATED_REPORTS_DIR'],
    REPORT_SETTINGS['TEMP_DIR'],
    BASE_DIR / 'logs'
]:
    os.makedirs(directory, exist_ok=True)

# CORS settings - VERY PERMISSIVE FOR DEVELOPMENT
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://0.0.0.0:3000',
    'https://ca-inspection-system.vercel.app'
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'access-control-allow-origin',
    'access-control-allow-credentials',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# CSRF settings - DISABLED FOR DEVELOPMENT
CSRF_COOKIE_SECURE = False
CSRF_USE_SESSIONS = False
CSRF_COOKIE_HTTPONLY = False
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://0.0.0.0:3000',
]

# Session settings - RELAXED FOR DEVELOPMENT
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_COOKIE_HTTPONLY = False  # Allow JS access
SESSION_COOKIE_SECURE = False  # Don't require HTTPS in development
SESSION_COOKIE_SAMESITE = 'Lax'  # Allow cross-site requests
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Security settings - RELAXED FOR DEVELOPMENT
SECURE_BROWSER_XSS_FILTER = False
SECURE_CONTENT_TYPE_NOSNIFF = False
X_FRAME_OPTIONS = 'SAMEORIGIN'

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'report_formatter': {
            'format': '[REPORTS] {levelname} {asctime} - {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'reports_file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'reports.log',
            'formatter': 'report_formatter',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'apps.reports': {
            'handlers': ['console', 'reports_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Email settings (for development)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Cache settings (for development)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Celery Configuration (optional - for background report generation)
# Uncomment these if you want to use Celery for async report generation
"""
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutes
"""

# Development-specific settings
if DEBUG:
    # Django Debug Toolbar (optional - install with pip install django-debug-toolbar)
    try:
        import debug_toolbar
        INSTALLED_APPS += ['debug_toolbar']
        MIDDLEWARE.insert(1, 'debug_toolbar.middleware.DebugToolbarMiddleware')
        INTERNAL_IPS = ['127.0.0.1', 'localhost']
        
        DEBUG_TOOLBAR_CONFIG = {
            'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
        }
    except ImportError:
        pass
    
    # Additional development settings for reports
    REPORT_SETTINGS.update({
        'DEBUG_MODE': True,
        'SAVE_TEMP_FILES': True,  # Keep temporary files for debugging
        'GENERATE_SAMPLE_DATA': True,  # Allow sample data generation
    })

# Environment-specific overrides
if not DEBUG:
    # Production settings
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    X_FRAME_OPTIONS = 'DENY'
    
    # Use PostgreSQL in production
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME'),
            'USER': config('DB_USER'),
            'PASSWORD': config('DB_PASSWORD'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
            'OPTIONS': {
                'charset': 'utf8',
            },
            'TEST': {
                'NAME': 'test_' + config('DB_NAME', default='ca_inspection'),
            }
        }
    }
    
    # Production report settings
    REPORT_SETTINGS.update({
        'DEBUG_MODE': False,
        'SAVE_TEMP_FILES': False,
        'USE_CDN_FOR_IMAGES': True,  # If you're using a CDN
        'COMPRESS_IMAGES': True,
        'WATERMARK_REPORTS': True,  # Add watermarks in production
    })
    
    # Production logging
    LOGGING['handlers']['file']['filename'] = '/var/log/ca_inspection/django.log'
    LOGGING['handlers']['reports_file']['filename'] = '/var/log/ca_inspection/reports.log'
    
    # Production email settings
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = config('EMAIL_HOST', default='localhost')
    EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
    EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
    DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@ca.go.ke')

# Additional constants for the reports app
INSPECTION_REPORT_CONSTANTS = {
    'ADDRESSEE': {
        'TO': 'D/MIRC',
        'THROUGH': 'PO/NR/MIRC',
    },
    'SIGNATURE_BLOCK': {
        'DESIGNATION': 'AO/MIRC/NR',
        'ORGANIZATION': 'Communications Authority of Kenya',
    },
    'STANDARD_FREQUENCIES': {
        'FM': {'min': 88.0, 'max': 108.0, 'unit': 'MHz'},
        'TV_VHF': {'min': 54.0, 'max': 216.0, 'unit': 'MHz'},
        'TV_UHF': {'min': 470.0, 'max': 862.0, 'unit': 'MHz'},
    },
    'VIOLATION_CATEGORIES': {
        'ERP_VIOLATION': 'Exceeding Authorized ERP Limit',
        'TYPE_APPROVAL_VIOLATION': 'Operating Non-Type Approved Equipment',
        'SAFETY_VIOLATION': 'Safety Compliance Issue',
        'TECHNICAL_VIOLATION': 'Technical Parameter Violation',
    },
    'COMPLIANCE_THRESHOLDS': {
        'TOWER_HEIGHT_AVIATION_WARNING': 60,  # meters
        'MAX_ERP_FM': 10.0,  # kW
        'MAX_ERP_TV': 10.0,  # kW
    }
}