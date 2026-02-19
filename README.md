# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Storage CORS Setup

To fix image loading issues on the live site, run the following command in your terminal to apply the CORS configuration:

```bash
gsutil cors set storage-cors.json gs://sixstars-62cf7.firebasestorage.app
```

*Note: You may need to have the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and be logged in.*
