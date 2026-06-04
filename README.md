# AgriRegistry360

## Project Overview

**AgriRegistry360** is an integrated **Farm & Farmer Registry Demo Platform** designed to demonstrate how a government or agriculture authority can manage farmers, farms, crops, eligibility, subsidy programs, and input distribution through a secure digital public infrastructure approach.

## Current Implementation

The current codebase starts the Farmer Registry module only. It includes:

* Node.js / Express / Mongoose backend under `backend/`
* Angular Farmer Registry frontend under `frontend/`
* Demo planning document in `FARM_REGISTRY_DEMO_PLAN.md`
* API test examples in `FARMER_API_TESTS.md`

### Run Locally

Install dependencies:

```bash
npm install
```

Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

Start MongoDB locally, then run both apps:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

Frontend:

```text
http://localhost:4200
```

Run backend tests and Angular build:

```bash
npm test
```

This demo focuses on the client requirement for a **Farm Registry system** using:

* **OpenG2P** as the registry, beneficiary, eligibility, and program management layer
* **Odoo ERP** as the operational ERP layer for inventory, procurement, distribution, accounting, and reporting
* **WSO2 API Manager** as the secure API gateway and integration layer
* **Angular Portal** as the user-facing application for officers, administrators, and demo users

The goal of this demo is to show how a farmer can be registered, linked to farm/land information, associated with crop details, verified for eligibility, enrolled into a government support program, and connected to Odoo for fertilizer or seed distribution.

---

## Demo Title

**AgriRegistry360 — Integrated Farm & Farmer Registry Demo**

---

## Demo Story

A field officer registers a smallholder farmer from Anuradhapura. The officer records the farmer’s basic information, farm/land details, crop details, and verification status.

Once the farmer and farm are verified, the system checks whether the farmer is eligible for a fertilizer subsidy program. If eligible, the farmer is enrolled into the program through the registry layer, and fertilizer stock is reserved or distributed through Odoo ERP.

All service communication is designed to be exposed securely through WSO2 API Manager.

---

## Main Demo Flow

```text
Farmer Registration
        ↓
Farm / Land Registration
        ↓
Crop Registration
        ↓
Farmer & Farm Verification
        ↓
Eligibility Check
        ↓
Program Enrollment
        ↓
Odoo Inventory Reservation / Distribution
        ↓
WSO2 API Manager Exposure
```

---

## Platform Responsibilities

| Platform              | Responsibility                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **OpenG2P**           | Farmer registry, farm registry, beneficiary management, eligibility rules, program enrollment, entitlement mapping |
| **Odoo ERP**          | Inventory, fertilizer and seed stock, procurement, distribution, accounting, operational reports                   |
| **WSO2 API Manager**  | API gateway, authentication, authorization, throttling, monitoring, API lifecycle management                       |
| **Angular Portal**    | User interface for admin users, field officers, and demo users                                                     |
| **Node.js Backend**   | Demo API layer for farmer, farm, crop, eligibility, and integration workflows                                      |
| **MongoDB**           | Demo database for storing registry and workflow data                                                               |
| **Postman / Swagger** | API testing and demo proof                                                                                         |

---

## Current Module Focus

The first module to implement is:

## Farmer Registry Module

This is the foundation of the full farm registry workflow.

### Minimum Farmer Fields

| Field               | Description                                            |
| ------------------- | ------------------------------------------------------ |
| Farmer ID           | Auto-generated farmer reference number                 |
| Full Name           | Farmer’s full legal name                               |
| National ID / NIC   | Farmer’s national identity number                      |
| Mobile Number       | Farmer’s contact number                                |
| District            | Farmer’s district                                      |
| GN Division         | Farmer’s Grama Niladhari division                      |
| Farmer Type         | Smallholder, Commercial, Tenant, or Cooperative Member |
| Verification Status | Pending Verification, Verified, or Rejected            |
| Registered By       | Officer or user who registered the farmer              |

### Demo Farmer

```text
Name: Mohamed Ameen
NIC: 901234567V
Mobile Number: 0771234567
District: Anuradhapura
GN Division: Nochchiyagama
Farmer Type: Smallholder
Verification Status: Pending Verification
Registered By: Field Officer
```

---

## Planned Demo Modules

### 1. Farmer Registry

Register and manage farmers as the primary registry participants.

Main functions:

* Register farmer
* View farmer list
* Search farmers
* View farmer profile
* Update farmer details
* Verify or reject farmer

---

### 2. Farm / Land Registry

Register one or more farms or land plots under a farmer.

Main functions:

* Add farm/land details
* Link farm to farmer
* Record land size
* Record ownership type
* Record district and GN division
* Store GPS/location details
* Verify farm information

---

### 3. Crop Registry

Track cultivation details linked to registered farms.

Main functions:

* Register crop type
* Record season
* Record cultivation area
* Record expected yield
* Track crop status

---

### 4. Eligibility Check

Check whether a verified farmer is eligible for government agriculture support programs.

Example eligibility rule:

```text
Verified Farmer + Verified Farm + Active Paddy Crop = Eligible for Fertilizer Subsidy
```

---

### 5. Program Enrollment

Enroll eligible farmers into government support programs.

Example programs:

* Fertilizer Subsidy Program
* Seed Distribution Program
* Drought Relief Program
* Crop Insurance Program
* Irrigation Support Program

---

### 6. Odoo ERP Distribution Workflow

Use Odoo ERP as the operational system for inventory and distribution.

Example workflow:

```text
Eligible Farmer
    ↓
Program Enrollment Approved
    ↓
Fertilizer Stock Reserved in Odoo
    ↓
Distribution Status Updated
```

---

### 7. WSO2 API Manager Integration

Use WSO2 API Manager to expose and secure APIs.

Main functions:

* Publish Farm Registry APIs
* Secure APIs using OAuth2/JWT
* Apply throttling policies
* Monitor API usage
* Provide controlled access for frontend, mobile apps, and future third-party systems

---

## Minimum Screens Needed

| Screen                | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| Login                 | Admin / Field Officer access                                  |
| Dashboard             | Summary of farmers, farms, crops, programs, and distributions |
| Farmer Registration   | Register a new farmer                                         |
| Farmer List           | View and search registered farmers                            |
| Farmer Details        | View complete farmer profile                                  |
| Farmer Verification   | Approve or reject farmer registration                         |
| Farm Registration     | Register farm or land details                                 |
| Crop Registration     | Add crop and season details                                   |
| Eligibility Check     | Check farmer eligibility for programs                         |
| Program Enrollment    | Enroll eligible farmer into support program                   |
| Odoo Inventory View   | Show fertilizer/seed stock reservation or distribution        |
| WSO2 API Manager View | Show published and secured APIs                               |
| Reports               | Show district, season, and program-level summaries            |

---

## Minimum APIs Needed

### Farmer Registry APIs

```http
POST /api/farmers/register
GET /api/farmers
GET /api/farmers/{id}
PUT /api/farmers/{id}
PATCH /api/farmers/{id}/verify
```

### Farm Registry APIs

```http
POST /api/farms/register
GET /api/farms
GET /api/farms/{id}
GET /api/farmers/{farmerId}/farms
```

### Crop Registry APIs

```http
POST /api/crops/register
GET /api/crops
GET /api/farms/{farmId}/crops
```

### Eligibility APIs

```http
POST /api/eligibility/check
```

### Program Enrollment APIs

```http
POST /api/programs/enroll
GET /api/programs/enrollments
```

### Odoo Integration APIs

```http
POST /api/odoo/inventory/reserve
POST /api/odoo/distribution/issue
```

### Report APIs

```http
GET /api/reports/farm-registry-summary
```

---

## Sample Farmer Registration Request

```http
POST /api/farmers/register
```

```json
{
  "fullName": "Mohamed Ameen",
  "nationalId": "901234567V",
  "mobileNumber": "0771234567",
  "district": "Anuradhapura",
  "gnDivision": "Nochchiyagama",
  "farmerType": "SMALLHOLDER",
  "registeredBy": "Field Officer"
}
```

---

## Sample Farmer Registration Response

```json
{
  "farmerCode": "FARMER-0001",
  "fullName": "Mohamed Ameen",
  "nationalId": "901234567V",
  "mobileNumber": "0771234567",
  "district": "Anuradhapura",
  "gnDivision": "Nochchiyagama",
  "farmerType": "SMALLHOLDER",
  "verificationStatus": "PENDING_VERIFICATION",
  "registeredBy": "Field Officer"
}
```

---

## Technology Stack

### Frontend

* **Framework:** Angular
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **UI Components:** Angular Material / Custom Components
* **Routing:** Angular Router
* **HTTP Client:** Angular HttpClient
* **Notifications:** Toast / Snackbar notifications

### Backend

* **Framework:** Node.js with Express.js
* **Database:** MongoDB
* **ODM:** Mongoose
* **Authentication:** JWT
* **Password Hashing:** bcrypt.js
* **API Documentation:** Swagger / OpenAPI

### Integration Layer

* **OpenG2P:** Registry, eligibility, program, and entitlement layer
* **Odoo ERP:** Inventory, procurement, distribution, accounting, and reporting layer
* **WSO2 API Manager:** API gateway, security, monitoring, and lifecycle management

### Tools and Utilities

* **Version Control:** Git
* **API Testing:** Postman
* **Project Management:** Jira
* **Code Quality:** ESLint, Prettier

---

## Project Structure

```text
AgriRegistry360/
├── frontend/                 # Angular frontend application
├── backend/                  # Node.js / Express.js backend API
├── docs/                     # Demo documents, API notes, and architecture files
├── postman/                  # Postman collection for API testing
├── .gitignore
├── README.md
├── LICENSE.md
├── package.json
└── ...
```

---

## Suggested Backend Structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   │   └── farmer.controller.js
│   ├── models/
│   │   └── farmer.model.js
│   ├── routes/
│   │   └── farmer.routes.js
│   ├── services/
│   │   └── farmer.service.js
│   ├── middleware/
│   ├── utils/
│   └── server.js
├── .env.example
├── package.json
└── README.md
```

---

## Suggested Frontend Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   ├── shared/
│   │   ├── features/
│   │   │   └── farmers/
│   │   │       ├── farmer-registration/
│   │   │       ├── farmer-list/
│   │   │       ├── farmer-details/
│   │   │       └── farmer-verification/
│   │   ├── app.routes.ts
│   │   └── app.component.ts
│   ├── environments/
│   └── styles.css
├── angular.json
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

* Node.js v18 or higher
* npm or yarn
* Angular CLI
* MongoDB

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MS-Official/AgriRegistry360.git
cd AgriRegistry360
```

---

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

---

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## Configuration

### Backend Environment Variables

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/agriregistry360
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=1d
```

---

### Frontend Environment Variables

Create an environment file or configure the Angular environment:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5001/api'
};
```

---

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on:

```text
http://localhost:5000
```

---

### Start Angular Frontend

```bash
cd frontend
ng serve
```

Frontend will run on:

```text
http://localhost:4200
```

---

## Demo Implementation Roadmap

### Phase 1: Farmer Registry Foundation

* Create Farmer model
* Create farmer registration API
* Create farmer list API
* Create farmer detail API
* Create farmer update API
* Create farmer verification API
* Create Angular farmer registration screen
* Create Angular farmer list screen
* Add demo seed farmer

### Phase 2: Farm / Land Registry

* Create Farm model
* Link farm to farmer
* Add farm registration screen
* Add farmer profile with farm records

### Phase 3: Crop Registry

* Create Crop model
* Link crop to farm
* Add crop registration screen
* Add crop list and crop status

### Phase 4: Eligibility & Program Enrollment

* Create simple eligibility rule engine
* Add fertilizer subsidy check
* Add program enrollment workflow

### Phase 5: Odoo ERP Integration

* Add placeholder Odoo inventory reservation API
* Add fertilizer stock reservation demo
* Add distribution status

### Phase 6: WSO2 API Manager Demo

* Prepare API collection
* Publish demo APIs through WSO2
* Show secured API request using token
* Show API monitoring and lifecycle

---

## Current Development Priority

The first development priority is:

```text
Farmer Registry Module
```

Start with:

```text
Farmer Registration Screen
Farmer Registration API
Farmer List Screen
Farmer Verification API
```

Do not start Farm, Crop, Eligibility, Odoo, or WSO2 integration until the Farmer Registry foundation is ready.

---

## License

This project is licensed under the MIT License.

---

## Contact

For more information, please contact:

```text
Team CodeMe
```

---

## Acknowledgments

* OpenG2P
* Odoo ERP
* WSO2 API Manager
* Angular
* Node.js
* Express.js
* MongoDB
* Tailwind CSS

---

Built with ❤️ for digital agriculture transformation.
