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
let deleteId = null;
let calendarInstance = null;

/* ---------------- AUTH ---------------- */

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("app-container").style.display = "block";
    initCalendar();
  }
});

function login() {
  auth.signInWithEmailAndPassword(
    document.getElementById("email").value,
    document.getElementById("password").value
  ).catch(() => {
    document.getElementById("login-error").innerText = "Invalid login";
  });
}

/* ---------------- CALENDAR ---------------- */

function initCalendar() {

  if (calendarInstance) calendarInstance.destroy();

  calendarInstance = new FullCalendar.Calendar(
    document.getElementById("calendar"),
    {
      initialView: "dayGridMonth",

      headerToolbar: {
        left: "prev,next",
        center: "",
        right: "title"
      },

      dateClick: (info) => {
        selectedDate = info.dateStr;
        document.getElementById("selected-date-title")
          .innerText = "Tasks for " + selectedDate;
        loadTasks();
      },

      dayCellDidMount: function(info) {
        const cellDate = info.date.toISOString().split("T")[0];

        info.el.addEventListener("mouseenter", () => {
          showAnalytics(cellDate, info.el);
        });

        info.el.addEventListener("mouseleave", () => {
          document.getElementById("analytics-note").style.display = "none";
        });
      }
    }
  );

  calendarInstance.render();
}

/* ---------------- TASKS ---------------- */

function createTask() {
  if (!selectedDate) return;

  db.collection("tasks").add({
    title: document.getElementById("task-title").value,
    description: document.getElementById("task-desc").value,
    date: selectedDate,
    completed: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById("task-title").value = "";
    document.getElementById("task-desc").value = "";
    loadTasks();
  });
}

function loadTasks() {
  const today = document.getElementById("today-tasks");
  const carry = document.getElementById("carry-tasks");
  const completed = document.getElementById("completed-tasks");

  today.innerHTML = "";
  carry.innerHTML = "";
  completed.innerHTML = "";

  db.collection("tasks").get().then(snapshot => {
    snapshot.forEach(doc => {
      const t = doc.data();
      const card = document.createElement("div");
      card.className = "task-card";
      card.innerHTML =
        `<strong>${t.title}</strong><br>
         <small>${t.description}</small>
         <span onclick="openDelete('${doc.id}')"
         style="float:right;cursor:pointer;">🗑</span>`;

      if (t.completed && t.date === selectedDate) {
        completed.appendChild(card);
      } else if (t.date === selectedDate) {
        today.appendChild(card);
      } else if (t.date < selectedDate && !t.completed) {
        carry.appendChild(card);
      }
    });
  });
}

/* ---------------- ANALYTICS ---------------- */

function showAnalytics(date, element) {

  db.collection("tasks")
    .where("date", "==", date)
    .get()
    .then(snapshot => {

      let total = snapshot.size;
      let pendingTasks = [];
      let completedCount = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.completed) {
          completedCount++;
        } else {
          pendingTasks.push(data.title);
        }
      });

      const note = document.getElementById("analytics-note");

      let taskListHTML = "";

      if (pendingTasks.length === 0) {
        taskListHTML = "<em>No pending tasks</em>";
      } else {
        const limited = pendingTasks.slice(0, 5);
        taskListHTML = limited.map(t => `• ${t}`).join("<br>");
      }

      note.innerHTML = `
        <strong>${date}</strong><br><br>
        Tasks Left: ${pendingTasks.length}<br>
        Completed: ${completedCount}<br><br>
        ${taskListHTML}
      `;

      note.style.display = "block";
    });
}

/* ---------------- MODAL ---------------- */

function openDelete(id) {
  deleteId = id;
  document.getElementById("delete-modal").classList.add("show");
}

function closeModal() {
  document.getElementById("delete-modal").classList.remove("show");
}

function confirmDelete() {
  db.collection("tasks").doc(deleteId).delete()
    .then(() => {
      closeModal();
      loadTasks();
    });
}
