# Task Progress: Fix "2البيقونية.pdf" File Access Error

## Issue Analysis
The error message indicates that the file "2البيقونية.pdf" cannot be accessed before payment. This happens in `lib/checkout-readiness.ts` when `verifyFileReachable()` tries to read the file from Cloudinary or local storage.

## Root Cause
The file URL stored in the database for "2البيقونية.pdf" is either:
1. A local path (`/private-uploads/...`) that doesn't work on Vercel (ephemeral filesystem)
2. A Cloudinary URL that returns 404 (file doesn't exist in Cloudinary)

## Solution Implemented
- [x] Created a diagnostic API endpoint at `/api/admin/diagnose-files` that:
  - Lists all product files with their URLs
  - Checks if each file is reachable (Cloudinary or local)
  - Allows verifying file accessibility
  - Allows re-uploading missing files to Cloudinary
- [x] Added a "تشخيص الملفات" (File Diagnostics) tab to the admin dashboard
- [x] The tab displays a table with file information including:
  - File name and URL
  - Product it belongs to
  - MIME type and size
  - Storage type (Cloudinary vs Local)
  - Reachability status
  - Actions to verify or re-upload to Cloudinary
- [x] Build completed successfully

## Files Created/Modified
1. `app/api/admin/diagnose-files/route.ts` - New API endpoint for file diagnostics
2. `components/admin-dashboard.tsx` - Added DiagnoseFilesTab component and tab

## How to Fix the Issue
1. Access the admin dashboard
2. Go to the "تشخيص الملفات" (File Diagnostics) tab
3. Click "تحديث القائمة" to load all files
4. Find the file "2البيقونية.pdf" in the list
5. If it shows "محلي" (Local) storage and "غير قابل للوصول" (Not reachable):
   - Click "رفع لـ Cloudinary" to re-upload it to Cloudinary
6. If it shows "Cloudinary" but "غير قابل للوصول":
   - Click "تحقق" to verify - if still not reachable, the file may have been deleted from Cloudinary and needs to be re-uploaded from local backup

## Next Steps
- Deploy to Vercel and ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set in Vercel environment variables
- Use the diagnostics tab to fix any unreachable files
- The checkout readiness validation will then pass for all products