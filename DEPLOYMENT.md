# Fruitbox Deployment Guide

## Vercel Deployment (Frontend Only)

This project is configured to deploy the frontend as a static site on Vercel.

### Quick Deploy Steps:

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

2. **Build Configuration**
   - Build Command: `vite build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

3. **Environment Variables** (Optional - only needed for full-stack deployment)
   - DATABASE_URL
   - INTERAKT_API_KEY
   - INTERAKT_BUSINESS_NUMBER
   - SESSION_SECRET

### Configuration Files:

- `vercel.json` - Deployment configuration
- `.vercelignore` - Files to exclude from deployment
- `dist/public/` - Built frontend files

### What Gets Deployed:

✅ React frontend with all pages
✅ Landing page with proper routing
✅ Responsive design and UI components
✅ SEO optimization with meta tags

❌ Backend API (requires separate deployment)
❌ Database functionality
❌ WhatsApp integration

### Frontend-Only Features:

- Complete landing page experience
- Authentication UI (visual only)
- Dashboard mockups and layouts
- Responsive design across all devices
- Professional branding and styling

### For Full-Stack Deployment:

To deploy the complete application with backend functionality, consider:
- Railway.app
- Render.com
- Heroku
- DigitalOcean App Platform

These platforms support Node.js applications with PostgreSQL databases.

### Troubleshooting:

If you see raw JavaScript code instead of the website:
1. Check that `vercel.json` is properly configured
2. Ensure `dist/public` contains `index.html`
3. Verify the build command completes successfully
4. Clear Vercel's cache and redeploy

### Local Testing:

```bash
npm run build
npx serve dist/public
```

This will serve the built frontend locally for testing.