"use strict";

const API = "/api";

let token = localStorage.getItem("knox_token");
let currentConversationId = null;
let isRegister = false;

const $ = (id) => document.getElementById(id);

const authScreen = $("authScreen");
const appScreen = $("appScreen");

const authForm = $("authForm");
const authMessage = $("authMessage");

const nameField = $("nameField");
const nameInput = $("nameInput");
const emailInput = $("emailInput");
const passwordInput = $("passwordInput");

const loginTab = $("loginTab");
const registerTab = $("registerTab");

const authButtonText = $("authButtonText");

const chatMessages = $("chatMessages");
const chatForm = $("chatForm");
const messageInput = $("messageInput");

const conversationList = $("conversationList");

const sidebar = $("sidebar");


/* ---------------- AUTH MODE ---------------- */

function setAuthMode(register) {
  isRegister = register;

  loginTab.classList.toggle(
    "active",
    !register
  );

  registerTab.classList.toggle(
    "active",
    register
  );

  nameField.classList.toggle(
    "hidden",
    !register
  );

  authButtonText.textContent =
    register ? "Create Account" : "Login";

  authMessage.textContent = "";
}

loginTab.addEventListener(
  "click",
  () => setAuthMode(false)
);

registerTab.addEventListener(
  "click",
  () => setAuthMode(true)
);


/* ---------------- AUTH SUBMIT ---------------- */

authForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    authMessage.textContent =
      "Please wait...";

    const endpoint = isRegister
      ? "/auth/register"
      : "/auth/login";

    const body = {
      email: emailInput.value.trim(),
      password: passwordInput.value
    };

    if (isRegister) {
      body.name = nameInput.value.trim();
    }

    try {
      const response = await fetch(
        API + endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Authentication failed."
        );
      }

      token = data.token;

      localStorage.setItem(
        "knox_token",
        token
      );

      localStorage.setItem(
        "knox_user",
        JSON.stringify(data.user)
      );

      showApp();

    } catch (error) {
      authMessage.textContent =
        error.message;
    }
  }
);


/* ---------------- APP ---------------- */

async function showApp() {
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  const user = JSON.parse(
    localStorage.getItem("knox_user") || "{}"
  );

  $("profileName").textContent =
    user.name || "User";

  $("profileEmail").textContent =
    user.email || "";

  $("avatar").textContent =
    (user.name || "K")
      .charAt(0)
      .toUpperCase();

  await loadConversations();
}

function logout() {
  localStorage.removeItem("knox_token");
  localStorage.removeItem("knox_user");

  token = null;
  currentConversationId = null;

  appScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");

  chatMessages.innerHTML = "";
}

$("logoutBtn").addEventListener(
  "click",
  logout
);


/* ---------------- API ---------------- */

async function api(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };

  if (
    options.body &&
    typeof options.body !== "string"
  ) {
    headers["Content-Type"] =
      "application/json";

    options.body =
      JSON.stringify(options.body);
  }

  const response = await fetch(
    API + path,
    {
      ...options,
      headers
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed."
    );
  }

  return data;
}


/* ---------------- CONVERSATIONS ---------------- */

async function loadConversations() {
  try {
    const data =
      await api("/conversations");

    conversationList.innerHTML = "";

    data.conversations.forEach(
      (conversation) => {

        const button =
          document.createElement("button");

        button.className =
          "conversation-item";

        button.textContent =
          conversation.title;

        button.addEventListener(
          "click",
          () => openConversation(
            conversation.id
          )
        );

        conversationList.appendChild(
          button
        );
      }
    );
  } catch (error) {
    console.error(error);
  }
}

async function openConversation(id) {
  try {
    const data =
      await api(
        `/conversations/${id}`
      );

    currentConversationId = id;

    chatMessages.innerHTML = "";

    data.conversation.messages.forEach(
      (message) => {
        addMessage(
          message.role,
          message.content
        );
      }
    );

    sidebar.classList.remove("open");

  } catch (error) {
    console.error(error);
  }
}


/* ---------------- NEW CHAT ---------------- */

function newChat() {
  currentConversationId = null;

  chatMessages.innerHTML = `
    <div id="welcome" class="welcome">

      <div class="welcome-logo">
        K
      </div>

      <h2>What can I help you with?</h2>

      <p>
        Start a new conversation with KNOX AI.
      </p>

    </div>
  `;

  sidebar.classList.remove("open");

  messageInput.focus();
}

$("newChatBtn").addEventListener(
  "click",
  newChat
);


/* ---------------- MESSAGES ---------------- */

function addMessage(role, content) {

  const welcome =
    document.getElementById("welcome");

  if (welcome) {
    welcome.remove();
  }

  const row =
    document.createElement("div");

  row.className =
    `message-row ${
      role === "user"
        ? "user-message"
        : "assistant-message"
    }`;

  const avatar =
    document.createElement("div");

  avatar.className =
    "message-avatar";

  avatar.textContent =
    role === "user" ? "U" : "K";

  const contentDiv =
    document.createElement("div");

  contentDiv.className =
    "message-content";

  contentDiv.textContent =
    content;

  row.appendChild(avatar);
  row.appendChild(contentDiv);

  chatMessages.appendChild(row);

  chatMessages.scrollTop =
    chatMessages.scrollHeight;
}


/* ---------------- SEND MESSAGE ---------------- */

chatForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const message =
      messageInput.value.trim();

    if (!message) return;

    messageInput.value = "";

    addMessage(
      "user",
      message
    );

    const sendButton =
      $("sendButton");

    sendButton.disabled = true;

    addMessage(
      "assistant",
      "KNOX AI is thinking..."
    );

    const thinking =
      chatMessages.lastElementChild
        ?.querySelector(
          ".message-content"
        );

    try {

      const data =
        await api("/chat", {
          method: "POST",

          body: {
            message,
            conversationId:
              currentConversationId
          }
        });

      currentConversationId =
        data.conversationId;

      if (thinking) {
        thinking.textContent =
          data.reply;
      }

      await loadConversations();

    } catch (error) {

      if (thinking) {
        thinking.textContent =
          error.message;
      }

    } finally {
      sendButton.disabled = false;
      messageInput.focus();
    }
  }
);


/* ---------------- SUGGESTIONS ---------------- */

document.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "[data-prompt]"
      );

    if (!button) return;

    messageInput.value =
      button.dataset.prompt;

    messageInput.focus();
  }
);


/* ---------------- SIDEBAR ---------------- */

$("openSidebar").addEventListener(
  "click",
  () => {
    sidebar.classList.add("open");
  }
);

$("closeSidebar").addEventListener(
  "click",
  () => {
    sidebar.classList.remove("open");
  }
);


/* ---------------- THEME ---------------- */

$("themeBtn").addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "light"
    );

    localStorage.setItem(
      "knox_theme",
      document.body.classList.contains(
        "light"
      )
        ? "light"
        : "dark"
    );
  }
);

if (
  localStorage.getItem("knox_theme") ===
  "light"
) {
  document.body.classList.add("light");
}


/* ---------------- TEXTAREA ---------------- */

messageInput.addEventListener(
  "input",
  () => {

    messageInput.style.height =
      "auto";

    messageInput.style.height =
      Math.min(
        messageInput.scrollHeight,
        150
      ) + "px";
  }
);

messageInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      chatForm.requestSubmit();
    }
  }
);


/* ---------------- STARTUP ---------------- */

if (token) {
  showApp();
} else {
  authScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
}
