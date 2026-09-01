---
name: Mobile release builds
description: Environment constraint for reliable static Expo bundle generation in this workspace
---

Static Expo bundle generation must not assume Metro can bind to port 8081. Other preview services may already use that port, so the build helper should select an available local port and use it consistently for Metro health checks, bundles, manifests, and assets.

**Why:** A release build failed only because the mockup preview already owned port 8081; Expo then prompted for another port in non-interactive mode.

**How to apply:** Keep Metro port selection automatic in the mobile build script and verify both iOS and Android bundles after changes.