import os
from pathlib import Path
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production-only')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

# SMART HOST DETECTION - Works everywhere
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS', 
    default='localhost,127.0.0.1,0.0.0.0'
).split(',')

# Auto-detect common deployment platforms
if config('VERCEL', default=False, cast=bool):
    ALLOWED_HOSTS.append('.vercel.app')
if config('HEROKU', default=False, cast=bool):
    ALLOWED_HOSTS.append('.herokuapp.com')
if config('RAILWAY', default=False, cast=bool):
    ALLOWED_HOSTS.append('.railway.app')

# Auto-detect dev tunnels
DEV_TUNNEL_URL = config('DEV_TUNNEL_URL', default='')
if DEV_TUNNEL_URL:
    ALLOWED_HOSTS.append(DEV_TUNNEL_URL)

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
    'apps.reports',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# SMART MIDDLEWARE - Adapts to environment
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Always include for flexibility
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
]

# Add CSRF only in production
if not DEBUG:
    MIDDLEWARE.append('django.middleware.csrf.CsrfViewMiddleware')

MIDDLEWARE.extend([
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
])

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

# SMART DATABASE - Auto-detects environment (FIXED - No extra dependencies)
def parse_database_url(url):
    """Simple DATABASE_URL parser without extra dependencies"""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        
        # Extract components
        engine_map = {
            'postgres': 'django.db.backends.postgresql',
            'postgresql': 'django.db.backends.postgresql',
            'mysql': 'django.db.backends.mysql',
            'sqlite': 'django.db.backends.sqlite3',
        }
        
        return {
            'ENGINE': engine_map.get(parsed.scheme, 'django.db.backends.postgresql'),
            'NAME': parsed.path[1:],  # Remove leading slash
            'USER': parsed.username,
            'PASSWORD': parsed.password,
            'HOST': parsed.hostname,
            'PORT': parsed.port,
        }
    except Exception:
        return None

# Database configuration
database_url = config('DATABASE_URL', default=None)
if database_url:
    # Production: Use DATABASE_URL
    parsed_db = parse_database_url(database_url)
    if parsed_db:
        DATABASES = {'default': parsed_db}
    else:
        # Fallback to SQLite if parsing fails
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
elif config('DB_NAME', default=None):
    # Production: Use individual DB settings
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
else:
    # Development: Use SQLite
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

# SMART STATIC FILES - Works in any environment
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# SMART MEDIA FILES - Works in any environment
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Custom User Model
AUTH_USER_MODEL = 'authentication.CAUser'

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
FILE_UPLOAD_PERMISSIONS = 0o644

# UNIVERSAL REST FRAMEWORK SETTINGS - UPDATED FOR DOCX ONLY
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
        'apps.reports.renderers.DOCXRenderer',  # DOCX ONLY - FIXED
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}

# SMART CORS SETTINGS - Works everywhere
CORS_ALLOW_CREDENTIALS = True

if DEBUG:
    # Development: Allow everything
    CORS_ALLOW_ALL_ORIGINS = True
else:
    # Production: Specific origins
    CORS_ALLOWED_ORIGINS = [
        'https://ca-inspection-system.vercel.app',
        'https://your-domain.com',
    ]
    
    # Add environment-specific origins
    frontend_url = config('FRONTEND_URL', default='')
    if frontend_url:
        CORS_ALLOWED_ORIGINS.append(frontend_url)

# Always allow localhost for development
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
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# SMART SECURITY SETTINGS - Adapts to environment
SECURE_BROWSER_XSS_FILTER = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = not DEBUG
X_FRAME_OPTIONS = 'SAMEORIGIN'

# Production security
if not DEBUG:
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# CSRF settings
CSRF_COOKIE_SECURE = not DEBUG
CSRF_USE_SESSIONS = False
CSRF_COOKIE_HTTPONLY = False

# Build trusted origins dynamically
CSRF_TRUSTED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']
if not DEBUG:
    frontend_url = config('FRONTEND_URL', default='')
    if frontend_url:
        CSRF_TRUSTED_ORIGINS.append(frontend_url)

# Session settings
SESSION_COOKIE_AGE = 86400
SESSION_COOKIE_HTTPONLY = False
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_SAVE_EVERY_REQUEST = True

# SMART EMAIL SETTINGS
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = config('EMAIL_HOST', default='localhost')
    EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
    EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
    DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@ca.go.ke')

# SMART CACHE SETTINGS - No extra dependencies
redis_url = config('REDIS_URL', default=None)
if redis_url and not DEBUG:
    # Production: Use Redis (if available)
    try:
        CACHES = {
            'default': {
                'BACKEND': 'django.core.cache.backends.redis.RedisCache',
                'LOCATION': redis_url,
            }
        }
    except Exception:
        # Fallback to in-memory if Redis import fails
        CACHES = {
            'default': {
                'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                'LOCATION': 'unique-snowflake',
            }
        }
else:
    # Development: Use in-memory cache
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }

# Report generation settings - UNIVERSAL
REPORT_SETTINGS = {
    'MAX_IMAGE_SIZE': 5 * 1024 * 1024,
    'MAX_IMAGES_PER_REPORT': 20,
    'ALLOWED_IMAGE_TYPES': [
        'image/jpeg', 'image/jpg', 'image/png', 
        'image/gif', 'image/webp', 'image/bmp'
    ],
    'IMAGE_QUALITY': 85,
    'MAX_IMAGE_DIMENSIONS': (2048, 2048),
    
    # Document generation paths
    'TEMPLATE_DIR': BASE_DIR / 'media' / 'templates',
    'GENERATED_REPORTS_DIR': BASE_DIR / 'media' / 'reports' / 'generated',
    'TEMP_DIR': BASE_DIR / 'media' / 'temp',
    
    # ERP settings
    'ERP_AUTHORIZED_LIMIT_KW': 10.0,
    'ERP_AUTHORIZED_LIMIT_DBW': 40.0,
    'DEFAULT_ANTENNA_GAIN_DBD': 11.0,
    'DEFAULT_SYSTEM_LOSSES_DB': 1.5,
    
    # Report settings
    'REFERENCE_FORMAT': 'CA/FSM/BC/{number:03d} Vol. II',
    'AUTO_DETECT_VIOLATIONS': True,
    'AUTO_GENERATE_CONCLUSIONS': True,
    'AUTO_GENERATE_RECOMMENDATIONS': True,
    
    # Environment-specific settings
    'DEBUG_MODE': DEBUG,
    'SAVE_TEMP_FILES': DEBUG,
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

# SMART LOGGING - Adapts to environment
log_level = 'DEBUG' if DEBUG else 'INFO'
log_file = BASE_DIR / 'logs' / 'django.log' if DEBUG else '/var/log/ca_inspection/django.log'

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
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': log_file,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': log_level,
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'] if not DEBUG else ['console'],
            'level': log_level,
            'propagate': False,
        },
        'apps.reports': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Development tools - Only in DEBUG mode
if DEBUG:
    try:
        import debug_toolbar
        INSTALLED_APPS += ['debug_toolbar']
        MIDDLEWARE.insert(1, 'debug_toolbar.middleware.DebugToolbarMiddleware')
        INTERNAL_IPS = ['127.0.0.1', 'localhost']
    except ImportError:
        pass

# Constants for the reports app
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
        'TOWER_HEIGHT_AVIATION_WARNING': 60,
        'MAX_ERP_FM': 10.0,
        'MAX_ERP_TV': 10.0,
    }
}

# Print environment info (helpful for debugging)
if DEBUG:
    print(f"🚀 CA Inspection System Starting...")
    print(f"📍 Environment: {'Development' if DEBUG else 'Production'}")
    print(f"🗄️  Database: {DATABASES['default']['ENGINE'].split('.')[-1]}")
    print(f"📦 Cache: {CACHES['default']['BACKEND'].split('.')[-1]}")
    print(f"🌐 Allowed Hosts: {', '.join(ALLOWED_HOSTS)}")
    print(f"📧 Email Backend: {EMAIL_BACKEND.split('.')[-1]}")
    print(f"✅ Ready for DOCX-only report generation!")

# Export settings for external use
__all__ = [
    'BASE_DIR', 'DEBUG', 'DATABASES', 'INSTALLED_APPS', 
    'MIDDLEWARE', 'REST_FRAMEWORK', 'REPORT_SETTINGS'
]