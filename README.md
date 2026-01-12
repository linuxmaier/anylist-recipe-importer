# AnyList Recipe Importer

A "smart" recipe digitizer that uses AI to convert photos of physical cookbooks into digital recipes in your AnyList account.

## Overview

This project solves the friction of manually typing recipes into AnyList.
1.  **Snap a photo** of a recipe book page.
2.  **AI (Google Gemini)** extracts the title, ingredients, and instructions, automatically formatting fractions (e.g., "1/2") and fixing text case.
3.  **The Backend** pushes the structured recipe directly to your AnyList account via an unofficial API.
4.  **The User** manually attaches the photo in AnyList (due to API limitations).

## Project Structure

This is a containerized full-stack application.

- **`frontend/`**: A React application (Vite + TypeScript) for taking/uploading photos and reviewing the extracted recipe data.
- **`backend/`**: A Node.js (Express) API that handles:
    - Image uploads.
    - Interfacing with the Gemini API for OCR and text extraction.
    - Logging into AnyList and creating recipes.
- **`docker-compose.yml`**: Orchestrates the frontend and backend for easy local development.

## Getting Started

### Prerequisites
- Docker & Docker Compose (Recommended)
- **OR** Node.js v18+ (for running locally without Docker)
- An AnyList account
- A Google Gemini API Key (Free tier available at [Google AI Studio](https://aistudio.google.com/))

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repo-url>
    cd anylist-import
    ```

2.  **Configure Secrets:**
    Create a `.env` file in the `backend/` directory:
    ```bash
    cp backend/.env.example backend/.env
    ```
    Edit `backend/.env` and add your credentials:
    ```env
    ANYLIST_EMAIL=your_email@example.com
    ANYLIST_PASSWORD=your_password
    GEMINI_API_KEY=your_gemini_key
    ```

### Running Locally (Docker) - Recommended

1.  Start the application:
    ```bash
    docker-compose up --build
    ```
2.  Open your browser:
    - **Frontend:** http://localhost:5173
    - **Backend API:** http://localhost:3001

### Running Locally (Manual)

**Backend:**
1.  Navigate to the backend: `cd backend`
2.  Install dependencies: `npm install`
3.  Start the server: `node server.js`
4.  Server runs at `http://localhost:3001`

**Frontend:**
1.  Navigate to the frontend: `cd frontend`
2.  Install dependencies: `npm install`
3.  Start the dev server: `npm run dev`
4.  App runs at `http://localhost:5173`

## Development Notes
- **Security:** Never commit your `.env` file.
- **AnyList API:** The API is unofficial. If AnyList changes their backend, this tool may break.
- **Cloud Deployment:** For AWS, use Systems Manager (SSM) Parameter Store for secrets instead of `.env` files.
