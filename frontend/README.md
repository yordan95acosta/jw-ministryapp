# Ministry Hours Tracker

A mobile app for tracking preaching hours and Bible studies. Works completely offline with local storage.

## Features

- 📅 Calendar view with monthly progress bar
- ⏱️ Track hours and minutes
- 👥 Track Bible studies (unique count per month)
- 🎯 Set monthly goals (15h, 30h, 50h presets or custom)
- 📝 Add notes to entries
- 🔐 PIN-protected profiles
- 📤 Export/Import data for backup
- 📱 Works 100% offline - no internet needed

## Building the Android APK

### Prerequisites

1. Node.js 18+ installed
2. Free Expo account (create at https://expo.dev)

### Steps to Build

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to your Expo account
eas login

# 3. Navigate to the frontend folder
cd frontend

# 4. Configure the project (first time only)
eas build:configure

# 5. Build the APK
eas build --platform android --profile preview
```

### After Build Completes

1. Expo will provide a download link for your APK
2. Download the APK file
3. Transfer to your Android phone (email, Google Drive, etc.)
4. On your phone, open the APK to install
5. You may need to enable "Install from unknown sources" in settings

## Building for iOS (Requires $99/year Apple Developer Account)

```bash
eas build --platform ios --profile preview
```

## Project Structure

```
frontend/
├── app/                    # Screens (expo-router)
│   ├── index.tsx          # Entry redirect
│   ├── login.tsx          # Profile login/create
│   ├── home.tsx           # Main calendar view
│   ├── day/[date].tsx     # Day entries view
│   ├── settings.tsx       # Goal settings
│   ├── history.tsx        # Monthly history
│   ├── export.tsx         # Backup/restore
│   └── profile.tsx        # Profile management
├── src/
│   ├── context/           # React context
│   └── services/          # Local storage service
├── app.json               # Expo configuration
└── eas.json               # EAS Build configuration
```

## Customization

### Change App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

### Change App Icon
Replace these files with your own (1024x1024 PNG recommended):
- `assets/images/icon.png`
- `assets/images/adaptive-icon.png`

### Change Colors
Main colors are defined in each component's StyleSheet:
- Primary: `#e94560` (pink/red)
- Background: `#16213e` (dark blue)
- Card: `#1a1a2e` (darker blue)
- Accent: `#0f3460` (medium blue)

## Data Storage

All data is stored locally on the device using AsyncStorage:
- `@ministry_profiles` - User profiles with hashed PINs
- `@ministry_entries` - Time entries
- `@ministry_goals` - Monthly goals
- `@ministry_current_profile` - Currently logged in profile

## License

MIT License - Feel free to modify and distribute.
