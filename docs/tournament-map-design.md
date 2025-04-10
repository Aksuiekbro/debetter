# Tournament Map Feature - Backend Design

This document outlines the backend design for implementing the tournament map upload, storage, and retrieval feature.

## 1. Storage Strategy

*   **Recommendation:** Cloud Storage (e.g., AWS S3, Google Cloud Storage, Cloudinary).
*   **Reasoning:** This approach is preferred for production environments due to its scalability, performance benefits for serving static assets, and separation of concerns from the main application server and database. It simplifies scaling and backup procedures.

## 2. Schema Update

The `Debate` model schema (`api/models/Debate.js`) will be updated to include a field for storing the map image URL.

*   **Add Field:** Add the following field to the `debateSchema`:
    ```javascript
    mapImageUrl: { 
      type: String, 
      trim: true, // Optional: removes leading/trailing whitespace
      default: null // Indicates no map uploaded initially
    },
    ```

## 3. API Endpoints

The following RESTful endpoints will be added, typically nested under the debate resource:

*   **Upload/Replace Map:**
    *   **Method:** `POST`
    *   **Path:** `/api/debates/:id/map`
    *   **Authorization:** Organizer/Admin only (User must be the debate creator or have an 'admin' role).
    *   **Middleware:**
        *   Authentication middleware (`protect`).
        *   Authorization middleware (`isOrganizerOrAdmin`).
        *   File handling middleware (`multer`) configured for single image upload (e.g., field name 'mapImage'), with file type and size validation.
    *   **Action:** Uploads the image to cloud storage, retrieves the URL, and updates the `mapImageUrl` field in the corresponding `Debate` document. Replaces the existing image if one exists.
    *   **Response:** `200 OK` with `{ message: 'Map uploaded successfully', mapImageUrl: '...' }` or appropriate error status (400, 401, 403, 500).

*   **Get Map URL/Info:**
    *   **Method:** `GET`
    *   **Path:** `/api/debates/:id/map`
    *   **Authorization:** Authenticated users (`protect` middleware). (Further restrictions could be added if maps should only be visible to participants).
    *   **Action:** Retrieves the `mapImageUrl` from the specified `Debate` document.
    *   **Response:** `200 OK` with `{ mapImageUrl: '...' }` (URL or null) or 404 if the debate is not found.

*   **Delete Map:**
    *   **Method:** `DELETE`
    *   **Path:** `/api/debates/:id/map`
    *   **Authorization:** Organizer/Admin only (`protect`, `isOrganizerOrAdmin`).
    *   **Action:** Deletes the image file from cloud storage using the stored `mapImageUrl` and sets the `mapImageUrl` field in the `Debate` document to `null`.
    *   **Response:** `200 OK` with `{ message: 'Map deleted successfully' }` or appropriate error status.

## 4. Backend Components

*   **File Handling Middleware (`multer`):**
    *   Configure `multer` instance (e.g., in `api/middleware/uploadMiddleware.js`).
    *   Use `multer.memoryStorage()` for direct handling of file buffers.
    *   Implement `fileFilter` for image MIME types (JPEG, PNG, GIF, WEBP).
    *   Set file size limits.
*   **Cloud Storage Service (`services/cloudStorageService.js`):**
    *   Abstracts interactions with the cloud provider's SDK (e.g., AWS SDK v3).
    *   Provides functions like `uploadFile(buffer, fileName, mimeType)` and `deleteFile(fileUrl)`.
    *   Manages cloud credentials securely (via environment variables).
*   **Service Layer (`api/services/tournamentService.js` or `api/services/mapService.js`):**
    *   `uploadTournamentMap(debateId, fileBuffer, fileName, mimeType, userId)`: Handles authorization, calls cloud storage upload, updates `Debate` model.
    *   `deleteTournamentMap(debateId, userId)`: Handles authorization, retrieves URL, calls cloud storage delete, updates `Debate` model.
    *   `getTournamentMapUrl(debateId)`: Retrieves `mapImageUrl` from `Debate` model.
*   **Controller Layer (`api/controllers/debateController.js` or `api/controllers/mapController.js`):**
    *   Functions (`uploadMap`, `getMap`, `deleteMap`) to handle HTTP requests.
    *   Validate request parameters (e.g., `:id`).
    *   Extract data (params, body, `req.file`, `req.user`).
    *   Call service layer functions.
    *   Format and send JSON responses.
*   **Routing (`api/routes/debateRoutes.js`):**
    *   Define the new routes (`POST /:id/map`, `GET /:id/map`, `DELETE /:id/map`).
    *   Apply necessary middleware in sequence: `protect`, `isOrganizerOrAdmin` (for POST/DELETE), `multerUpload.single('mapImage')` (for POST).

## 5. Data Flow Diagram (Mermaid)

```mermaid
graph TD
    A[Client Request (POST /api/debates/:id/map + Image)] --> B(Auth Middleware);
    B --> C{User Authenticated?};
    C -- Yes --> D(Authorization Middleware);
    D --> E{User Organizer/Admin?};
    E -- Yes --> F(Multer Middleware);
    F --> G{File Valid?};
    G -- Yes --> H(Map Controller: uploadMap);
    H --> I(Tournament/Map Service: uploadTournamentMap);
    I --> J(Cloud Storage Service: uploadFile);
    J --> K[Cloud Storage (e.g., S3)];
    J -- URL --> I;
    I --> L(Update Debate Model);
    L --> M[MongoDB: Debate Document];
    I -- Success --> H;
    H --> N(Send Success Response);
    N --> A;

    subgraph Error Handling
        C -- No --> Z1(401 Unauthorized);
        E -- No --> Z2(403 Forbidden);
        G -- No --> Z3(400 Bad Request - Invalid File);
        I -- Error --> H;
        J -- Error --> I;
        L -- Error --> I;
        H -- Error --> Z4(500 Internal Server Error / Specific Error);
        Z1 --> A;
        Z2 --> A;
        Z3 --> A;
        Z4 --> A;
    end

    GET[Client Request (GET /api/debates/:id/map)] --> B;
    B --> C;
    C -- Yes --> GET_Ctrl(Map Controller: getMap);
    GET_Ctrl --> GET_Svc(Tournament/Map Service: getTournamentMapUrl);
    GET_Svc --> GET_DB(Read Debate Model);
    GET_DB --> M;
    GET_DB -- URL --> GET_Svc;
    GET_Svc --> GET_Ctrl;
    GET_Ctrl --> GET_Resp(Send Map URL Response);
    GET_Resp --> GET;


    DEL[Client Request (DELETE /api/debates/:id/map)] --> B;
    B --> C;
    C -- Yes --> D;
    D --> E;
    E -- Yes --> DEL_Ctrl(Map Controller: deleteMap);
    DEL_Ctrl --> DEL_Svc(Tournament/Map Service: deleteTournamentMap);
    DEL_Svc --> DEL_DB(Read Debate Model for URL);
    DEL_DB --> M;
    DEL_DB -- URL --> DEL_Svc;
    DEL_Svc --> DEL_Cloud(Cloud Storage Service: deleteFile);
    DEL_Cloud --> K;
    DEL_Cloud -- Success --> DEL_Svc;
    DEL_Svc --> DEL_Update(Update Debate Model - Remove URL);
    DEL_Update --> M;
    DEL_Svc -- Success --> DEL_Ctrl;
    DEL_Ctrl --> DEL_Resp(Send Success Response);
    DEL_Resp --> DEL;