# AnyList Recipe Importer

A "smart" recipe digitizer that uses AI to convert photos of physical cookbooks into digital recipes in your AnyList account.

## Overview

This project solves the friction of manually typing recipes into AnyList. The process is simple:

1.  **Login** to the app using a shared family password.
2.  **Snap a photo** of a recipe book page using your phone.
3.  **AI (Google Gemini)** analyzes the image and extracts the recipe's title, ingredients, instructions, and more.
4.  **Review and Edit** the extracted text in a simple user interface.
5.  **Save to AnyList**, and the app automatically creates the new recipe in the collection you choose.

Because the AnyList API does not support photo uploads, you must still manually attach the recipe photo within the AnyList app if desired.

## Key Technologies

-   **Frontend:** React (Vite), TypeScript, Lucide React
-   **Backend:** Node.js, Express
-   **AI Processing:** Google Gemini
-   **AnyList Integration:** Unofficial `anylist` Node.js library
-   **Authentication:** JWT (JSON Web Tokens) with a shared password and rate limiting.

## Setup and Configuration

This guide covers running the application locally without Docker.

### Prerequisites

-   Node.js (v18 or newer)
-   An AnyList account
-   A Google Gemini API Key (Get one from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository

Clone the project to your local machine:
```bash
git clone <repo-url>
cd <repo-directory>
```

### 2. Configure the Backend

The backend server requires several secret keys and credentials to function.

1.  Navigate to the `backend` directory: `cd backend`
2.  Copy the example environment file: `cp .env.example .env`
3.  Edit the new `.env` file and provide values for the following variables:

| Variable | Description |
| :--- | :--- |
| `ANYLIST_EMAIL` | The email address for your AnyList account. |
| `ANYLIST_PASSWORD` | The password for your AnyList account. |
| `GEMINI_API_KEY` | Your API key from Google AI Studio. |
| `SHARED_PASSWORD` | A password you create that family members will use to log into this app. |
| `JWT_SECRET` | A long, random string used to secure login sessions. You can generate one easily online. |
| `PORT` | The port for the backend server. Defaults to `3001`. |

## Running for Local Development

You will need to run two separate processes in two separate terminal windows.

### Terminal 1: Start the Backend

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the server
node server.js
```
The backend API will be running at `http://localhost:3001`.

### Terminal 2: Start the Frontend

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will be running at `http://localhost:5173`. You can now access the app from your browser.

## How to Use the App

1.  **Login:** Open `http://localhost:5173` in your browser. You'll be prompted to enter the `SHARED_PASSWORD` you configured.
2.  **Upload:** Once logged in, you'll see the main screen. Click the "Snap or Upload a Recipe" area to either take a photo with your device's camera or select an existing image file.
3.  **Review:** After the AI processes the image, you'll be taken to a review screen. Here you can edit the extracted recipe title, ingredients, and instructions. You can also select which AnyList collection to save the recipe to from a dropdown menu.
4.  **Save:** Once you're happy with the recipe, click "Save to AnyList". The recipe will be created in your account under the collection you specified.

## Testing on a Mobile Device

To test the app on a phone on the same Wi-Fi network:

1.  **Find your computer's local IP address** (e.g., `192.168.1.100`).
2.  **Create a file** in the `frontend` directory named `.env.development.local`.
3.  **Add the following line** to that file, replacing `<YOUR_COMPUTER_IP>` with your actual IP:
    ```
    VITE_API_URL=http://<YOUR_COMPUTER_IP>:3001
    ```
4.  **Start the backend server** as usual.
5.  **Start the frontend server with the `--host` flag:**
    ```bash
    cd frontend
    npm run dev -- --host
    ```
6.  **Access the app** on your mobile browser by navigating to `http://<YOUR_COMPUTER_IP>:5173`.