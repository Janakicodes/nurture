# Nurture Process Flow Diagrams

These diagrams describe the implemented Nurture pregnancy companion flows.
They are intentionally written in Mermaid so they remain editable in GitHub,
Markdown editors, and documentation tools that support Mermaid.

## 1. High-level user journey

```mermaid
flowchart LR
  subgraph USER["Woman / user"]
    U1["Open Nurture"]
    U2["Create local profile"]
    U3["Track pregnancy journey"]
    U4["Review maternity benefits"]
    U5["Export, logout, or delete data"]
    U1 --> U2 --> U3 --> U4 --> U5
  end

  subgraph APP["Nurture app"]
    A1["Hydrate device storage"]
    A2["Calculate due date and current week"]
    A3["Dashboard: weekly guidance and local logs"]
    A4["Local kicks, symptoms, and appointments"]
    A5["Clear private records"]
    A1 --> A2 --> A3 --> A4 --> A5
  end

  subgraph API["Public API"]
    P1["Weekly guidance"]
    P2["Benefits catalog"]
    P3["Stateless eligibility check"]
    P4["Aggregate anonymous analytics"]
  end

  U1 -.-> A1
  U2 -.-> A2
  U3 -.-> A3
  U4 -.-> A4
  U5 -.-> A5
  A3 --> P1
  A4 --> P2
  A4 --> P3
  A3 -. opt-in only .-> P4
```

## 2. Private data boundary

```mermaid
flowchart LR
  subgraph DEVICE["On-device / private"]
    D1["Name, due date, and LMP"]
    D2["Kick sessions and symptoms"]
    D3["Appointments and notes"]
    D4["Export, logout, and deletion"]
    D5[("AsyncStorage private store")]
    D1 --> D5
    D2 --> D5
    D3 --> D5
    D4 --> D5
  end

  subgraph NETWORK["API / public or aggregate"]
    N1["Weekly content"]
    N2["Benefits list and sources"]
    N3["Eligibility request and response"]
    N4["Allowlisted anonymous event"]
    N5[("Event type and timestamp only")]
    N1 --> N5
    N2 --> N5
    N3 --> N5
    N4 --> N5
  end

  D5 -. never uploaded .-> NETWORK
  APP["Nurture app"] --> N1
  APP --> N2
  APP --> N3
  APP -. consent required .-> N4
```

### Data that must never cross the private boundary

- Profile details
- Due dates or last menstrual period dates
- Kick or symptom records
- Appointment details or notes
- Eligibility answers as a stored user record
- User IDs, install IDs, or other identifiers

## 3. Benefits eligibility flow

```mermaid
flowchart LR
  subgraph USER["User"]
    B1["Open Benefits"]
    B2["Browse schemes"]
    B3["Answer eligibility form"]
    B4["Review matched support"]
    B1 --> B2 --> B3 --> B4
  end

  subgraph APP["Nurture app"]
    BA1["Fetch public scheme list"]
    BA2["Show scheme source and target"]
    BA3["Send form for one check"]
    BA4["Display results in session"]
    BA1 --> BA2 --> BA3 --> BA4
  end

  subgraph API["Public API"]
    BP1["Benefits endpoint"]
    BP2["Eligibility endpoint"]
    BP3["Return eligible schemes"]
    BP4["Do not persist answers"]
    BP1 --> BP2 --> BP3 --> BP4
  end

  B1 -.-> BA1
  B2 -.-> BA2
  B3 -.-> BA3
  B4 -.-> BA4
  BA1 --> BP1
  BA3 --> BP2
  BP3 --> BA4
```

Eligibility answers are used to calculate the response and are not stored as
part of the user's private pregnancy profile.

## 4. Anonymous analytics and admin flow

```mermaid
flowchart LR
  subgraph MOBILE["Mobile app"]
    M1["Consent defaults off"]
    M2["User opts in"]
    M3["Allowlisted event occurs"]
    M4["No event sent"]
    M1 --> M2 --> M3
    M1 -. if consent remains off .-> M4
  end

  subgraph SERVER["API and database"]
    S1["Receive event"]
    S2[("Store event type and timestamp")]
    S3["Aggregate last 30 days"]
    S4["No IDs or health fields"]
    S1 --> S2 --> S3 --> S4
  end

  subgraph ADMIN["Admin view"]
    AD1["Total events"]
    AD2["Active days"]
    AD3["Event-type counts"]
    AD4["Daily counts"]
  end

  M3 --> S1
  S4 --> AD1
  S4 --> AD2
  S4 --> AD3
  S4 --> AD4
```

The admin view contains product-level aggregates only. It must not expose
pregnancy, symptom, kick, appointment, profile, or eligibility records.

## Source-of-truth notes

- Private pregnancy and health records are stored locally on the device.
- Weekly content and benefits catalog data are public API-backed content.
- Benefits eligibility checks are stateless.
- Analytics is opt-in, allowlisted, identifier-free, and aggregate-only.
- Admin authentication still requires production security hardening before a
  public launch.