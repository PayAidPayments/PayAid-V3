import { NextResponse } from 'next/server'

function getWsBaseUrl() {
  const u =
    process.env.NEXT_PUBLIC_PAYAID_VOICE_WS_URL ||
    process.env.PAYAID_VOICE_WS_URL ||
    process.env.NEXT_PUBLIC_VOICE_WS_URL
  if (u && String(u).trim()) return String(u).replace(/\/+$/, '')
  return 'wss://voice-api.payaid.com/ws/web'
}

function js(): string {
  const wsBaseUrl = getWsBaseUrl()

  return `(function () {
  var currentScript = document.currentScript;
  if (!currentScript) return;

  var scriptSrc = currentScript.getAttribute("src") || "";
  var apiOrigin = "";
  try {
    apiOrigin = new URL(scriptSrc, window.location && window.location.href ? window.location.href : undefined).origin;
  } catch (e) {
    apiOrigin = "";
  }

  var agentId = currentScript.getAttribute("data-agent");
  if (!agentId) {
    console.error("PayAid Voice: data-agent missing on script tag");
    return;
  }

  var renderMode = currentScript.getAttribute("data-render") || "floating"; // floating | inline
  var source = currentScript.getAttribute("data-source") || (renderMode === "inline" ? "share_link" : "embed");
  var position = currentScript.getAttribute("data-position") || "bottom-right";
  var color = currentScript.getAttribute("data-color") || "";

  var ws = null;
  var mediaStream = null;
  var mediaRecorder = null;
  var isConnected = false;
  var statusEl = null;
  var talkBtn = null;
  var stopBtn = null;

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function safeJsonParse(s) {
    try { return JSON.parse(s); } catch (e) { return null; }
  }

  function applyTheme(t) {
    if (!t) return;
    if (!color && typeof t.color === "string" && t.color) color = t.color;
    if (typeof t.position === "string" && t.position) position = t.position;
  }

  function fetchThemeIfNeeded() {
    if (color) return Promise.resolve(null);
    try {
      var base = apiOrigin || "";
      var url = base + "/api/public/agents/" + encodeURIComponent(agentId);
      return fetch(url, { method: "GET", headers: { "accept": "application/json" } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (data && data.theme) applyTheme(data.theme);
          return data;
        })
        .catch(function () { return null; });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "style") {
          Object.assign(node.style, attrs.style);
        } else if (k === "className") {
          node.className = attrs.className;
        } else if (k.startsWith("data-")) {
          node.setAttribute(k, attrs[k]);
        } else {
          node[k] = attrs[k];
        }
      });
    }
    if (children && children.length) {
      children.forEach(function (c) {
        if (typeof c === "string") node.appendChild(document.createTextNode(c));
        else if (c) node.appendChild(c);
      });
    }
    return node;
  }

  function mountInline(root) {
    var panel = el("div", { style: {
      border: "1px solid rgba(226,232,240,1)",
      borderRadius: "16px",
      padding: "16px",
      background: "white"
    }});

    var header = el("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" } }, [
      el("div", null, [
        el("div", { style: { fontSize: "12px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b" } }, ["Voice session"]),
        (statusEl = el("div", { style: { marginTop: "6px", fontSize: "14px", fontWeight: "600", color: "#0f172a" } }, ["Idle"]))
      ])
    ]);

    var actions = el("div", { style: { marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" } }, [
      (talkBtn = el("button", { type: "button", style: {
        background: color || "#2563eb",
        color: "white",
        border: "none",
        borderRadius: "9999px",
        padding: "10px 14px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer"
      } }, ["Start talking"])),
      (stopBtn = el("button", { type: "button", disabled: true, style: {
        background: "rgba(15,23,42,0.06)",
        color: "#0f172a",
        border: "1px solid rgba(148,163,184,0.35)",
        borderRadius: "9999px",
        padding: "10px 14px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "not-allowed"
      } }, ["Stop"]))
    ]);

    panel.appendChild(header);
    panel.appendChild(actions);
    root.appendChild(panel);

    talkBtn.addEventListener("click", function () { startAudioAndConnect(); });
    stopBtn.addEventListener("click", function () { stopSession(); });
  }

  function mountFloating() {
    var btn = el("div", { id: "payaid-voice-widget", style: {
      position: "fixed",
      zIndex: "2147483647",
      width: "56px",
      height: "56px",
      borderRadius: "9999px",
      backgroundColor: color || "#2563eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.30)"
    }});

    if (position === "bottom-left") {
      btn.style.left = "24px";
      btn.style.bottom = "24px";
    } else {
      btn.style.right = "24px";
      btn.style.bottom = "24px";
    }

    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24">' +
      '<path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/>' +
      '<path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.07A7 7 0 0 0 19 11z"/>' +
      '</svg>';

    btn.addEventListener("click", function () { startAudioAndConnect(); });
    document.body.appendChild(btn);
  }

  function buildWsUrl() {
    var pageUrl = "";
    try { pageUrl = String(window.location && window.location.href || ""); } catch (e) {}
    var qs = "agentId=" + encodeURIComponent(agentId) +
      "&source=" + encodeURIComponent(source) +
      "&pageUrl=" + encodeURIComponent(pageUrl);
    return "${wsBaseUrl}" + (String("${wsBaseUrl}").indexOf("?") >= 0 ? "&" : "?") + qs;
  }

  function stopSession() {
    try {
      if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    } catch (e) {}
    try {
      if (mediaStream) mediaStream.getTracks().forEach(function (t) { t.stop(); });
    } catch (e) {}
    try {
      if (ws && (ws.readyState === 0 || ws.readyState === 1)) ws.close();
    } catch (e) {}
    ws = null;
    mediaStream = null;
    mediaRecorder = null;
    isConnected = false;
    setStatus("Idle");
    if (stopBtn) {
      stopBtn.disabled = true;
      stopBtn.style.cursor = "not-allowed";
      stopBtn.style.opacity = "0.8";
    }
  }

  function playAudioChunk(arrayBuffer) {
    try {
      var blob = new Blob([arrayBuffer], { type: "audio/webm" });
      var url = URL.createObjectURL(blob);
      var audio = new Audio(url);
      audio.onended = function () { try { URL.revokeObjectURL(url); } catch (e) {} };
      audio.play().catch(function () {});
    } catch (e) {}
  }

  function startRecorder(stream) {
    var opts = {};
    try {
      // Prefer opus/webm when available
      if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        opts.mimeType = "audio/webm;codecs=opus";
      } else if (window.MediaRecorder) {
        opts.mimeType = "audio/webm";
      }
    } catch (e) {}

    try {
      mediaRecorder = new MediaRecorder(stream, opts);
    } catch (e) {
      // Fallback without opts
      mediaRecorder = new MediaRecorder(stream);
    }

    mediaRecorder.ondataavailable = function (event) {
      if (!event || !event.data || event.data.size <= 0) return;
      if (!ws || ws.readyState !== 1) return;
      event.data.arrayBuffer().then(function (buf) {
        try { ws.send(buf); } catch (e) {}
      });
    };

    // Chunking interval for low latency; server can reassemble.
    mediaRecorder.start(250);
  }

  function startAudioAndConnect() {
    if (isConnected) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("PayAid Voice: getUserMedia not supported");
      return;
    }

    setStatus("Requesting microphone…");

    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      mediaStream = stream;

      setStatus("Connecting…");
      var wsUrl = buildWsUrl();
      ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";

      ws.onopen = function () {
        isConnected = true;
        setStatus("Listening…");
        if (stopBtn) {
          stopBtn.disabled = false;
          stopBtn.style.cursor = "pointer";
          stopBtn.style.background = "rgba(15,23,42,0.04)";
        }
        // Send a small hello payload for servers that want metadata
        try {
          ws.send(JSON.stringify({ type: "hello", agentId: agentId, source: source }));
        } catch (e) {}
        startRecorder(stream);
      };

      ws.onmessage = function (event) {
        if (!event) return;
        if (typeof event.data === "string") {
          var msg = safeJsonParse(event.data);
          if (msg && typeof msg.status === "string") setStatus(msg.status);
          return;
        }
        // Binary audio from server (TTS chunks)
        playAudioChunk(event.data);
      };

      ws.onclose = function () {
        stopSession();
      };

      ws.onerror = function () {
        setStatus("Connection error");
      };
    }).catch(function (err) {
      console.error("PayAid Voice: mic error", err);
      setStatus("Microphone blocked");
    });
  }

  function init() {
    fetchThemeIfNeeded().then(function () {
      var root = document.getElementById("payaid-voice-root");
      if (renderMode === "inline" || root) {
        if (!root) {
          root = document.createElement("div");
          root.id = "payaid-voice-root";
          document.body.appendChild(root);
        }
        mountInline(root);
      } else {
        mountFloating();
      }
    });
  }

  if (document.readyState === "complete" || document.readyState === "interactive") init();
  else document.addEventListener("DOMContentLoaded", init);
})();`
}

export async function GET() {
  return new NextResponse(js(), {
    status: 200,
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  })
}

