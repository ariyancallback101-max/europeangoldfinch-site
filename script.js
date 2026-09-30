const { createClient } = window.supabase;

const supabaseClient = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

let authMode = "login";
let currentUser = null;
let currentProfile = null;

const authView = document.getElementById("authView");
const appView = document.getElementById("appView");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authSubmit = document.getElementById("authSubmit");
const usernameField = document.getElementById("usernameField");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const userBadge = document.getElementById("userBadge");
const logoutBtn = document.getElementById("logoutBtn");
const displayUsername = document.getElementById("displayUsername");
const avatar = document.getElementById("avatar");
const messageText = document.getElementById("messageText");
const charCount = document.getElementById("charCount");
const saveMessageBtn = document.getElementById("saveMessageBtn");
const saveStatus = document.getElementById("saveStatus");
const messagesList = document.getElementById("messagesList");
const messagesEmpty = document.getElementById("messagesEmpty");
const refreshBtn = document.getElementById("refreshBtn");

function showStatus(element, message, isError = false) {
  element.textContent = message;
  element.style.color = isError ? "#a71920" : "";
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });

  const signup = mode === "signup";
  usernameField.hidden = !signup;
  usernameInput.required = signup;

  authTitle.textContent = signup ? "Create your account" : "Welcome back";
  authSubtitle.textContent = signup
    ? "Choose the username that will appear beside your saved messages."
    : "Log in to access your saved messages.";
  authSubmit.textContent = signup ? "Create account" : "Log in";
  authMessage.textContent = "";
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => setAuthMode(tab.dataset.mode));
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showStatus(authMessage, "Working...");

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const username = usernameInput.value.trim();

  if (authMode === "signup") {
    if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
      showStatus(authMessage, "Username must be 3–30 characters using letters, numbers, or underscores.", true);
      return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) {
      showStatus(authMessage, error.message, true);
      return;
    }

    if (data.session) {
      showStatus(authMessage, "Account created. Loading your notebook...");
      await startApp(data.session.user);
    } else {
      showStatus(authMessage, "Account created. Check your email to confirm your account, then log in.");
    }
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showStatus(authMessage, error.message, true);
    return;
  }

  await startApp(data.user);
});

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
});

supabaseClient.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    await startApp(session.user);
  } else {
    currentUser = null;
    currentProfile = null;
    authView.hidden = false;
    appView.hidden = true;
    userBadge.hidden = true;
    logoutBtn.hidden = true;
  }
});

async function startApp(user) {
  currentUser = user;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (error) {
    showStatus(authMessage, "Your account is signed in, but the profile could not be loaded. Check that you ran the SQL setup.", true);
    return;
  }

  currentProfile = profile;
  const username = profile.username || "User";

  displayUsername.textContent = username;
  avatar.textContent = username.charAt(0).toUpperCase();
  userBadge.textContent = `@${username}`;
  userBadge.hidden = false;
  logoutBtn.hidden = false;

  authView.hidden = true;
  appView.hidden = false;

  await loadMessages();
}

async function loadMessages() {
  messagesList.innerHTML = "";
  messagesEmpty.hidden = true;

  const { data, error } = await supabaseClient
    .from("messages")
    .select(`
      id,
      user_id,
      body,
      created_at,
      profiles ( username )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    messagesList.innerHTML = `<div class="message">Could not load messages: ${escapeHTML(error.message)}</div>`;
    return;
  }

  if (!data.length) {
    messagesEmpty.hidden = false;
    return;
  }

  data.forEach(message => {
    const article = document.createElement("article");
    article.className = "message";

    const username = message.profiles?.username || "Unknown user";
    const date = new Date(message.created_at).toLocaleString();

    article.innerHTML = `
      <div class="message-meta">
        <strong>@${escapeHTML(username)}</strong>
        <span>${escapeHTML(date)}</span>
      </div>
      <div class="message-body">${escapeHTML(message.body)}</div>
      ${message.user_id === currentUser.id
        ? `<div class="message-actions"><button class="delete-btn" data-id="${message.id}">Delete</button></div>`
        : ""}
    `;

    const deleteButton = article.querySelector(".delete-btn");
    if (deleteButton) {
      deleteButton.addEventListener("click", () => deleteMessage(message.id));
    }

    messagesList.appendChild(article);
  });
}

saveMessageBtn.addEventListener("click", async () => {
  const body = messageText.value.trim();

  if (!body) {
    showStatus(saveStatus, "Write something first.", true);
    return;
  }

  saveMessageBtn.disabled = true;
  showStatus(saveStatus, "Saving...");

  const { error } = await supabaseClient
    .from("messages")
    .insert({
      user_id: currentUser.id,
      body
    });

  saveMessageBtn.disabled = false;

  if (error) {
    showStatus(saveStatus, error.message, true);
    return;
  }

  messageText.value = "";
  updateCharCount();
  showStatus(saveStatus, "Message saved.");
  await loadMessages();
});

async function deleteMessage(id) {
  if (!confirm("Delete this message?")) return;

  const { error } = await supabaseClient
    .from("messages")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUser.id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadMessages();
}

refreshBtn.addEventListener("click", loadMessages);

messageText.addEventListener("input", updateCharCount);

function updateCharCount() {
  charCount.textContent = `${messageText.value.length} / 5000`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

updateCharCount();
setAuthMode("login");
