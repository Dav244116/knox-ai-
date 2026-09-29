"use strict";

/* =========================================================
   KNOX AI — FRONTEND ENGINE
========================================================= */

const CONFIG = {
  maxMessages: 20,
  defaultName: "Knox"
};

const $ = id => document.getElementById(id);

const body = document.body;
const drawer = $("drawer");
const shade = $("shade");

const menuBtn = $("menu");
const closeBtn = $("close");
const newChatBtn = $("newChat");

const themeBtn = $("theme");
const profileBtn = $("profile");
const profileModal = $("profileModal");

const messages = $("messages");
const historyBox = $("history");

const input = $("input");
const sendBtn = $("send");

const attachBtn = $("attach");
const fileInput = $("file");

const imageModal = $("imageModal");
const preview = $("preview");

const toast = $("toast");

const nameInput = $("name");
const endpointInput = $("endpoint");
const saveBtn = $("save");

const leftCounter = $("left");
const profileName = $("pname");
const avatar = $("avatar");

const chatStatus = $("chatStatus");

let conversations =
  JSON.parse(localStorage.getItem("knox_history") || "[]");

let messageCount =
  Number(localStorage.getItem("knox_message_count") || "0");

let currentConversationId = null;
let selectedImage = null;
let toastTimer = null;

/* =========================================================
   INIT
========================================================= */

function init() {
  checkDailyReset();
  loadSettings();
  updateProfile();
  loadTheme();
  renderHistory();
  updateCounter();
  updateChatStatus();
}

init();

/* =========================================================
   TOAST
========================================================= */

function showToast(message) {
  clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* =========================================================
   DRAWER
========================================================= */

function openDrawer() {
  drawer?.classList.add("open");
  shade?.classList.add("show");
}

function closeDrawer() {
  drawer?.classList.remove("open");
  shade?.classList.remove("show");
}

menuBtn?.addEventListener("click", openDrawer);
closeBtn?.addEventListener("click", closeDrawer);
shade?.addEventListener("click", closeDrawer);

/* =========================================================
   VIEWS
========================================================= */

function showView(view) {
  document.querySelectorAll(".view").forEach(section => {
    section.classList.remove("active");
  });

  const target = $(view + "View");

  if (target) {
    target.classList.add("active");
  }

  closeDrawer();

  if (view === "history") {
    renderHistory();
  }
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
  });
});

$("home")?.addEventListener("click", () => {
  showView("home");
});

/* =========================================================
   NEW CHAT
========================================================= */

function startNewChat() {
  currentConversationId = null;

  messages.innerHTML = "";

  showView("chat");

  addAssistantMessage(
    `Hey ${getName()} 👋\n\n` +
    "I'm KNOX AI. What do you want to work on?"
  );
}

newChatBtn?.addEventListener("click", startNewChat);

/* =========================================================
   MESSAGES
========================================================= */

function addUserMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "msg user";

  const icon = document.createElement("div");
  icon.className = "msgicon";
  icon.textContent = getInitial();

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrapper.append(icon, bubble);
  messages.appendChild(wrapper);

  scrollChat();
}

function addAssistantMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "msg";

  const icon = document.createElement("div");
  icon.className = "msgicon";
  icon.textContent = "🦊";

  const content = document.createElement("div");

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  const actions = document.createElement("div");
  actions.className = "msg-actions";

  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "Copy";

  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied");
    } catch {
      showToast("Copy failed");
    }
  });

  actions.appendChild(copy);
  content.append(bubble, actions);
  wrapper.append(icon, content);

  messages.appendChild(wrapper);

  scrollChat();
}

function addTyping() {
  const wrapper = document.createElement("div");
  wrapper.className = "msg";
  wrapper.id = "typing";

  const icon = document.createElement("div");
  icon.className = "msgicon";
  icon.textContent = "🦊";

  const bubble = document.createElement("div");
  bubble.className = "bubble typing";

  ["", "", ""].forEach(() => {
    const dot = document.createElement("i");
    bubble.appendChild(dot);
  });

  wrapper.append(icon, bubble);
  messages.appendChild(wrapper);

  scrollChat();
}

function removeTyping() {
  $("typing")?.remove();
}

function scrollChat() {
  setTimeout(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  }, 50);
}

/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {
  const text = input.value.trim();

  if (!text) return;

  if (messageCount >= CONFIG.maxMessages) {
    showToast("Daily message limit reached.");
    return;
  }

  input.value = "";
  autoResize();

  showView("chat");

  addUserMessage(text);

  incrementCounter();

  saveConversationMessage("user", text);

  addTyping();

  try {
    const answer = await getAIResponse(text);

    removeTyping();

    addAssistantMessage(answer);
    saveConversationMessage("assistant", answer);
  } catch (error) {
    removeTyping();

    addAssistantMessage(
      "I couldn't reach the AI backend.\n\n" +
      "Open Settings and check your AI endpoint."
    );

    chatStatus.textContent = "Backend connection failed";
  }
}

sendBtn?.addEventListener("click", sendMessage);

/* =========================================================
   AI BACKEND
========================================================= */

async function getAIResponse(text) {
  const endpoint =
    localStorage.getItem("knox_endpoint") || "";

  if (!endpoint) {
    return localResponse(text);
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        prompt: text,
        name: getName()
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    const answer =
      data.reply ||
      data.response ||
      data.answer ||
      data.message ||
      data.output ||
      data.text ||
      data.content ||
      data.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("Backend returned no answer");
    }

    chatStatus.textContent = "AI backend connected";

    return String(answer);
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================
   DEMO RESPONSE
========================================================= */

function localResponse(text) {
  const q = text.toLowerCase();

  if (/^(hi|hello|hey)\b/.test(q)) {
    return (
      `Hey ${getName()} 👋\n\n` +
      "KNOX AI is ready. Connect a real AI endpoint in " +
      "Settings when you want full AI responses."
    );
  }

  if (q.includes("who are you")) {
    return (
      "I'm KNOX AI 🦊 — your personal AI assistant interface.\n\n" +
      "The frontend is running in Demo Mode."
    );
  }

  if (q.includes("photosynthesis")) {
    return (
      "Photosynthesis is the process plants use to make " +
      "glucose using light energy.\n\n" +
      "Carbon dioxide + water → glucose + oxygen.\n\n" +
      "It mainly takes place in chloroplasts."
    );
  }

  if (q.includes("html")) {
    return (
      "HTML provides the structure of a webpage.\n\n" +
      "CSS controls its appearance, while JavaScript " +
      "adds behaviour and interactivity."
    );
  }

  if (q.includes("css")) {
    return (
      "CSS controls the appearance of webpages, including " +
      "layout, colours, fonts, spacing and responsive design."
    );
  }

  if (q.includes("javascript")) {
    return (
      "JavaScript makes webpages interactive.\n\n" +
      "KNOX AI uses JavaScript for chat, navigation, " +
      "history, settings and backend communication."
    );
  }

  if (q.includes("quadratic")) {
    return (
      "For ax² + bx + c = 0:\n\n" +
      "x = (-b ± √(b² - 4ac)) / 2a\n\n" +
      "Send the actual equation when you want to solve one."
    );
  }

  if (q.includes("study")) {
    return (
      "A simple study session:\n\n" +
      "1. Review your notes.\n" +
      "2. Study the hardest topic.\n" +
      "3. Answer practice questions.\n" +
      "4. Check your mistakes.\n" +
      "5. Summarize what you learned."
    );
  }

  return (
    `I received your message:\n\n“${text}”\n\n` +
    "KNOX AI is currently in Demo Mode. " +
    "Connect an AI backend in Settings for real AI responses."
  );
}

/* =========================================================
   QUICK PROMPTS
========================================================= */

document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    sendMessage();
  });
});

/* =========================================================
   TEXT INPUT
========================================================= */

input?.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

input?.addEventListener("input", autoResize);

function autoResize() {
  input.style.height = "auto";
  input.style.height =
    Math.min(input.scrollHeight, 120) + "px";
}

/* =========================================================
   COUNTER
========================================================= */

function incrementCounter() {
  messageCount++;

  localStorage.setItem(
    "knox_message_count",
    String(messageCount)
  );

  updateCounter();
}

function updateCounter() {
  const remaining =
    Math.max(CONFIG.maxMessages - messageCount, 0);

  if (leftCounter) {
    leftCounter.textContent = remaining;
  }

  if (sendBtn) {
    sendBtn.disabled = remaining <= 0;
  }
}

/* =========================================================
   HISTORY
========================================================= */

function saveConversationMessage(role, text) {
  if (!currentConversationId) {
    currentConversationId = Date.now().toString();

    conversations.unshift({
      id: currentConversationId,
      title:
        role === "user"
          ? text.slice(0, 45)
          : "New chat",
      messages: [],
      created: new Date().toISOString()
    });
  }

  const conversation =
    conversations.find(
      item => item.id === currentConversationId
    );

  if (!conversation) return;

  conversation.messages.push({
    role,
    text,
    time: new Date().toISOString()
  });

  if (role === "user") {
    conversation.title =
      text.length > 45
        ? text.slice(0, 45) + "..."
        : text;
  }

  conversation.updated =
    new Date().toISOString();

  localStorage.setItem(
    "knox_history",
    JSON.stringify(conversations)
  );

  renderHistory();
}

function renderHistory() {
  if (!historyBox) return;

  historyBox.innerHTML = "";

  if (!conversations.length) {
    historyBox.innerHTML =
      '<div class="empty">No conversations yet.<br><br>' +
      "Start chatting with KNOX AI.</div>";

    return;
  }

  conversations.forEach(conversation => {
    const item = document.createElement("div");
    item.className = "history-item";

    const info = document.createElement("div");

    const title = document.createElement("b");
    title.textContent =
      conversation.title || "New chat";

    const date = document.createElement("small");
    date.textContent =
      formatDate(
        conversation.updated ||
        conversation.created
      );

    info.append(title, date);

    const open = document.createElement("button");
    open.type = "button";
    open.textContent = "Open";

    open.addEventListener("click", () => {
      openConversation(conversation.id);
    });

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Delete";

    del.addEventListener("click", () => {
      deleteConversation(conversation.id);
    });

    item.append(info, open, del);

    historyBox.appendChild(item);
  });
}

function openConversation(id) {
  const conversation =
    conversations.find(item => item.id === id);

  if (!conversation) return;

  currentConversationId = id;
  messages.innerHTML = "";

  conversation.messages.forEach(message => {
    if (message.role === "user") {
      addUserMessage(message.text);
    } else {
      addAssistantMessage(message.text);
    }
  });

  showView("chat");
}

function deleteConversation(id) {
  conversations =
    conversations.filter(item => item.id !== id);

  localStorage.setItem(
    "knox_history",
    JSON.stringify(conversations)
  );

  if (currentConversationId === id) {
    currentConversationId = null;
    messages.innerHTML = "";
  }

  renderHistory();
  showToast("Chat deleted");
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleString();
}

/* =========================================================
   CLEAR DATA
========================================================= */

$("clear")?.addEventListener("click", () => {
  if (!confirm(
    "Clear KNOX AI local history, settings and profile?"
  )) {
    return;
  }

  [
    "knox_history",
    "knox_name",
    "knox_endpoint",
    "knox_message_count",
    "knox_counter_date"
  ].forEach(key => localStorage.removeItem(key));

  conversations = [];
  messageCount = 0;
  currentConversationId = null;

  messages.innerHTML = "";

  nameInput.value = CONFIG.defaultName;
  endpointInput.value = "";

  updateProfile();
  updateCounter();
  renderHistory();
  updateChatStatus();

  showToast("Local data cleared");
});

/* =========================================================
   THEME
========================================================= */

function loadTheme() {
  const theme =
    localStorage.getItem("knox_theme");

  const dark = theme === "dark";

  body.classList.toggle("dark", dark);

  if (themeBtn) {
    themeBtn.textContent =
      dark ? "☀" : "☾";
  }
}

themeBtn?.addEventListener("click", () => {
  body.classList.toggle("dark");

  const dark =
    body.classList.contains("dark");

  localStorage.setItem(
    "knox_theme",
    dark ? "dark" : "light"
  );

  themeBtn.textContent =
    dark ? "☀" : "☾";
});

/* =========================================================
   PROFILE
========================================================= */

function getName() {
  return (
    localStorage.getItem("knox_name") ||
    CONFIG.defaultName
  );
}

function getInitial() {
  const name = getName().trim();

  return name
    ? name.charAt(0).toUpperCase()
    : "K";
}

function updateProfile() {
  if (profileName) {
    profileName.textContent = getName();
  }

  if (avatar) {
    avatar.textContent = getInitial();
  }
}

profileBtn?.addEventListener("click", () => {
  profileModal?.classList.add("show");
});

$("editProfile")?.addEventListener("click", () => {
  profileModal?.classList.remove("show");

  showView("settings");

  setTimeout(() => {
    nameInput?.focus();
  }, 100);
});

/* =========================================================
   SETTINGS
========================================================= */

function loadSettings() {
  if (nameInput) {
    nameInput.value =
      localStorage.getItem("knox_name") ||
      CONFIG.defaultName;
  }

  if (endpointInput) {
    endpointInput.value =
      localStorage.getItem("knox_endpoint") ||
      "";
  }
}

function validEndpoint(value) {
  if (!value) return true;

  try {
    const url =
      new URL(value, window.location.href);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

saveBtn?.addEventListener("click", () => {
  const name =
    nameInput.value.trim() || CONFIG.defaultName;

  const endpoint =
    endpointInput.value.trim();

  if (!validEndpoint(endpoint)) {
    showToast("Enter a valid HTTP/HTTPS endpoint.");
    return;
  }

  localStorage.setItem("knox_name", name);
  localStorage.setItem("knox_endpoint", endpoint);

  updateProfile();
  updateChatStatus();

  showToast("Settings saved");
});

/* =========================================================
   CHAT STATUS
========================================================= */

function updateChatStatus() {
  if (!chatStatus) return;

  const endpoint =
    localStorage.getItem("knox_endpoint") || "";

  chatStatus.textContent =
    endpoint
      ? "AI backend connected"
      : "Demo mode";
}

/* =========================================================
   BACK / MORE
========================================================= */

$("back")?.addEventListener("click", () => {
  showView("home");
});

$("more")?.addEventListener("click", () => {
  startNewChat();
});

/* =========================================================
   IMAGE ATTACHMENT
========================================================= */

attachBtn?.addEventListener("click", () => {
  fileInput?.click();
});

fileInput?.addEventListener("change", event => {
  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please select an image.");
    fileInput.value = "";
    return;
  }

  selectedImage = file;

  const reader = new FileReader();

  reader.onload = event => {
    preview.src = event.target.result;
    imageModal?.classList.add("show");
  };

  reader.readAsDataURL(file);
});

$("askImage")?.addEventListener("click", () => {
  if (!selectedImage) return;

  const filename = selectedImage.name;

  imageModal?.classList.remove("show");

  showView("chat");

  addUserMessage(
    "I attached an image: " + filename
  );

  incrementCounter();

  addAssistantMessage(
    "The image was attached successfully.\n\n" +
    "Full image understanding requires a vision-capable backend."
  );

  selectedImage = null;
  fileInput.value = "";
});

/* =========================================================
   MODALS
========================================================= */

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    const modal = $(button.dataset.close);

    if (modal) {
      modal.classList.remove("show");
    }
  });
});

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      modal.classList.remove("show");
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document
      .querySelectorAll(".modal.show")
      .forEach(modal => {
        modal.classList.remove("show");
      });

    closeDrawer();
  }
});

/* =========================================================
   DAILY RESET
========================================================= */

function checkDailyReset() {
  const today =
    new Date().toISOString().slice(0, 10);

  const savedDate =
    localStorage.getItem("knox_counter_date");

  if (savedDate !== today) {
    messageCount = 0;

    localStorage.setItem(
      "knox_message_count",
      "0"
    );

    localStorage.setItem(
      "knox_counter_date",
      today
    );
  }

  updateCounter();
}

/* =========================================================
   PAGE VISIBILITY
========================================================= */

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    checkDailyReset();
    updateProfile();
    updateChatStatus();
  }
});

/* =========================================================
   BEFORE UNLOAD
========================================================= */

window.addEventListener("beforeunload", () => {
  localStorage.setItem(
    "knox_history",
    JSON.stringify(conversations)
  );
});

/* =========================================================
   FINAL STARTUP
========================================================= */

function finalStartup() {
  checkDailyReset();
  loadSettings();
  updateProfile();
  loadTheme();
  renderHistory();
  updateCounter();
  updateChatStatus();
}

finalStartup();