const SYSTEM_PROMPT = `You are ManzxzAi, a fast and smart AI assistant. Be concise and direct. Answer in the same language as the user. Use markdown only when necessary (code blocks, lists). Avoid long intros or filler sentences.`;

let chatHistory = [];
let currentChatId = null;
let isLoading = false;

// DOM Elements
const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const welcomeEl = document.getElementById("welcome");
const historyEl = document.getElementById("historyList");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

// Sidebar toggle
document.getElementById("menuBtn")?.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
});
overlay?.addEventListener("click", () => {
  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
});

// New chat
document.getElementById("newChatBtn")?.addEventListener("click", () => {
  startNewChat();
  sidebar.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
});

// Send on Enter
inputEl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto resize textarea
inputEl?.addEventListener("input", () => {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + "px";
});

sendBtn?.addEventListener("click", sendMessage);

// Suggestion buttons
document.querySelectorAll(".suggestion-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    inputEl.value = btn.dataset.prompt;
    sendMessage();
  });
});

function startNewChat() {
  currentChatId = null;
  chatHistory = [];
  messagesEl.innerHTML = "";
  welcomeEl.classList.remove("hidden");
  messagesEl.classList.add("hidden");
}

function appendMessage(role, content) {
  welcomeEl.classList.add("hidden");
  messagesEl.classList.remove("hidden");

  const div = document.createElement("div");
  div.className = `message-enter flex gap-3 py-4 px-4 rounded-xl ${role === "user" ? "flex-row-reverse" : "flex-row"}`;

  const avatar = document.createElement("div");
  avatar.className = `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${role === "user" ? "bg-purple-500/20" : "bg-purple-500/10 border border-purple-500/20 overflow-hidden"}`;
  if (role === "user") {
    avatar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`;
  } else {
    avatar.innerHTML = `<img src="https://media.base44.com/images/public/69f8aa3de2b02f40bfcd8662/ad7cf74a8_ChatGPTImage4Mei2026222903.png" class="w-5 h-5 object-contain" />`;
  }

  const bubble = document.createElement("div");
  bubble.className = `max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${role === "user" ? "bg-purple-600 text-white rounded-tr-sm" : "bg-gray-800 border border-gray-700 rounded-tl-sm text-gray-100"}`;

  if (role === "user") {
    bubble.textContent = content;
  } else {
    bubble.innerHTML = formatMarkdown(content);
  }

  div.appendChild(avatar);
  div.appendChild(bubble);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

function showTyping() {
  welcomeEl.classList.add("hidden");
  messagesEl.classList.remove("hidden");

  const div = document.createElement("div");
  div.id = "typing";
  div.className = "flex gap-3 py-4 px-4";
  div.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mt-1 overflow-hidden">
      <img src="https://media.base44.com/images/public/69f8aa3de2b02f40bfcd8662/ad7cf74a8_ChatGPTImage4Mei2026222903.png" class="w-5 h-5 object-contain" />
    </div>
    <div class="flex items-center gap-1 py-3">
      <div class="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style="animation-delay:0ms"></div>
      <div class="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style="animation-delay:150ms"></div>
      <div class="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style="animation-delay:300ms"></div>
    </div>
  `;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  document.getElementById("typing")?.remove();
}

async function sendMessage() {
  const content = inputEl.value.trim();
  if (!content || isLoading) return;

  inputEl.value = "";
  inputEl.style.height = "auto";
  isLoading = true;
  sendBtn.disabled = true;

  chatHistory.push({ role: "user", content });
  appendMessage("user", content);
  showTyping();

  const aiText = await callAI();
  removeTyping();
  chatHistory.push({ role: "assistant", content: aiText });
  appendMessage("assistant", aiText);

  isLoading = false;
  sendBtn.disabled = false;

  // Save to localStorage
  saveChat();
  renderHistory();
}

async function callAI() {
  const apiMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...chatHistory.slice(-6)
  ];

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: apiMessages }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Maaf, terjadi kesalahan. Coba lagi.";
}

function saveChat() {
  if (!currentChatId) {
    currentChatId = Date.now().toString();
  }
  const title = chatHistory[0]?.content?.slice(0, 50) || "Chat baru";
  const chats = JSON.parse(localStorage.getItem("manzxz_chats") || "{}");
  chats[currentChatId] = { id: currentChatId, title, messages: chatHistory, updated: Date.now() };
  localStorage.setItem("manzxz_chats", JSON.stringify(chats));
}

function renderHistory() {
  const chats = JSON.parse(localStorage.getItem("manzxz_chats") || "{}");
  const sorted = Object.values(chats).sort((a, b) => b.updated - a.updated);

  historyEl.innerHTML = "";
  sorted.forEach(chat => {
    const div = document.createElement("div");
    div.className = `group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${currentChatId === chat.id ? "bg-gray-700 text-white" : "hover:bg-gray-700/60 text-gray-400"}`;
    div.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M21 16c0 1.1-.9 2-2 2H7l-4 4V6a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>
      <span class="text-sm truncate flex-1">${chat.title}</span>
      <button class="delete-btn opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400" data-id="${chat.id}">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    `;

    div.addEventListener("click", (e) => {
      if (e.target.closest(".delete-btn")) {
        const id = e.target.closest(".delete-btn").dataset.id;
        const chats = JSON.parse(localStorage.getItem("manzxz_chats") || "{}");
        delete chats[id];
        localStorage.setItem("manzxz_chats", JSON.stringify(chats));
        if (currentChatId === id) startNewChat();
        renderHistory();
        return;
      }
      loadChat(chat.id);
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    });

    historyEl.appendChild(div);
  });
}

function loadChat(id) {
  const chats = JSON.parse(localStorage.getItem("manzxz_chats") || "{}");
  const chat = chats[id];
  if (!chat) return;

  currentChatId = id;
  chatHistory = chat.messages;
  messagesEl.innerHTML = "";
  welcomeEl.classList.add("hidden");
  messagesEl.classList.remove("hidden");

  chat.messages.forEach(m => appendMessage(m.role, m.content));
  renderHistory();
}

function formatMarkdown(text) {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => `<div class="my-3 rounded-xl overflow-hidden border border-gray-600"><div class="bg-gray-700 px-4 py-2 text-xs text-gray-400 font-mono">${lang || "code"}</div><pre class="bg-gray-900 p-4 overflow-x-auto text-sm"><code class="font-mono text-gray-100">${escapeHtml(code.trim())}</code></pre></div>`)
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-gray-700 font-mono text-xs text-purple-300">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/^### (.*$)/gm, '<h3 class="text-sm font-bold my-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-base font-bold my-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold my-3">$1</h1>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-sm my-0.5">$1</li>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Init
renderHistory();
