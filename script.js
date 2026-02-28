// 🔥 REPLACE THIS WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBfvM6nae-LiPPs04G5rkp8Op1S2QoqoDM",
  authDomain: "private-calendar-app.firebaseapp.com",
  projectId: "private-calendar-app",
  storageBucket: "private-calendar-app.firebasestorage.app",
  messagingSenderId: "334898216863",
  appId: "1:334898216863:web:85d4bc3b12964bee7dc7aa"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let selectedDate = null;
let calendar;

// Dark mode persistence
if (localStorage.getItem("dark") === "true") {
  document.body.classList.add("dark");
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark"));
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("app-container").style.display = "block";
    loadCalendar();
    loadAnalytics();
  }
});

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .catch(() => {
      document.getElementById("login-error").innerText =
        "Invalid email or password";
    });
}

function logout() {
  auth.signOut();
  location.reload();
}

function loadCalendar() {
  const calendarEl = document.getElementById('calendar');

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    dateClick: function(info) {
      selectedDate = info.dateStr;

      document.querySelectorAll(".fc-daygrid-day")
        .forEach(el => el.classList.remove("selected-date"));

      info.dayEl.classList.add("selected-date");

      document.getElementById("selected-date-title").innerText =
        "Tasks for " + selectedDate;

      loadTasks(selectedDate);
    }
  });

  calendar.render();
}

function addTask() {
  const taskText = document.getElementById("new-task").value.trim();
  if (!taskText || !selectedDate) return;

  db.collection("tasks").add({
    task: taskText,
    date: selectedDate,
    completed: false
  }).then(() => {
    document.getElementById("new-task").value = "";
    loadTasks(selectedDate);
    loadAnalytics();
  });
}

function loadTasks(date) {
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  db.collection("tasks").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();

      if (data.date === date) {
        const li = document.createElement("li");
        li.innerText = data.task;

        if (data.completed) li.classList.add("completed");

        li.onclick = () => toggleComplete(doc.id);

        const delBtn = document.createElement("button");
        delBtn.innerText = "✖";
        delBtn.onclick = (e) => {
          e.stopPropagation();
          deleteTask(doc.id);
        };

        li.appendChild(delBtn);
        list.appendChild(li);
      }
    });
  });
}

function toggleComplete(id) {
  const ref = db.collection("tasks").doc(id);

  ref.get().then(doc => {
    ref.update({
      completed: !doc.data().completed
    }).then(() => {
      loadTasks(selectedDate);
      loadAnalytics();
    });
  });
}

function deleteTask(id) {
  db.collection("tasks").doc(id).delete()
    .then(() => {
      loadTasks(selectedDate);
      loadAnalytics();
    });
}

/* Analytics */
function loadAnalytics() {
  db.collection("tasks").get().then(snapshot => {
    let completed = 0;
    let total = 0;
    const last30 = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      total++;
      if (data.completed) completed++;

      if (!last30[data.date]) last30[data.date] = 0;
      if (data.completed) last30[data.date]++;
    });

    document.getElementById("weekly-stats").innerText =
      `Total Tasks: ${total} | Completed: ${completed}`;

    renderHeatmap(last30);
  });
}

function renderHeatmap(data) {
  const container = document.getElementById("heatmap");
  container.innerHTML = "";

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];

    const div = document.createElement("div");
    div.classList.add("heat-cell");

    const count = data[key] || 0;

    if (count === 1) div.classList.add("heat-1");
    if (count === 2) div.classList.add("heat-2");
    if (count >= 3) div.classList.add("heat-3");

    container.appendChild(div);
  }
}
