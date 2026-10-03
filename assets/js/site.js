(function () {
  "use strict";

  var config = window.UNSCRAMBLE_FORMS;

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function initNav() {
    var toggle = qs(".nav-toggle");
    var nav = qs("#site-nav");
    if (!toggle || !nav) return;
    var label = qs(".visually-hidden", toggle);
    var desktop = window.matchMedia("(min-width: 960px)");

    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (label) label.textContent = "Menu";
    }

    function open() {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      if (label) label.textContent = "Close menu";
    }

    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) close();
      else open();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });

    qsa("a", nav).forEach(function (link) {
      link.addEventListener("click", close);
    });

    function onChange() {
      if (desktop.matches) close();
    }
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  function digits(value) {
    return (value || "").replace(/\D/g, "");
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function validPhone(value) {
    if (!/^[\d\s()+\-.]+$/.test(value)) return false;
    var count = digits(value).length;
    return count >= 10 && count <= 15;
  }

  function prettyDate(value) {
    if (!value) return "";
    var parts = value.split("-");
    var dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  }

  function prettyTime(value) {
    if (!value) return "";
    var parts = value.split(":");
    var h = Number(parts[0]);
    var m = parts[1] || "00";
    var suffix = h >= 12 ? "pm" : "am";
    var hour = h % 12 || 12;
    return hour + ":" + m + " " + suffix;
  }

  function dash(value) {
    var text = value == null ? "" : String(value).trim();
    return text ? text : "—";
  }

  function setError(id, message) {
    var el = document.getElementById(id);
    var err = document.getElementById(id + "-error");
    if (!el || !err) return;
    var field = el.closest(".field, fieldset, .field-pair") || el.parentElement;
    if (message) {
      err.hidden = false;
      err.textContent = message;
      el.setAttribute("aria-invalid", "true");
      var described = el.getAttribute("data-hint") || "";
      el.setAttribute("aria-describedby", (described + " " + err.id).trim());
      if (field) field.classList.add("is-invalid");
    } else {
      err.hidden = true;
      err.textContent = "";
      el.removeAttribute("aria-invalid");
      if (field) field.classList.remove("is-invalid");
    }
  }

  function clearStep(step) {
    qsa("[id$='-error']", step).forEach(function (err) {
      var id = err.id.replace(/-error$/, "");
      setError(id, "");
    });
  }

  function firstInvalid(step) {
    return qs("[aria-invalid='true']", step);
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function checked(name, root) {
    var el = qs("input[name='" + name + "']:checked", root);
    return el ? el.value : "";
  }

  function initForm(form) {
    var kind = form.getAttribute("data-form");
    var spec = config && config[kind];
    var steps = qsa(".step", form);
    var thanks = qs(".thanks", form.parentElement);
    var errorBox = qs(".form-error", form);
    var index = 0;
    var furthest = 0;
    var sending = false;

    function paint() {
      steps.forEach(function (step, i) {
        step.hidden = i !== index;
      });
      qsa("[data-goto]", form).forEach(function (button, i) {
        button.disabled = i > furthest;
        if (i === index) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });
      var bar = qs(".progress__track span", form);
      if (bar) bar.style.width = ((index + 1) / steps.length * 100) + "%";
      var back = qs("[data-back]", steps[index]);
      if (back) back.hidden = index === 0;
    }

    function show(next, focusHeading) {
      index = next;
      if (index > furthest) furthest = index;
      paint();
      if (focusHeading) {
        var heading = qs("h2", steps[index]);
        if (heading) heading.focus();
      }
    }

    function validateStep(step) {
      clearStep(step);
      var ok = true;
      var key = step.getAttribute("data-step");

      function need(id, message) {
        if (!val(id)) {
          setError(id, message);
          ok = false;
        }
      }

      if (key === "farm") {
        need("farm-name", "Enter the farm name.");
        need("site-address", "Enter the site address.");
        need("contact-name", "Enter a contact name.");
        if (!val("contact-phone")) {
          setError("contact-phone", "Enter a phone number.");
          ok = false;
        } else if (!validPhone(val("contact-phone"))) {
          setError("contact-phone", "Enter a phone number with at least 10 digits.");
          ok = false;
        }
        if (!val("contact-email")) {
          setError("contact-email", "Enter an email address.");
          ok = false;
        } else if (!validEmail(val("contact-email"))) {
          setError("contact-email", "Enter an email address like name@farm.ca.");
          ok = false;
        }
        var billingOn = qs("#billing-different", form).checked;
        if (billingOn) {
          need("billing-name", "Enter the billing contact name.");
          if (!val("billing-email")) setError("billing-email", "Enter a billing email.");
          else if (!validEmail(val("billing-email"))) {
            setError("billing-email", "Enter a valid billing email.");
            ok = false;
          }
        }
      }

      if (key === "schedule") {
        need("start-date", "Choose a start date.");
        need("start-time", "Choose the daily start time.");
        if (!val("end-time") && !val("shift-length")) {
          setError("shift-window", "Add an expected end time or a shift length.");
          ok = false;
        }
        need("days-per-week", "Choose how many days a week.");
        if (!checked("Weekends included", form)) {
          setError("weekends", "Say whether weekends are included.");
          ok = false;
        }
        if (!checked("Shift", form)) {
          setError("shift", "Choose day, night, or both.");
          ok = false;
        }
        if (!val("end-date") && !val("season-length")) {
          setError("season-window", "Add an estimated end date or a season length.");
          ok = false;
        }
        if (val("start-date") && val("end-date") && val("end-date") < val("start-date")) {
          setError("end-date", "The end date should be on or after the start date.");
          ok = false;
        }
      }

      if (key === "crew") {
        var any = false;
        var bad = false;
        qsa("[data-headcount]", step).forEach(function (input) {
          var raw = input.value.trim();
          if (raw === "") return;
          var n = Number(raw);
          if (!Number.isInteger(n) || n < 0 || n > 500) {
            setError(input.id, "Use a whole number from 0 to 500.");
            bad = true;
          } else if (n > 0) any = true;
        });
        if (bad) ok = false;
        else if (!any) {
          setError("crew", "Enter a headcount for at least one role.");
          ok = false;
        }
      }

      if (key === "site") {
        /* All site details are optional. */
      }

      if (key === "about") {
        need("full-name", "Enter your name.");
        if (!val("phone")) {
          setError("phone", "Enter a phone number.");
          ok = false;
        } else if (!validPhone(val("phone"))) {
          setError("phone", "Enter a phone number with at least 10 digits.");
          ok = false;
        }
        if (!val("email")) {
          setError("email", "Enter an email address.");
          ok = false;
        } else if (!validEmail(val("email"))) {
          setError("email", "Enter an email address like name@email.com.");
          ok = false;
        }
        need("town", "Enter your town or community.");
      }

      if (key === "work") {
        if (!qsa("input[name='role']:checked", form).length) {
          setError("roles", "Choose at least one role.");
          ok = false;
        }
        need("available-date", "Choose the date you can start.");
        if (!checked("Own transport", form)) {
          setError("transport", "Say whether you have your own transport.");
          ok = false;
        }
        var fileInput = document.getElementById("resume");
        var file = fileInput && fileInput.files && fileInput.files[0];
        if (!file) {
          setError("resume", "Add a resume as a PDF or Word file.");
          ok = false;
        } else if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
          setError("resume", "Use a PDF, DOC, or DOCX file.");
          ok = false;
        } else if (file.size > 10 * 1024 * 1024) {
          setError("resume", "That file is over 10 MB. Please send a smaller resume.");
          ok = false;
        }
      }

      if (!ok) {
        var badEl = firstInvalid(step) || qs(".is-invalid input, .is-invalid select, .is-invalid textarea", step);
        if (badEl && badEl.focus) badEl.focus();
      }
      return ok;
    }

    function validateAll() {
      for (var i = 0; i < steps.length; i += 1) {
        if (!validateStep(steps[i])) {
          show(i, false);
          return false;
        }
      }
      return true;
    }

    function licenceList(ids) {
      var picked = [];
      ids.forEach(function (item) {
        var el = document.getElementById(item.id);
        if (el && el.checked) picked.push(item.label);
      });
      return picked.length ? picked.join(", ") : "None noted";
    }

    function buildLabour() {
      var data = new FormData();
      var roles = [
        ["graders", "Graders"],
        ["packers", "Packers"],
        ["drivers", "Truck drivers"],
        ["forklift", "Forklift and machinery"],
        ["washers", "Pressure washers"],
        ["cleaners", "Cleaners"],
        ["field", "Field labour"],
        ["supervisors", "Shift supervisors"]
      ];
      data.append("Farm name", val("farm-name"));
      data.append("Site address", val("site-address"));
      data.append("Contact name", val("contact-name"));
      data.append("Contact phone", val("contact-phone"));
      data.append("Contact email", val("contact-email"));
      if (qs("#billing-different").checked) {
        data.append("Billing contact", val("billing-name"));
        data.append("Billing email", val("billing-email"));
      } else {
        data.append("Billing contact", "Same as site contact");
        data.append("Billing email", "Same as site contact");
      }
      data.append("Start date", prettyDate(val("start-date")));
      data.append("Daily start time", prettyTime(val("start-time")));
      data.append("Expected end time", dash(prettyTime(val("end-time"))));
      data.append("Shift length", dash(val("shift-length")));
      data.append("Days per week", val("days-per-week"));
      data.append("Weekends included", checked("Weekends included", form));
      data.append("Shift", checked("Shift", form));
      data.append("Estimated end date", dash(prettyDate(val("end-date"))));
      data.append("Season length", dash(val("season-length")));
      roles.forEach(function (role) {
        var raw = val(role[0]);
        data.append(role[1], raw === "" ? "0" : raw);
      });
      data.append("Licences and requirements", licenceList([
        { id: "lic-az", label: "AZ" },
        { id: "lic-dz", label: "DZ" },
        { id: "lic-forklift", label: "Forklift experience" },
        { id: "lic-bin", label: "Bin piler experience" }
      ]));
      data.append("Other requirements", dash(val("other-requirements")));
      data.append("PPE or site rules", dash(val("ppe")));
      data.append("Parking and transport", dash(val("parking")));
      data.append("How they heard about us", dash(val("heard")));
      data.append("Notes", dash(val("notes")));
      return data;
    }

    function buildApply() {
      var data = new FormData();
      var roles = qsa("input[name='role']:checked", form).map(function (el) { return el.value; });
      data.append("Full name", val("full-name"));
      data.append("Phone", val("phone"));
      data.append("Email", val("email"));
      data.append("Town", val("town"));
      data.append("Roles wanted", roles.join(", "));
      data.append("Available start date", prettyDate(val("available-date")));
      data.append("AZ licence", qs("#app-az").checked ? "Yes" : "No");
      data.append("DZ licence", qs("#app-dz").checked ? "Yes" : "No");
      data.append("Forklift licence", qs("#app-forklift").checked ? "Yes" : "No");
      data.append("Own transport", checked("Own transport", form));
      var file = document.getElementById("resume").files[0];
      data.append("Resume", file, file.name);
      return data;
    }

    function showThanks() {
      form.hidden = true;
      if (thanks) {
        thanks.hidden = false;
        thanks.focus();
      }
    }

    function fail(message) {
      if (!errorBox) return;
      errorBox.hidden = false;
      errorBox.textContent = message;
    }

    async function send() {
      if (sending) return;
      var honey = qs("input[name='_honey']", form);
      if (honey && honey.value.trim()) {
        showThanks();
        return;
      }
      if (!spec || !config.endpoint) {
        fail("This form is not configured. Please call +1 (902) 200-4888.");
        return;
      }
      sending = true;
      var submit = qs("[type='submit']", form);
      var previous = submit ? submit.textContent : "";
      if (submit) {
        submit.disabled = true;
        submit.textContent = "Sending…";
      }
      if (errorBox) errorBox.hidden = true;

      var data = kind === "labour" ? buildLabour() : buildApply();
      var subject = spec.subject
        .replace("{farm}", val("farm-name"))
        .replace("{name}", val("full-name"));
      var reply = kind === "labour" ? val("contact-email") : val("email");
      data.append("_cc", spec.cc);
      data.append("_subject", subject);
      data.append("_template", config.template);
      data.append("_captcha", config.captcha);
      data.append("_replyto", reply);
      data.append("_honey", honey ? honey.value : "");
      data.append("Form", kind === "labour" ? "Request Labour" : "Find Work");

      try {
        var response = await fetch(config.endpoint + encodeURIComponent(spec.to), {
          method: "POST",
          headers: { Accept: "application/json" },
          body: data
        });
        var payload = {};
        try { payload = await response.json(); } catch (ignore) { payload = {}; }
        var success = response.ok && String(payload.success) !== "false";
        if (!success) {
          var detail = payload && payload.message ? String(payload.message) : "";
          var activation = /activat/i.test(detail)
            ? " The recipient inbox still needs to open FormSubmit’s one-time activation email."
            : "";
          fail("We could not send this just now. Please call +1 (902) 200-4888 or email admin@unscramble.ca." + activation);
        } else {
          showThanks();
        }
      } catch (err) {
        fail("We could not send this just now. Please call +1 (902) 200-4888 or email admin@unscramble.ca.");
      } finally {
        sending = false;
        if (submit && !form.hidden) {
          submit.disabled = false;
          submit.textContent = previous;
        }
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (index < steps.length - 1) {
        if (validateStep(steps[index])) show(index + 1, true);
        return;
      }
      if (validateAll()) send();
    });

    form.addEventListener("click", function (event) {
      var origin = event.target.closest ? event.target : event.target.parentElement;
      var next = origin.closest("[data-next]");
      var back = origin.closest("[data-back]");
      var goto = origin.closest("[data-goto]");
      if (next) {
        if (validateStep(steps[index])) show(index + 1, true);
      } else if (back) {
        show(index - 1, true);
      } else if (goto && !goto.disabled) {
        show(Number(goto.getAttribute("data-goto")), true);
      }
    });

    form.addEventListener("input", function (event) {
      var target = event.target;
      if (target && target.id) setError(target.id, "");
      if (target && target.name === "Weekends included") setError("weekends", "");
      if (target && target.name === "Shift") setError("shift", "");
      if (target && target.name === "Own transport") setError("transport", "");
      if (target && target.name === "role") setError("roles", "");
      if (target && target.hasAttribute("data-headcount")) setError("crew", "");
      var total = qs("#crew-total");
      if (total && target && target.hasAttribute("data-headcount")) {
        var sum = qsa("[data-headcount]", form).reduce(function (count, input) {
          return count + (parseInt(input.value, 10) || 0);
        }, 0);
        total.textContent = "Crew total: " + sum;
      }
      var fileLabel = qs("#file-name");
      if (fileLabel && target && target.id === "resume" && target.files && target.files[0]) {
        fileLabel.textContent = target.files[0].name;
      }
    });

    var billing = qs("#billing-different");
    var billingFields = qs("#billing-fields");
    if (billing && billingFields) {
      billing.addEventListener("change", function () {
        billingFields.hidden = !billing.checked;
        if (!billing.checked) {
          setError("billing-name", "");
          setError("billing-email", "");
        }
      });
    }

    qsa("h2", form).forEach(function (heading) {
      heading.tabIndex = -1;
    });
    if (thanks) thanks.tabIndex = -1;
    paint();
  }

  function initMotion() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("motion");

    function countUp(el) {
      var target = Number(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (!isFinite(target)) return;
      var start = performance.now();
      var duration = 900;
      function tick(now) {
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = String(target) + suffix;
      }
      requestAnimationFrame(tick);
    }

    var reveals = qsa("[data-reveal]");
    var counters = qsa("[data-count]");
    var seen = [];

    function inView(el) {
      var rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
        qsa("[data-count]", entry.target).forEach(function (el) {
          if (seen.indexOf(el) !== -1) return;
          seen.push(el);
          countUp(el);
        });
        if (entry.target.hasAttribute("data-count") && seen.indexOf(entry.target) === -1) {
          seen.push(entry.target);
          countUp(entry.target);
        }
      });
    }, { threshold: 0.28, rootMargin: "0px 0px -8% 0px" });

    reveals.forEach(function (el) {
      if (inView(el)) el.classList.add("is-in");
      else {
        el.classList.add("reveal");
        observer.observe(el);
      }
    });

    counters.forEach(function (el) {
      var host = el.closest("[data-reveal]") || el;
      if (inView(host)) {
        seen.push(el);
        countUp(el);
      }
    });
  }

  initNav();
  initMotion();
  qsa("form[data-form]").forEach(initForm);
})();
