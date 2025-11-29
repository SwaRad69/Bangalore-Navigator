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

-   **For Vercel**: Go to your project's "Settings" tab, then "Environment Variables", and add `GEMINI_API_KEY` with the value you copied.
-   **For Firebase Hosting**: If you are using a Cloud Run backend with App Hosting, you can set secrets using the Google Cloud Secret Manager and expose them to your application. The name of the secret should be `GEMINI_API_KEY`.

After setting the environment variable, you will need to **re-deploy** your application for the changes to take effect. If you do not set this variable, the AI feature for styling the route will fail, and you will see an "AI Feature Offline" message.
