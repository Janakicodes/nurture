# Nurture Mobile App — Product Requirements Document

**Document status:** Release candidate  
**Product:** Nurture  
**Platform:** iOS and Android via Expo  
**Primary market:** India  
**Owner:** Product owner / founder  
**Last updated:** August 5, 2026

---

## 1. Product summary

Nurture is a privacy-first pregnancy companion for women in India. It combines personalized weekly pregnancy guidance with simple daily tracking, appointment planning, and localized information about Indian maternity benefits.

The product should feel reassuring and practical: it helps someone understand what is happening this week, remember what to do next, and keep useful health information organized without overwhelming her.

## 2. Problem statement

Existing pregnancy apps often provide generic international content, focus heavily on content consumption, or separate tracking and planning into multiple tools. They frequently do not address:

- Indian maternity schemes and eligibility requirements
- Local healthcare workflows and appointment types
- The need for a simple, low-friction kick and symptom tracker
- Privacy concerns around sensitive pregnancy information
- Clear weekly actions rather than only development facts

Nurture addresses this by bringing localized education, tracking, planning, and benefit discovery into one focused mobile experience.

## 3. Goals

### Product goals

1. Help users understand their pregnancy week and what matters now.
2. Make daily kick and symptom logging quick enough to become a habit.
3. Help users prepare for and remember important appointments.
4. Make Indian maternity benefits easier to discover and understand.
5. Give users control over their profile, due-date information, appearance, and exported health summary.

### Business and adoption goals

1. Launch a trustworthy mobile beta for pregnant women in India.
2. Validate whether localized weekly guidance and benefits information improve repeat usage.
3. Establish a foundation for partnerships with clinicians, maternal-health organizations, and community health workers.

## 4. Non-goals for the current release

- Diagnosing medical conditions
- Replacing a doctor, midwife, or emergency service
- Providing medical treatment recommendations
- Real-time clinical monitoring
- Insurance claims or government-benefit applications
- Social networking or community chat
- Full electronic health-record integration
- Monetization, subscriptions, or commerce

The app must clearly direct users to a qualified healthcare professional for concerning symptoms or medical decisions.

## 5. Target users

### Primary user

Pregnant women in India, especially first-time mothers who want practical weekly guidance and a simple way to organize pregnancy-related information.

### Secondary users

- Pregnant users who want localized information about government benefits
- Partners or family members helping manage appointments
- Community health workers supporting expectant mothers
- Clinicians receiving a user-exported health summary

### Initial assumptions

- The user may be using a lower-cost Android device or a mobile browser.
- The user may have limited time, intermittent connectivity, or limited digital-health experience.
- The user may prefer English initially, with localization to Indian languages as a future expansion.
- The user may not want to create an account for the initial personal experience.

## 6. Product principles

- **Reassuring, not alarming:** Use calm language and distinguish education from medical advice.
- **Actionable, not encyclopedic:** Every weekly view should help the user decide what to do next.
- **Privacy-first:** Collect the minimum information required and make exports and deletion understandable.
- **Localized by default:** Use Indian schemes, terminology, currency, and healthcare context.
- **Fast to use:** Daily logging should take seconds, not minutes.
- **Accessible:** Use readable type, strong contrast, touch-friendly controls, and clear empty states.

## 7. Current product scope

### 7.1 Onboarding and pregnancy profile

The user can provide:

- Name
- Due date or last menstrual period
- First-pregnancy status
- Notification preference

The app calculates pregnancy week, trimester, days remaining, and relevant weekly content from the profile.

### 7.2 Home dashboard

The dashboard displays:

- Greeting and current pregnancy week
- Baby development summary
- Approximate baby size information
- Pregnancy progress and days remaining
- Today’s kick and symptom counts
- Weekly checklist and recommended actions

### 7.3 Kick tracking

The user can:

- Start or continue a daily kick session
- Record kicks with a prominent tap action
- View the daily goal and current count
- Reset the current session
- Review recent kick history
- View trend information when available

The tracker must not imply that a generic kick goal replaces clinical guidance.

### 7.4 Symptom tracking

The user can:

- Choose from predefined symptoms
- Record severity
- Record a date and optional note where supported
- Review previously logged symptoms
- Identify warning symptoms that warrant medical attention

The UI should include a clear disclaimer that symptom tracking is informational and not diagnostic.

### 7.5 Appointments

The user can:

- View upcoming and completed appointments
- See suggested appointments for the current pregnancy week
- Add an appointment
- Record appointment type, date, time, doctor, location, notes, and reminder preference where supported
- Mark an appointment complete
- Edit or delete an appointment

Suggested appointments must be presented as prompts to discuss with a healthcare provider, not as mandatory medical instructions.

### 7.6 Government benefits

The user can:

- Browse Indian maternity benefit schemes
- Expand a scheme to read its description, target group, benefits, and documents
- Open an eligibility checker
- Answer eligibility questions
- Receive a result explaining potentially relevant schemes and next steps

The app must display a freshness disclaimer because eligibility rules, benefit amounts, and state-level requirements can change.

### 7.7 Profile and settings

The user can:

- View pregnancy summary
- Edit name, due date, LMP, first-pregnancy status, and notification preference
- Change light, dark, or system appearance
- Export a health report for sharing with a doctor
- Sign out of or clear local administrative state where applicable

## 8. Navigation and screens

### Primary navigation

- Home
- Track
- Visits
- Benefits
- Profile

### Supporting screens

- Onboarding
- Edit profile
- Appointment add/edit flow
- Symptom entry flow
- Eligibility checker
- Admin login
- Admin dashboard
- Not-found and error states

## 9. Functional requirements

### Must have — release-critical

- The app loads on iOS and Android builds.
- A new user can complete onboarding.
- An existing profile loads after relaunch.
- Pregnancy week and trimester are calculated consistently from the profile.
- Home content is shown for the calculated week.
- Kick entries persist and appear in history.
- Symptom entries persist and appear in the tracker.
- Appointments can be created, viewed, edited, completed, and deleted.
- Benefits content loads and the eligibility flow returns a result.
- Profile edits persist after relaunch.
- Loading, empty, offline/error, and partial-data states are safe and understandable.
- The app does not expose secrets or credentials in client code.

### Should have

- Local reminder notifications for appointments.
- Exportable PDF health report.
- Dark mode and system theme support.
- Gentle haptic feedback for key tracking actions.
- Clear confirmation and undo affordances for destructive actions.
- Accessibility labels for icons and tracking controls.

### Could have

- Indian language support
- Clinician-reviewed content badges
- State-specific benefits guidance
- Personalized weekly action recommendations
- Offline-first entry queue with later synchronization
- Partner or caregiver view

## 10. Data and privacy requirements

### Data collected

- Pregnancy profile details
- Due date or LMP
- Pregnancy tracking entries
- Symptoms and severity
- Appointments and notes
- User preferences

### Requirements

- Explain why each sensitive field is requested.
- Avoid collecting data that is not needed for the current experience.
- Protect server-side data with authenticated, user-scoped access before multi-user accounts are introduced.
- Provide a clear way to export personal data.
- Provide a clear way to delete or reset personal data.
- Do not present analytics or content personalization as medical diagnosis.
- Avoid logging personal health information in application logs.
- Review all copy for medical safety and legal/privacy compliance before public launch.

## 11. Admin and content management

The product includes an internal admin surface for:

- Admin sign-in
- Weekly content management
- Benefits content management
- Aggregate analytics

### Release requirement

Admin authentication must be server-side and protected before exposing the admin route in a public build. A password embedded in the mobile bundle and a local-storage authentication flag are suitable only for a private prototype, not production security.

## 12. API and technical requirements

- The mobile app uses the shared generated API client for server-backed data.
- API contracts are defined in OpenAPI and regenerated when changed.
- The mobile client must use the configured deployment domain rather than hardcoded local hostnames.
- Server-owned values such as ownership, timestamps, and derived pregnancy calculations must be validated server-side.
- Mutations must refresh or update every affected screen.
- User-visible state must survive navigation and relaunch where persistence is expected.
- The static Expo release build must generate valid iOS and Android bundles, manifests, and assets.
- Production build tooling must select an available Metro port rather than assuming 8081.

## 13. Analytics and success metrics

### Activation

- Percentage of users completing onboarding
- Time from first launch to completed profile
- Percentage of users reaching the home dashboard after onboarding

### Engagement

- Weekly active users
- Returning users after 7 and 30 days
- Weekly guidance views
- Kick sessions started and completed
- Symptoms logged per active user
- Appointments created and completed
- Benefits pages viewed
- Eligibility checks completed

### Trust and quality

- Crash-free sessions
- API error rate
- Percentage of sessions reaching an error state
- Export health report completion rate
- User-reported content corrections
- Support requests related to privacy or medical misunderstanding

### Suggested beta targets

- 70%+ onboarding completion
- 40%+ seven-day return rate among users who complete onboarding
- 50%+ of active users logging at least one tracking event during the first week
- Less than 1% client-visible API failure rate on supported flows
- Zero known critical privacy or authentication vulnerabilities

## 14. Quality and acceptance criteria

### User acceptance tests

1. A first-time user can complete onboarding without assistance.
2. Changing the due date updates pregnancy week, trimester, dashboard content, and suggested appointments.
3. A kick recorded from the Track screen is visible in the current session and history.
4. A symptom saved from the tracker remains after leaving and returning to the screen.
5. An appointment created by the user appears under Upcoming.
6. Completing an appointment moves it to Completed.
7. The eligibility checker accepts valid answers and explains its result.
8. Profile edits remain after the app is closed and reopened.
9. The health report export starts successfully on supported devices.
10. The app remains usable on a 375-point-wide phone screen.

### Release verification

- Typecheck passes.
- iOS production bundle passes.
- Android production bundle passes.
- Static server responds to landing page and both platform manifests.
- Mobile workflow starts cleanly.
- No critical browser or Metro errors.
- App icon and splash assets are present.
- Production API domain and environment values are configured.
- Admin authentication is secure or the admin route is excluded from the public build.

## 15. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Benefits information becomes outdated | Users may receive incorrect guidance | Add content ownership, review dates, source links, and visible freshness language |
| Users interpret tracking as diagnosis | Potential health harm | Use safety copy, escalation guidance, and clinical review |
| Sensitive pregnancy data is exposed | Loss of trust and privacy harm | Minimize collection, use authenticated access, avoid PII logs, and provide deletion |
| Admin route is bypassed | Content and analytics may be compromised | Move authentication and authorization to the server |
| Poor connectivity prevents logging | Users abandon tracking | Add resilient loading/error states and consider offline queueing |
| Generic content feels irrelevant | Low retention | Localize content and validate weekly actions with Indian users |
| Reminder permissions are denied | Missed appointments | Keep in-app appointment visibility useful without notifications |

## 16. Launch plan

### Phase 1 — private pilot

- Test with a small group of pregnant users in India.
- Validate onboarding, weekly content, kick tracking, appointments, and benefits comprehension.
- Collect feedback on language, medical safety, and trust.

### Phase 2 — controlled beta

- Resolve admin authentication.
- Add monitoring and support process.
- Review legal/privacy copy and content sources.
- Publish a controlled mobile beta.

### Phase 3 — public launch

- Publish after security, content, and medical-safety review.
- Add onboarding feedback and support links.
- Track activation, retention, error rate, and benefits-content corrections.

## 17. Open questions

1. Will the initial launch support English only, or should Hindi and another regional language be included?
2. Which clinical or maternal-health expert will review pregnancy content?
3. Which states and benefit schemes should receive the deepest eligibility coverage first?
4. Should users create accounts, or should the app remain local-first for the initial beta?
5. What reminder channels are acceptable: local notifications, SMS, email, or in-app only?
6. Should the admin functionality ship in the mobile app, or move to a separate secured web console?
7. What is the intended data-retention and deletion policy?

## 18. Current readiness summary

The core mobile experience is implemented and the iOS and Android production bundles build successfully. The current highest-priority launch item is replacing the prototype client-side admin authentication with secure server-side authentication, or removing the admin route from the public mobile build.