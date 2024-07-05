import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  startAfter,
  endBefore,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAi4wQOQ_UQ1MVfxrDPHhVsSS5h6Vk2Pk",
  authDomain: "student-f1afe.firebaseapp.com",
  projectId: "student-f1afe",
  storageBucket: "student-f1afe.appspot.com",
  messagingSenderId: "85597003330",
  appId: "1:85597003330:web:9c3b0e05bf2b2be08717db",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let students = [];
async function etudiantsFirestore() {
  const querySnapshot = await getDocs(collection(db, "students"));
  students = [];
  querySnapshot.forEach((doc) => {
    const student = doc.data();
    student.id = doc.id;
    students.push(student);
  });
  filtre();
}

etudiantsFirestore();

const NbreEtudiantsPage = 5;
let PageCurrent = 1;
let studentIdToUpdate = null;

function Moyenne() {
  let Total = 0;
  for (const student of students) {
    Total += student.note;
  }
  return Total / students.length;
}

function SommeNote() {
  let totalNote = 0;
  for (const chaqueNote of students) {
    totalNote += chaqueNote.note;
  }
  return totalNote;
}

function SommeAge() {
  let totalAge = 0;
  for (const chaqueAge of students) {
    totalAge += chaqueAge.age;
  }
  return totalAge;
}

function compterNotes() {
  return students.length;
}

function compterAge() {
  return students.length;
}

function AfficheEtudiant(EtudiantAffiche) {
  const tbody = document.getElementById("Tbody");
  tbody.innerHTML = "";

  for (let i = 0; i < EtudiantAffiche.length; i++) {
    const student = EtudiantAffiche[i];
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${student.nom}</td>
          <td>${student.prenom}
            </td><td>${student.note}/20</td>
            <td>${student.age}</td> 
                <td>
                    <button class="btn btn-outline-danger supprimer" data-id="${student.id}">
           <i class="fa-solid fa-trash" style="color: #ff0000;"></i>
        </button>
        <button class="btn btn-outline-warning modifier" data-id="${student.id}">
           <i class="fa-solid fa-pen-to-square" style="color: #FFD43B;"></i>
        </button>

          </td>`;
    tbody.appendChild(tr);
  }
}
// Ajout du formulaire
document
  .getElementById("studentForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    let nomAjout = document.getElementById("nom").value;
    let prenomAjout = document.getElementById("prenom").value;
    let noteAjout = parseFloat(document.getElementById("note").value);
    let ageAjout = parseInt(document.getElementById("age").value);

    // Vérifiez si les champs sont remplis
    if (!prenomAjout || !nomAjout || isNaN(ageAjout) || isNaN(noteAjout)) {
      alert("Veuillez renseigner tous les champs");
      return;
    }

    // Vérifiez si la note est valide
    if (noteAjout < 0 || noteAjout > 20) {
      alert("La note doit être comprise entre 0 et 20");
      return;
    }

    if (studentIdToUpdate) {
      // Modification
      try {
        await updateDoc(doc(db, "students", studentIdToUpdate), {
          prenom: prenomAjout,
          nom: nomAjout,
          age: ageAjout,
          note: noteAjout,
        });

        // Mettre à jour localement la liste des étudiants
        const studentIndex = students.findIndex(
          (student) => student.id === studentIdToUpdate
        );
        students[studentIndex] = {
          id: studentIdToUpdate,
          prenom: prenomAjout,
          nom: nomAjout,
          age: ageAjout,
          note: noteAjout,
        };

        // Réinitialiser l'état de modification
        studentIdToUpdate = null;
      } catch (error) {
        console.error("Erreur lors de la modification de l'étudiant : ", error);
      }
    } else {
      // Ajout
      try {
        const docRef = await addDoc(collection(db, "students"), {
          prenom: prenomAjout,
          nom: nomAjout,
          age: ageAjout,
          note: noteAjout,
        });

        // Ajouter l'étudiant à la liste locale
        students.push({
          id: docRef.id,
          prenom: prenomAjout,
          nom: nomAjout,
          age: ageAjout,
          note: noteAjout,
        });
      } catch (error) {
        console.log("Error writing document: ", error);
      }
    }

    // Mettre à jour l'affichage
    filtre(); // Réafficher les étudiants avec les nouvelles données
    hideModalAndResetForm(); // Cacher le modal après modification
  });

// modifier
document
  .getElementById("Tbody")
  .addEventListener("click", async function (event) {
    if (event.target.classList.contains("modifier")) {
      const studentId = event.target.getAttribute("data-id");
      studentIdToUpdate = studentId;
      const studentToUpdate = students.find(
        (student) => student.id === studentId
      );

      // Préremplir le formulaire modal avec les informations de l'étudiant à modifier
      document.getElementById("nom").value = studentToUpdate.nom;
      document.getElementById("prenom").value = studentToUpdate.prenom;
      document.getElementById("note").value = studentToUpdate.note;
      document.getElementById("age").value = studentToUpdate.age;

      // Afficher le modal pour la modification
      $("#Modal").modal("show");
    }
  });

// suppression
document
  .getElementById("Tbody")
  .addEventListener("click", async function (event) {
    if (event.target.classList.contains("supprimer")) {
      const studentId = event.target.getAttribute("data-id");
      const confirmation = confirm(
        "Voulez-vous vraiment supprimer cet étudiant ?"
      );
      if (confirmation) {
        try {
          await deleteDoc(doc(db, "students", studentId));

          // Supprimer l'étudiant de la liste locale
          students = students.filter((student) => student.id !== studentId);

          // Mettre à jour l'affichage
          filtre();
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de l'étudiant : ",
            error
          );
        }
      }
    }
  });

// pagination
function Pagination(EtudiantPagination) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const pageCount = Math.ceil(EtudiantPagination.length / NbreEtudiantsPage);

  // Precedente Page - Toujours page 1
  if (pageCount > 1) {
    const precedentePageItem = document.createElement("a");
    precedentePageItem.href = "#";
    precedentePageItem.className = "page-link";
    precedentePageItem.innerHTML = '<i class="fas fa-chevron-left"></i>';
    precedentePageItem.onclick = function (event) {
      event.preventDefault();
      PageCurrent = 1;
      filtre();
    };
    const precedentePageLi = document.createElement("li");
    precedentePageLi.className = "page-item";
    precedentePageLi.appendChild(precedentePageItem);
    pagination.appendChild(precedentePageLi);
  }

  // Pages numerotees
  for (let i = 1; i <= pageCount; i++) {
    const pageItem = document.createElement("a");
    pageItem.href = "#";
    pageItem.className = "page-link";
    pageItem.innerText = i;
    pageItem.onclick = function (event) {
      event.preventDefault();
      PageCurrent = i;
      filtre();
    };
    const pageLi = document.createElement("li");
    pageLi.className = "page-item";
    if (i === PageCurrent) {
      pageLi.classList.add("active");
    }
    pageLi.appendChild(pageItem);
    pagination.appendChild(pageLi);
  }

  // Suivante Page - Toujours derniere page
  if (pageCount > 1) {
    const suivantePageItem = document.createElement("a");
    suivantePageItem.href = "#";
    suivantePageItem.className = "page-link";
    suivantePageItem.innerHTML = '<i class="fas fa-chevron-right"></i>';
    suivantePageItem.onclick = function (event) {
      event.preventDefault();
      PageCurrent = pageCount;
      filtre();
    };
    const suivantePageLi = document.createElement("li");
    suivantePageLi.className = "page-item";
    suivantePageLi.appendChild(suivantePageItem);
    pagination.appendChild(suivantePageLi);
  }
}

function filtre() {
  const searchInput = document
    .getElementById("inputRecherche")
    .value.toLowerCase();
  const EtudiantFiltres = students.filter(
    (student) =>
      student.nom.toLowerCase().includes(searchInput) ||
      student.prenom.toLowerCase().includes(searchInput)
  );

  const startIndex = (PageCurrent - 1) * NbreEtudiantsPage;
  const EtudiantAffiche = EtudiantFiltres.slice(
    startIndex,
    startIndex + NbreEtudiantsPage
  );

  AfficheEtudiant(EtudiantAffiche);
  Pagination(EtudiantFiltres);

  document.getElementById("Moyen").innerText =
    Math.round(Moyenne() * 100) / 100;
  document.getElementById("totalNotes").innerText = SommeNote();
  document.getElementById("totalAges").innerText = SommeAge();
  document.getElementById("numNotes").innerText = compterNotes();
  document.getElementById("numAges").innerText = compterAge();
}

document.getElementById("inputRecherche").addEventListener("input", () => {
  PageCurrent = 1;
  filtre();
});

let bouttonAjout = document.getElementById("ajout");
const modal = document.getElementById("Modal");
bouttonAjout.addEventListener("click", function () {
  $(modal).modal("show");
});

function hideModalAndResetForm() {
  $("#Modal").modal("hide");
  viderFormulaire();
  studentIdToUpdate = null; // Réinitialiser l'état de modification
}

function viderFormulaire() {
  document.getElementById("studentForm").reset();
}

document
  .querySelector('[data-bs-dismiss="modal"]')
  .addEventListener("click", hideModalAndResetForm);

window.onload = function () {
  filtre();
};
