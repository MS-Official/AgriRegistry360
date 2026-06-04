# OpenG2P Mapping Guide

## Purpose

OpenG2P is the registry, beneficiary, program, eligibility, entitlement, enrollment, and benefit allocation layer for the AgriRegistry360 target architecture. The current AgriRegistry360 implementation is a local demo workflow that prepares the data structures and process boundaries needed for future OpenG2P alignment.

Odoo ERP remains the inventory and operational fulfilment layer. WSO2 API Manager remains the secure API gateway, publishing, monitoring, throttling, and lifecycle management layer.

## High-Level Mapping

| AgriRegistry360 Module | OpenG2P Concept |
| --- | --- |
| Farmer Registry | Registrant / Beneficiary |
| Farm / Land Registry | Extended registry profile or agriculture-domain custom entity |
| Crop Registry | Agriculture-domain custom registry extension |
| Eligibility Check | Program eligibility rules |
| Program Enrollment | Program enrollment / beneficiary enrollment |
| Recommended Entitlement | Entitlement / benefit package |
| Odoo Inventory Reservation | Benefit delivery / external ERP fulfilment |
| WSO2 API Catalog | API publishing and secure integration layer |

## Farmer Mapping

| AgriRegistry360 Field | OpenG2P Mapping |
| --- | --- |
| `farmerCode` | External Registry ID / Beneficiary Code |
| `fullName` | Registrant Name |
| `nationalId` | Unique ID / National ID |
| `mobileNumber` | Contact Information |
| `district` | Address / Location |
| `gnDivision` | Administrative Area |
| `farmerType` | Beneficiary Category |
| `verificationStatus` | Verification / Validation Status |
| `registeredBy` | Registered by Officer / Audit metadata |

## Farm / Land Mapping

| AgriRegistry360 Field | OpenG2P Mapping |
| --- | --- |
| `farmCode` | External agriculture asset ID |
| `farmerCode` | Linked registrant / beneficiary |
| `landSize` + `landSizeUnit` | Landholding attribute |
| `ownershipType` | Land ownership attribute |
| `district` / `gnDivision` | Farm location attributes |
| `gpsLatitude` / `gpsLongitude` | Geo-location extension |
| `soilType` | Agriculture extension attribute |
| `irrigationType` | Agriculture extension attribute |
| `farmStatus` | Farm activity status |
| `verificationStatus` | Farm validation status |

## Crop Mapping

| AgriRegistry360 Field | OpenG2P Mapping |
| --- | --- |
| `cropCode` | External crop activity ID |
| `farmCode` | Linked farm / land asset |
| `farmerCode` | Linked beneficiary |
| `cropType` | Agriculture activity type |
| `season` + `seasonYear` | Program season context |
| `cultivationArea` | Eligibility input |
| `plantingDate` / `expectedHarvestDate` | Program validation fields |
| `expectedYield` | Reporting / planning data |
| `cropStatus` | Activity lifecycle status |
| `verificationStatus` | Crop validation status |

## Eligibility Mapping

| AgriRegistry360 Field | OpenG2P Mapping |
| --- | --- |
| `eligibilityCode` | Eligibility evaluation reference |
| `programCode` | OpenG2P Program Code |
| `programName` | OpenG2P Program Name |
| `eligibilityStatus` | Eligibility result |
| `ruleResults` | Rule engine evaluation output |
| `failureReasons` | Eligibility failure explanation |
| `recommendedEntitlement` | Entitlement / benefit package |
| `checkedBy` | Officer / system evaluator |
| `checkedAt` | Evaluation timestamp |

## Program Enrollment Mapping

| AgriRegistry360 Field | OpenG2P Mapping |
| --- | --- |
| `enrollmentCode` | Program enrollment ID |
| `eligibilityCode` | Linked eligibility evaluation |
| `farmerCode` | Enrolled beneficiary |
| `programCode` | Program reference |
| `entitlement` | Assigned entitlement |
| `enrollmentStatus` | Enrollment lifecycle status |
| `approvalStatus` | Approval workflow status |
| `enrollmentDate` | Enrollment date |
| `enrolledBy` | Program officer / audit metadata |

## Odoo Fulfilment Mapping

Odoo is not replacing OpenG2P.

- OpenG2P decides who is eligible and enrolled.
- Odoo handles inventory, procurement, stock reservation, issue, distribution, accounting, and operational fulfilment.
- WSO2 securely connects the systems.

| AgriRegistry360 Field | Odoo / Fulfilment Mapping |
| --- | --- |
| Inventory Reservation | Odoo stock reservation / delivery order |
| `reservationCode` | Odoo stock movement reference |
| `enrollmentCode` | Source program enrollment reference |
| `itemCode` | Odoo product SKU |
| `reservedQuantity` | Reserved stock quantity |
| `reservationStatus` | Stock movement / fulfilment status |

## Recommended OpenG2P Customization Areas

- Add agriculture-specific beneficiary profile fields.
- Add farm/land custom entity or linked registry extension.
- Add crop activity registry extension.
- Add agriculture support program definitions.
- Add fertilizer subsidy eligibility rules.
- Add entitlement mapping for fertilizer quantity.
- Add approval workflow for program enrollment.
- Add external ERP fulfilment reference for Odoo.
- Add API integration through WSO2.

## Future Integration Approach

| Phase | Focus |
| --- | --- |
| Phase 1 | Data mapping and OpenG2P registry alignment |
| Phase 2 | Synchronize Farmer Registry with OpenG2P registrants / beneficiaries |
| Phase 3 | Map Farm and Crop data as agriculture registry extensions |
| Phase 4 | Move eligibility rules into OpenG2P program configuration |
| Phase 5 | Use OpenG2P enrollment / entitlement outputs to trigger Odoo reservation |
| Phase 6 | Expose all integration APIs through WSO2 API Manager |

## How To Explain This To The Client

AgriRegistry360 uses OpenG2P as the registry and program layer. Farmers are treated as beneficiaries or registrants. Farms and crops are agriculture-specific extensions. Eligibility and enrollment represent government program logic. Odoo handles the operational delivery of fertilizer stock. WSO2 API Manager secures and publishes the APIs.

## Risks And Assumptions

- The current implementation is a demo mapping layer, not a live OpenG2P integration.
- Farm and crop records may require custom OpenG2P extensions or linked domain entities.
- Eligibility rules may need to be reimplemented in OpenG2P program configuration.
- Entitlement and fulfilment identifiers must remain stable across OpenG2P and Odoo.
- WSO2 should mediate cross-system access in production-style architecture.

## Next Integration Steps

1. Validate OpenG2P registrant and beneficiary schema requirements.
2. Confirm agriculture extension data model for farms and crops.
3. Define program and entitlement configuration in OpenG2P.
4. Define synchronization contracts between AgriRegistry360 and OpenG2P.
5. Define Odoo fulfilment callbacks and references.
6. Publish integration APIs through WSO2 API Manager.

## TODO Placeholders

- Real OpenG2P API sync.
- OpenG2P PBMS program configuration.
- OpenG2P entitlement sync.
- OpenG2P beneficiary registry import.
- WSO2-secured integration endpoints.

