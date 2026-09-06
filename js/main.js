(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var nav = qs("#nav");
  var toggle = qs(".nav-toggle");
  var mobile = qs("#nav-mobile");

  function onScroll() {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && mobile) {
    toggle.addEventListener("click", function () {
      var open = !mobile.classList.contains("is-open");
      mobile.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    qsa("a", mobile).forEach(function (a) {
      a.addEventListener("click", function () {
        mobile.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  var cursor = qs(".cursor");
  if (cursor && window.matchMedia("(pointer: fine)").matches) {
    document.documentElement.classList.add("has-cursor");
    var x = 0, y = 0, cx = 0, cy = 0;
    window.addEventListener("mousemove", function (e) {
      x = e.clientX;
      y = e.clientY;
      cursor.classList.add("is-on");
    }, { passive: true });
    document.addEventListener("mouseleave", function () { cursor.classList.remove("is-on"); });
    document.addEventListener("mouseover", function (e) {
      cursor.classList.toggle("is-hover", !!e.target.closest("a, button, input, textarea, select"));
    });
    function tick() {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      cursor.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(tick);
    }
    if (!reduce) tick();
    else {
      window.addEventListener("mousemove", function () {
        cursor.style.transform = "translate(" + x + "px," + y + "px)";
      }, { passive: true });
    }
  }

  qsa(".section, .hero-copy, .arch, .nb, .caps-grid, .flow, .horizon-groups, .who-arch, .store-panel").forEach(function (el) {
    el.classList.add("reveal");
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
    qsa(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    qsa(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  var stack = qs("[data-stack]");
  var layers = qsa(".layer", stack);
  function setLayer(i) {
    layers.forEach(function (el, n) { el.classList.toggle("is-on", n === i); });
  }
  if (stack && layers.length) {
    function updateStack() {
      var rect = stack.getBoundingClientRect();
      var h = Math.max(1, rect.height - window.innerHeight);
      var p = Math.min(1, Math.max(0, -rect.top / h));
      setLayer(Math.min(layers.length - 1, Math.floor(p * layers.length)));
    }
    updateStack();
    window.addEventListener("scroll", updateStack, { passive: true });
  }

  var nb = qs("[data-nb]");
  var states = [
    {
      id: "browse",
      url: "newage://start",
      tab: 0,
      start: true,
      prompt: "Ready. Local model loaded. Waiting for a task.",
      log: ["Start page", "Local runtime idle", "Memory available", "Awaiting intent"]
    },
    {
      id: "local",
      url: "newage://runtime",
      tab: 0,
      start: true,
      prompt: "Reasoning locally. No page action until the plan is confirmed.",
      log: ["Model: Qwen3-8B Instruct", "GGUF · llama.cpp", "Context assembled", "Plan ready"]
    },
    {
      id: "execute",
      url: "https://example.com/workflow",
      tab: 1,
      start: false,
      title: "Task in progress",
      copy: "The agent issues a structured action, then checks that the page responded as expected.",
      prompt: "Complete the workflow. Navigate, extract, and confirm before continuing.",
      log: ["Goal received", "Page observed", "Action verified", "Continue"]
    },
    {
      id: "auto",
      url: "newage://automation",
      tab: 1,
      start: false,
      title: "Browser automation",
      copy: "Navigate, click, type, scroll, and move across tabs — observing each page as it changes.",
      prompt: "Open the form, fill the required fields, and submit only after verification.",
      log: ["Tab focused", "Element located", "Input typed", "Submit pending"]
    },
    {
      id: "control",
      url: "newage://controlled",
      tab: 1,
      start: false,
      title: "Controlled environment",
      copy: "Actions are structured. Sensitive steps wait for user direction. Failed actions recover before the task continues.",
      prompt: "Hold before any destructive action. Verify, then resume.",
      log: ["Observe", "Act", "Verify", "Recover"]
    },
    {
      id: "workflow",
      url: "newage://workflows",
      tab: 2,
      start: false,
      title: "Multi-step workflow",
      copy: "Goal. Reason. Act. Observe. Verify. Recover. Continue — the same loop, across a longer task.",
      prompt: "Run the full sequence. Do not skip verification.",
      log: ["Step 01 complete", "Step 02 complete", "Step 03 live", "Step 04 queued"]
    },
    {
      id: "secure",
      url: "newage://private",
      tab: 0,
      start: true,
      prompt: "Private session. Memory stays local and is used only at your direction.",
      log: ["Isolation on", "Local memory", "No remote execution required", "Environment controlled"]
    }
  ];

  function applyState(i) {
    if (!nb) return;
    var s = states[i];
    nb.setAttribute("data-state", s.id);
    var url = qs("[data-url]", nb);
    if (url) url.textContent = s.url;
    qsa("[data-tab]", nb).forEach(function (t, n) { t.classList.toggle("is-on", n === s.tab); });
    var start = qs("[data-view='start']", nb);
    var doc = qs("[data-view='doc']", nb);
    if (start) start.hidden = !s.start;
    if (doc) doc.hidden = !!s.start;
    if (!s.start) {
      var title = qs("[data-doc-title]", nb);
      var copy = qs("[data-doc-copy]", nb);
      if (title) title.textContent = s.title;
      if (copy) copy.textContent = s.copy;
    }
    var prompt = qs("[data-prompt]", nb);
    if (prompt) prompt.textContent = "“" + s.prompt + "”";
    var items = qsa("[data-log] li", nb);
    items.forEach(function (li, n) {
      li.classList.toggle("is-done", n < 2);
      li.classList.toggle("is-live", n === 2);
      li.innerHTML = "<span>0" + (n + 1) + "</span> " + (s.log[n] || "");
    });
    qsa("[data-nb-state]").forEach(function (b, n) { b.classList.toggle("is-on", n === i); });
  }

  var stateIdx = 0;
  qsa("[data-nb-state]").forEach(function (btn, i) {
    btn.addEventListener("click", function () {
      stateIdx = i;
      applyState(i);
    });
  });
  if (nb) applyState(0);
  if (nb && !reduce) {
    setInterval(function () {
      stateIdx = (stateIdx + 1) % states.length;
      applyState(stateIdx);
    }, 4800);
  }

  var form = qs("#contact-form");
  if (form) {
    var note = qs("#form-note");
    var success = qs("#form-success");
    var submitBtn = qs("#form-submit");
    var subject = qs("#form-subject");
    var nextField = qs("#form-next");
    var topic = qs("#topic");
    var emailField = qs("#email");
    var messageField = qs("#message");
    var emailError = qs("#email-error");
    var messageError = qs("#message-error");
    var endpoint = "https://formspree.io/f/mljewjwy";

    function setSubject() {
      if (subject && topic) subject.value = "NEWAGE-EX — " + topic.value;
    }
    function setNext() {
      if (nextField) {
        nextField.value = window.location.pathname.split("?")[0] + "?sent=1";
        try {
          nextField.value = window.location.origin + nextField.value;
        } catch (err) {}
      }
    }
    if (topic) topic.addEventListener("change", setSubject);
    setSubject();
    setNext();

    function showSuccess() {
      if (form) form.hidden = true;
      if (success) success.hidden = false;
    }

    if (/[?&]sent=1(?:&|$)/.test(window.location.search)) {
      showSuccess();
    }

    function showNote(text, isError) {
      if (!note) return;
      note.hidden = false;
      note.textContent = text;
      note.classList.toggle("is-error", !!isError);
    }

    function setFieldError(field, el, text) {
      if (el) {
        el.hidden = !text;
        el.textContent = text || "";
      }
      if (field) field.setAttribute("aria-invalid", text ? "true" : "false");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setFieldError(emailField, emailError, "");
      setFieldError(messageField, messageError, "");
      if (note) note.hidden = true;

      if (emailField && (!emailField.value || emailField.value.indexOf("@") === -1)) {
        setFieldError(emailField, emailError, "Enter a valid email address.");
        emailField.focus();
        return;
      }
      if (messageField && !messageField.value.trim()) {
        setFieldError(messageField, messageError, "Enter a message.");
        messageField.focus();
        return;
      }

      setSubject();
      setNext();
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      var payload = new FormData(form);
      payload.delete("_gotcha");

      fetch(endpoint, {
        method: "POST",
        body: payload,
        headers: { Accept: "application/json" }
      }).then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        }).catch(function () {
          return { ok: res.ok, data: {} };
        });
      }).then(function (result) {
        if (result.ok) {
          showSuccess();
          return;
        }
        var errors = (result.data && result.data.errors) || [];
        var general = "";
        errors.forEach(function (err) {
          var field = (err.field || "").toLowerCase();
          var msg = err.message || "This field needs attention.";
          if (field === "email") setFieldError(emailField, emailError, msg);
          else if (field === "message") setFieldError(messageField, messageError, msg);
          else general = general || msg;
        });
        showNote(general || "The message could not be sent. Try again, or email newageex@gmail.com.", true);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send message";
        }
      }).catch(function () {
        form.submit();
      });
    });
  }
})();
