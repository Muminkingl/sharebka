# PairDrop unresolved bug remediation plan

## Implemented in this branch

The first remediation pass is implemented in the working tree: trusted proxy
address handling and public-room validation (`server/peer.js`,
`server/ws-server.js`), endpoint-scoped IndexedDB data, reconnect/visibility
guards, transfer IDs and post-validation completion acknowledgements, safer
thumbnail/download handling, mobile clipboard and IME handling, stale service
worker invalidation, notification click routing, dialog accessibility, and
streamed CLI base64 encoding. The browser/proxy/TURN matrix in the later
phases still needs deployment-specific verification before those issue numbers
can be marked closed upstream.

Audit date: 2026-10-03. Source: the open issue list and the issue reports in the upstream PairDrop repository. The audit found 77 open issues, including 35 issues titled `[Bug]`, 36 issues carrying the `bug` label, and the unlabelled security issue [#510](https://github.com/schlagmichdoch/PairDrop/issues/510).

This is a remediation plan, not a claim that every report is reproducible. Each item must end in one of four evidence-backed outcomes: fixed with a regression test, fixed by deployment/documentation changes, reproduced as an upstream browser or network limitation with a supported fallback, or closed as stale/non-reproducible/duplicate.

## Release gates

1. **Security gate:** close the IP-room spoofing and room-secret isolation paths before public deployment.
2. **Connection gate:** prove reconnect, page-resume, proxy, and room-switch behavior with a signaling test server and a reverse-proxy test matrix.
3. **Transfer gate:** prove single-file, repeated-file, multi-file, iOS-photo, large-file, and interrupted-transfer behavior with byte-for-byte checksums.
4. **Browser gate:** run the same cases on Chromium desktop/mobile, Firefox, Safari macOS, iOS Safari/PWA, and iPadOS PWA. Use BrowserStack or physical Apple devices for cases that cannot be simulated locally.
5. **PWA/cache gate:** deploy a versioned service-worker strategy that cannot mix old `main.js`, `ui.js`, `index.html`, and Next.js assets.
6. **Operations gate:** test Oracle, Docker, Nginx, Cloudflare Tunnel, and coturn configurations with explicit proxy and WebSocket settings.

## Phase 0 — instrumentation and test harness

- Add a transfer/session correlation ID to browser logs and signaling messages. Record connection state, ICE candidate type, selected candidate pair, WebSocket close reason, data-channel state, file ID, chunk sequence, and checksum; never log file contents or room secrets.
- Add a deterministic fake signaling server and fake `RTCPeerConnection`/data-channel adapter for unit tests. Add real browser smoke tests for the WebSocket and WebRTC paths.
- Build a proxy matrix: direct, Nginx with WebSocket upgrade, Cloudflare Tunnel, and a proxy that supplies `X-Forwarded-For`. Test local IP rooms, public rooms, pairing, reconnect, and TURN.
- Add fixtures for Unicode filenames, rejected and repeated transfers, 100+ files, large files, iOS share-target payloads, and the problematic archive from issue #332.

## Phase 1 — security and room correctness (P0)

| Issue | Finding | Planned remediation |
| --- | --- | --- |
| [#510](https://github.com/schlagmichdoch/PairDrop/issues/510) | `server/peer.js` trusts a client-supplied `cf-connecting-ip`; an attacker can enter another IP room. | Use the socket address by default. Parse `X-Forwarded-For` only when an explicit trusted-proxy mode is enabled. Parse `cf-connecting-ip` only with an explicit Cloudflare mode. Validate IPs, document the proxy contract, and add spoofing tests. |
| [#269](https://github.com/schlagmichdoch/PairDrop/issues/269) | Paired room secrets are not scoped to the signaling endpoint. | Add the normalized signaling origin/path to the IndexedDB record, migrate the database, filter secrets by endpoint, and test switching between signaling servers. |
| [#298](https://github.com/schlagmichdoch/PairDrop/issues/298) | Public-room membership can leave stale peer/room state. | Make join/leave idempotent on both client and server, send explicit room membership updates, remove stale room IDs from peer objects, and add a two-room integration test. |
| [#497](https://github.com/schlagmichdoch/PairDrop/issues/497) | Public-room joining fails in a self-hosted reverse-proxy deployment. | Reproduce through a proxy, verify WebSocket upgrade and path rewriting, normalize room IDs at both ends, add connection/room diagnostics, and fix proxy configuration/documentation where the application is not at fault. |
| [#333](https://github.com/schlagmichdoch/PairDrop/issues/333) | Cloudflare Tunnel/UnRAID deployments do not discover local peers. | Use the same trusted-proxy/IP-room work as #510, add a documented Tunnel configuration, and provide a public-room fallback when the proxy cannot preserve client IPs. |
| [#455](https://github.com/schlagmichdoch/PairDrop/issues/455) | Large coturn UDP port mappings can exhaust Docker startup/resources. | Provide a tested, bounded port-range compose profile, explain host/container port mapping and coturn limits, and measure startup/memory behavior. Treat arbitrary Docker daemon exhaustion as an operations constraint. |

## Phase 2 — connection lifecycle and startup reliability (P0/P1)

| Issue | Finding | Planned remediation |
| --- | --- | --- |
| [#515](https://github.com/schlagmichdoch/PairDrop/issues/515) | `navigator.connection.change` unconditionally closes a usable WebSocket during transfers. | Stop reconnecting on informational network-quality changes. Reconnect only for a closed/unresponsive socket or confirmed offline/online transition; add a transfer-aware grace period and tests with changing RTT. |
| [#498](https://github.com/schlagmichdoch/PairDrop/issues/498) | `_onVisibilityChange()` checks the property name instead of `document[hiddenProperty]`; iPadOS can resume a zombie socket. | Correct the visibility check, add a client ping/pong liveness timeout, discard zombie sockets on resume, reconnect with bounded exponential backoff, and rejoin IP/secret/public rooms after reconnect. |
| [#247](https://github.com/schlagmichdoch/PairDrop/issues/247) | Mobile file pickers/backgrounding make a connected peer appear offline. | Add a page-lifecycle state machine with a picker/background grace period, avoid destroying a usable peer while the picker is open, and show an explicit reconnect state when the OS suspends the page. |
| [#501](https://github.com/schlagmichdoch/PairDrop/issues/501) | Firefox saw mixed cached assets (`AboutUI` missing); clearing site data fixed it. | Version every service-worker cache, precache an atomic manifest, use network-first navigation, delete old caches on activation, and add a startup fallback/error screen. Test upgrades from every previous cache version. |
| [#423](https://github.com/schlagmichdoch/PairDrop/issues/423) | Some Firefox users receive a blank page. | Remove the permanent opacity-0 failure mode, catch deferred-asset errors, surface a retry/reset-cache action, and capture startup diagnostics. Test a blocked/stale service-worker response. |
| [#352](https://github.com/schlagmichdoch/PairDrop/issues/352) | Discovery failures reported with Windows 11 24H2. | Reproduce across direct/proxied/paired/public-room paths, record IP/ICE/room diagnostics, then fix the failing layer. Do not change discovery semantics without a regression test. |
| [#410](https://github.com/schlagmichdoch/PairDrop/issues/410) | Safari-to-Safari transfers outside one LAN fail. | Verify TURN credentials, Safari ICE behavior, and public-room signaling independently. Fix RTC configuration or coturn deployment where needed and document unsupported Safari constraints. |

## Phase 3 — transfer correctness and performance (P0/P1)

| Issue | Finding | Planned remediation |
| --- | --- | --- |
| [#426](https://github.com/schlagmichdoch/PairDrop/issues/426) | Rejecting a file prevents resending the same file. | Give every transfer a unique ID, reset rejected-request state, and key queues by transfer ID rather than filename/hash. Add reject-then-resend tests. |
| [#328](https://github.com/schlagmichdoch/PairDrop/issues/328) | Transfers disappear at 100% or abort near completion. | Add an explicit finalize/ack handshake, wait for data-channel buffered bytes to drain, verify the received checksum before declaring success, and preserve a retryable completed file. |
| [#332](https://github.com/schlagmichdoch/PairDrop/issues/332) | A particular file makes the peer disappear. | Reproduce with the supplied archive, validate MIME/name/size metadata, isolate decoder/preview failures from transport failures, and make malformed file metadata fail the transfer rather than the peer session. |
| [#336](https://github.com/schlagmichdoch/PairDrop/issues/336) | iOS photo-gallery transfers reload Safari. | Measure memory during image preparation, stream or downscale previews, release object URLs/workers, and add an iOS-specific path that avoids holding duplicate full-size buffers. |
| [#340](https://github.com/schlagmichdoch/PairDrop/issues/340) | Large multi-file sends can trigger Chrome's ten-download limit. | Always package more than one received file into one ZIP, wait for every file and checksum before enabling download, and add a one-click fallback for browsers that cannot auto-download. |
| [#359](https://github.com/schlagmichdoch/PairDrop/issues/359), [#244](https://github.com/schlagmichdoch/PairDrop/issues/244), [#387](https://github.com/schlagmichdoch/PairDrop/issues/387) | Mobile-to-desktop and IPv6 transfers can be much slower than the reverse direction. | Log selected ICE pair and data-channel backpressure, tune chunk size and pacing, avoid unnecessary WebSocket/TURN fallback, and benchmark LAN IPv4, LAN IPv6, STUN, and TURN separately. |
| [#425](https://github.com/schlagmichdoch/PairDrop/issues/425) | iOS 12 completes a transfer without starting a download. | Add feature detection and a legacy Blob/anchor download fallback; if iOS 12 cannot support it reliably, show a save/share instruction instead of a false success. |
| [#398](https://github.com/schlagmichdoch/PairDrop/issues/398) | iOS shortcut filenames with non-ASCII or apostrophe characters are corrupted. | Keep filenames as UTF-8 strings end-to-end, remove unsafe URI encode/decode steps, test NFC/NFD Unicode and apostrophes, and verify the downloaded `File.name`. |
| [#370](https://github.com/schlagmichdoch/PairDrop/issues/370) | Pasting images does not work on mobile. | Detect the available Clipboard API, handle `ClipboardItem` image blobs, and provide a file-picker/share-target fallback when mobile browsers deny clipboard reads. |
| [#503](https://github.com/schlagmichdoch/PairDrop/issues/503), [#391](https://github.com/schlagmichdoch/PairDrop/issues/391) | The external iOS Shortcut/share flow opens the wrong UI or fails to open the PWA. | Verify the published shortcut's input type and URL construction, then make the manifest/service-worker share target unambiguous for one PDF, multiple files, and an already-open PWA. Publish an updated shortcut when the defect is outside the web app. |
| [#392](https://github.com/schlagmichdoch/PairDrop/issues/392) | Windows Share Target fails when the PWA is already open. | Handle `launchQueue`/`launch_handler` focus-existing behavior, queue incoming files in IndexedDB before focusing the existing client, and add an already-open PWA test. |
| [#401](https://github.com/schlagmichdoch/PairDrop/issues/401), [#400](https://github.com/schlagmichdoch/PairDrop/issues/400), [#399](https://github.com/schlagmichdoch/PairDrop/issues/399) | Notification text and click actions do not reflect download state, focus the page, or copy text. | Add service-worker notification-click handlers that focus/open the client and pass a one-time action payload. Mark auto-downloaded files separately, defer clipboard writes until the focused page has user activation, and test notification behavior per browser. |
| [#443](https://github.com/schlagmichdoch/PairDrop/issues/443) | CLI can consume excessive RAM while preparing transfers. | Profile the shell script, remove unnecessary whole-file/base64 copies, stream archive creation where possible, clean temporary files on signals, and retain the upstream `wontfix` decision if the supported CLI design cannot meet the requested memory bound. |

## Phase 4 — persistence, localization, UI, and accessibility (P1/P2)

| Issue | Finding | Planned remediation |
| --- | --- | --- |
| [#351](https://github.com/schlagmichdoch/PairDrop/issues/351) | Edited display names sometimes disappear after weeks. | Make IndexedDB initialization a shared readiness promise, use a namespaced localStorage fallback, validate migrations, and add persistence tests across reload, browser restart, and storage upgrade. |
| [#408](https://github.com/schlagmichdoch/PairDrop/issues/408) | iOS Chinese input can duplicate room-code characters. | Make code entry composition-aware (`compositionstart/update/end`), ignore synthetic duplicate `input` events, and test IME input on iOS Safari. |
| [#397](https://github.com/schlagmichdoch/PairDrop/issues/397) | Older iOS cannot scroll dialogs. | Replace brittle fixed-height/overflow rules with touch-scrolling modal containers and keyboard-safe viewport sizing; test the smallest supported iOS viewport. |
| [#396](https://github.com/schlagmichdoch/PairDrop/issues/396) | RTL direction can remain after switching back to LTR on old iOS. | Set `dir="ltr"` explicitly instead of only removing the attribute, and add an Arabic-to-English regression test. |
| [#395](https://github.com/schlagmichdoch/PairDrop/issues/395) | Background canvas can be empty after a stale tab resumes. | Reinitialize the worker and canvas on `pageshow`/visibility resume, resize before drawing, and provide a CSS/static fallback if the worker is unavailable. |
| [#393](https://github.com/schlagmichdoch/PairDrop/issues/393) | Discovery panel does not stack on narrow screens. | Add a breakpoint based on available panel width, allow badge text to wrap, and test 320px/320px RTL layouts. |
| [#335](https://github.com/schlagmichdoch/PairDrop/issues/335) | Screen readers can reach dialogs that are visually hidden. | Use `hidden`, `aria-hidden`, `inert`, focus trapping, and restoration of focus. Add automated keyboard/accessibility checks. |
| [#325](https://github.com/schlagmichdoch/PairDrop/issues/325) | Header icon theme color changes lag behind the theme. | Apply the theme class and CSS variables before revealing the UI, remove conflicting transitions during initialization, and add a visual regression check. |
| [#240](https://github.com/schlagmichdoch/PairDrop/issues/240) | Grey line report is marked not reproducible. | Re-test current Next.js layout at the reported Firefox viewport; close with evidence if it no longer reproduces. |

## Triage-only items

- [#458](https://github.com/schlagmichdoch/PairDrop/issues/458) is a duplicate/native-app request, not a web bug. Keep it out of the web release unless a native client becomes an explicit product scope.
- [#501](https://github.com/schlagmichdoch/PairDrop/issues/501) and [#240](https://github.com/schlagmichdoch/PairDrop/issues/240) require reproduction evidence before code changes.
- [#503](https://github.com/schlagmichdoch/PairDrop/issues/503) and [#391](https://github.com/schlagmichdoch/PairDrop/issues/391) may require updating the externally published iOS Shortcut in addition to web code.
- Browser/OS limitations, TURN reachability, Docker port exhaustion, and unsupported iOS versions must receive a tested fallback and clear documentation rather than a misleading “fixed” claim.

## Implementation order

1. Freeze the current branch and add the instrumentation/test harness.
2. Fix #510, #269, #298, #497, and #333; deploy no public instance before the security tests pass.
3. Fix #515, #498, #247, #501, and #423; replace the service-worker cache strategy before validating the Next.js frontend/PWA.
4. Fix transfer identity/finalization and multi-file packaging (#426, #328, #332, #340), then address mobile/iOS transfer memory and download behavior.
5. Fix share-target, notifications, filename encoding, clipboard, and CLI issues.
6. Fix persistence, localization, accessibility, responsive layout, canvas, and theme polish.
7. Run the full browser/proxy/TURN matrix, update deployment docs, and publish a release checklist with known platform limitations.

## Definition of done

Every candidate issue has a linked test or reproduction record, the security issues have negative tests, transfer tests compare checksums, reconnect tests prove room rejoin without stale peers, service-worker upgrades are tested from old caches, and deployment examples work with the Next.js frontend on Vercel and the signaling server on Oracle.
