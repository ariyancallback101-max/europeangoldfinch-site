// ==========================================
// GOLDfinch NOTES
// LOGIN-ONLY VERSION
// ==========================================

const {
  createClient
} = window.supabase;


const supabase = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_KEY
);


// ==========================================
// ELEMENTS
// ==========================================

const authView =
  document.getElementById("authView");

const appView =
  document.getElementById("appView");

const authForm =
  document.getElementById("authForm");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const authSubmit =
  document.getElementById("authSubmit");

const authMessage =
  document.getElementById("authMessage");

const logoutBtn =
  document.getElementById("logoutBtn");

const userBadge =
  document.getElementById("userBadge");

const displayUsername =
  document.getElementById("displayUsername");

const avatar =
  document.getElementById("avatar");

const messageText =
  document.getElementById("messageText");

const charCount =
  document.getElementById("charCount");

const saveMessageBtn =
  document.getElementById("saveMessageBtn");

const saveStatus =
  document.getElementById("saveStatus");

const messagesList =
  document.getElementById("messagesList");

const messagesEmpty =
  document.getElementById("messagesEmpty");

const refreshBtn =
  document.getElementById("refreshBtn");


// ==========================================
// HELPERS
// ==========================================

function showAuthMessage(message, type = "error") {

  authMessage.textContent = message;

  authMessage.className =
    "status " + type;
}


function showSaveMessage(message, type = "success") {

  saveStatus.textContent = message;

  saveStatus.className =
    "status " + type;
}


function escapeHTML(value) {

  const div =
    document.createElement("div");

  div.textContent = value;

  return div.innerHTML;
}


function formatDate(dateString) {

  const date =
    new Date(dateString);

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );
}


// ==========================================
// LOGIN
// ==========================================

authForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    showAuthMessage("");

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    if (!email || !password) {

      showAuthMessage(
        "Please enter your email and password."
      );

      return;
    }


    authSubmit.disabled = true;

    authSubmit.textContent =
      "Entering...";


    const {
      data,
      error
    } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });


    if (error) {

      console.error(error);

      showAuthMessage(
        "Login failed: " + error.message
      );

      authSubmit.disabled = false;

      authSubmit.textContent =
        "Enter";

      return;
    }


    if (!data.user) {

      showAuthMessage(
        "Login failed. Please try again."
      );

      authSubmit.disabled = false;

      authSubmit.textContent =
        "Enter";

      return;
    }


    passwordInput.value = "";

    authSubmit.disabled = false;

    authSubmit.textContent =
      "Enter";


    await showLoggedInUser(
      data.user
    );

  }
);


// ==========================================
// LOGGED-IN USER
// ==========================================

async function showLoggedInUser(user) {

  authView.hidden = true;

  appView.hidden = false;

  logoutBtn.hidden = false;

  userBadge.hidden = false;


  userBadge.textContent =
    user.email;


  let username =
    user.email
      ? user.email.split("@")[0]
      : "User";


  // Try to get username from profiles table

  const {
    data: profile,
    error
  } =
    await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();


  if (!error && profile?.username) {

    username =
      profile.username;

  }


  displayUsername.textContent =
    username;


  avatar.textContent =
    username
      .charAt(0)
      .toUpperCase();


  await loadMessages();
}


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener(
  "click",
  async () => {

    logoutBtn.disabled = true;

    const {
      error
    } =
      await supabase.auth.signOut();


    logoutBtn.disabled = false;


    if (error) {

      console.error(error);

      return;
    }


    appView.hidden = true;

    authView.hidden = false;

    logoutBtn.hidden = true;

    userBadge.hidden = true;


    emailInput.value = "";

    passwordInput.value = "";

    messagesList.innerHTML = "";

    showAuthMessage("");

  }
);


// ==========================================
// SAVE MESSAGE
// ==========================================

saveMessageBtn.addEventListener(
  "click",
  async () => {

    const text =
      messageText.value.trim();


    if (!text) {

      showSaveMessage(
        "Write something first.",
        "error"
      );

      return;
    }


    const {
      data: {
        user
      }
    } =
      await supabase.auth.getUser();


    if (!user) {

      showSaveMessage(
        "You are not logged in.",
        "error"
      );

      return;
    }


    saveMessageBtn.disabled = true;

    saveMessageBtn.textContent =
      "Saving...";


    const {
      error
    } =
      await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          content: text
        });


    saveMessageBtn.disabled = false;

    saveMessageBtn.textContent =
      "Save message";


    if (error) {

      console.error(error);

      showSaveMessage(
        "Could not save message: " +
        error.message,
        "error"
      );

      return;
    }


    messageText.value = "";

    updateCharacterCount();

    showSaveMessage(
      "Message saved.",
      "success"
    );


    await loadMessages();

  }
);


// ==========================================
// LOAD MESSAGES
// ==========================================

async function loadMessages() {

  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser();


  if (!user) {

    return;
  }


  messagesList.innerHTML =
    "<p class='empty'>Loading...</p>";


  const {
    data,
    error
  } =
    await supabase
      .from("messages")
      .select(
        "id, content, created_at"
      )
      .eq(
        "user_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    messagesList.innerHTML = "";

    messagesEmpty.hidden = false;

    messagesEmpty.textContent =
      "Could not load messages.";

    return;
  }


  messagesList.innerHTML = "";


  if (!data || data.length === 0) {

    messagesEmpty.hidden = false;

    messagesEmpty.textContent =
      "You haven't saved any messages yet.";

    return;
  }


  messagesEmpty.hidden = true;


  data.forEach(
    (message) => {

      const card =
        document.createElement("article");

      card.className =
        "message-card";


      card.innerHTML = `

        <p class="message-text">
          ${escapeHTML(message.content)}
        </p>

        <div class="message-meta">

          <span>
            ${escapeHTML(
              formatDate(message.created_at)
            )}
          </span>

          <button
            class="delete-btn"
            data-id="${message.id}"
          >
            Delete
          </button>

        </div>

      `;


      const deleteButton =
        card.querySelector(".delete-btn");


      deleteButton.addEventListener(
        "click",
        () => deleteMessage(message.id)
      );


      messagesList.appendChild(card);

    }
  );

}


// ==========================================
// DELETE MESSAGE
// ==========================================

async function deleteMessage(id) {

  const confirmed =
    confirm(
      "Delete this message?"
    );


  if (!confirmed) {

    return;
  }


  const {
    error
  } =
    await supabase
      .from("messages")
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(error);

    alert(
      "Could not delete message: " +
      error.message
    );

    return;
  }


  await loadMessages();

}


// ==========================================
// CHARACTER COUNTER
// ==========================================

function updateCharacterCount() {

  const length =
    messageText.value.length;


  charCount.textContent =
    `${length} / 5000`;

}


messageText.addEventListener(
  "input",
  updateCharacterCount
);


// ==========================================
// REFRESH
// ==========================================

refreshBtn.addEventListener(
  "click",
  async () => {

    refreshBtn.disabled = true;

    await loadMessages();

    refreshBtn.disabled = false;

  }
);


// ==========================================
// CHECK EXISTING SESSION
// ==========================================

async function checkSession() {

  const {
    data
  } =
    await supabase.auth.getSession();


  if (data.session?.user) {

    await showLoggedInUser(
      data.session.user
    );

  }

}


// ==========================================
// AUTH STATE LISTENER
// ==========================================

supabase.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    if (
      event === "SIGNED_IN" &&
      session?.user
    ) {

      await showLoggedInUser(
        session.user
      );

    }


    if (
      event === "SIGNED_OUT"
    ) {

      appView.hidden = true;

      authView.hidden = false;

      logoutBtn.hidden = true;

      userBadge.hidden = true;

    }

  }
);


// ==========================================
// START
// ==========================================

updateCharacterCount();

checkSession();
