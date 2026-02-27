

## Fix Capacitor App ID

The error occurs because the current `appId` in `capacitor.config.ts` contains a long hexadecimal string, which is not a valid Java package identifier. Android requires the App ID to follow Java package naming conventions (e.g., `com.example.app`).

### Change

Update `capacitor.config.ts` to use a valid App ID:

- **Current**: `app.lovable.4e8b89cfc2f147db89e743b4deaebf54`
- **New**: `com.sersadia.express`

Also update `appName` to the proper display name: `Ser Sadia Express`.

The `server.url` will remain pointing to the production URL so the app works as a WebView.

### After approval

Once you pull the updated code from GitHub, run these commands again:

```
npm install
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

