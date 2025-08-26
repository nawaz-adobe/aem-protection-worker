#!/bin/bash

# AEM Protection Worker - Production Akamai EdgeWorkers Deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BUNDLE_NAME="aem-protection-worker-production.tgz"
EDGEWORKER_NAME="AEM Protection Worker Production"
EDGEWORKER_DESCRIPTION="Production-optimized AEM content protection with authentication awareness"

echo -e "${BLUE}🔺 AEM Protection Worker - Production Deployment${NC}"
echo "================================================="

# Check if EdgeWorker ID is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <edgeworker-id> [staging|production]${NC}"
    echo "Example: $0 12345 staging"
    echo ""
    echo "To create a new EdgeWorker ID:"
    echo "akamai edgeworkers create-id --name \"$EDGEWORKER_NAME\" --description \"$EDGEWORKER_DESCRIPTION\""
    exit 1
fi

EDGEWORKER_ID=$1
NETWORK=${2:-staging}

echo -e "${BLUE}EdgeWorker ID:${NC} $EDGEWORKER_ID"
echo -e "${BLUE}Target Network:${NC} $NETWORK"
echo -e "${BLUE}Bundle Type:${NC} Production Optimized"
echo ""

# Step 1: Run production tests
echo -e "${YELLOW}🧪 Running production tests...${NC}"
if npm run test:production; then
    echo -e "${GREEN}✅ Production tests passed${NC}"
else
    echo -e "${RED}❌ Production tests failed - check issues before deploying${NC}"
    exit 1
fi

# Step 2: Build production bundle
echo -e "${YELLOW}📦 Building production EdgeWorkers bundle...${NC}"
npm run build:production

# Verify the bundle was created
if [ ! -f "dist/main.js" ]; then
    echo -e "${RED}❌ Production bundle not created${NC}"
    exit 1
fi

# Step 3: Create deployment package with production bundle config
echo -e "${YELLOW}📋 Creating production deployment package...${NC}"
cd dist/
tar -czf ../$BUNDLE_NAME main.js ../bundle-production.json
cd ..

# Check bundle size
BUNDLE_SIZE=$(du -h $BUNDLE_NAME | cut -f1)
echo -e "${GREEN}✅ Production bundle created: $BUNDLE_NAME ($BUNDLE_SIZE)${NC}"

# Verify bundle size is reasonable
BUNDLE_SIZE_BYTES=$(stat -f%z $BUNDLE_NAME 2>/dev/null || stat -c%s $BUNDLE_NAME)
BUNDLE_SIZE_MB=$((BUNDLE_SIZE_BYTES / 1024 / 1024))

if [ $BUNDLE_SIZE_MB -gt 20 ]; then
    echo -e "${RED}❌ Bundle size ($BUNDLE_SIZE_MB MB) exceeds Akamai limit (20MB)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Bundle size ($BUNDLE_SIZE_MB MB) within Akamai limits${NC}"

# Step 4: Upload to Akamai
echo -e "${YELLOW}☁️ Uploading production bundle to Akamai EdgeWorkers...${NC}"
if akamai edgeworkers upload --bundle $BUNDLE_NAME --id $EDGEWORKER_ID; then
    echo -e "${GREEN}✅ Upload successful${NC}"
else
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

# Step 5: Get the latest version
echo -e "${YELLOW}🔍 Getting latest version...${NC}"
VERSION=$(akamai edgeworkers list-versions --id $EDGEWORKER_ID --json | jq -r '.[0].version' 2>/dev/null || echo "unknown")
echo -e "${BLUE}Latest version:${NC} $VERSION"

# Step 6: Activate
echo -e "${YELLOW}🚀 Activating production bundle on $NETWORK network...${NC}"
if akamai edgeworkers activate --id $EDGEWORKER_ID --version $VERSION --network $NETWORK; then
    echo -e "${GREEN}✅ Activation successful${NC}"
else
    echo -e "${RED}❌ Activation failed${NC}"
    exit 1
fi

# Step 7: Show deployment summary
echo ""
echo -e "${GREEN}🎉 Production Deployment Complete!${NC}"
echo "======================================"
echo -e "${BLUE}EdgeWorker ID:${NC} $EDGEWORKER_ID"
echo -e "${BLUE}Version:${NC} $VERSION"
echo -e "${BLUE}Network:${NC} $NETWORK"
echo -e "${BLUE}Bundle Type:${NC} Production Optimized"
echo -e "${BLUE}Bundle Size:${NC} $BUNDLE_SIZE"
echo ""

# Step 8: Show testing commands
echo -e "${YELLOW}🧪 Production Testing Commands:${NC}"
echo "1. Basic functionality test:"
echo "   curl -H 'Pragma: akamai-x-ew-debug' https://your-domain.com/education"
echo ""
echo "2. Performance test:"
echo "   curl -H 'Pragma: akamai-x-cache-on' https://your-domain.com/education"
echo ""
echo "3. Protection bypass test:"
echo "   curl -H 'Pragma: akamai-x-ew-debug' https://your-domain.com/fragments/test"
echo ""
echo "4. Monitor real-time logs:"
echo "   akamai edgeworkers logs --id $EDGEWORKER_ID --tail"
echo ""

# Step 9: Show monitoring commands
echo -e "${YELLOW}📊 Production Monitoring:${NC}"
echo "1. Check execution performance:"
echo "   akamai edgeworkers logs --id $EDGEWORKER_ID --download"
echo ""
echo "2. Monitor error rates in Akamai Control Center"
echo "3. Watch for performance alerts (>50ms execution time)"
echo "4. Monitor memory usage alerts (>32MB)"
echo ""

# Cleanup
rm $BUNDLE_NAME
echo -e "${GREEN}🧹 Cleaned up temporary files${NC}"

echo -e "${GREEN}✨ Production EdgeWorker is live and ready!${NC}"
echo ""
echo -e "${BLUE}🎯 Expected Performance:${NC}"
echo "• Execution time: <10ms for unprotected pages"
echo "• Execution time: <50ms for protected pages"
echo "• Memory usage: <5MB typical, <32MB maximum"
echo "• Error rate: <1%"
echo ""
echo -e "${YELLOW}💡 If you see issues, check the logs and consider:${NC}"
echo "• Increasing cache TTL for unprotected content"
echo "• Optimizing regex patterns for large pages"
echo "• Adding more specific bypass paths"
