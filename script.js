/* =====================================================================
   script.js: small features for the website
   1.  Theme selector (Light / Dark / Forest)
   2.  Sidebar menu on tablet and mobile
   3.  Clock in the top bar (shows the visitor's own local time)
   4.  Contact buttons copy their links from the sidebar icons
   5.  External links open in a new tab
   6.  Publications: Year / Category / Search filters, Detail / Compact view
   7.  Fade-in when scrolling
   8.  Falling background symbols
   9.  Current year in the footer
   10. Profile photo appears automatically when assets/profile.jpg exists
   11. CV button turns on automatically when assets/cv.pdf exists
   12. Sidebar highlights the page you are on
   You do not need to edit this file for normal updates.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js"); // tells the CSS that JavaScript is running

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Theme selector ---------- */
  var themeSelect = document.getElementById("theme-select");
  var allowedThemes = ["light", "dark", "forest"];

  function readSavedTheme() {
    try { return localStorage.getItem("theme"); } catch (e) { return null; }
  }
  function saveTheme(value) {
    try { localStorage.setItem("theme", value); } catch (e) { /* ignore */ }
  }
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeSelect) { themeSelect.value = theme; }
  }

  var startTheme = readSavedTheme();

if (allowedThemes.indexOf(startTheme) === -1) {
  startTheme = "forest";
}

applyTheme(startTheme);

  if (themeSelect) {
    themeSelect.addEventListener("change", function () {
      applyTheme(themeSelect.value);
      saveTheme(themeSelect.value);
    });
  }

  /* ---------- 2. Sidebar menu (tablet and mobile) ---------- */
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebar-overlay");
  var menuBtn = document.getElementById("menu-btn");
  var closeBtn = document.getElementById("sidebar-close");

  function setSidebar(open, returnFocus) {
    if (!sidebar || !menuBtn) { return; }
    sidebar.classList.toggle("is-open", open);
    if (overlay) { overlay.hidden = !open; }
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open && closeBtn) { closeBtn.focus(); }
    if (!open && returnFocus) { menuBtn.focus(); }
  }

  if (sidebar && menuBtn) {
    menuBtn.addEventListener("click", function () {
      setSidebar(!sidebar.classList.contains("is-open"), false);
    });
    if (closeBtn) {
      closeBtn.addEventListener("click", function () { setSidebar(false, true); });
    }
    if (overlay) {
      overlay.addEventListener("click", function () { setSidebar(false, false); });
    }
    // Close after choosing a menu link
    sidebar.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest(".side-nav a")) { setSidebar(false, false); }
    });
    // Close with the Escape key
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && sidebar.classList.contains("is-open")) { setSidebar(false, true); }
    });
    // Close automatically if the window becomes desktop-sized
    if (window.matchMedia) {
      var desktopQuery = window.matchMedia("(min-width: 1024px)");
      var onDesktopChange = function () { if (desktopQuery.matches) { setSidebar(false, false); } };
      if (desktopQuery.addEventListener) {
        desktopQuery.addEventListener("change", onDesktopChange);
      } else if (desktopQuery.addListener) {
        desktopQuery.addListener(onDesktopChange);
      }
    }
  }

  /* ---------- 3. Clock ---------- */
  var clockTime = document.getElementById("clock-time");
  var clockDate = document.getElementById("clock-date");

  function updateClock() {
    var now = new Date();
    if (clockTime) {
      clockTime.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (clockDate) {
      clockDate.textContent = now.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  }
  if (clockTime || clockDate) {
    updateClock();
    setInterval(updateClock, 30000);
  }

  /* ---------- 4. Contact buttons copy links from the sidebar ---------- */
  var sources = document.querySelectorAll(".sidebar-links [data-profile]");
  sources.forEach(function (source) {
    var key = source.getAttribute("data-profile");
    var targets = document.querySelectorAll('.profile-sync[data-profile="' + key + '"]');
    targets.forEach(function (button) {
      button.setAttribute("href", source.getAttribute("href"));
      button.classList.toggle("is-placeholder", source.classList.contains("is-placeholder"));
    });
  });

  /* ---------- 5. External links open in a new tab ---------- */
  document.querySelectorAll('a[href^="http"]').forEach(function (link) {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");
  });

  /* ---------- 6. Publications: filters and Detail / Compact view ---------- */
  var pubCards = Array.prototype.slice.call(document.querySelectorAll(".pub-card"));
  var yearSelect = document.getElementById("pub-year");
  var categorySelect = document.getElementById("pub-category");
  var searchInput = document.getElementById("pub-search");
  var emptyMessage = document.getElementById("pub-empty");
  var viewButtons = document.querySelectorAll(".view-btn");

  function getCardYear(card) {
    var el = card.querySelector(".pub-year");
    var text = el ? el.textContent.trim() : "";
    return /^\d{4}$/.test(text) ? text : "";
  }

  function getCardCategory(card) {
    var el = card.querySelector(".pub-category");
    var text = el ? el.textContent.trim() : "";
    return (text && text.charAt(0) !== "[") ? text : "";
  }

  function unique(list) {
    return list.filter(function (value, index) {
      return value && list.indexOf(value) === index;
    });
  }

  function fillSelect(select, values) {
    if (!select) { return; }
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function applyFilters() {
    var year = yearSelect ? yearSelect.value : "all";
    var category = categorySelect ? categorySelect.value : "all";
    var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    var shown = 0;

    pubCards.forEach(function (card) {
      var okYear = year === "all" || getCardYear(card) === year;
      var okCategory = category === "all" || getCardCategory(card) === category;
      var okQuery = query === "" || card.textContent.toLowerCase().indexOf(query) !== -1;
      var match = okYear && okCategory && okQuery;
      card.hidden = !match;
      if (match) { shown++; }
    });

    if (emptyMessage) { emptyMessage.hidden = shown !== 0; }
  }

  function setCardOpen(card, open) {
    card.classList.toggle("is-open", open);
    var toggle = card.querySelector(".pub-toggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Collapse details" : "Expand details");
    }
  }

  function setView(view) {
    viewButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-view") === view ? "true" : "false");
    });
    pubCards.forEach(function (card) { setCardOpen(card, view === "detail"); });
  }

  if (pubCards.length) {
    fillSelect(yearSelect, unique(pubCards.map(getCardYear)).sort().reverse());
    fillSelect(categorySelect, unique(pubCards.map(getCardCategory)).sort());

    if (yearSelect) { yearSelect.addEventListener("change", applyFilters); }
    if (categorySelect) { categorySelect.addEventListener("change", applyFilters); }
    if (searchInput) { searchInput.addEventListener("input", applyFilters); }

    viewButtons.forEach(function (button) {
      button.addEventListener("click", function () { setView(button.getAttribute("data-view")); });
    });

    pubCards.forEach(function (card) {
      var toggle = card.querySelector(".pub-toggle");
      if (toggle) {
        toggle.addEventListener("click", function () {
          setCardOpen(card, !card.classList.contains("is-open"));
        });
      }
    });
  }

  /* ---------- 7. Fade-in on scroll ---------- */
  var revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      revealItems.forEach(function (item) { observer.observe(item); });
    } else {
      revealItems.forEach(function (item) { item.classList.add("is-visible"); });
    }
  }

  /* ---------- 8. Falling background symbols ---------- */
  var glyphBox = document.getElementById("bg-glyphs");
  if (glyphBox && !reduceMotion) {
    var symbols = ["⚛", "⚗", "✦", "◆", "∑", "π", "λ", "Ω", "∞", "✳"];
    var total = window.innerWidth < 641 ? 10 : 18;
    for (var i = 0; i < total; i++) {
      var glyph = document.createElement("span");
      glyph.className = "glyph";
      glyph.textContent = symbols[i % symbols.length];
      glyph.style.left = (Math.random() * 100) + "%";
      glyph.style.fontSize = (14 + Math.random() * 16) + "px";
      glyph.style.animationDuration = (18 + Math.random() * 22) + "s";
      glyph.style.animationDelay = (-Math.random() * 30) + "s";
      glyphBox.appendChild(glyph);
    }
  }

  /* ---------- 9. Footer year ---------- */
  var yearSpot = document.getElementById("current-year");
  if (yearSpot) { yearSpot.textContent = new Date().getFullYear(); }

  /* ---------- 10. Profile photo appears automatically ----------
     Upload your photo into the assets folder as profile.jpg
     (profile.jpeg, profile.png and profile.webp also work). */
  var photoNames = [
    "assets/profile.jpg",
    "assets/profile.jpeg",
    "assets/profile.png",
    "assets/profile.webp"
  ];
  var photoIndex = 0;

  function useProfilePhoto(path) {
    var heroPlaceholder = document.querySelector("div.hero-photo");
    if (heroPlaceholder) {
      var heroImg = document.createElement("img");
      heroImg.className = "hero-photo";
      heroImg.src = path;
      heroImg.alt = "Portrait of Khandakar Rashedul Islam";
      heroPlaceholder.parentNode.replaceChild(heroImg, heroPlaceholder);
    }
    var sidePlaceholder = document.querySelector("span.side-avatar");
    if (sidePlaceholder) {
      var sideImg = document.createElement("img");
      sideImg.className = "side-avatar";
      sideImg.src = path;
      sideImg.alt = "";
      sidePlaceholder.parentNode.replaceChild(sideImg, sidePlaceholder);
    }
  }

  function tryNextPhoto() {
    if (photoIndex >= photoNames.length) { return; }
    var path = photoNames[photoIndex];
    photoIndex++;
    var probe = new Image();
    probe.onload = function () { useProfilePhoto(path); };
    probe.onerror = tryNextPhoto;
    probe.src = path;
  }
  if (document.querySelector("div.hero-photo") || document.querySelector("span.side-avatar")) {
    tryNextPhoto();
  }

  /* ---------- 11. CV button turns on when the PDF exists ---------- */
  var cvLinks = document.querySelectorAll('a[href="assets/cv.pdf"]');
  if (cvLinks.length && window.fetch) {
    fetch("assets/cv.pdf", { method: "HEAD" }).then(function (response) {
      if (response.status === 404) {
        cvLinks.forEach(function (link) {
          link.classList.add("is-unavailable");
          link.setAttribute("aria-disabled", "true");
        });
      }
    }).catch(function () { /* network problem: leave the button as it is */ });
  }

  /* ---------- 12. Sidebar highlights the page you are on ---------- */
  var currentFile = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (currentFile.indexOf(".") === -1) { currentFile = currentFile + ".html"; }
  document.querySelectorAll(".side-nav a").forEach(function (link) {
    var target = (link.getAttribute("href") || "").split("#")[0].toLowerCase();
    if (target && target === currentFile) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  /* ---------- 13. Publications always start in Compact view ---------- */
  // Mark the category item so Compact view can hide it
  pubCards.forEach(function (card) {
    var cat = card.querySelector(".pub-category");
    var item = cat ? cat.closest(".meta-item") : null;
    if (item) { item.classList.add("meta-category"); }
  });
  // Close all cards when the page opens
  if (pubCards.length) { setView("compact"); }

  /* ---------- 14. DOI button beside the year in Compact view ---------- */
  pubCards.forEach(function (card) {
    var meta = card.querySelector(".pub-meta");
    if (!meta) { return; }

    // Find the DOI button in the bottom button row
    var doiLink = null;
    card.querySelectorAll(".pub-links a").forEach(function (link) {
      if (link.textContent.trim().toLowerCase() === "doi") { doiLink = link; }
    });
    if (!doiLink) { return; }

    // Make a copy and place it right after the year
    var copy = doiLink.cloneNode(true);
    copy.classList.add("compact-doi");
    var yearEl = card.querySelector(".pub-year");
    var yearItem = yearEl ? yearEl.closest(".meta-item") : null;
    if (yearItem) {
      yearItem.insertAdjacentElement("afterend", copy);
    } else {
      meta.appendChild(copy);
    }
  });

  /* ---------- 15. Hide the CV viewer until cv.pdf has been uploaded ---------- */
  var cvSection = document.getElementById("cv");
  if (cvSection && window.fetch) {
    fetch("assets/cv.pdf", { method: "HEAD" }).then(function (response) {
      if (response.status === 404) { cvSection.classList.add("cv-missing"); }
    }).catch(function () { /* network problem: leave the viewer as it is */ });
  }

  /* ---------- 16. CV preview on tablet and phone ----------
     Draws each page of assets/cv.pdf using PDF.js (from cdnjs).
     Desktop keeps the browser's own PDF viewer. */
  var PDFJS_BASE = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  var cvViewerBox = document.querySelector(".cv-viewer");
  var cvPagesBox = document.getElementById("cv-pages");
  var cvSectionEl = document.getElementById("cv");
  var smallScreenQuery = window.matchMedia ? window.matchMedia("(max-width: 1023px)") : null;
  var cvPreviewStarted = false;

  function cvPreviewFailed() {
    if (cvViewerBox) { cvViewerBox.classList.add("cv-failed"); }
  }

  function loadExternalScript(src, onDone, onFail) {
    var tag = document.createElement("script");
    tag.src = src;
    tag.onload = onDone;
    tag.onerror = onFail;
    document.head.appendChild(tag);
  }

  function drawCvPage(pdf, pageNumber, cssWidth, ratio) {
    return pdf.getPage(pageNumber).then(function (page) {
      var base = page.getViewport({ scale: 1 });
      var viewport = page.getViewport({ scale: (cssWidth / base.width) * ratio });
      var canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", "CV page " + pageNumber + " of " + pdf.numPages);
      cvPagesBox.appendChild(canvas);
      cvViewerBox.classList.add("has-pages");
      return page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport }).promise;
    });
  }

  function renderCvPages() {
    var pdfjs = window.pdfjsLib;
    if (!pdfjs) { cvPreviewFailed(); return; }
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_BASE + "pdf.worker.min.js";

    pdfjs.getDocument("assets/cv.pdf").promise.then(function (pdf) {
      var cssWidth = Math.max(cvPagesBox.clientWidth - 16, 200);
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var chain = Promise.resolve();
      for (var n = 1; n <= pdf.numPages; n++) {
        (function (pageNumber) {
          chain = chain.then(function () {
            return drawCvPage(pdf, pageNumber, cssWidth, ratio);
          });
        })(n);
      }
      return chain;
    }).catch(cvPreviewFailed);
  }

  function startCvPreview() {
    if (cvPreviewStarted || !cvViewerBox || !cvPagesBox) { return; }
    if (!smallScreenQuery || !smallScreenQuery.matches) { return; }
    cvPreviewStarted = true;
    loadExternalScript(PDFJS_BASE + "pdf.min.js", renderCvPages, cvPreviewFailed);
  }

  if (cvSectionEl && cvViewerBox && cvPagesBox) {
    if ("IntersectionObserver" in window) {
      var cvWatcher = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { startCvPreview(); }
      }, { rootMargin: "400px 0px" });
      cvWatcher.observe(cvSectionEl);
    } else {
      startCvPreview();
    }
    if (smallScreenQuery) {
      var onSizeChange = function () {
        var box = cvSectionEl.getBoundingClientRect();
        if (box.top < window.innerHeight + 400) { startCvPreview(); }
      };
      if (smallScreenQuery.addEventListener) {
        smallScreenQuery.addEventListener("change", onSizeChange);
      } else if (smallScreenQuery.addListener) {
        smallScreenQuery.addListener(onSizeChange);
      }
    }
  }
})();
