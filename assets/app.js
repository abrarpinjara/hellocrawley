(function () {
  "use strict";

  var STORIES = (window.STORIES || []).slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });

  // Warm palette for portrait placeholders, picked deterministically per story.
  var TONES = [
    ["#c8102e", "#7a0a1c"], ["#d97706", "#92400e"], ["#0f766e", "#134e4a"],
    ["#1d4ed8", "#1e3a8a"], ["#7c3aed", "#4c1d95"], ["#be185d", "#831843"],
    ["#4d7c0f", "#365314"], ["#475569", "#1e293b"]
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function initials(name) {
    return name.replace(/^Sample:\s*/i, "").split(/\s+/).slice(0, 2)
      .map(function (w) { return w.charAt(0).toUpperCase(); }).join("");
  }

  function fmtDate(iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  function photo(s) {
    var badge = s.sample ? '<span class="badge-sample">Sample</span>' : "";
    if (s.photo) {
      return '<div class="photo" style="background-image:url(\'' + esc(s.photo) + '\')" role="img" aria-label="Portrait of ' + esc(s.name) + '">' + badge + "</div>";
    }
    var t = TONES[hash(s.id) % TONES.length];
    return '<div class="photo" style="background:linear-gradient(150deg,' + t[0] + "," + t[1] + ')" aria-hidden="true"><span class="initials">' + esc(initials(s.name)) + "</span>" + badge + "</div>";
  }

  function meta(s) {
    return '<div class="meta"><span>' + esc(s.name) + '</span><span class="dot"></span><span>' + esc(s.neighbourhood) + '</span><span class="dot"></span><span>' + esc(s.theme) + "</span></div>";
  }

  function card(s) {
    return '<a class="card" href="story.html?id=' + encodeURIComponent(s.id) + '">' + photo(s) +
      "<blockquote>" + esc(s.headline) + "</blockquote>" + meta(s) + "</a>";
  }

  // Mobile menu
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Home page ----------
  var featuredEl = document.getElementById("featured");
  if (featuredEl && STORIES.length) {
    var f = STORIES[0];
    featuredEl.href = "story.html?id=" + encodeURIComponent(f.id);
    featuredEl.innerHTML = photo(f) + '<div class="body"><p class="eyebrow">Latest story</p><blockquote>' +
      esc(f.headline) + "</blockquote>" + meta(f) + "</div>";
  }

  var grid = document.getElementById("grid");
  if (grid) {
    var hoodSel = document.getElementById("f-hood");
    var search = document.getElementById("f-search");
    var chipsEl = document.getElementById("chips");
    var theme = "All";

    window.NEIGHBOURHOODS.forEach(function (n) {
      var o = document.createElement("option");
      o.value = n; o.textContent = n;
      hoodSel.appendChild(o);
    });

    ["All"].concat(window.THEMES).forEach(function (t) {
      var b = document.createElement("button");
      b.className = "chip"; b.type = "button"; b.textContent = t;
      b.setAttribute("aria-pressed", t === "All" ? "true" : "false");
      b.addEventListener("click", function () {
        theme = t;
        Array.prototype.forEach.call(chipsEl.children, function (c) {
          c.setAttribute("aria-pressed", c === b ? "true" : "false");
        });
        render();
      });
      chipsEl.appendChild(b);
    });

    var params = new URLSearchParams(location.search);
    if (params.get("hood")) hoodSel.value = params.get("hood");

    function render() {
      var q = search.value.trim().toLowerCase();
      var hood = hoodSel.value;
      var list = STORIES.filter(function (s) {
        if (hood && s.neighbourhood !== hood) return false;
        if (theme !== "All" && s.theme !== theme) return false;
        if (q) {
          var text = (s.name + " " + s.headline + " " + s.neighbourhood + " " + s.body.join(" ")).toLowerCase();
          if (text.indexOf(q) === -1) return false;
        }
        return true;
      });
      grid.innerHTML = list.length ? list.map(card).join("") :
        '<p class="empty">No stories here yet. <a href="submit.html">Know someone we should meet?</a></p>';
    }

    hoodSel.addEventListener("change", render);
    search.addEventListener("input", render);
    render();

    // Neighbourhood list with counts
    var hoodList = document.getElementById("hood-list");
    if (hoodList) {
      hoodList.innerHTML = window.NEIGHBOURHOODS.map(function (n) {
        var c = STORIES.filter(function (s) { return s.neighbourhood === n; }).length;
        return '<a href="?hood=' + encodeURIComponent(n) + '#stories">' + esc(n) + '<span class="count">' + c + "</span></a>";
      }).join("");
    }
  }

  // ---------- Story page ----------
  var storyEl = document.getElementById("story");
  if (storyEl) {
    var id = new URLSearchParams(location.search).get("id");
    var s = STORIES.filter(function (x) { return x.id === id; })[0];
    if (!s) {
      storyEl.innerHTML = '<a class="back" href="index.html">← All stories</a><h1>Story not found</h1><p>That story may have moved. <a href="index.html">Browse all stories</a>.</p>';
    } else {
      document.title = s.name + " · Hello Crawley";
      var url = location.href;
      var shareText = s.headline + " — " + s.name + ", " + s.neighbourhood;
      storyEl.innerHTML =
        '<a class="back" href="index.html">← All stories</a>' +
        (s.sample ? '<div class="notice">This is a sample story used to preview the layout.</div>' : "") +
        photo(s) +
        '<p class="eyebrow">' + esc(s.neighbourhood) + " · " + esc(s.theme) + "</p>" +
        "<h1>" + esc(s.headline) + "</h1>" +
        '<div class="meta" style="margin-bottom:28px"><span>' + esc(s.name) + '</span><span class="dot"></span><span>' + fmtDate(s.date) + "</span></div>" +
        '<div class="body">' + s.body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
        '<div class="share">' +
          '<a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(shareText + " " + url) + '">Share on WhatsApp</a>' +
          '<a class="btn ghost" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '">Facebook</a>' +
          '<button class="btn ghost" type="button" id="copy-link">Copy link</button>' +
        "</div>";

      var copy = document.getElementById("copy-link");
      copy.addEventListener("click", function () {
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
          .then(function () { copy.textContent = "Link copied"; })
          .catch(function () { copy.textContent = url; });
      });

      var more = STORIES.filter(function (x) { return x.id !== s.id; })
        .sort(function (a, b) { return (b.neighbourhood === s.neighbourhood) - (a.neighbourhood === s.neighbourhood); })
        .slice(0, 3);
      var moreEl = document.getElementById("more");
      if (moreEl) moreEl.innerHTML = more.map(card).join("");
    }
  }

  // ---------- Submit page ----------
  var form = document.getElementById("submit-form");
  if (form) {
    var hoodField = document.getElementById("s-hood");
    window.NEIGHBOURHOODS.concat(["Elsewhere in Crawley"]).forEach(function (n) {
      var o = document.createElement("option");
      o.value = n; o.textContent = n;
      hoodField.appendChild(o);
    });

    // Posts to Netlify Forms. If hosting elsewhere, point FORM_ENDPOINT at your
    // form backend (Formspree, etc).
    var FORM_ENDPOINT = "/";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "Sending…";
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.style.display = "none";
        document.getElementById("form-error").classList.remove("show");
        document.getElementById("form-success").classList.add("show");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }).catch(function () {
        document.getElementById("form-error").classList.add("show");
        btn.disabled = false; btn.textContent = "Send";
      });
    });
  }
})();
