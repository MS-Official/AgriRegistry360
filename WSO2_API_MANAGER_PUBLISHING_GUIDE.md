# WSO2 API Manager Publishing Guide

## Purpose

WSO2 API Manager will act as the secure API gateway for AgriRegistry360. The Angular portal currently calls the Node.js backend directly, but the target architecture routes frontend, mobile, and external system traffic through WSO2 API Manager for authentication, authorization, throttling, monitoring, analytics, and API lifecycle control.

## Target Architecture

```text
Angular Portal / Mobile App / External Systems
↓
WSO2 API Manager
↓
AgriRegistry360 Backend APIs
↓
OpenG2P-style Registry + Odoo-style Inventory Workflows
```

## APIs To Publish

### API 1: AgriRegistry360 Registry API

Includes:

- Farmer Registry APIs
- Farm / Land Registry APIs
- Crop Registry APIs

Metadata:

| Field | Value |
| --- | --- |
| Name | AgriRegistry360 Registry API |
| Context | `/agriregistry360/registry` |
| Version | `1.0.0` |
| Backend base path | `http://localhost:5001/api` |
| Security | OAuth2/JWT |
| Throttling | 1000 requests/min for demo |

### API 2: AgriRegistry360 Program API

Includes:

- Eligibility Check APIs
- Program Enrollment APIs

Metadata:

| Field | Value |
| --- | --- |
| Name | AgriRegistry360 Program API |
| Context | `/agriregistry360/program` |
| Version | `1.0.0` |
| Backend base path | `http://localhost:5001/api` |
| Security | OAuth2/JWT |
| Throttling | 500 requests/min for demo |

### API 3: AgriRegistry360 Inventory API

Includes:

- Odoo-style inventory item APIs
- Inventory reservation APIs

Metadata:

| Field | Value |
| --- | --- |
| Name | AgriRegistry360 Inventory API |
| Context | `/agriregistry360/inventory` |
| Version | `1.0.0` |
| Backend base path | `http://localhost:5001/api` |
| Security | OAuth2/JWT |
| Throttling | 300 requests/min for demo |

## Recommended Security Model

- Use OAuth2/JWT at WSO2 API Manager.
- Keep backend APIs behind the gateway in production-style deployments.
- Use role-based scopes later for officer, admin, integration, and reporting access.
- TODO: Enforce OAuth2/JWT validation at the backend or trusted gateway boundary.

## Suggested Throttling Policies

- Registry API: 1000 requests/min for demo.
- Program API: 500 requests/min for demo.
- Inventory API: 300 requests/min for demo.
- TODO: Add subscription plans for internal systems, mobile clients, and partner integrations.

## Suggested API Lifecycle

1. Create API from OpenAPI definition.
2. Review resource grouping and contexts.
3. Apply OAuth2/JWT security.
4. Apply throttling policy.
5. Publish to Developer Portal.
6. Subscribe demo applications.
7. Monitor traffic and errors.
8. Promote from Created to Published to Deprecated/Retired as needed.

## Import OpenAPI Spec Into WSO2

1. Start the AgriRegistry360 backend.
2. Open `http://localhost:5001/api/docs/wso2.json` or `http://localhost:5001/api/docs.json`.
3. Save the JSON file locally.
4. In WSO2 API Publisher, create a REST API using OpenAPI import.
5. Use OpenAPI File/Archive upload and upload the saved JSON file.
6. Use URL import only if WSO2 can reach the backend from inside Docker.
7. If URL import fails, use file upload. WSO2 running inside Docker may not resolve host-browser `localhost` URLs correctly.
8. Split or filter resources into Registry, Program, and Inventory APIs as needed.
9. Set context, version, security, and throttling from the metadata above.

## Demo Talking Points

- The current backend already exposes a WSO2-importable OpenAPI document.
- `/api/catalog` shows the recommended API grouping for publishing.
- WSO2 API Manager will secure and expose the APIs without changing the existing backend workflow.
- The implemented workflow demonstrates registry, eligibility, enrollment, and inventory reservation boundaries.

## Future TODOs

- Real WSO2 API import.
- OAuth2/JWT enforcement.
- Subscription plans.
- API analytics.
- Gateway deployment.
