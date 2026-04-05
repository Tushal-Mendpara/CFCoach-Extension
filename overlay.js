const API_BASE = window.CFCOACH_CONFIG?.API_BASE || "http://127.0.0.1:8000";
const HANDLE_KEY = "cfcoach_handle";

const tabs = document.querySelectorAll(".tab");
const panes = document.querySelectorAll(".pane");
const analysisRunBtn = document.getElementById("analysisRunBtn");
const dailyRunBtn = document.getElementById("dailyRunBtn");
const analysisContent = document.getElementById("analysisContent");
const dailyContent = document.getElementById("dailyContent");
const dailyMoreBtn = document.getElementById("dailyMoreBtn");
const dailyMeta = document.getElementById("dailyMeta");
const dailyTagList = document.getElementById("dailyTagList");
const dailyTagBtn = document.getElementById("dailyTagBtn");
const dailyTagMeta = document.getElementById("dailyTagMeta");
const dailyTagContent = document.getElementById("dailyTagContent");

const contestHandles = document.getElementById("contestHandles");
const contestMode = document.getElementById("contestMode");
const problemCount = document.getElementById("problemCount");
const contestGenerateBtn = document.getElementById("contestGenerateBtn");
const contestContent = document.getElementById("contestContent");
const tagWrap = document.getElementById("tagWrap");
const tagList = document.getElementById("tagList");

let selectedTags = new Set();
let availableTags = [];
let activeTab = "analysis";
let dailyMixState = null;
let dailyTagState = null;
let dailySelectedTags = new Set();
let profileHandle = "";

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    panes.forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
    activeTab = tab.dataset.tab;
  });
});

function setContent(el, html) {
  el.innerHTML = html;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderTagSection(title, tags, allTagMap, className) {
  if (!tags || !tags.length) {
    return "";
  }

  const cards = tags
    .map((tag) => {
      const info = allTagMap[tag] || {};
      const isLocked = info.status === "locked";
      const pct = Math.round(Number(info.percentage) || 0);

      return `<div class="tag-card ${className}">
          <div class="tag-name">${tag}</div>
          ${
            isLocked
              ? `<div class="tag-meta">Locked by progression</div>`
              : `<div class="tag-bar"><span style="width:${pct}%"></span></div>
                 <div class="tag-meta">${pct}% mastery</div>`
          }
        </div>`;
    })
    .join("");

  return `<h3>${title}</h3><div class="tag-grid">${cards}</div>`;
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }
  return res.json();
}

function getHandle() {
  return profileHandle;
}

function getHandleFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("handle") || "").trim();
}

function initProfileHandle() {
  const fromQuery = getHandleFromQuery();
  if (fromQuery) {
    profileHandle = fromQuery;
    contestHandles.value = fromQuery;
    chrome.storage.local.set({ [HANDLE_KEY]: fromQuery });
    return;
  }

  chrome.storage.local.get([HANDLE_KEY], (result) => {
    profileHandle = result[HANDLE_KEY] || "";
    contestHandles.value = profileHandle;
  });
}

async function runProfileAnalysis() {
  const handle = getHandle();
  if (!handle) {
    setContent(analysisContent, "Could not detect profile handle from this page.");
    return;
  }

  chrome.storage.local.set({ [HANDLE_KEY]: handle });
  contestHandles.value = handle;

  setContent(analysisContent, "Loading analysis...");
  try {
    const data = await apiGet(`/api/analysis/${encodeURIComponent(handle)}`);
    const skill = data.skill_profile || {};
    const tagMap = skill.tags || {};
    const summary = skill.summary || {};
    const weak = (skill.focus_areas || []).slice(0, 5);
    const strongTags = skill.strong_tags || [];
    const moderateTags = skill.moderate_tags || [];
    const weakTags = skill.weak_tags || [];
    const veryWeakTags = skill.very_weak_tags || [];
    const lockedTags = skill.locked_tags || [];
    const patterns = data.patterns || [];

    const weakHtml = weak.length
      ? `<ul class=\"list\">${weak.map((x) => `<li><strong>${x.tag}</strong>: ${x.reason || "Focus area"}</li>`).join("")}</ul>`
      : "No urgent weak areas detected.";

    const patternHtml = patterns.length
      ? `<ul class=\"list\">${patterns.map((p) => `<li><strong>${p.title || p.name}</strong>: ${p.description || "-"}</li>`).join("")}</ul>`
      : "No pattern insights available.";

    const skillTreeHtml =
      renderTagSection("Strong Areas", strongTags, tagMap, "strong") +
      renderTagSection("Moderate Areas", moderateTags, tagMap, "moderate") +
      renderTagSection("Weak Areas", weakTags, tagMap, "weak") +
      renderTagSection("Very Weak Areas", veryWeakTags, tagMap, "very-weak") +
      renderTagSection("Locked Topics", lockedTags, tagMap, "locked");

    setContent(
      analysisContent,
      `<div class=\"metric-grid\">
         <div class=\"metric\"><span>Rating</span><strong>${skill.user_rating || data.profile?.rating || "N/A"}</strong></div>
         <div class=\"metric\"><span>Overall Strength</span><strong>${summary.overall_strength || 0}%</strong></div>
         <div class=\"metric\"><span>Contest Ratio</span><strong>${summary.contest_ratio || 0}%</strong></div>
         <div class=\"metric\"><span>Practiced Topics</span><strong>${Object.keys(skill.tags || {}).length}</strong></div>
       </div>
       <h3>Top Focus Areas</h3>
       ${weakHtml}
       <h3>Pattern Insights</h3>
       ${patternHtml}
       <h3>Complete Skill Tree Breakdown</h3>
       ${skillTreeHtml || "<div class=\"muted-inline\">No tag data available.</div>"}`
    );
  } catch (err) {
    setContent(analysisContent, `Failed: ${err.message}`);
  }
}

async function runDailyMix() {
  const handle = getHandle();
  if (!handle) {
    setContent(dailyContent, "Could not detect profile handle from this page.");
    return;
  }

  chrome.storage.local.set({ [HANDLE_KEY]: handle });
  contestHandles.value = handle;

  setContent(dailyContent, "Loading daily mix...");
  try {
    const data = await apiGet(`/api/daily-mix/${encodeURIComponent(handle)}`);
    dailyMixState = data;
    renderDailyMix();
    dailyTagState = null;
    setContent(dailyTagContent, "No tag-based suggestions yet.");
    updateDailyTagMeta();
  } catch (err) {
    setContent(dailyContent, `Failed: ${err.message}`);
    dailyMeta.textContent = "";
    dailyMoreBtn.disabled = true;
  }
}

function renderDailyMix() {
  const data = dailyMixState || {};
  const list = data.problems || [];

  if (!list.length) {
    setContent(dailyContent, "No problems returned.");
    dailyMeta.textContent = "";
    dailyMoreBtn.disabled = true;
    return;
  }

  const html = `
    <div class=\"metric-grid\">
      <div class=\"metric\"><span>Total Problems</span><strong>${list.length}</strong></div>
      <div class=\"metric\"><span>Remaining Batches</span><strong>${data.remaining_batches ?? "-"}</strong></div>
    </div>
    <div class=\"problem-list\">${list
      .map(
        (p) =>
          `<div class=\"problem-item\">
             <div><strong>${escapeHtml((p.slot || "target").toUpperCase())}</strong> • Rating ${p.rating ?? "-"}</div>
             <a href=\"${escapeHtml(p.url || "#")}\" target=\"_blank\" rel=\"noreferrer\">${escapeHtml(`${p.contest_id}-${p.index} ${p.name}`)}</a>
           </div>`
      )
      .join("")}</div>`;

  setContent(dailyContent, html);

  const remaining = Number(data.remaining_batches ?? 0);
  dailyMeta.textContent = data.message || `Remaining batches today: ${remaining}`;
  dailyMoreBtn.disabled = remaining <= 0;
  dailyMoreBtn.textContent = remaining > 0 ? `Get More Problems (${remaining} left)` : "No More Batches Today";
}

async function runDailyMixMore() {
  const handle = getHandle();
  if (!handle) {
    setContent(dailyContent, "Could not detect profile handle from this page.");
    return;
  }

  if (!dailyMixState?.problems?.length) {
    await runDailyMix();
    return;
  }

  const remaining = Number(dailyMixState.remaining_batches ?? 0);
  if (remaining <= 0) {
    dailyMeta.textContent = "No more batches available today.";
    dailyMoreBtn.disabled = true;
    return;
  }

  const previousText = dailyMoreBtn.textContent;
  dailyMoreBtn.disabled = true;
  dailyMoreBtn.textContent = "Generating...";

  try {
    const excludeIds = (dailyMixState.problems || [])
      .map((p) => p.problem_id)
      .filter(Boolean);

    const more = await apiPost(`/api/daily-mix/${encodeURIComponent(handle)}/more`, {
      exclude_ids: excludeIds,
    });

    dailyMixState = {
      ...more,
      problems: [...(dailyMixState.problems || []), ...(more.problems || [])],
    };
    renderDailyMix();
  } catch (err) {
    dailyMeta.textContent = `Failed: ${err.message}`;
    dailyMoreBtn.disabled = false;
    dailyMoreBtn.textContent = previousText;
  }
}

function renderDailyTagSelector() {
  dailyTagList.innerHTML = "";
  const dailyTagOptions = [{ tag: "random" }, ...availableTags.filter((item) => item?.tag !== "random")];

  dailyTagOptions.forEach((item) => {
    const tag = item.tag;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `chip ${dailySelectedTags.has(tag) ? "active" : ""}`;
    btn.textContent = tag;
    btn.addEventListener("click", () => {
      if (dailySelectedTags.has(tag)) {
        dailySelectedTags.delete(tag);
      } else {
        dailySelectedTags.add(tag);
      }
      renderDailyTagSelector();
      updateDailyTagMeta();
    });
    dailyTagList.appendChild(btn);
  });
}

function updateDailyTagMeta(message) {
  if (message) {
    dailyTagMeta.textContent = message;
    return;
  }
  const selected = Array.from(dailySelectedTags);
  dailyTagMeta.textContent = selected.length
    ? `Selected tags: ${selected.join(", ")}`
    : "Select one or more tags.";
}

async function runDailyTagPractice() {
  const handle = getHandle();
  if (!handle) {
    setContent(dailyTagContent, "Could not detect profile handle from this page.");
    return;
  }

  if (dailySelectedTags.size === 0) {
    updateDailyTagMeta("Pick at least one tag.");
    return;
  }

  const prev = dailyTagBtn.textContent;
  dailyTagBtn.disabled = true;
  dailyTagBtn.textContent = "Finding...";

  try {
    const exclude = new Set();
    (dailyMixState?.problems || []).forEach((p) => p.problem_id && exclude.add(p.problem_id));
    (dailyTagState?.problems || []).forEach((p) => p.problem_id && exclude.add(p.problem_id));

    const data = await apiPost(`/api/daily-mix/${encodeURIComponent(handle)}/tags`, {
      tags: Array.from(dailySelectedTags),
      problem_count: 4,
      exclude_ids: Array.from(exclude),
    });

    dailyTagState = data;
    const list = data.problems || [];
    if (!list.length) {
      setContent(dailyTagContent, "No tag-based problems returned.");
      updateDailyTagMeta("No results returned for selected tags.");
    } else {
      const html = `<div class=\"problem-list\">${list
        .map(
          (p) =>
            `<div class=\"problem-item\">
               <div><strong>${escapeHtml((p.slot || "target").toUpperCase())}</strong> • Rating ${p.rating ?? "-"}</div>
               <a href=\"${escapeHtml(p.url || "#")}\" target=\"_blank\" rel=\"noreferrer\">${escapeHtml(`${p.contest_id}-${p.index} ${p.name}`)}</a>
             </div>`
        )
        .join("")}</div>`;
      setContent(dailyTagContent, html);
      const selectedLabel = data.selected_tags?.length
        ? data.selected_tags.join(", ")
        : Array.from(dailySelectedTags).join(", ");
      updateDailyTagMeta(`Generated ${list.length} problems for: ${selectedLabel}`);
    }
  } catch (err) {
    setContent(dailyTagContent, `Failed: ${err.message}`);
    updateDailyTagMeta("Failed to fetch tag suggestions.");
  } finally {
    dailyTagBtn.disabled = false;
    dailyTagBtn.textContent = prev;
  }
}

async function loadTags() {
  try {
    const data = await apiGet("/api/meta/tags");
    availableTags = data.tags || [];
    renderTags();
  } catch {
    availableTags = [];
  }
}

function renderTags() {
  tagList.innerHTML = "";
  availableTags.forEach((item) => {
    const tag = item.tag;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `chip ${selectedTags.has(tag) ? "active" : ""}`;
    btn.textContent = tag;
    btn.addEventListener("click", () => {
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
      } else {
        selectedTags.add(tag);
      }
      renderTags();
    });
    tagList.appendChild(btn);
  });

  renderDailyTagSelector();
}

contestMode.addEventListener("change", () => {
  const isTag = contestMode.value === "tag_filtered";
  tagWrap.classList.toggle("hidden", !isTag);
});

async function runContestGenerator() {
  const handles = contestHandles.value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  if (!handles.length) {
    setContent(contestContent, "Add at least one handle.");
    return;
  }

  const count = Number(problemCount.value || 5);
  if (count < 2 || count > 8) {
    setContent(contestContent, "Problem count must be between 2 and 8.");
    return;
  }

  if (contestMode.value === "tag_filtered" && selectedTags.size === 0) {
    setContent(contestContent, "Select at least one tag for Tag Filtered mode.");
    return;
  }

  setContent(contestContent, "Generating contest...");

  try {
    const data = await apiPost("/api/contest/generate", {
      handles,
      problem_count: count,
      mode: contestMode.value,
      selected_tags: contestMode.value === "tag_filtered" ? Array.from(selectedTags) : [],
    });

    const list = data.problems || [];
    if (!list.length) {
      setContent(contestContent, "No contest problems returned.");
      return;
    }

    const steps = (data.mashup_instructions || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 8);

    const html = `<div class=\"metric-grid\">
        <div class=\"metric\"><span>Mode</span><strong>${data.mode || contestMode.value}</strong></div>
        <div class=\"metric\"><span>Group Size</span><strong>${data.group_size || handles.length}</strong></div>
        <div class=\"metric\"><span>Problems</span><strong>${list.length}</strong></div>
      </div>
      <div class=\"problem-list\">${list
        .map(
          (p) =>
            `<div class=\"problem-item\"><a href=\"${p.url}\" target=\"_blank\" rel=\"noreferrer\">${p.position} - ${p.contest_id}-${p.index} ${p.name}</a></div>`
        )
        .join("")}</div>
      ${
        steps.length
          ? `<h3>Codeforces Mashup Setup</h3>
             <div class=\"setup-flow\">
               <div class=\"setup-step\">
                 <strong>Step 1: Open Mashup Page</strong>
                 <ul class=\"list\">
                   <li><a href=\"https://codeforces.com/mashup/new\" target=\"_blank\" rel=\"noreferrer\">https://codeforces.com/mashup/new</a></li>
                   <li>Login with your Codeforces account.</li>
                 </ul>
               </div>
               <div class=\"setup-step\">
                 <strong>Step 2: Set Contest Details</strong>
                 <ul class=\"list\"><li>Fill contest settings as preferred.</li></ul>
               </div>
               <div class=\"setup-step\">
                 <strong>Step 3: Add Problems In Order</strong>
                 <ul class=\"list\">${list
                   .map(
                     (p, idx) =>
                       `<li>${idx + 1}. ${p.contest_id}-${p.index} ${p.name}</li>`
                   )
                   .join("")}</ul>
               </div>
               <div class=\"setup-step\">
                 <strong>Step 4: Create Mashup Contest</strong>
                 <ul class=\"list\"><li>Click Create Mashup Contest.</li></ul>
               </div>
               <div class=\"setup-step\">
                 <strong>Step 5: Manage Invitations</strong>
                 <ul class=\"list\">
                   <li>Go to Manage Invitation.</li>
                   <li>Create invitation link and share with participants.</li>
                 </ul>
               </div>
             </div>`
          : ""
      }`;

    setContent(contestContent, html);
  } catch (err) {
    setContent(contestContent, `Failed: ${err.message}`);
  }
}

analysisRunBtn.addEventListener("click", () => {
  runProfileAnalysis();
});

dailyRunBtn.addEventListener("click", () => {
  runDailyMix();
});

dailyMoreBtn.addEventListener("click", () => {
  runDailyMixMore();
});

dailyTagBtn.addEventListener("click", () => {
  runDailyTagPractice();
});

contestGenerateBtn.addEventListener("click", () => {
  runContestGenerator();
});

initProfileHandle();
loadTags();
updateDailyTagMeta();
