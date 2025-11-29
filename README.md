# Bengaluru Navigator

This is a Next.js application that visualizes Dijkstra's shortest-path algorithm on a map of Bengaluru.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Deployment

When deploying this application to a hosting provider like Vercel or Firebase Hosting, you will need to set an environment variable for the AI features to work correctly.

### Required Environment Variable

You must add the following environment variable to your hosting provider's project settings:

- **Name**: `GEMINI_API_KEY`
- **Value**: Your actual Gemini API key.

**How to get a Gemini API Key:**

1.  Go to the [Google AI Studio](https://aistudio.google.com/).
2.  Sign in with your Google account.
3.  Click on "Get API key".
4.  Create a new API key in a new or existing project.
5.  Copy the generated key.

**How to add the key to your hosting provider:**

-   **For Firebase App Hosting (used by Firebase Studio):**
    1.  Go to the Google Cloud Console for your Firebase project.
    2.  In the search bar, type "Secret Manager" and select it.
    3.  Click **"Create Secret"**.
    4.  For the **Name**, enter `GEMINI_API_KEY`.
    5.  In the **Secret value** field, paste your copied Gemini API key.
    6.  Click **"Create secret"**.
    7. Your App Hosting backend will automatically have access to this secret as an environment variable.

-   **For Vercel**:
    1. Go to your project's "Settings" tab.
    2. Go to the "Environment Variables" section.
    3. Add a new variable with the **Name** `GEMINI_API_KEY` and paste your key as the **Value**.
    4. Ensure it is available for the "Production" environment.
    5. Save the changes.

After setting the environment variable, you will need to **re-deploy** your application for the changes to take effect. If you do not set this variable, the AI feature for styling the route will fail, and you will see an "AI Feature Offline" message.