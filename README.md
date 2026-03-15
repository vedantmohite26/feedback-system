# Feedback & Polling System

A premium, modern Feedback Portal featuring a stunning neumorphic design and secure real-time interactions. Built with Firebase and Vanilla JavaScript.

## ✨ Features

- **Premium Neumorphic UI**: A cohesive, modern design system using soft shadows and vibrant gradients for a high-end feel.
- **Real-time Feedback**: Users can submit feedback and vote on polls with instantaneous updates.
- **Admin Dashboard**: Comprehensive management interface for tracking issues and managing polling data.
- **Secure Architecture**: API keys are protected using environment variables to prevent exposure on GitHub.
- **Offline Persistence**: Powered by Cloud Firestore for reliability even in poor network conditions.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [Firebase CLI](https://firebase.google.com/docs/cli)

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd feedback-system
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Firebase credentials:
   ```env
   FIREBASE_API_KEY=your_key
   FIREBASE_AUTH_DOMAIN=your_domain
   FIREBASE_PROJECT_ID=your_id
   FIREBASE_STORAGE_BUCKET=your_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_id
   FIREBASE_APP_ID=your_id
   FIREBASE_MEASUREMENT_ID=your_id
   ```

3. **Initialize the Project**:
   ```bash
   npm install
   npm run setup-env
   ```
   *This script injects your credentials into the frontend configuration securely.*

### Running Locally

You can use any local web server to serve the `frontend` directory. For example, using VS Code's "Live Server" extension or:
```bash
npx serve frontend
```

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS (Neumorphic Design), JavaScript (ES6+)
- **Backend**: Firebase Authentication, Cloud Firestore
- **Hosting**: Firebase Hosting
- **Security**: custom `.env` injection system for credential management

## 📦 Deployment

To deploy the latest version to Firebase Hosting:
```bash
npm run deploy
```
*This command automatically runs the credential injection before triggering the Firebase deploy.*

## 📁 Project Structure

```text
├── frontend/
│   ├── css/            # Custom Neumorphic design system
│   ├── js/             # Application logic and Firebase config
│   └── *.html          # Responsive client-side views
├── inject-env.js       # Secure credential management script
├── package.json        # Project scripts and dependencies
├── .env                # Local secrets (ignored by Git)
└── .gitignore          # Protected files configuration
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
