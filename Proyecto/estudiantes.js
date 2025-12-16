import { supabase } from "./supabaseClient.js";

// ======= DOM =======
const lista = document.getElementById("lista-estudiantes");
const alertTop = document.getElementById("alert-top");

const filtroTexto = document.getElementById("filtro-texto");
document.getElementById("btn-filtrar").addEventListener("click", filtrar);
document.getElementById("btn-limpiar").addEventListener("click", () => {
  filtroTexto.value = "";
  cargarEstudiantes();
});

// Form crear
const form = document.getElementById("estudiante-form");
const statusDiv = document.getElementById("status");
const btnCancel = document.getElementById("btn-cancel");

const iNombre = document.getElementById("nombre");
const iA1 = document.getElementById("apellido1");
const iA2 = document.getElementById("apellido2");
const iCorreo = document.getElementById("correo");
const selCarrera = document.getElementById("carrera");

// Modal editar
const modalEditEl = document.getElementById("modalEditarEstudiante");
const modalEdit = new bootstrap.Modal(modalEditEl);

const mId = document.getElementById("modal-estudiante-id");
const mNombre = document.getElementById("modal-nombre");
const mA1 = document.getElementById("modal-apellido1");
const mA2 = document.getElementById("modal-apellido2");
const mCorreo = document.getElementById("modal-correo");
const mCarrera = document.getElementById("modal-carrera");
const mStatus = document.getElementById("modal-status");
document.getElementById("btn-modal-guardar").addEventListener("click", actualizarDesdeModal);

// Modal delete
const modalDeleteEl = document.getElementById("modalConfirmDelete");
const modalDelete = new bootstrap.Modal(modalDeleteEl);
const deleteInfo = document.getElementById("delete-info");
const deleteStatus = document.getElementById("delete-status");
const btnConfirmDelete = document.getElementById("btn-confirm-delete");
let deleteId = null;

// Modal carrera
const carreraNueva = document.getElementById("carrera-nueva");
const carreraStatus = document.getElementById("carrera-status");
document.getElementById("btn-guardar-carrera").addEventListener("click", guardarCarrera);

// ======= Helpers (alerts) =======
function showAlert(targetEl, message, type = "success") {
  if (!targetEl) return;
  targetEl.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function clearAlert(targetEl) {
  if (!targetEl) return;
  targetEl.innerHTML = "";
}

function limpiarForm() {
  form.reset();
  btnCancel.style.display = "none";
  statusDiv.innerHTML = "";
}

btnCancel.addEventListener("click", limpiarForm);

// ======= Cargar carreras =======
async function cargarCarreras() {
  const { data, error } = await supabase.from("Carreras").select("id,nombre").order("nombre");
  if (error) {
    console.error(error);
    showAlert(alertTop, "Error cargando carreras.", "danger");
    return;
  }

  // Select del form
  selCarrera.innerHTML = `<option value="">-- Seleccione --</option>`;
  // Select del modal
  mCarrera.innerHTML = `<option value="">-- Seleccione --</option>`;

  data.forEach(c => {
    selCarrera.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
    mCarrera.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
  });
}

// ======= Cargar estudiantes =======
let cacheEstudiantes = [];

async function cargarEstudiantes() {
  clearAlert(alertTop);

  // Nota: requiere FK carrera_id -> Carreras.id para poder traer el nombre así
  const { data, error } = await supabase
    .from("Estudiantes")
    .select("id,nombre,apellido1,apellido2,correo,carrera_id,Carreras(nombre)");

  if (error) {
    console.error(error);
    showAlert(alertTop, "Error al cargar estudiantes.", "danger");
    return;
  }

  cacheEstudiantes = data || [];
  pintarTabla(cacheEstudiantes);
}

function pintarTabla(estudiantes) {
  lista.innerHTML = "";

  estudiantes.forEach(e => {
    const tr = document.createElement("tr");

    const carreraNombre = e.Carreras?.nombre ?? "—";
    const apellidos = `${e.apellido1 ?? ""} ${e.apellido2 ?? ""}`.trim();

tr.innerHTML = `
  <td>${e.id}</td>
  <td class="text-start">${e.nombre}</td>
  <td class="text-start">${e.apellido1 ?? ""}</td>
  <td class="text-start">${e.apellido2 ?? ""}</td>
  <td>${carreraNombre}</td>
  <td class="text-start">${e.correo}</td>
  <td>
    <div class="d-flex justify-content-center gap-2">
      <button class="btn btn-sm btn-warning btn-edit"
        data-id="${e.id}"
        data-nombre="${e.nombre}"
        data-apellido1="${e.apellido1}"
        data-apellido2="${e.apellido2}"
        data-correo="${e.correo}"
        data-carrera="${e.carrera_id}">
        ✏️ Editar
      </button>
      <button class="btn btn-sm btn-danger btn-delete"
        data-id="${e.id}"
        data-info="${e.nombre} ${e.apellido1 ?? ""} ${e.apellido2 ?? ""}">
        🗑️ Eliminar
      </button>
    </div>
  </td>
`;

    lista.appendChild(tr);
  });
}

// ======= Filtro =======
function filtrar() {
  const t = filtroTexto.value.trim().toLowerCase();
  if (!t) {
    pintarTabla(cacheEstudiantes);
    return;
  }

  const filtrados = cacheEstudiantes.filter(e => {
    const carrera = (e.Carreras?.nombre ?? "").toLowerCase();
    const full = `${e.nombre} ${e.apellido1} ${e.apellido2} ${e.correo} ${carrera}`.toLowerCase();
    return full.includes(t);
  });

  pintarTabla(filtrados);
}

// ======= Crear estudiante =======
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  clearAlert(statusDiv);

  const payload = {
    nombre: iNombre.value.trim(),
    apellido1: iA1.value.trim(),
    apellido2: iA2.value.trim(),
    correo: iCorreo.value.trim(),
    carrera_id: selCarrera.value
  };

  if (!payload.nombre || !payload.apellido1 || !payload.apellido2 || !payload.correo || !payload.carrera_id) return;

  showAlert(statusDiv, "Guardando...", "info");

  const { error } = await supabase.from("Estudiantes").insert([payload]);
  if (error) {
    console.error(error);
    showAlert(statusDiv, "Error al guardar. ¿Correo repetido?", "danger");
    return;
  }

  showAlert(alertTop, "Estudiante registrado ✅", "success");
  limpiarForm();
  cargarEstudiantes();
});

// ======= Click tabla (editar / eliminar) =======
lista.addEventListener("click", (ev) => {
  const btnEdit = ev.target.closest(".btn-edit");
  const btnDel = ev.target.closest(".btn-delete");

  if (btnEdit) {
    mId.value = btnEdit.dataset.id;
    mNombre.value = btnEdit.dataset.nombre;
    mA1.value = btnEdit.dataset.apellido1;
    mA2.value = btnEdit.dataset.apellido2;
    mCorreo.value = btnEdit.dataset.correo;
    mCarrera.value = btnEdit.dataset.carrera;

    mStatus.innerHTML = "";
    modalEdit.show();
    return;
  }

  if (btnDel) {
    deleteId = btnDel.dataset.id;
    deleteInfo.textContent = btnDel.dataset.info || "";
    deleteStatus.innerHTML = "";
    modalDelete.show();
  }
});

// ======= Actualizar desde modal =======
async function actualizarDesdeModal() {
  clearAlert(mStatus);

  const id = mId.value;
  const payload = {
    nombre: mNombre.value.trim(),
    apellido1: mA1.value.trim(),
    apellido2: mA2.value.trim(),
    correo: mCorreo.value.trim(),
    carrera_id: mCarrera.value
  };

  if (!id || !payload.nombre || !payload.apellido1 || !payload.apellido2 || !payload.correo || !payload.carrera_id) {
    showAlert(mStatus, "Complete todos los campos.", "danger");
    return;
  }

  showAlert(mStatus, "Actualizando...", "info");

  const { error } = await supabase.from("Estudiantes").update(payload).eq("id", id);
  if (error) {
    console.error(error);
    showAlert(mStatus, "Error al actualizar.", "danger");
    return;
  }

  showAlert(alertTop, "Estudiante actualizado ✅", "success");
  modalEdit.hide();
  cargarEstudiantes();
}

// ======= Eliminar con modal =======
btnConfirmDelete.addEventListener("click", async () => {
  if (!deleteId) return;

  btnConfirmDelete.disabled = true;
  const oldText = btnConfirmDelete.innerHTML;
  btnConfirmDelete.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Eliminando...`;

  showAlert(deleteStatus, "Eliminando...", "info");

  const { error } = await supabase.from("Estudiantes").delete().eq("id", deleteId);

  if (error) {
    console.error(error);
    showAlert(deleteStatus, "Error al eliminar.", "danger");
    btnConfirmDelete.disabled = false;
    btnConfirmDelete.innerHTML = oldText;
    return;
  }

  showAlert(alertTop, "Estudiante eliminado 🗑️", "warning");
  deleteId = null;
  modalDelete.hide();
  cargarEstudiantes();

  btnConfirmDelete.disabled = false;
  btnConfirmDelete.innerHTML = oldText;
});

// ======= Agregar carrera (modal) =======
async function guardarCarrera() {
  const nombre = carreraNueva.value.trim();
  carreraStatus.innerHTML = "";
  if (!nombre) {
    showAlert(carreraStatus, "Escriba el nombre de la carrera.", "danger");
    return;
  }

  showAlert(carreraStatus, "Guardando...", "info");

  const { error } = await supabase.from("Carreras").insert([{ nombre }]);
  if (error) {
    console.error(error);
    showAlert(carreraStatus, "Error guardando carrera (¿repetida?).", "danger");
    return;
  }

  showAlert(carreraStatus, "Carrera guardada ✅", "success");
  carreraNueva.value = "";
  await cargarCarreras();
}

// ======= Init =======
(async function init() {
  await cargarCarreras();
  await cargarEstudiantes();
})();
