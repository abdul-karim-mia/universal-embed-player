// Dailymotion embed protocol — NOT USED.
//
// The new Dailymotion embed endpoint at geo.dailymotion.com/player.html?video=X
// uses a client-side JS player (Preact / "Photon" platform) wrapping a native
// <video> element. It does NOT expose a postMessage control bridge.
//
// The legacy endpoint www.dailymotion.com/embed/video/X supported ?api=1 and
// ?api=postMessage for postMessage-based control, but it has been fully
// redirected to geo.dailymotion.com since February 3, 2026 (see migration
// guide: developers.dailymotion.com/reference/migration-guide-new-embed-endpoint).
// Query params are stripped during the redirect.
//
// Dailymotion is rendered as a plain iframe with controllable: false, handled
// by the generic fallback path in iframe.js when no protocol matches. This
// file is kept for historical reference.
//
// Verified by inspecting the actual player.html page (v0.45.0):
//   - Renders a <video> element with HLS playback
//   - Player config is server-generated JSON (autostart, controls, etc.)
//   - No postMessage event listeners or external control API
//   - Built-in controls exist (enablePlaybackControls: true)
