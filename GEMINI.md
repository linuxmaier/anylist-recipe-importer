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
- **Image Processing:** Sharp (Node.js) to crop/resize user-uploaded photos.
- **Integration:** Unofficial Node.js AnyList API (`anylist`).

## Architecture Decisions
- **Frontend:** Web interface (React + Vite + TypeScript + Lucide React for icons).
- **Backend:** Node.js (Express) - chosen for stable AnyList integration.
- **Database:** (Optional) Simple JSON file or SQLite for queue/history.
- **Authentication:** Needed for the Web App? (Maybe simple passkey for family).
- **Recipe Import Strategy:** "Hybrid" approach. The app creates the recipe via API with all text data. The user manually adds the photo via the AnyList app/web interface (since the API doesn't support photo uploads).

## Research Items
- [x] AnyList unofficial API availability (Node.js library `anylist` is stable).
- [x] Gemini API: Using `gemini-2.5-flash` for high-performance extraction.
- [ ] Image enhancement libraries (Sharp for Node.js).
- [x] Security: Use `.env` for local secrets, AWS SSM Parameter Store for cloud production.
- [x] Vulnerability Analysis: `tough-cookie` (GHSA-72xf-g2v4-qvf3) is flagged in `anylist` dependency, but analysis confirms we are NOT vulnerable because the library does not use `CookieJar` or cookies for authentication (uses Bearer tokens).

## Current Issues / Work-in-Progress
- **Model Selection:** Settled on `gemini-2.5-flash` as it provides successful extraction and reasoning capabilities.
- **AnyList Persistence:** Fixed a bug where recipes weren't showing in the UI by manually setting the `uid` and adding recipes to the "All Recipes" collection.
- **Frontend Refinement:** Finalizing the React UI and fixing TypeScript build errors.

## Next Steps
1.  Verify end-to-end flow from the browser.
2.  Add image cropping/enhancement using Sharp.
3.  Add family authentication (simple passkey).