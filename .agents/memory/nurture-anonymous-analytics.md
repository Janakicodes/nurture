---
name: Nurture anonymous analytics
description: Privacy limits and consent rules for product analytics
---

Anonymous analytics is opt-in and aggregate-only. The mobile client may send only a fixed event name; it must not send an install ID, profile data, pregnancy details, health logs, appointments, or eligibility answers.

**Why:** Admin needs product-usage visibility without weakening Nurture’s device-only privacy boundary or making users linkable.

**How to apply:** Keep event names allowlisted at the API boundary, default consent off in local storage, show the consent control in Profile, and expose only counts/active days to admins.