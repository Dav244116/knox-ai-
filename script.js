"use strict";

/* =========================================================
   KNOX AI
   Main JavaScript
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const DEFAULT_ENDPOINT =
  "https://knox-ai-backend-production.up.railway.app/api/chat";


const STORAGE = {
  name: "knox_ai_name",
  endpoint: "knox_ai_endpoint",
  theme: "knox_ai_theme",
  history: "knox_ai_history"
};


/* =========================================================
   ELEMENTS
========================================================= */

const drawer =
  document.getElementById("drawer");

const shade =
  document.getElementById("shade");

const menu =
  document.getElementById("menu");

const closeDrawer =
  document.getElementById("close");

const newChat =
  document.getElementById("newChat");

const homeButton =
  document.getElementById("homeButton");

const theme =
  document.getElementById("theme");

const profile =
  document.getElementById("profile");

const avatar =
  document.getElementById("avatar");

const pname =
  document.getElementById("pname");

const left =
  document.getElementById("left");

const messagesBox =
  document.getElementById("messages");

const input =
  document.getElementById("input");

const send =
  document.getElementById("send");

const attach =
  document.getElementById("attach");

const fileInput =
  document.getElementById("file");

const toast =
  document.getElementById("toast");

const chatStatus =
  document.getElementById("chatStatus");

const homeStatus =
  document.getElementById("homeStatus");

const endpointInput =
  document.getElementById("endpoint");

const nameInput =
  document.getElementById("name");

const saveButton =
  document.getElementById("save");

const historyBox =
  document.getElementById("history");

const back =
  document.getElementById("back");

const more =
  document.getElementById("more");

const clearButton =
  document.getElementById("clear");

const editProfile =
  document.getElementById("editProfile");

const preview =
  document.getElementById("preview");

const askImage =
  document.getElementById("askImage");


/* =========================================================
   STATE
========================================================= */

let endpoint =
  localStorage.getItem(STORAGE.endpoint) ||
  DEFAULT_ENDPOINT;

let userName =
  localStorage.getItem(STORAGE.name) ||
  "Knox";

let messages = [];

let currentConversation = [];

let attachedImage = null;

let isSending = false;


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  loadTheme();

  loadProfile();

  endpointInput.value = endpoint;

  setupNavigation();

  setupPromptButtons();

  setupComposer();

  setupDrawer();

  setupModals();

  setupSettings();

  setupHistory();

  setupTheme();

  updateUsage();

  updateConnectionStatus();

});


/* =========================================================
   THEME
========================================================= */

function loadTheme(){

  const savedTheme =
    localStorage.getItem(STORAGE.theme);

  if(savedTheme === "dark"){
    document.body.classList.add("dark");
    theme.textContent = "☀";
  }else{
    theme.textContent = "☾";
  }

}


function setupTheme(){

  theme.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const dark =
      document.body.classList.contains("dark");

    localStorage.setItem(
      STORAGE.theme,
      dark ? "dark" : "light"
    );

    theme.textContent =
      dark ? "☀" : "☾";

  });

}


/* =========================================================
   PROFILE
========================================================= */

function loadProfile(){

  pname.textContent = userName;

  avatar.textContent =
    userName.charAt(0).toUpperCase();

  nameInput.value = userName;

}


function saveProfile(){

  let name =
    nameInput.value.trim();

  if(!name){
    name = "Knox";
  }

  userName = name;

  localStorage.setItem(
    STORAGE.name,
    userName
  );

  loadProfile();

  showToast("Profile saved");

}


/* =========================================================
   DRAWER
========================================================= */

function openDrawer(){

  drawer.classList.add("open");

  shade.classList.add("show");

}


function closeDrawerFn(){

  drawer.classList.remove("open");

  shade.classList.remove("show");

}


function setupDrawer(){

  menu.addEventListener(
    "click",
    openDrawer
  );

  closeDrawer.addEventListener(
    "click",
    closeDrawerFn
  );

  shade.addEventListener(
    "click",
    closeDrawerFn
  );

}


/* =========================================================
   NAVIGATION
========================================================= */

function showView(name){

  document
    .querySelectorAll(".view")
    .forEach(view => {

      view.classList.remove("active");

    });


  const target =
    document.getElementById(
      name + "View"
    );


  if(target){
    target.classList.add("active");
  }


  closeDrawerFn();

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

}


function setupNavigation(){

  document
    .querySelectorAll("[data-view]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          showView(
            button.dataset.view
          );

        }
      );

    });


  homeButton.addEventListener(
    "click",
    () => showView("home")
  );


  back.addEventListener(
    "click",
    () => {

      showView("home");

    }
  );

}


/* =========================================================
   PROMPT BUTTONS
========================================================= */

function setupPromptButtons(){

  document
    .querySelectorAll("[data-prompt]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const prompt =
            button.dataset.prompt;

          if(!prompt){
            return;
          }

          openChat();

          input.value = prompt;

          autoResize();

          input.focus();

        }
      );

    });

}


/* =========================================================
   CHAT
========================================================= */

function openChat(){

  showView("chat");

  if(messages.length === 0){

    renderWelcome();

  }

}


function renderWelcome(){

  messagesBox.innerHTML = "";

  addMessageToUI(
    "assistant",
    `Hey ${userName}! 🦊

I'm KNOX AI. Ask me anything and I'll do my best to help you.

You can ask me about school, coding, writing, maths, ideas, or everyday questions.`
  );

}


function addMessageToUI(
  role,
  text,
  options = {}
){

  const row =
    document.createElement("div");

  row.className =
    "msg " +
    (role === "user" ? "user" : "");


  const icon =
    document.createElement("div");

  icon.className = "msgicon";

  icon.textContent =
    role === "user"
      ? avatar.textContent
      : "🦊";


  const content =
    document.createElement("div");


  const bubble =
    document.createElement("div");

  bubble.className = "bubble";

  bubble.textContent = text;


  content.appendChild(bubble);


  if(role === "assistant"){

    const actions =
      document.createElement("div");

    actions.className =
      "msg-actions";


    const copy =
      document.createElement("button");

    copy.textContent = "Copy";

    copy.addEventListener(
      "click",
      async () => {

        try{

          await navigator.clipboard.writeText(
            text
          );

          showToast("Copied");

        }catch{

          showToast(
            "Copy is unavailable"
          );

        }

      }
    );


    actions.appendChild(copy);

    content.appendChild(actions);

  }


  row.appendChild(icon);

  row.appendChild(content);

  messagesBox.appendChild(row);

  messagesBox.scrollIntoView({
    behavior:"smooth",
    block:"end"
  });

}


/* =========================================================
   TYPING INDICATOR
========================================================= */

function showTyping(){

  const row =
    document.createElement("div");

  row.className =
    "msg typing-message";


  const icon =
    document.createElement("div");

  icon.className = "msgicon";

  icon.textContent = "🦊";


  const bubble =
    document.createElement("div");

  bubble.className =
    "bubble typing";


  bubble.innerHTML =
    "<i></i><i></i><i></i>";


  row.appendChild(icon);

  row.appendChild(bubble);

  messagesBox.appendChild(row);

  messagesBox.scrollIntoView({
    behavior:"smooth",
    block:"end"
  });


  return row;

}


/* =========================================================
   COMPOSER
========================================================= */

function setupComposer(){

  send.addEventListener(
    "click",
    sendMessage
  );


  input.addEventListener(
    "keydown",
    event => {

      if(
        event.key === "Enter" &&
        !event.shiftKey
      ){

        event.preventDefault();

        sendMessage();

      }

    }
  );


  input.addEventListener(
    "input",
    autoResize
  );


  attach.addEventListener(
    "click",
    () => {

      fileInput.click();

    }
  );


  fileInput.addEventListener(
    "change",
    handleImage
  );


  newChat.addEventListener(
    "click",
    startNewChat
  );

}


/* =========================================================
   AUTO RESIZE
========================================================= */

function autoResize(){

  input.style.height = "auto";

  input.style.height =
    Math.min(
      input.scrollHeight,
      120
    ) + "px";

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(){

  if(isSending){
    return;
  }


  const text =
    input.value.trim();


  if(!text && !attachedImage){

    showToast(
      "Type a message first"
    );

    return;

  }


  openChat();


  const userText =
    text ||
    "Please analyze the attached image.";


  addMessageToUI(
    "user",
    userText
  );


  currentConversation.push({
    role:"user",
    content:userText
  });


  input.value = "";

  autoResize();


  const imageToSend =
    attachedImage;


  attachedImage = null;


  isSending = true;

  send.disabled = true;

  chatStatus.textContent =
    "KNOX AI is thinking...";


  const typing =
    showTyping();


  try{

    const reply =
      await requestAI(
        userText,
        imageToSend
      );


    typing.remove();


    addMessageToUI(
      "assistant",
      reply
    );


    currentConversation.push({
      role:"assistant",
      content:reply
    });


    saveConversation();


  }catch(error){

    typing.remove();


    const message =
      getReadableError(error);


    addMessageToUI(
      "assistant",
      message
    );


  }finally{

    isSending = false;

    send.disabled = false;

    chatStatus.textContent =
      "Connected to KNOX AI";

    updateUsage();

  }

}


/* =========================================================
   BACKEND REQUEST
========================================================= */

async function requestAI(
  text,
  image
){

  if(!endpoint){

    throw new Error(
      "No backend endpoint has been configured."
    );

  }


  const payload = {

    message:text,

    prompt:text,

    messages:[
      ...currentConversation
    ],

    name:userName

  };


  if(image){

    payload.image = image;

  }


  const response =
    await fetch(
      endpoint,
      {
        method:"POST",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:JSON.stringify(payload)
      }
    );


  if(!response.ok){

    let detail = "";

    try{

      detail =
        await response.text();

    }catch{

      detail = "";

    }


    throw new Error(
      `Backend returned HTTP ${response.status}. ${detail}`
    );

  }


  const data =
    await response.json();


  return extractAIResponse(data);

}


/* =========================================================
   RESPONSE PARSER
========================================================= */

function extractAIResponse(data){

  if(typeof data === "string"){

    return data;

  }


  const possible =
    [

      data?.reply,

      data?.response,

      data?.message,

      data?.answer,

      data?.content,

      data?.text,

      data?.output,

      data?.data?.reply,

      data?.data?.response,

      data?.data?.message,

      data?.data?.content,

      data?.choices?.[0]?.message?.content,

      data?.choices?.[0]?.text

    ];


  const found =
    possible.find(
      value =>
        typeof value === "string" &&
        value.trim()
    );


  if(found){

    return found.trim();

  }


  throw new Error(
    "The backend responded, but no AI message was found in the response."
  );

}


/* =========================================================
   IMAGE
========================================================= */

function handleImage(event){

  const file =
    event.target.files?.[0];


  if(!file){
    return;
  }


  if(!file.type.startsWith("image/")){

    showToast(
      "Please select an image"
    );

    return;

  }


  const reader =
    new FileReader();


  reader.onload = () => {

    attachedImage =
      reader.result;

    preview.src =
      attachedImage;

    document
      .getElementById("imageModal")
      .classList.add("show");


    showToast(
      "Image attached"
    );

  };


  reader.readAsDataURL(file);

}


/* =========================================================
   ASK ABOUT IMAGE
========================================================= */

askImage.addEventListener(
  "click",
  () => {

    document
      .getElementById("imageModal")
      .classList.remove("show");


    openChat();


    if(!attachedImage){

      showToast(
        "No image selected"
      );

      return;

    }


    input.value =
      "Please analyze this image and explain what you can see.";

    autoResize();

    input.focus();

  }
);


/* =========================================================
   MODALS
========================================================= */

function setupModals(){

  profile.addEventListener(
    "click",
    () => {

      document
        .getElementById("profileModal")
        .classList.add("show");

    }
  );


  editProfile.addEventListener(
    "click",
    () => {

      document
        .getElementById("profileModal")
        .classList.remove("show");

      showView("settings");

      nameInput.focus();

    }
  );


  document
    .querySelectorAll("[data-close]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.close;

          const modal =
            document.getElementById(id);

          if(modal){
            modal.classList.remove("show");
          }

        }
      );

    });


  document
    .querySelectorAll(".modal")
    .forEach(modal => {

      modal.addEventListener(
        "click",
        event => {

          if(event.target === modal){

            modal.classList.remove(
              "show"
            );

          }

        }
      );

    });

}


/* =========================================================
   SETTINGS
========================================================= */

function setupSettings(){

  saveButton.addEventListener(
    "click",
    saveSettings
  );

}


function saveSettings(){

  const newEndpoint =
    endpointInput.value.trim();


  endpoint =
    newEndpoint ||
    DEFAULT_ENDPOINT;


  userName =
    nameInput.value.trim() ||
    "Knox";


  localStorage.setItem(
    STORAGE.endpoint,
    endpoint
  );


  localStorage.setItem(
    STORAGE.name,
    userName
  );


  loadProfile();

  endpointInput.value =
    endpoint;


  updateConnectionStatus();

  showToast(
    "Settings saved"
  );

}


/* =========================================================
   CONNECTION STATUS
========================================================= */

async function updateConnectionStatus(){

  if(!endpoint){

    chatStatus.textContent =
      "Backend not configured";

    homeStatus.textContent =
      "Backend not configured";

    return;

  }


  chatStatus.textContent =
    "KNOX AI backend ready";


  homeStatus.textContent =
    "Powered through the KNOX AI backend.";

}


/* =========================================================
   HISTORY
========================================================= */

function getHistory(){

  try{

    return JSON.parse(
      localStorage.getItem(
        STORAGE.history
      ) || "[]"
    );

  }catch{

    return [];

  }

}


function saveConversation(){

  if(
    currentConversation.length < 2
  ){
    return;
  }


  const history =
    getHistory();


  const firstUser =
    currentConversation.find(
      item =>
        item.role === "user"
    );


  if(!firstUser){
    return;
  }


  const item = {

    id:Date.now(),

    title:
      firstUser.content
        .slice(0,70),

    messages:[
      ...currentConversation
    ],

    date:
      new Date().toLocaleString()

  };


  history.unshift(item);


  const limited =
    history.slice(0,30);


  localStorage.setItem(
    STORAGE.history,
    JSON.stringify(limited)
  );


  renderHistory();

}


function setupHistory(){

  renderHistory();

}


function renderHistory(){

  if(!historyBox){
    return;
  }


  const history =
    getHistory();


  if(history.length === 0){

    historyBox.innerHTML = `
      <div class="empty">
        🦊<br><br>
        No conversations yet.
      </div>
    `;

    return;

  }


  historyBox.innerHTML = "";


  history.forEach(item => {

    const row =
      document.createElement("div");

    row.className =
      "history-item";


    const content =
      document.createElement("div");


    const title =
      document.createElement("b");

    title.textContent =
      item.title ||
      "KNOX AI conversation";


    const date =
      document.createElement("small");

    date.textContent =
      item.date || "";


    content.appendChild(title);

    content.appendChild(date);


    const open =
      document.createElement("button");

    open.textContent =
      "Open";


    open.addEventListener(
      "click",
      () => {

        loadConversation(item);

      }
    );


    row.appendChild(content);

    row.appendChild(open);

    historyBox.appendChild(row);

  });

}


function loadConversation(item){

  if(!item.messages){
    return;
  }


  currentConversation =
    [...item.messages];


  messages =
    [...item.messages];


  messagesBox.innerHTML = "";


  item.messages.forEach(message => {

    addMessageToUI(
      message.role,
      message.content
    );

  });


  showView("chat");

}


/* =========================================================
   NEW CHAT
========================================================= */

function startNewChat(){

  currentConversation = [];

  messages = [];

  attachedImage = null;

  input.value = "";

  messagesBox.innerHTML = "";

  renderWelcome();

  showView("chat");

  closeDrawerFn();

  input.focus();

}


/* =========================================================
   CLEAR DATA
========================================================= */

clearButton.addEventListener(
  "click",
  () => {

    const confirmed = confirm(
      "Clear your saved KNOX AI profile, settings and chat history?"
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(STORAGE.name);
    localStorage.removeItem(STORAGE.endpoint);
    localStorage.removeItem(STORAGE.history);
    localStorage.removeItem(STORAGE.theme);

    userName = "Knox";

    endpoint = DEFAULT_ENDPOINT;

    document.body.classList.remove("dark");

    loadProfile();

    endpointInput.value = endpoint;

    renderHistory();

    startNewChat();

    showToast("Local data cleared");
  }
);


/* =========================================================
   MORE BUTTON
========================================================= */

more.addEventListener(
  "click",
  () => {
    showToast("KNOX AI menu");
  }
);


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(message) {

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(
    () => {
      toast.classList.remove("show");
    },
    2200
  );
}


/* =========================================================
   USAGE
========================================================= */

function updateUsage() {

  left.textContent = "∞";
}


/* =========================================================
   ERROR HANDLING
========================================================= */

function getReadableError(error) {

  const message =
    error?.message || "";


  if (message.includes("Failed to fetch")) {

    return `I couldn't reach the KNOX AI backend.

Please check that your Railway backend is running and that the endpoint in Settings is correct.`;
  }


  if (message.includes("HTTP 404")) {

    return `The KNOX AI backend returned 404.

Check the API endpoint in Settings.`;
  }


  if (message.includes("HTTP 500")) {

    return `The KNOX AI backend returned a server error.

The website is working, but the Railway backend needs to be checked.`;
  }


  return `Sorry — I couldn't complete that request.

${message || "Unknown backend error."}`;
}


/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {

      closeDrawerFn();

      document
        .querySelectorAll(".modal.show")
        .forEach(modal => {
          modal.classList.remove("show");
        });

    }

  }
);
