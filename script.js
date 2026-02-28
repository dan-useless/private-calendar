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

// Auto login persistence
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("app-container").style.display = "block";
    loadCalendar();
  }
});

// Login
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .catch(() => {
      document.getElementById("login-error").innerText =
        "Invalid email or password";
    });
}

// Logout
function logout() {
  auth.signOut();
  location.reload();
}

// Calendar
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

// Add Task
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
  });
}

// Load Tasks (NO duplication logic)
function loadTasks(date) {
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  db.collection("tasks").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();

      if (
        data.date === date ||
        (data.date < date && data.completed === false)
      ) {
        const li = document.createElement("li");
        li.innerText = data.task;

        if (data.completed && data.date === date) {
          li.classList.add("completed");
        }

        li.onclick = () => {
          if (data.date === date) {
            toggleComplete(doc.id);
          }
        };

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

// Mark Complete
function toggleComplete(id) {
  db.collection("tasks").doc(id).update({
    completed: true
  }).then(() => loadTasks(selectedDate));
}

// Delete
function deleteTask(id) {
  db.collection("tasks").doc(id).delete()
    .then(() => loadTasks(selectedDate));
}
