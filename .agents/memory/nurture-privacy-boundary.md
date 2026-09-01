---
name: Nurture privacy boundary
description: Rules for keeping pregnancy records local while serving public guidance content
---

Nurture mobile private records must stay on-device: profile, due-date calculations, kicks, symptoms, appointments, exports, and deletion are local operations. Public weekly guidance may remain API-backed because it is not user-specific.

**Why:** The product’s privacy direction explicitly prevents personal pregnancy and health data from being stored on the server or exposed to admin analytics.

**How to apply:** Do not reintroduce profile, health-log, appointment, or dashboard-summary API calls into the mobile private journey. Keep API-backed content endpoints nullable where their database columns are nullable, and regenerate shared schemas after OpenAPI changes.