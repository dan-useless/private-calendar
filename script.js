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

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("login-container").style.display="none";
    document.getElementById("app-container").style.display="block";
    initCalendar();
  }
});

function login(){
  auth.signInWithEmailAndPassword(
    document.getElementById("email").value,
    document.getElementById("password").value
  ).catch(()=> {
    document.getElementById("login-error").innerText="Invalid login";
  });
}

function initCalendar(){
  const calendar = new FullCalendar.Calendar(
    document.getElementById("calendar"), {
    initialView:"dayGridMonth",
    dateClick:(info)=>{
      selectedDate = info.dateStr;
      document.getElementById("selected-date-title")
        .innerText="Tasks for "+selectedDate;
      loadTasks();
    },
    dateMouseEnter:(info)=>{
      showAnalytics(info.dateStr, info.dayEl);
    },
    dateMouseLeave:()=>{
      document.getElementById("analytics-note").classList.add("hidden");
    }
  });
  calendar.render();
}

function createTask(){
  if(!selectedDate) return;
  db.collection("tasks").add({
    title:document.getElementById("task-title").value,
    description:document.getElementById("task-desc").value,
    date:selectedDate,
    completed:false,
    priority:Date.now(),
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  }).then(()=>{
    document.getElementById("task-title").value="";
    document.getElementById("task-desc").value="";
    loadTasks();
  });
}

function loadTasks(){
  const today = document.getElementById("today-tasks");
  const carry = document.getElementById("carry-tasks");
  const completed = document.getElementById("completed-tasks");

  today.innerHTML="";
  carry.innerHTML="";
  completed.innerHTML="";

  db.collection("tasks").get().then(snapshot=>{
    snapshot.forEach(doc=>{
      const t = doc.data();
      const card = document.createElement("div");
      card.className="task-card";
      card.innerHTML=`<strong>${t.title}</strong><br><small>${t.description}</small>
        <span onclick="openDelete('${doc.id}')" style="float:right;cursor:pointer;">🗑</span>`;
      card.dataset.id=doc.id;

      if(t.completed && t.date===selectedDate){
        card.classList.add("completed");
        completed.appendChild(card);
      }
      else if(t.date===selectedDate){
        today.appendChild(card);
      }
      else if(t.date<selectedDate && !t.completed){
        card.classList.add("carry");
        carry.appendChild(card);
      }
    });

    initDrag();
  });
}

function initDrag(){
  new Sortable(today-tasks,{group:"tasks"});
  new Sortable(carry-tasks,{group:"tasks"});
  new Sortable(completed-tasks,{
    group:"tasks",
    onAdd:(evt)=>{
      const id=evt.item.dataset.id;
      db.collection("tasks").doc(id).update({completed:true});
    }
  });
}

function showAnalytics(date, el){
  db.collection("tasks").where("date","==",date).get()
  .then(snapshot=>{
    let total=0, completed=0;
    snapshot.forEach(doc=>{
      total++;
      if(doc.data().completed) completed++;
    });
    const note=document.getElementById("analytics-note");
    note.innerHTML=`<strong>${date}</strong><br>
      Total: ${total}<br>
      Completed: ${completed}<br>
      Pending: ${total-completed}`;
    note.classList.remove("hidden");
  });
}

function openDelete(id){
  deleteId=id;
  document.getElementById("delete-modal").classList.remove("hidden");
}

function closeModal(){
  document.getElementById("delete-modal").classList.add("hidden");
}

function confirmDelete(){
  db.collection("tasks").doc(deleteId).delete()
  .then(()=>{
    closeModal();
    loadTasks();
  });
}
