const defaultTopics = [
  ["FAQ: The Basics Behind the Goldfinch", "KVGfinchlover7475"],
  ["Goldfinch sightings and photography", "FinchFriend234"],
  ["Best food for European Goldfinches?", "BirdBrain88"],
  ["How do you identify a young goldfinch?", "CarduelisFan"],
  ["Share your favorite bird photos!", "FinchesRgr8"],
  ["Caring for a pet finch", "Carol4Christ"],
  ["Goldfinch habitat and migration", "Cuckoo4Finches"],
  ["Want to start my own birdie site", "KidSpyFinch2343"],
  ["Goldfinch song appreciation", "GenusEophona"],
  ["Better living through breeding?", "FiddlyFinch912"],
  ["Can Finch Food Hurt You?", "JumpingBean88"],
  ["Goldfinch pilgrimage", "BirdLover2026"],
  ["Gift ideas for bird lovers", "BirdBrain"],
  ["New goldfinch photo thread", "BettyFinchFan483"],
  ["Relaxing qualities of goldfinch song?", "SongbirdFan"],
  ["EGF site update!", "KVGFinchlover7475"]
];

let topics = JSON.parse(localStorage.getItem("goldfinchTopics") || "null") || defaultTopics;

const topicList = document.getElementById("topicList");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const topicCount = document.getElementById("topicCount");
const modal = document.getElementById("topicModal");
const newTopicBtn = document.getElementById("newTopicBtn");
const closeModal = document.getElementById("closeModal");
const topicForm = document.getElementById("topicForm");

function saveTopics() {
  localStorage.setItem("goldfinchTopics", JSON.stringify(topics));
}

function renderTopics() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = topics.filter(([title, user]) =>
    title.toLowerCase().includes(query) || user.toLowerCase().includes(query)
  );

  topicList.innerHTML = "";

  filtered.forEach(([title, user]) => {
    const row = document.createElement("div");
    row.className = "topic-row";
    row.innerHTML = `
      <div class="topic-title">${escapeHTML(title)}</div>
      <div class="user-id">${escapeHTML(user)}</div>
    `;

    row.addEventListener("click", () => {
      alert(`Topic: ${title}\nStarted by: ${user}\n\nYou can connect this row to a real topic page or database later.`);
    });

    topicList.appendChild(row);
  });

  emptyState.hidden = filtered.length !== 0;
  topicCount.textContent = topics.length;
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function openModal() {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("topicTitle").focus();
}

function closeTopicModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

searchInput.addEventListener("input", renderTopics);
newTopicBtn.addEventListener("click", openModal);
closeModal.addEventListener("click", closeTopicModal);

modal.addEventListener("click", event => {
  if (event.target === modal) closeTopicModal();
});

topicForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = document.getElementById("topicTitle").value.trim();
  const user = document.getElementById("topicUser").value.trim();

  if (!title || !user) return;

  topics.unshift([title, user]);
  saveTopics();
  renderTopics();
  topicForm.reset();
  closeTopicModal();
});

renderTopics();
