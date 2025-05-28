#!/bin/bash

# Backend API Testing Script
# Tests your Django backend endpoints

API_URL="http://127.0.0.1:8000/api"
USERNAME="admin"
PASSWORD="admin123"

echo "🚀 Testing Django Backend API..."
echo "================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Test 1: Check if server is running
echo "Test 1: Checking if Django server is running..."
if curl -s --connect-timeout 5 "$API_URL/" > /dev/null 2>&1; then
    print_success "Django server is running at $API_URL"
else
    print_error "Django server is not responding at $API_URL"
    echo "Make sure you've started your Django server with: python manage.py runserver"
    exit 1
fi
echo

# Test 2: Login and get token
echo "Test 2: Testing authentication..."
print_info "Attempting login with username: $USERNAME"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login/" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
    -w "HTTPSTATUS:%{http_code}")

HTTP_CODE=$(echo $LOGIN_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
LOGIN_BODY=$(echo $LOGIN_RESPONSE | sed -E 's/HTTPSTATUS:[0-9]*$//')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Login successful!"
    TOKEN=$(echo $LOGIN_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', 'NOT_FOUND'))" 2>/dev/null)
    
    if [ "$TOKEN" != "NOT_FOUND" ] && [ "$TOKEN" != "" ]; then
        print_success "Token received: ${TOKEN:0:10}..."
    else
        print_warning "Login succeeded but no token found in response"
        echo "Response: $LOGIN_BODY"
        TOKEN=""
    fi
else
    print_error "Login failed with HTTP code: $HTTP_CODE"
    echo "Response: $LOGIN_BODY"
    exit 1
fi
echo

# Test 3: Test authenticated endpoint (current user)
if [ "$TOKEN" != "" ]; then
    echo "Test 3: Testing authenticated endpoint..."
    print_info "Getting current user info..."
    
    USER_RESPONSE=$(curl -s -X GET "$API_URL/auth/me/" \
        -H "Authorization: Token $TOKEN" \
        -H "Content-Type: application/json" \
        -w "HTTPSTATUS:%{http_code}")
    
    HTTP_CODE=$(echo $USER_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    USER_BODY=$(echo $USER_RESPONSE | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Authenticated endpoint working!"
        echo "User info: $USER_BODY"
    else
        print_error "Authenticated endpoint failed with HTTP code: $HTTP_CODE"
        echo "Response: $USER_BODY"
    fi
    echo
fi

# Test 4: Test inspections endpoint
echo "Test 4: Testing inspections endpoint..."
print_info "Getting inspections list..."

INSPECTIONS_RESPONSE=$(curl -s -X GET "$API_URL/inspections/inspections/" \
    -H "Authorization: Token $TOKEN" \
    -H "Content-Type: application/json" \
    -w "HTTPSTATUS:%{http_code}")

HTTP_CODE=$(echo $INSPECTIONS_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
INSPECTIONS_BODY=$(echo $INSPECTIONS_RESPONSE | sed -E 's/HTTPSTATUS:[0-9]*$//')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Inspections endpoint working!"
    
    # Try to extract inspection count and first ID
    INSPECTION_COUNT=$(echo $INSPECTIONS_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('results', data)) if isinstance(data.get('results', data), list) else 'unknown')" 2>/dev/null)
    FIRST_INSPECTION_ID=$(echo $INSPECTIONS_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); results=data.get('results', data); print(results[0]['id'] if isinstance(results, list) and len(results) > 0 else 'none')" 2>/dev/null)
    
    echo "Found $INSPECTION_COUNT inspections"
    if [ "$FIRST_INSPECTION_ID" != "none" ] && [ "$FIRST_INSPECTION_ID" != "" ]; then
        echo "First inspection ID: $FIRST_INSPECTION_ID"
        
        # Test 5: Test specific inspection endpoint
        echo
        echo "Test 5: Testing specific inspection endpoint..."
        print_info "Getting inspection ID: $FIRST_INSPECTION_ID"
        
        INSPECTION_RESPONSE=$(curl -s -X GET "$API_URL/inspections/inspections/$FIRST_INSPECTION_ID/" \
            -H "Authorization: Token $TOKEN" \
            -H "Content-Type: application/json" \
            -w "HTTPSTATUS:%{http_code}")
        
        HTTP_CODE=$(echo $INSPECTION_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        INSPECTION_BODY=$(echo $INSPECTION_RESPONSE | sed -E 's/HTTPSTATUS:[0-9]*$//')
        
        if [ "$HTTP_CODE" = "200" ]; then
            print_success "Specific inspection endpoint working!"
        else
            print_error "Specific inspection endpoint failed with HTTP code: $HTTP_CODE"
            echo "Response: $INSPECTION_BODY"
        fi
        
        # Test 6: Test create report from inspection
        echo
        echo "Test 6: Testing create report from inspection..."
        print_info "Creating report from inspection ID: $FIRST_INSPECTION_ID"
        
        CREATE_REPORT_RESPONSE=$(curl -s -X POST "$API_URL/reports/create-from-inspection/$FIRST_INSPECTION_ID/" \
            -H "Authorization: Token $TOKEN" \
            -H "Content-Type: application/json" \
            -w "HTTPSTATUS:%{http_code}")
        
        HTTP_CODE=$(echo $CREATE_REPORT_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        CREATE_REPORT_BODY=$(echo $CREATE_REPORT_RESPONSE | sed -E 's/HTTPSTATUS:[0-9]*$//')
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
            print_success "Create report endpoint working!"
            echo "Response: $CREATE_REPORT_BODY"
        else
            print_error "Create report endpoint failed with HTTP code: $HTTP_CODE"
            echo "Response: $CREATE_REPORT_BODY"
        fi
    else
        print_warning "No inspections found to test specific endpoints"
    fi
else
    print_error "Inspections endpoint failed with HTTP code: $HTTP_CODE"
    echo "Response: $INSPECTIONS_BODY"
fi
echo

# Test 7: Test reports endpoint
echo "Test 7: Testing reports endpoint..."
print_info "Getting reports list..."

REPORTS_RESPONSE=$(curl -s -X GET "$API_URL/reports/reports/" \
    -H "Authorization: Token $TOKEN" \
    -H "Content-Type: application/json" \
    -w "HTTPSTATUS:%{http_code}")

HTTP_CODE=$(echo $REPORTS_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
REPORTS_BODY=$(echo $REPORTS_RESPONSE | sed -E 's/HTTPSTATUS:[0-9]*$//')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Reports endpoint working!"
    
    REPORT_COUNT=$(echo $REPORTS_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('results', data)) if isinstance(data.get('results', data), list) else 'unknown')" 2>/dev/null)
    echo "Found $REPORT_COUNT reports"
else
    print_error "Reports endpoint failed with HTTP code: $HTTP_CODE"
    echo "Response: $REPORTS_BODY"
fi
echo

# Test 8: Test broadcasters endpoint
echo "Test 8: Testing broadcasters endpoint..."
print_info "Getting broadcasters list..."

BROADCASTERS_RESPONSE=$(curl -s -X GET "$API_URL/broadcasters/broadcasters/" \
    -H "Authorization: Token $TOKEN" \
    -H "Content-Type: application/json" \
    -w "HTTPSTATUS:%{http_code}")

HTTP_CODE=$(echo $BROADCASTERS_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
BROADCASTERS_BODY=$(echo $BROADCASTERS_RESPONSE | sed -E 's/HTTPSTATUS:[0-9]*$//')

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Broadcasters endpoint working!"
    
    BROADCASTER_COUNT=$(echo $BROADCASTERS_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('results', data)) if isinstance(data.get('results', data), list) else 'unknown')" 2>/dev/null)
    echo "Found $BROADCASTER_COUNT broadcasters"
else
    print_error "Broadcasters endpoint failed with HTTP code: $HTTP_CODE"
    echo "Response: $BROADCASTERS_BODY"
fi
echo

# Summary
echo "================================="
echo "🏁 Backend Testing Complete!"
echo "================================="

if [ "$TOKEN" != "" ]; then
    print_success "Authentication: Working"
else
    print_error "Authentication: Failed"
fi

echo
print_info "If any tests failed, check:"
echo "1. Django server is running: python manage.py runserver"
echo "2. Database migrations: python manage.py migrate"
echo "3. User credentials are correct"
echo "4. All required Django apps are installed"
echo "5. CORS settings allow your requests"

