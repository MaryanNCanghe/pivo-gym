document.addEventListener("DOMContentLoaded", () => {
  const csrftoken = document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "";
  const feed = document.getElementById("feed");
  const feedEmpty = document.getElementById("feedEmpty");
  const feedEnd = document.getElementById("feedEnd");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const postContent = document.getElementById("postContent");
  const postImageInput = document.getElementById("postImageInput");
  const postSubmitBtn = document.getElementById("postSubmitBtn");
  const imagePreviewWrap = document.getElementById("imagePreviewWrap");
  const imagePreviewImg = document.getElementById("imagePreviewImg");
  const removeImageBtn = document.getElementById("removeImageBtn");
  const composeAvatar = document.getElementById("composeAvatar");

  let currentPage = 1;
  let loading = false;

  // ── Avatar color from username ──────────────────────────────────
  function avatarColor(name) {
    const palette = ["#e91e8c", "#c2185b", "#9c27b0", "#f48fb1", "#ab47bc"];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
  }

  function buildAvatar(user, size = 38, extraClass = "") {
    const div = document.createElement("div");
    div.className = `comm-avatar ${extraClass}`;
    div.style.width = size + "px";
    div.style.height = size + "px";
    div.style.fontSize = (size * 0.42) + "px";
    if (user.avatar) {
      const img = document.createElement("img");
      img.src = user.avatar;
      img.alt = user.username;
      div.appendChild(img);
    } else {
      div.textContent = user.initials;
      div.style.background = avatarColor(user.username);
    }
    return div;
  }

  // ── Seed compose avatar with current user's initial ─────────────
  // We'll derive it from the first post we load; meanwhile show a placeholder
  composeAvatar.textContent = "?";
  composeAvatar.style.background = "#8b9978";

  // ── Image preview ───────────────────────────────────────────────
  postImageInput.addEventListener("change", () => {
    const file = postImageInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    imagePreviewImg.src = url;
    imagePreviewWrap.hidden = false;
  });

  removeImageBtn.addEventListener("click", () => {
    postImageInput.value = "";
    imagePreviewImg.src = "";
    imagePreviewWrap.hidden = true;
  });

  // ── Submit post ─────────────────────────────────────────────────
  postSubmitBtn.addEventListener("click", async () => {
    const content = postContent.value.trim();
    const file = postImageInput.files[0];
    if (!content && !file) return;

    postSubmitBtn.disabled = true;
    postSubmitBtn.textContent = "Posting…";

    const fd = new FormData();
    fd.append("content", content);
    if (file) fd.append("image", file);

    try {
      const res = await fetch("/api/posts/", {
        method: "POST",
        headers: { "X-CSRFToken": csrftoken },
        body: fd,
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      postContent.value = "";
      postImageInput.value = "";
      imagePreviewImg.src = "";
      imagePreviewWrap.hidden = true;
      feedEmpty.hidden = true;
      feed.prepend(buildPostCard(data.post));
      // Seed compose avatar from own user
      updateComposeAvatar(data.post.user);
    } catch (err) {
      alert(err.message);
    } finally {
      postSubmitBtn.disabled = false;
      postSubmitBtn.textContent = "Post";
    }
  });

  function updateComposeAvatar(user) {
    composeAvatar.innerHTML = "";
    if (user.avatar) {
      const img = document.createElement("img");
      img.src = user.avatar;
      composeAvatar.appendChild(img);
    } else {
      composeAvatar.textContent = user.initials;
      composeAvatar.style.background = avatarColor(user.username);
    }
  }

  // ── Build post card ─────────────────────────────────────────────
  function buildPostCard(post) {
    const card = document.createElement("div");
    card.className = "comm-post";
    card.dataset.id = post.id;

    // Header
    const header = document.createElement("div");
    header.className = "comm-post-header";
    header.appendChild(buildAvatar(post.user));

    const meta = document.createElement("div");
    meta.className = "comm-post-meta";
    meta.innerHTML = `
      <div class="comm-post-username">${esc(post.user.username)}</div>
      <div class="comm-post-time">${esc(post.time_ago)}</div>
    `;
    header.appendChild(meta);

    if (post.is_mine) {
      const menuWrap = document.createElement("div");
      menuWrap.className = "comm-post-menu";
      const menuBtn = document.createElement("button");
      menuBtn.className = "comm-menu-btn";
      menuBtn.textContent = "···";
      const dropdown = document.createElement("div");
      dropdown.className = "comm-menu-dropdown";
      dropdown.hidden = true;
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete post";
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Delete this post?")) return;
        await fetch(`/api/posts/${post.id}/delete/`, { method: "POST", headers: { "X-CSRFToken": csrftoken } });
        card.remove();
        if (!feed.children.length) feedEmpty.hidden = false;
      });
      dropdown.appendChild(deleteBtn);
      menuBtn.addEventListener("click", e => {
        e.stopPropagation();
        dropdown.hidden = !dropdown.hidden;
      });
      document.addEventListener("click", () => { dropdown.hidden = true; }, { once: false });
      menuWrap.appendChild(menuBtn);
      menuWrap.appendChild(dropdown);
      header.appendChild(menuWrap);
    }

    card.appendChild(header);

    // Content
    if (post.content) {
      const p = document.createElement("div");
      p.className = "comm-post-content";
      p.textContent = post.content;
      card.appendChild(p);
    }

    // Image
    if (post.image) {
      const img = document.createElement("img");
      img.className = "comm-post-image";
      img.src = post.image;
      img.alt = "Post image";
      card.appendChild(img);
    }

    // Actions
    const actions = document.createElement("div");
    actions.className = "comm-actions";

    const likeBtn = document.createElement("button");
    likeBtn.className = "comm-action-btn" + (post.liked_by_me ? " liked" : "");
    likeBtn.innerHTML = heartIcon(post.liked_by_me) + `<span>${post.likes_count}</span>`;
    likeBtn.addEventListener("click", async () => {
      const res = await fetch(`/api/posts/${post.id}/like/`, { method: "POST", headers: { "X-CSRFToken": csrftoken } });
      const data = await res.json();
      likeBtn.className = "comm-action-btn" + (data.liked ? " liked" : "");
      likeBtn.innerHTML = heartIcon(data.liked) + `<span>${data.likes_count}</span>`;
    });

    const commentCount = document.createElement("span");
    commentCount.className = "comm-comment-count";
    commentCount.textContent = post.comments_count;

    const commentBtn = document.createElement("button");
    commentBtn.className = "comm-action-btn";
    commentBtn.innerHTML = commentIcon() + `<span>${post.comments_count}</span>`;

    actions.appendChild(likeBtn);
    actions.appendChild(commentBtn);
    card.appendChild(actions);

    // Comments section (lazy)
    const commentsSection = document.createElement("div");
    commentsSection.className = "comm-comments";
    commentsSection.hidden = true;
    card.appendChild(commentsSection);

    let commentsLoaded = false;
    commentBtn.addEventListener("click", async () => {
      commentsSection.hidden = !commentsSection.hidden;
      if (!commentsSection.hidden && !commentsLoaded) {
        commentsLoaded = true;
        await loadComments(post.id, commentsSection, commentBtn);
      }
    });

    return card;
  }

  function heartIcon(filled) {
    return filled
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="#e91e8c" stroke="#e91e8c" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  }

  function commentIcon() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  }

  // ── Load comments for a post ────────────────────────────────────
  async function loadComments(postId, section, commentBtn) {
    section.innerHTML = '<div class="comm-loading" style="padding:.5rem 0">Loading…</div>';
    const res = await fetch(`/api/posts/${postId}/comments/`);
    const data = await res.json();
    section.innerHTML = "";

    data.comments.forEach(c => section.appendChild(buildComment(c)));

    // Comment input row
    const inputRow = document.createElement("div");
    inputRow.className = "comm-comment-input-row";
    const input = document.createElement("input");
    input.className = "comm-comment-input";
    input.placeholder = "Write a comment…";
    input.type = "text";
    const sendBtn = document.createElement("button");
    sendBtn.className = "comm-comment-send";
    sendBtn.title = "Send";
    sendBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

    const send = async () => {
      const text = input.value.trim();
      if (!text) return;
      sendBtn.disabled = true;
      const res = await fetch(`/api/posts/${postId}/comments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (data.ok) {
        input.value = "";
        inputRow.before(buildComment(data.comment));
        // Update comment count on button
        const countEl = commentBtn.querySelector("span");
        if (countEl) countEl.textContent = parseInt(countEl.textContent || "0") + 1;
      }
      sendBtn.disabled = false;
    };

    sendBtn.addEventListener("click", send);
    input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); send(); } });
    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);
    section.appendChild(inputRow);
  }

  function buildComment(c) {
    const wrap = document.createElement("div");
    wrap.className = "comm-comment";
    wrap.appendChild(buildAvatar(c.user, 28, "comm-comment-avatar"));
    const body = document.createElement("div");
    body.className = "comm-comment-body";
    body.innerHTML = `
      <span class="comm-comment-user">${esc(c.user.username)}</span>
      <span class="comm-comment-time">${esc(c.time_ago)}</span>
      <div class="comm-comment-text">${esc(c.content)}</div>
    `;
    wrap.appendChild(body);
    return wrap;
  }

  // ── Load feed ───────────────────────────────────────────────────
  async function loadPage(page) {
    if (loading) return;
    loading = true;
    const spinner = document.createElement("div");
    spinner.className = "comm-loading";
    spinner.textContent = "Loading…";
    feed.appendChild(spinner);

    try {
      const res = await fetch(`/api/posts/?page=${page}`);
      const data = await res.json();
      spinner.remove();

      if (!data.posts.length && page === 1) {
        feedEmpty.hidden = false;
      }

      data.posts.forEach(p => {
        feed.appendChild(buildPostCard(p));
        // Seed compose avatar from the logged-in user's own post
        if (p.is_mine) updateComposeAvatar(p.user);
      });

      feedEnd.hidden = !data.has_more;
      currentPage = page;
    } catch {
      spinner.remove();
    } finally {
      loading = false;
    }
  }

  loadMoreBtn.addEventListener("click", () => loadPage(currentPage + 1));

  loadPage(1);

  // ── Challenge board ─────────────────────────────────────────────
  async function loadChallenges() {
    try {
      const res = await fetch('/api/challenges/');
      const data = await res.json();
      const list = document.getElementById('challengeList');
      if (!list) return;
      if (!data.challenges.length) {
        list.innerHTML = '<p class="text-muted-pivo text-center" style="padding:1rem 0;">No challenges yet. Create the first one!</p>';
        return;
      }
      list.innerHTML = '';
      data.challenges.forEach(c => list.appendChild(buildChallengeCard(c)));
    } catch {}
  }

  function buildChallengeCard(c) {
    const card = document.createElement('div');
    card.className = 'comm-post';
    card.id = `challenge-${c.id}`;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;">
        <div>
          <div style="font-weight:700;font-size:.95rem;color:var(--pebble);">${esc(c.title)}</div>
          ${c.description ? `<div style="font-size:.85rem;color:var(--muted);margin-top:.2rem;">${esc(c.description)}</div>` : ''}
          <div style="font-size:.78rem;color:var(--muted);margin-top:.35rem;">by ${esc(c.creator)} · ends ${c.end_date} · ${c.participant_count} joined</div>
        </div>
        <button class="challenge-join-btn btn-${c.is_joined ? 'outline' : 'primary'}-min" data-id="${c.id}" style="white-space:nowrap;flex-shrink:0;">
          ${c.is_joined ? 'Leave' : 'Join'}
        </button>
      </div>
    `;
    card.querySelector('.challenge-join-btn').addEventListener('click', async function() {
      const res = await fetch(`/api/challenges/${c.id}/join/`, { method: 'POST', headers: { 'X-CSRFToken': csrftoken } });
      const data = await res.json();
      c.is_joined = data.joined;
      c.participant_count = data.participant_count;
      const newCard = buildChallengeCard(c);
      card.replaceWith(newCard);
    });
    return card;
  }

  window.createChallenge = async function() {
    const title = document.getElementById('challengeTitle').value.trim();
    const desc = document.getElementById('challengeDesc').value.trim();
    const endDate = document.getElementById('challengeEnd').value;
    if (!title) { alert('Please enter a challenge title.'); return; }
    const res = await fetch('/api/challenges/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
      body: JSON.stringify({ title, description: desc, end_date: endDate }),
    });
    const data = await res.json();
    if (data.ok) {
      document.getElementById('challengeTitle').value = '';
      document.getElementById('challengeDesc').value = '';
      document.getElementById('challengeEnd').value = '';
      document.getElementById('challengeForm').hidden = true;
      const list = document.getElementById('challengeList');
      list.innerHTML = '';
      list.prepend(buildChallengeCard(data.challenge));
    }
  };

  loadChallenges();

  // ── Helpers ─────────────────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});
