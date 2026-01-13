# Project: AnyList Recipe Importer

## Overview
A web-based tool to digitize physical recipe books and import them into AnyList. It allows family members to upload photos of recipes, which are then processed by AI to extract data and automatically populate AnyList.

## User Goals
- **Easy Input:** Upload photos from mobile devices.
- **AI Processing:**
    - Transcribe text from images.
    - Normalize text (Title Case, formatting fractions).
    - Extract fields: Title, Ingredients, Instructions, Cook Time, Notes/Substitutions.
    - Categorize recipes automatically.
- **AnyList Sync:** Automate entry creation.

## Technical Requirements
- **Platform:** Web Application (Mobile-responsive).
- **Input:** Image Upload / Camera capture.
- **AI Model:** Gemini API (Multimodal: Image -> JSON). Start with Free Tier.
- **Integration:** Unofficial Node.js AnyList API (`anylist`).

## Architecture Decisions
- **Frontend:** Web interface (React + Vite + TypeScript + Lucide React for icons).
- **Backend:** Node.js (Express) - chosen for stable AnyList integration.
- **Database:** (Optional) Simple JSON file or SQLite for queue/history.
- **Authentication:** Shared Password with Rate Limiting (using `express-rate-limit`).
- **Recipe Import Strategy:** "Hybrid" approach. The app creates the recipe via API with all text data. The user manually adds the photo via the AnyList app/web interface (since the API doesn't support photo uploads).

## Research Items
- [x] AnyList unofficial API availability (Node.js library `anylist` is stable).
- [x] Gemini API: Using `gemini-2.5-flash` for high-performance extraction.
- [x] Security: Use `.env` for local secrets, AWS SSM Parameter Store for cloud production.
- [x] Vulnerability Analysis: `tough-cookie` (GHSA-72xf-g2v4-qvf3) is flagged in `anylist` dependency, but analysis confirms we are NOT vulnerable because the library does not use `CookieJar` or cookies for authentication (uses Bearer tokens).
- [x] Authentication: Implemented Shared Password with Rate Limiting and JWT cookies.
- [x] Error Handling: Improved Gemini API error messaging for rate limits and safety filters.

## Current Issues / Work-in-Progress
- **Docker:** Implementation complete in files, but local verification is pending (Docker not installed on dev machine).
- **Deployment:** Ready for cloud deployment (AWS/Heroku/DigitalOcean) once Docker is available.

## Next Steps

1. Verify end-to-end flow from a physical mobile device (UI testing).

2. Setup Docker locally once installed and verify containerized networking.

3. Deploy to a cloud provider with HTTPS (required for secure cookies).



## Lessons Learned

- **AnyList Library `uid` Inconsistency:** The unofficial `anylist` library has an internal inconsistency with the User ID (`uid`). 

    - When creating a recipe (`createRecipe`), the `uid` must be manually found and set from the user's `sharedUsers` list.

    - When adding a recipe to a collection (`addRecipeToCollection`), the `RecipeCollection` wrapper must be initialized with this *same, manually-found `uid`*, not the default `_userData.userId` which may be null or incorrect.

    - **Rule:** For any multi-step operations involving the `anylist` library, ensure a single, verified `uid` is passed explicitly to all relevant methods or constructors.
