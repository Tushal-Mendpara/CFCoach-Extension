(() => {
  const existing = document.getElementById("cfcoach-profile-tab");
  if (existing) {
    return;
  }

  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const isProfilePage = pathParts[0] === "profile" && !!pathParts[1];
  if (!isProfilePage) {
    return;
  }

  const detectedHandle = pathParts[1];

  const upper = (s) => (s || "").trim().toUpperCase();
  const profileNavTexts = new Set([
    "SETTINGS",
    "STATICS",
    "LISTS",
    "BLOG",
    "FAVOURITES",
    "TEAMS",
    "SUBMISSIONS",
    "GROUPS",
    "CONTESTS",
    "PROBLEMSETTING",
    "SNEAKPEEK",
  ]);

  const allNavLikeLinks = Array.from(document.querySelectorAll("a")).filter((a) =>
    profileNavTexts.has(upper(a.textContent))
  );

  if (!allNavLikeLinks.length) {
    return;
  }

  const containerScores = new Map();
  allNavLikeLinks.forEach((a) => {
    const container = a.closest("ul, div");
    if (!container) {
      return;
    }
    if (!containerScores.has(container)) {
      containerScores.set(container, {
        score: 0,
        hasStatics: false,
        hasSneakpeek: false,
      });
    }
    const stats = containerScores.get(container);
    const t = upper(a.textContent);
    stats.score += 1;
    if (t === "STATICS") {
      stats.hasStatics = true;
      stats.score += 3;
    }
    if (t === "SNEAKPEEK") {
      stats.hasSneakpeek = true;
      stats.score += 2;
    }
  });

  const bestContainer = Array.from(containerScores.entries())
    .sort((a, b) => b[1].score - a[1].score)[0]?.[0];

  if (!bestContainer) {
    return;
  }

  const navLinks = Array.from(bestContainer.querySelectorAll("a")).filter((a) =>
    profileNavTexts.has(upper(a.textContent))
  );

  const navAnchor =
    navLinks.find((a) => upper(a.textContent) === "SETTINGS") ||
    navLinks.find((a) => upper(a.textContent) === "STATICS") ||
    navLinks[0];

  if (!navAnchor) {
    return;
  }

  const linkItem = navAnchor.closest("li");
  const navContainer = (linkItem && linkItem.parentElement) || navAnchor.parentElement;
  if (!navContainer) {
    return;
  }

  const tabItem = linkItem ? linkItem.cloneNode(true) : document.createElement("span");
  const tabLink = linkItem ? tabItem.querySelector("a") : document.createElement("a");

  if (!tabLink) {
    return;
  }

  tabLink.id = "cfcoach-profile-tab";
  tabLink.textContent = "CFCOACH";
  tabLink.href = "#";
  tabLink.title = "Open CFCoach";
  tabLink.classList.remove("current");

  if (!linkItem) {
    tabLink.style.marginLeft = "12px";
    tabLink.style.cursor = "pointer";
    tabItem.appendChild(tabLink);
  }

  const frame = document.createElement("iframe");
  frame.id = "cfcoach-frame";
  frame.src = `${chrome.runtime.getURL("overlay.html")}?handle=${encodeURIComponent(detectedHandle)}`;
  frame.setAttribute("aria-label", "CFCoach panel");

  const panelWrap = document.createElement("div");
  panelWrap.id = "cfcoach-panel-wrap";
  panelWrap.appendChild(frame);

  const pageRoot =
    navContainer.closest("#pageContent") ||
    document.querySelector("#pageContent") ||
    navContainer.parentElement;
  const navBlock = navContainer.closest(".roundbox, .info, .userbox, .main-info") || navContainer;
  let hiddenNodes = [];

  const showDedicatedTabView = () => {
    if (!pageRoot) {
      return;
    }

    if (!panelWrap.parentElement) {
      const anchor = navBlock && navBlock.parentElement ? navBlock : navContainer;
      if (anchor && anchor.parentElement) {
        anchor.insertAdjacentElement("afterend", panelWrap);
      } else {
        pageRoot.appendChild(panelWrap);
      }
    }

    hiddenNodes = Array.from(pageRoot.children).filter(
      (node) => node !== panelWrap && !node.contains(navContainer)
    );

    hiddenNodes.forEach((node) => {
      node.dataset.cfcoachPrevDisplay = node.style.display || "";
      node.style.display = "none";
    });

    panelWrap.classList.add("cfcoach-open");
    frame.classList.add("cfcoach-open");
    tabLink.classList.add("cfcoach-current");
  };

  const hidePanel = () => {
    panelWrap.classList.remove("cfcoach-open");
    frame.classList.remove("cfcoach-open");
    tabLink.classList.remove("cfcoach-current");

    hiddenNodes.forEach((node) => {
      const prev = node.dataset.cfcoachPrevDisplay;
      node.style.display = prev;
      delete node.dataset.cfcoachPrevDisplay;
    });
    hiddenNodes = [];
  };

  tabLink.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = panelWrap.classList.contains("cfcoach-open");
    if (isOpen) {
      hidePanel();
      return;
    }
    showDedicatedTabView();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hidePanel();
    }
  });

  navContainer.addEventListener("click", (e) => {
    const target = e.target.closest("a");
    if (!target || target.id === "cfcoach-profile-tab") {
      return;
    }
    hidePanel();
  });

  navContainer.appendChild(tabItem);
})();
