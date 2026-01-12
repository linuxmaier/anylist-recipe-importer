# Project: AnyList Recipe Importer

## Overview
A web-based tool to digitize physical recipe books and import them into AnyList. It allows family members to upload photos of recipes, which are then processed by AI to extract data, crop photos, and automatically populate AnyList.

## User Goals
- **Easy Input:** Upload photos from mobile devices.
- **AI Processing:**
    - Transcribe text from images.
    - Normalize text (Title Case, formatting fractions).
    - Extract fields: Title, Ingredients, Instructions, Cook Time, Notes/Substitutions.
    - Categorize recipes automatically.
- **Image Handling:**
    - Intelligently crop the final dish photo from the recipe page.
    - Enhance image (remove glare/artifacts).
- **AnyList Sync:** Automate entry creation.

## Technical Requirements
- **Platform:** Web Application (Mobile-responsive).
- **Input:** Image Upload / Camera capture.
- **AI Model:** Gemini API (Multimodal: Image -> JSON). Start with Free Tier.
- **Image Processing:** Crop and enhance user-uploaded photos.
- **Integration:** Unofficial AnyList API or Browser Automation (Selenium/Playwright).

## Architecture Decisions
- **Frontend:** Web interface (React/Next.js or simple HTML/HTMX).
- **Backend:** Python (FastAPI/Flask) - chosen for strong AI/Image processing libraries.
- **Database:** (Optional) Simple SQLite to track queue/history if needed.
- **Authentication:** Needed for the Web App? (Maybe simple passkey for family).

## Research Items
- [ ] AnyList unofficial API availability.
- [ ] Gemini API Free tier limits and capabilities.
- [ ] Image enhancement libraries (OpenCV).