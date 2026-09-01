# Nurture Launch Readiness Checklist

**Product:** Nurture — Pregnancy Companion  
**Target launch:** Mobile beta for pregnant women in India  
**Last checked:** August 5, 2026  
**Release owner:** ____________________  
**Target date:** ____________________

## How to use this checklist

- `[x]` **Verified** in the current workspace or by a repeatable local check.
- `[ ]` **Open** — still needs implementation, review, or sign-off.
- `BLOCKER` — must be closed before a public launch.
- `PILOT` — may be acceptable for a private, controlled pilot but not a public launch.

The current codebase has a working core experience and passing production bundle checks. The main public-launch blockers are secure admin access, signed store-release preparation, medical/content review, and real-device acceptance testing.

---

## 1. Product scope and launch decision

- [x] Core mobile surfaces exist: Home, Track, Visits, Benefits, Profile.
- [x] Onboarding, weekly guidance, kick tracking, symptom tracking, appointments, benefits, profile editing, export, and local data reset are implemented.
- [x] The current privacy direction is documented: pregnancy and health records remain on-device.
- [x] Gamified kick-goal celebrations are removed from the current mobile release.
- [ ] Decide the launch channel:
  - `[ ]` Private pilot only.
  - `[ ]` Controlled beta.
  - `[ ]` Public App Store / Google Play launch.
- [ ] Decide whether the web app is also part of the launch. The web experience still uses the older server-backed profile and health-data flows and should not be treated as equivalent to the privacy-first mobile release without a separate privacy review.
- [ ] Confirm the supported language for launch. Current product copy is English-only.
- [ ] Confirm the supported Android/iOS OS versions and minimum device specifications.

## 2. Core user acceptance tests

### Onboarding and profile

- [ ] A new user can complete onboarding on a physical iPhone.
- [ ] A new user can complete onboarding on a physical Android device.
- [x] Due date, LMP, pregnancy week, and trimester are calculated locally in the mobile flow.
- [ ] Due-date and LMP edge cases are tested around month boundaries, leap years, and dates before/after the expected pregnancy range.
- [ ] Profile edits persist after force-close and relaunch.
- [ ] Updating the due date updates the week, trimester, weekly content, and appointment suggestions.
- [ ] Empty name and invalid date states have clear, accessible validation.

### Home and weekly guidance

- [ ] Home loads successfully with network access.
- [ ] Home handles no network, slow network, API error, and partial weekly-content data without a broken screen.
- [ ] All intended pregnancy weeks have reviewed content or a safe, intentional fallback.
- [ ] Week 1 and late-pregnancy content are checked for tone and correctness.
- [ ] Weekly content with nullable length/weight fields renders correctly.
- [ ] Weekly actions and warning-symptom copy have received medical review.

### Tracking

- [ ] A kick session can be started, incremented, reset, and revisited after relaunch.
- [ ] Symptom entries can be added, reviewed, and deleted after relaunch.
- [ ] Tracking remains usable with the keyboard open and on a 375-point-wide phone.
- [ ] The tracker clearly says it is informational and does not replace clinical advice.
- [ ] Warning symptoms clearly direct the user to a qualified healthcare professional or emergency service where appropriate.
- [ ] No kick or symptom data is sent to the API from the mobile private journey.

### Appointments

- [ ] Appointments can be created, viewed, edited, completed, and deleted on iOS.
- [ ] Appointments can be created, viewed, edited, completed, and deleted on Android.
- [ ] Appointment data persists after force-close and relaunch.
- [ ] Date/time handling is verified across local time zones.
- [ ] Destructive actions have clear confirmation.
- [ ] Reminder behavior is explicitly decided:
  - `[ ]` Implement and test local notifications.
  - `[ ]` Remove or relabel reminder controls as not available in this release.
  - `[ ]` Keep in-app appointment visibility as the only reminder for the beta.
- [ ] Suggested appointments are reviewed as prompts to discuss with a healthcare provider, not mandatory medical instructions.

### Benefits

- [ ] Benefits list loads on iOS and Android.
- [ ] Benefits list handles offline, loading, empty, and API-error states.
- [ ] Benefit details, documents, application steps, and official links are checked.
- [ ] Eligibility checker completes with valid answers and shows an understandable result.
- [ ] Eligibility answers are not persisted on the server.
- [ ] Eligibility results are labeled informational and not an approval or guarantee.
- [ ] Every benefit record has a verified official source URL.
- [ ] Every benefit record has an owner, last-reviewed date, jurisdiction/state coverage, and status.
- [ ] A content owner confirms that benefit amounts and eligibility rules are current for the launch states.
- [ ] Freshness language is visible wherever benefit information is shown.

### Profile, privacy, and export

- [ ] Export creates a readable health report on iOS.
- [ ] Export creates a readable health report on Android.
- [ ] Exported files contain only the user’s local data and no analytics identifiers.
- [ ] Logout clears local profile, kicks, symptoms, and appointments.
- [ ] Delete/reset clears local private data and returns the user to onboarding.
- [ ] Local deletion is verified by inspecting the app after relaunch, not only by checking the UI.
- [ ] Analytics consent is off by default.
- [ ] Turning analytics on sends only allowlisted event names.
- [ ] Turning analytics off stops future analytics events.
- [ ] Analytics payloads contain no install ID, profile, due date, pregnancy week, symptoms, kicks, appointments, or eligibility answers.

## 3. Privacy, security, and compliance

### Public user experience

- [x] Mobile private records are stored in the local device store.
- [x] Weekly guidance remains API-backed because it is public, non-user-specific content.
- [x] Anonymous analytics is opt-in and aggregate-only.
- [ ] Add or link a plain-language privacy notice inside the app before launch.
- [ ] Add terms of use and medical disclaimer copy appropriate for India.
- [ ] Add a support/contact route for privacy questions, corrections, and deletion help.
- [ ] Define local-data retention behavior, including what happens when the app is uninstalled or a device is replaced.
- [ ] Confirm whether any crash, proxy, server, or access logs could contain personal health information.
- [ ] Review all exported-report handling and sharing behavior for accidental persistence or exposure.

### Admin and content management

- **BLOCKER:** Replace the hardcoded mobile admin password and local-only authentication flag with server-side authentication and authorization, or remove admin routes from the public mobile build.
- **BLOCKER:** Replace the web admin’s hardcoded/local authentication before exposing the web admin publicly.
- [ ] Protect weekly-content mutations with server-side admin authorization.
- [ ] Protect admin analytics with server-side admin authorization.
- [ ] Confirm admin analytics exposes only anonymous aggregate events.
- [ ] Remove or disable old private-user analytics endpoints from the public admin requirements.
- [ ] Decide whether admin belongs in a separate secured web console rather than the public mobile bundle.
- [ ] Test failed login, session expiry, logout, and unauthorized API access.
- [ ] Review admin audit logging without logging user health or pregnancy data.

## 4. Medical and content review

- [ ] Name a clinical or maternal-health reviewer: ____________________.
- [ ] Review all weekly pregnancy guidance.
- [ ] Review symptom and warning-symptom language.
- [ ] Review kick-tracking language and the neutral reference explanation.
- [ ] Review suggested appointment prompts.
- [ ] Review export wording and doctor-sharing guidance.
- [ ] Review Indian maternity-benefit content, official links, amounts, and state-specific conditions.
- [ ] Add content review dates and correction ownership.
- [ ] Confirm the app never presents itself as diagnosing, treating, monitoring, or replacing a clinician.
- [ ] Confirm emergency escalation language for concerning symptoms.
- [ ] Obtain legal/privacy review for India and the intended launch markets.

## 5. Reliability and accessibility

- [x] Mobile TypeScript check passes.
- [x] Shared library typecheck passes.
- [x] API server builds successfully.
- [x] Web app typecheck passes.
- [x] iOS static production bundle builds successfully.
- [x] Android static production bundle builds successfully.
- [x] Mobile workflow restarts and serves the preview.
- [x] API workflow restarts and serves requests.
- [x] Weekly-content API returns HTTP 200 with nullable fields.
- [x] Anonymous analytics accepts valid event names and rejects invalid event names.
- [ ] Add automated acceptance tests for onboarding, local persistence, tracking, appointments, export, and data deletion.
- [ ] Test cold start, warm start, force-close, low-memory restart, and interrupted network requests.
- [ ] Test low-end Android performance and startup time.
- [ ] Test 375-point-wide layout and large system font sizes.
- [ ] Add accessibility labels/hints for icon-only controls and tracking actions.
- [ ] Verify color contrast in light and dark themes.
- [ ] Verify screen-reader navigation for onboarding, tracker, appointments, benefits, and Profile.
- [ ] Decide on crash reporting and error monitoring.
- [ ] Define an owner and response process for crash/API/content reports.
- [ ] Resolve Expo package-version compatibility warnings before store submission.

## 6. Release engineering and store readiness

### Build and distribution

- [x] Mobile app version is currently `1.0.0`.
- [x] App icon and splash assets are configured.
- [ ] Configure a unique iOS bundle identifier.
- [ ] Configure a unique Android application ID/package name.
- [ ] Configure app ownership, signing credentials, and release profiles.
- [ ] Produce signed iOS archive/TestFlight build.
- [ ] Produce signed Android App Bundle for Play Console.
- [ ] Install and smoke-test the signed builds outside the Replit preview.
- [ ] Confirm production API URL/environment values in the signed builds.
- [ ] Confirm production database schema includes the anonymous analytics table through the supported publish flow.
- [ ] Confirm the current static Expo/preview bundle is not being mistaken for a store-ready signed native build.
- [ ] Create a rollback/hotfix plan for the first beta.

### App Store and Play Store

- [ ] Reserve app name and package identifiers.
- [ ] Prepare app icon variants and required store image sizes.
- [ ] Capture final iOS and Android screenshots from signed builds.
- [ ] Write store title, subtitle/short description, full description, and keywords.
- [ ] Complete age/content rating questionnaires.
- [ ] Complete health, privacy, data-safety, and permissions disclosures.
- [ ] Publish the privacy-policy URL and support URL.
- [ ] Document that health records are device-local and anonymous analytics is optional.
- [ ] Document the app’s medical-information limitations.
- [ ] Prepare beta tester group and feedback channel.
- [ ] Submit TestFlight/Internal Testing build before public review.

## 7. Operations after launch

- [ ] Assign an owner for weekly pregnancy-content review.
- [ ] Assign an owner for benefits-content review and corrections.
- [ ] Assign an owner for security/admin access.
- [ ] Assign an owner for support and privacy requests.
- [ ] Set a review cadence for benefit sources and medical copy.
- [ ] Set an incident process for incorrect medical or government-benefit information.
- [ ] Monitor anonymous analytics without attempting to identify users.
- [ ] Define what metrics are useful for the beta: onboarding completion, return usage, guidance views, benefits views, error rate, and support issues.
- [ ] Define how analytics data is retained and deleted.
- [ ] Keep a release changelog and known-issues list for testers.

## 8. Go / no-go sign-off

### Private pilot

- [ ] Core user acceptance tests pass on at least one physical iOS device.
- [ ] Core user acceptance tests pass on at least one physical Android device.
- [ ] Medical/content reviewer approves pilot copy.
- [ ] Privacy notice and support contact are available.
- [ ] Admin access is restricted to trusted internal users, or admin is removed from the pilot build.
- [ ] Pilot feedback and incident process are ready.

### Controlled beta

- [ ] All private-pilot items are complete.
- [ ] Signed builds are distributed through TestFlight/Internal Testing.
- [ ] Data-safety and privacy disclosures are complete.
- [ ] Crash/error monitoring and support ownership are active.
- [ ] Benefits content has current source/review metadata.
- [ ] Admin authentication is server-side and tested.

### Public launch

- [ ] All controlled-beta items are complete.
- [ ] No known critical privacy, medical-safety, or authentication vulnerabilities.
- [ ] Store review materials and required disclosures are approved.
- [ ] Production API, database, admin, monitoring, and rollback procedures are verified.
- [ ] Launch owner signs off: ____________________ Date: __________
- [ ] Clinical/content reviewer signs off: ____________________ Date: __________
- [ ] Privacy/legal reviewer signs off: ____________________ Date: __________
- [ ] Technical/release owner signs off: ____________________ Date: __________

## Current recommendation

**Status: ready for a controlled private pilot, not yet ready for public launch.**

The highest-priority blockers are:

1. Secure or remove the admin surface from public builds.
2. Complete medical, benefits, privacy, and legal review.
3. Produce and test signed native iOS/Android builds on real devices.
4. Add store disclosures, privacy/support URLs, and data-safety declarations.
5. Establish crash/error monitoring and a support/incident owner.