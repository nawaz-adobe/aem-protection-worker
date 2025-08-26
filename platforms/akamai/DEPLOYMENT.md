# 🔺 Akamai EdgeWorkers Deployment Guide

## 📋 Prerequisites

1. **Akamai Account**: Active Akamai Control Center account with EdgeWorkers access
2. **Akamai CLI**: Install the Akamai CLI and EdgeWorkers package
3. **Node.js**: Version 18+ for building the bundle

## 🛠️ Initial Setup

### 1. Install Akamai CLI
```bash
# Install Akamai CLI
npm install -g @akamai/cli

# Install EdgeWorkers package
akamai install edgeworkers
```

### 2. Configure Credentials
```bash
# Configure your Akamai credentials
akamai configure

# Test connectivity
akamai edgeworkers list-groups
```

## 🚀 Deployment Process

### 1. Build the Production Bundle
```bash
# From the akamai directory
npm run build:production
```

This creates:
- `dist/main.js` - The optimized bundle (9.72 KiB)
- Production-ready ES6 module for EdgeWorkers runtime

### 2. Create EdgeWorker on Akamai
```bash
# Create a new EdgeWorker
akamai edgeworkers create-id --bundle bundle-production.json --group-id YOUR_GROUP_ID

# Note the EdgeWorker ID returned (e.g., 12345)
```

### 3. Deploy Using Script (Recommended)
```bash
# Deploy to staging
./deploy-production.sh YOUR_EDGEWORKER_ID staging

# Deploy to production  
./deploy-production.sh YOUR_EDGEWORKER_ID production
```

### 4. Manual Deployment (Alternative)
```bash
# Upload version
akamai edgeworkers upload --bundle bundle-production.json YOUR_EDGEWORKER_ID

# Activate on staging
akamai edgeworkers activate YOUR_EDGEWORKER_ID STAGING --version LATEST

# Activate on production (after testing)
akamai edgeworkers activate YOUR_EDGEWORKER_ID PRODUCTION --version LATEST
```

## ⚙️ Property Configuration

Add the EdgeWorker behavior to your Akamai property:

### 1. In Property Manager
1. Go to Property Manager in Akamai Control Center
2. Edit your property configuration
3. Add a new **EdgeWorker** behavior
4. Set EdgeWorker ID to your created ID
5. Configure the criteria (typically "All Requests")

### 2. Behavior Settings
```json
{
  "name": "edgeWorker",
  "options": {
    "edgeWorkerId": "YOUR_EDGEWORKER_ID",
    "enabled": true
  }
}
```

## ✅ Validation & Testing

### 1. Test Bundle Compatibility
```bash
# Validate production bundle
npm run test:production
```

Expected output:
```
✅ Bundle size: 9.72 KiB (within 20MB limit)
✅ ES6 modules: Detected exports
✅ No Node.js dependencies: Clean
✅ EdgeWorkers APIs: Valid
✅ Performance estimate: ~15ms (under 50ms limit)
✅ Memory estimate: ~8MB (under 32MB limit)
✅ All checks passed! Bundle is production-ready.
```

### 2. Monitor Deployment
```bash
# Check EdgeWorker status
akamai edgeworkers status YOUR_EDGEWORKER_ID

# View logs (if available)
akamai edgeworkers log YOUR_EDGEWORKER_ID
```

## 🔧 Configuration

### Bundle Manifest (`bundle-production.json`)
```json
{
  "edgeworker-version": "1.0",
  "bundle-version": 1,
  "api-version": "0.1",
  "description": "AEM Protection Worker - Production optimized for performance"
}
```

### Key Features Enabled
- ✅ **Page-level protection**: Full page replacement with teasers
- ✅ **Section-level protection**: Selective content hiding  
- ✅ **Block-level protection**: Granular element control
- ✅ **Authentication-aware**: Different content for logged in/out users
- ✅ **Performance optimized**: String operations, minimal memory usage

## 🚨 Troubleshooting

### Common Issues

**1. Bundle too large**
```bash
# Check current size
ls -lh dist/main.js

# Our bundle is only 9.72 KiB, well under 20MB limit
```

**2. ES6 module errors**
```bash
# Verify ES6 exports exist
grep -n "export.*onClientRequest\|export.*responseProvider" dist/main.js
```

**3. Runtime errors**
- Check Akamai logs in Control Center
- Verify EdgeWorker is active on your property
- Ensure property is activated

**4. Authentication not working**
- Current implementation uses mock authentication (always returns false)
- Update `checkAuthentication()` function for your auth method

## 📊 Performance Characteristics

- **Bundle Size**: 9.72 KiB (0.05% of 20MB limit)
- **Memory Usage**: ~8MB (25% of 32MB limit)  
- **Execution Time**: ~15ms (30% of 50ms limit)
- **API Usage**: Only EdgeWorkers native APIs
- **Dependencies**: None (self-contained)

## 🔄 Updates & Maintenance

### Updating the Worker
1. Modify `src/main-production.js`
2. Run `npm run build:production`
3. Deploy with `./deploy-production.sh YOUR_ID staging`
4. Test on staging environment
5. Promote to production

### Monitoring
- Use Akamai Control Center for real-time monitoring
- Set up alerts for EdgeWorker failures
- Monitor performance metrics

---

## 🎯 Next Steps

1. **Deploy to staging** and test with your AEM content
2. **Configure authentication** to match your actual auth system
3. **Monitor performance** and adjust as needed
4. **Deploy to production** once validated

Your EdgeWorker is optimized for Akamai's strict runtime constraints and ready for production deployment! 🚀
