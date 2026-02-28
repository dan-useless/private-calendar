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

/* AUTH */
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

/* CALENDAR */
function initCalendar() {
  if (calendarInstance) calendarInstance.destroy();

  calendarInstance = new FullCalendar.Calendar(
    document.getElementById("calendar"),
    {
      initialView: "dayGridMonth",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: ""
      },
      dateClick: (info) => {
        selectedDate = info.dateStr;
        document.getElementById("selected-date-title")
          .innerText = "Tasks for " + selectedDate;
        loadTasks();
      },
      dateMouseEnter: (info) => showAnalytics(info.dateStr),
      dateMouseLeave: () =>
        document.getElementById("analytics-note").style.display = "none"
    }
  );

  calendarInstance.render();
}

/* TASKS */
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
        `<strong>${t.title}</strong><br><small>${t.description}</small>
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

/* ANALYTICS */
function showAnalytics(date) {
  db.collection("tasks").where("date","==",date).get()
  .then(snapshot => {

    let total = snapshot.size;
    let done = 0;

    snapshot.forEach(doc => {
      if (doc.data().completed) done++;
    });

    const note = document.getElementById("analytics-note");
    note.innerHTML = `
      <strong>${date}</strong><br><br>
      Total: ${total}<br>
      Completed: ${done}<br>
      Pending: ${total - done}
    `;

    note.style.display = "block";
  });
}

/* MODAL */
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
