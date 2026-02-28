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
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .catch(() => {
      document.getElementById("login-error").innerText = "Invalid login";
    });
}

/* ---------------- CALENDAR ---------------- */

function initCalendar() {

  if (calendarInstance) {
    calendarInstance.destroy();
  }

  calendarInstance = new FullCalendar.Calendar(
    document.getElementById("calendar"),
    {
      initialView: "dayGridMonth",

      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: ""
      },

      dateClick: function(info) {
        selectedDate = info.dateStr;
        document.getElementById("selected-date-title")
          .innerText = "Tasks for " + selectedDate;
        loadTasks();
      },

      dateMouseEnter: function(info) {
        showAnalytics(info.dateStr);
      },

      dateMouseLeave: function() {
        document.getElementById("analytics-note").style.display = "none";
      }
    }
  );

  calendarInstance.render();
}

/* ---------------- TASK CREATION ---------------- */

function createTask() {

  if (!selectedDate) {
    alert("Select a date first.");
    return;
  }

  const title = document.getElementById("task-title").value.trim();
  const description = document.getElementById("task-desc").value.trim();

  if (!title) return;

  db.collection("tasks").add({
    title: title,
    description: description,
    date: selectedDate,
    completed: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    document.getElementById("task-title").value = "";
    document.getElementById("task-desc").value = "";
    loadTasks();
  });
}

/* ---------------- TASK LOADING ---------------- */

function loadTasks() {

  const todayContainer = document.getElementById("today-tasks");
  const carryContainer = document.getElementById("carry-tasks");
  const completedContainer = document.getElementById("completed-tasks");

  todayContainer.innerHTML = "";
  carryContainer.innerHTML = "";
  completedContainer.innerHTML = "";

  db.collection("tasks").get().then(snapshot => {

    snapshot.forEach(doc => {

      const task = doc.data();
      const taskId = doc.id;

      const card = document.createElement("div");
      card.className = "task-card";
      card.innerHTML = `
        <strong>${task.title}</strong><br>
        <small>${task.description || ""}</small>
        <span onclick="openDelete('${taskId}')" 
        style="float:right;cursor:pointer;">🗑</span>
      `;

      // Completed tasks for selected date
      if (task.completed && task.date === selectedDate) {
        card.classList.add("completed");
        completedContainer.appendChild(card);
      }

      // Tasks for selected date
      else if (task.date === selectedDate) {
        todayContainer.appendChild(card);
      }

      // Carry forward (older incomplete tasks)
      else if (task.date < selectedDate && !task.completed) {
        card.classList.add("carry");
        carryContainer.appendChild(card);
      }

    });

  });
}

/* ---------------- ANALYTICS ---------------- */

function showAnalytics(date) {

  db.collection("tasks")
    .where("date", "==", date)
    .get()
    .then(snapshot => {

      let total = 0;
      let completedCount = 0;

      snapshot.forEach(doc => {
        total++;
        if (doc.data().completed) completedCount++;
      });

      const pending = total - completedCount;

      const note = document.getElementById("analytics-note");
      note.innerHTML = `
        <strong>${date}</strong><br><br>
        Total Tasks: ${total}<br>
        Completed: ${completedCount}<br>
        Pending: ${pending}
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

  if (!deleteId) return;

  db.collection("tasks").doc(deleteId).delete()
    .then(() => {
      closeModal();
      loadTasks();
      deleteId = null;
    });
}
