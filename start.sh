#!/bin/bash

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e " Hungarian Inventory & Bookkeeping App"
echo -e "========================================${NC}"
echo ""

echo -e "${YELLOW}Starting the application...${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Start the development server
echo -e "${GREEN}Opening the application in your browser...${NC}"
echo ""
echo -e "${BLUE}The application will be available at: http://localhost:5173${NC}"
echo ""
echo -e "${RED}To stop the application, press Ctrl+C in this terminal${NC}"
echo ""

npm run dev