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

// 🔐 LOGIN
function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username !== "dany") {
    document.getElementById("login-error").innerText = "Invalid username";
    return;
  }

  auth.signInWithEmailAndPassword("dany1102@gmail.com", password)
    .then(() => {
      document.getElementById("login-container").style.display = "none";
      document.getElementById("app-container").style.display = "block";
      loadCalendar();
    })
    .catch(() => {
      document.getElementById("login-error").innerText = "Wrong password";
    });
}

function logout() {
  auth.signOut();
  location.reload();
}

// 📅 CALENDAR
function loadCalendar() {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    dateClick: function(info) {
      selectedDate = info.dateStr;
      document.getElementById("selected-date-title").innerText =
        "Tasks for " + selectedDate;

      carryForwardTasks(selectedDate);
      loadTasks(selectedDate);
    }
  });

  calendar.render();
}

// ➕ ADD TASK
function addTask() {
  const taskText = document.getElementById("new-task").value;
  if (!taskText || !selectedDate) return;

  db.collection("tasks").add({
    task: taskText,
    date: selectedDate,
    completed: false
  });

  document.getElementById("new-task").value = "";
  loadTasks(selectedDate);
}

// 📥 LOAD TASKS
function loadTasks(date) {
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  db.collection("tasks")
    .where("date", "==", date)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const li = document.createElement("li");
        li.innerText = doc.data().task;

        if (doc.data().completed) {
          li.classList.add("completed");
        }

        li.onclick = () => toggleComplete(doc.id);
        
        const delBtn = document.createElement("button");
        delBtn.innerText = "X";
        delBtn.onclick = (e) => {
          e.stopPropagation();
          deleteTask(doc.id);
        };

        li.appendChild(delBtn);
        list.appendChild(li);
      });
    });
}

// ✅ TOGGLE COMPLETE
function toggleComplete(id) {
  const ref = db.collection("tasks").doc(id);
  ref.get().then(doc => {
    ref.update({
      completed: !doc.data().completed
    }).then(() => loadTasks(selectedDate));
  });
}

// ❌ DELETE
function deleteTask(id) {
  db.collection("tasks").doc(id).delete()
    .then(() => loadTasks(selectedDate));
}

// 🔁 CARRY FORWARD
function carryForwardTasks(currentDate) {
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().split('T')[0];

  db.collection("tasks")
    .where("date", "==", prevDateStr)
    .where("completed", "==", false)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        db.collection("tasks").add({
          task: doc.data().task,
          date: currentDate,
          completed: false
        });
      });
    });
}
