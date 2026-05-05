# Firebase Firestore Setup Guide for SolarTrack

## Overview

Your SolarTrack application is now configured to save all data to Firebase Firestore. This allows:
- **Data persistence** across browser sessions
- **Public data visibility** - anyone with the link can view data
- **Real-time sync** - all changes are saved to the database instantly
- **Multi-profile support** - organize data by profiles (different houses, users, etc.)

## Database Structure

The app uses the following Firestore collections:

```
solartrack-89d95 (Project)
├── daily_entries/{profile_name}/{date} → {date, kWh}
├── billing_cycles/{profile_name}/{id} → {month, startDate, endDate, actualGridKWh, appliedRateId}
├── municipal_rates/{profile_name}/{id} → {tier, maxKWh, ratePerKWh, startDate, endDate}
```

### Collection Details

1. **daily_entries/{profile}** - Daily solar generation data
   - Document ID: Date (YYYY-MM-DD)
   - Fields: `date`, `kWh`

2. **billing_cycles/{profile}** - Billing period definitions
   - Document ID: Unique ID
   - Fields: `month`, `startDate`, `endDate`, `actualGridKWh`, `appliedRateId`

3. **municipal_rates/{profile}** - Electricity rate tiers
   - Document ID: Unique ID
   - Fields: `tier`, `maxKWh`, `ratePerKWh`, `startDate`, `endDate`

## Firestore Security Rules

To allow **public read/write access** to all data, use these security rules:

1. Go to your [Firebase Console](https://console.firebase.google.com)
2. Select your project: **solartrack-89d95**
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the default rules with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read/write access to all collections
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish**

### Security Note

These rules allow **anyone** to read and write all data. This is appropriate for:
- Demo/testing applications
- Public shared data (solar generation tracking for a household/community)
- Applications where authentication isn't needed

If you want to add authentication later, modify the rules to:
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## How It Works

### Data Flow

1. **Loading Data**: When you select a profile, the app fetches all data from Firestore
2. **Saving Data**: When you add/edit/delete entries, billing cycles, or rates, changes are:
   - Immediately updated in the app UI
   - Saved to Firestore in the background
   - Also saved to localStorage as a backup (for offline access)
3. **Fallback**: If Firestore is unavailable, the app falls back to localStorage

### Features

- ✅ Multiple profiles (e.g., "Main House", "Cabin", "Community Solar")
- ✅ Real-time persistence across browser tabs
- ✅ Shared data - anyone with the link can view/edit
- ✅ Offline support via localStorage
- ✅ Import/Export functionality (CSV files)

## Environment Variables

The Firebase config is already embedded in `client/lib/firebase.ts`:
- API Key: `AIzaSyBkpGRtmi2C8ENe8laueLN5UvZ887nMldk`
- Project ID: `solartrack-89d95`
- Auth Domain: `solartrack-89d95.firebaseapp.com`

No additional environment variables are needed.

## Troubleshooting

### Data not saving to Firestore?
1. Check browser console for errors (F12 → Console tab)
2. Verify Firestore security rules allow read/write
3. Ensure you have internet connection
4. Check that your Firebase project is active in the console

### Can't see data when sharing the app?
1. Make sure Firestore rules are set to `allow read, write: if true;`
2. Share the full app URL (e.g., https://your-domain.com/)
3. Each user should see the same data in real-time

### Want to reset all data?
1. Go to Firebase Console → Firestore Database
2. Select each collection and delete all documents
3. Or contact support for a database reset

## Next Steps

1. ✅ Firebase config is set up in `client/lib/firebase.ts`
2. ⚠️ **You must configure Firestore security rules** (see above)
3. Deploy your app to make it accessible via web link
4. Share the URL with others - they'll see all the data!

## API Integration

The app uses these Firebase functions from `client/lib/firebase.ts`:

- `getDocuments(collectionName)` - Fetch all documents
- `setDocument(collectionName, docId, data)` - Save a document
- `deleteDocument(collectionName, docId)` - Delete a document
- `batchWriteDocuments(collectionName, documents)` - Save multiple documents at once
- `subscribeToCollection(collectionName, callback)` - Real-time listener (prepared for future use)

All functions include error handling and fallback to localStorage.
