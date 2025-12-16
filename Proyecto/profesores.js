import { supabase } from "./supabaseClient.js";

// DOM
const lista = document.getElementById("lista-profesores");
const alertTop = document.getElementById("alert-top");
const filtroTexto = document.getElementById("filtro-texto");
document.getElementById("btn-filtrar").addEventListener("click", filtrar);
document.getElementById("btn-limpiar").addEventListener("click", () => {
  filtroTexto.value = "";
  pintarTabla(cacheProfesores);
});

const form = document.getElementById("profesor-form");
const statusDiv = document.getElementById("status");

const iNombre = document.getElementById("nombre");
const iA1 = document.getElementById("apellido1");
const iA2 = document.getElementById("apellido2");
const iCorreo = document.getElementById("correo");
const selCarrera = document.getElementById("carrera");
const selCurso = document.getElementById("curso");

// Modal edit
const modalEdit = new bootstrap.Modal(document.getElementById("modalEditarProfesor"));
const mId = document.getElementById("modal-profesor-id");
const mNombre = document.getElementById("modal-nombre");
const mA1 = document.getElementById("modal-apellido1");
const mA2 = document.getElementById("modal-apellido2");
const mCorreo = document.getElementById("modal-correo");
const mCarrera = document.getElementById("modal-carrera");
const mCurso = document.getElementById("modal-curso");
const mStatus = document.getElementById("modal-status");
document.getElementById("btn-modal-guardar").addEventListener("click", actualizarDesdeModal);

// Modal delete
const modalDelete = new bootstrap.Modal(document.getElementById("modalConfirmDelete"));
const deleteInfo = document.getElementById("delete-info");
const deleteStatus = document.getElementById("delete-status");
const btnConfirmDelete = document.getElementById("btn-confirm-delete");
let deleteId = null;

// Helpers
function showAlert(targetEl, message, type = "success") {
  targetEl.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}
function clearAlert(targetEl){ targetEl.innerHTML = ""; }
function getSelectedValues(select) {
  return Array.from(select.selectedOptions).map(o => Number(o.value));
}


// Cargar selects
async function cargarCarreras() {
  const { data, error } = await supabase.from("Carreras").select("id,nombre").order("nombre");
  if (error) { console.error(error); showAlert(alertTop, "Error cargando carreras.", "danger"); return; }

  selCarrera.innerHTML = `<option value="">-- Seleccione --</option>`;
  mCarrera.innerHTML = `<option value="">-- Seleccione --</option>`;
  data.forEach(c => {
    selCarrera.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
    mCarrera.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
  });
}

async function cargarCursos() {
  const { data, error } = await supabase.from("Cursos").select("id,codigo,nombre").order("codigo");
  if (error) { console.error(error); showAlert(alertTop, "Error cargando cursos.", "danger"); return; }

  selCurso.innerHTML = `<option value="">-- Seleccione --</option>`;
  mCurso.innerHTML = `<option value="">-- Seleccione --</option>`;
  data.forEach(c => {
    const label = `${c.codigo} - ${c.nombre}`;
    selCurso.innerHTML += `<option value="${c.id}">${label}</option>`;
    mCurso.innerHTML += `<option value="${c.id}">${label}</option>`;
  });
}

// Cargar profesores + cursos asignados
let cacheProfesores = [];

async function cargarProfesores() {

  // Traer profesores + carrera
  const { data: profesores, error } = await supabase
    .from("Profesores")
    .select("id,nombre,apellido1,apellido2,correo,carrera_id,Carreras(nombre)");

  if (error) {
    console.error(error);
    return;
  }

  // Traer tabla puente ProfesoresCursos + Cursos
  const { data: pcs, error: err2 } = await supabase
    .from("ProfesoresCursos")
    .select("profesor_id, curso_id, Cursos(codigo,nombre)")


  if (err2) {
    console.error(err2);
    return;
  }

  // ================================
  // MAP 
  // ================================
const map = new Map();

pcs.forEach(x => {
  if (!x.profesor_id) return;

  const label = x.Cursos ? `${x.Cursos.codigo} - ${x.Cursos.nombre}` : "";

  if (!map.has(x.profesor_id)) map.set(x.profesor_id, []);
  if (label) map.get(x.profesor_id).push(label);
});


  // Unir profesores + cursos
  const dataFinal = profesores.map(p => ({
    ...p,
    cursos: (map.get(p.id) || []).join(", ")
  }));

  // Pintar tabla
  cacheProfesores = dataFinal;   
  pintarTabla(cacheProfesores);  
}

function pintarTabla(items) {
  lista.innerHTML = "";

  items.forEach(p => {
    const tr = document.createElement("tr");
    const carreraNombre = p.Carreras?.nombre ?? "—";

    tr.innerHTML = `
      <td>${p.id}</td>
      <td class="text-start">${p.nombre}</td>
      <td class="text-start">${p.apellido1}</td>
      <td class="text-start">${p.apellido2}</td>
      <td>${carreraNombre}</td>
      <td class="text-start">${p.correo}</td>
      <td class="text-start">${p.cursos || "—"}</td>
      <td>
        <div class="d-flex justify-content-center gap-2">
          <button class="btn btn-sm btn-warning btn-edit"
            data-id="${p.id}"
            data-nombre="${p.nombre}"
            data-apellido1="${p.apellido1}"
            data-apellido2="${p.apellido2}"
            data-correo="${p.correo}"
            data-carrera="${p.carrera_id}">
            ✏️ Editar
          </button>
          <button class="btn btn-sm btn-danger btn-delete"
            data-id="${p.id}"
            data-info="${p.nombre} ${p.apellido1} ${p.apellido2}">
            🗑️ Eliminar
          </button>
        </div>
      </td>
    `;
    lista.appendChild(tr);
  });
}

// Filtro
function filtrar() {
  const t = filtroTexto.value.trim().toLowerCase();
  if (!t) { pintarTabla(cacheProfesores); return; }

  const filtrados = cacheProfesores.filter(p => {
    const carrera = (p.Carreras?.nombre ?? "").toLowerCase();
    const full = `${p.nombre} ${p.apellido1} ${p.apellido2} ${p.correo} ${carrera} ${p.cursos ?? ""}`.toLowerCase();
    return full.includes(t);
  });
  pintarTabla(filtrados);
}

// Crear profesor + asignar curso
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusDiv.innerHTML = "";

  const payload = {
    nombre: iNombre.value.trim(),
    apellido1: iA1.value.trim(),
    apellido2: iA2.value.trim(),
    correo: iCorreo.value.trim(),
    carrera_id: Number(selCarrera.value)
  };

  // 👉 obtener múltiples cursos seleccionados
  const cursosIds = Array.from(selCurso.selectedOptions)
                         .map(o => Number(o.value));

  if (
    !payload.nombre ||
    !payload.apellido1 ||
    !payload.apellido2 ||
    !payload.correo ||
    !payload.carrera_id ||
    cursosIds.length === 0
  ) {
    statusDiv.innerHTML = `<div class="alert alert-danger">Complete todos los campos</div>`;
    return;
  }

  statusDiv.innerHTML = `<div class="alert alert-info">Guardando profesor...</div>`;

  // =============================
  // 1️⃣ Insertar PROFESOR
  // =============================
  const { data: profesor, error } = await supabase
    .from("Profesores")
    .insert([payload])
    .select("id")
    .single();

  if (error) {
    console.error(error);
    statusDiv.innerHTML = `<div class="alert alert-danger">
      Error al guardar profesor (¿correo repetido?)
    </div>`;
    return;
  }

  // =============================
  // 2️⃣ Insertar CURSOS (tabla puente)
  // =============================
const rows = cursosIds.map(cursoId => ({
  profesor_id: profesor.id,
  curso_id: cursoId
}));

const { data: inserted, error: errorCursos } = await supabase
  .from("ProfesoresCursos")
  .insert(rows)
  .select("id, profesor_id, curso_id");  // 👈 confirma cuántos insertó

console.log("cursosIds:", cursosIds);
console.log("rows:", rows);
console.log("inserted:", inserted);

if (errorCursos) {
  console.error(errorCursos);
  statusDiv.innerHTML = `<div class="alert alert-warning">
    Profesor creado, pero error al asignar cursos
  </div>`;
} else {
  statusDiv.innerHTML = `<div class="alert alert-success">
    Profesor registrado correctamente ✅ (cursos insertados: ${inserted?.length ?? 0})
  </div>`;
}


  form.reset();
  await cargarProfesores();
});


// Click tabla
lista.addEventListener("click", async (e) => {
  const btnEdit = e.target.closest(".btn-edit");
  const btnDel = e.target.closest(".btn-delete");

  if (btnEdit) {
    mId.value = btnEdit.dataset.id;
    mNombre.value = btnEdit.dataset.nombre;
    mA1.value = btnEdit.dataset.apellido1;
    mA2.value = btnEdit.dataset.apellido2;
    mCorreo.value = btnEdit.dataset.correo;
    mCarrera.value = btnEdit.dataset.carrera;

    // curso actual (si tiene)
    const profId = Number(btnEdit.dataset.id);
    const { data } = await supabase
    .from("ProfesoresCursos")
    .select("curso_id")
     .eq("profesor_id", profId);

    const ids = (data || []).map(x => Number(x.curso_id));

    // marcar seleccionados en <select multiple>
    Array.from(mCurso.options).forEach(opt => {
    opt.selected = ids.includes(Number(opt.value));
});


    mStatus.innerHTML = "";
    modalEdit.show();
  }

  if (btnDel) {
    deleteId = Number(btnDel.dataset.id);
    deleteInfo.textContent = btnDel.dataset.info || "";
    deleteStatus.innerHTML = "";
    modalDelete.show();
  }
});

// Actualizar desde modal (profesor + re-asignar 1 curso)
async function actualizarDesdeModal() {

  document.getElementById("btn-modal-guardar")
  .addEventListener("click", async () => {
    await actualizarDesdeModal();
  });

  clearAlert(mStatus);

  const id = Number(mId.value);

  const payload = {
    nombre: mNombre.value.trim(),
    apellido1: mA1.value.trim(),
    apellido2: mA2.value.trim(),
    correo: mCorreo.value.trim(),
    carrera_id: Number(mCarrera.value)
  };

  const cursosIds = [...new Set(
  Array.from(mCurso.selectedOptions).map(o => Number(o.value))
  )].filter(n => Number.isInteger(n) && n > 0);
  

  if (!Number.isFinite(id) || id <= 0) {
  showAlert(mStatus, "ID inválido.", "danger");
  return;
  }

  if (!payload.nombre || !payload.apellido1 || !payload.apellido2 || !payload.correo || !payload.carrera_id) {
    showAlert(mStatus, "Complete todos los campos.", "danger");
    return;
  }
  if (cursosIds.length === 0) {
    showAlert(mStatus, "Seleccione al menos un curso.", "danger");
    return;
  }

  // 1) actualizar profesor
  const { error: errProf } = await supabase
    .from("Profesores")
    .update(payload)
    .eq("id", id);

  if (errProf) {
    console.error(errProf);
    showAlert(mStatus, "Error actualizando profesor.", "danger");
    return;
  }

  // 2) borrar cursos anteriores
  const { error: errDel } = await supabase
    .from("ProfesoresCursos")
    .delete()
    .eq("profesor_id", id);

  if (errDel) {
    console.error(errDel);
    showAlert(mStatus, "Error limpiando cursos anteriores.", "warning");
    return;
  }

  // 3) insertar nuevos cursos
const rows = cursosIds.map(cursoId => ({
  profesor_id: id,
  curso_id: cursoId
}));

const { error: errUpsert } = await supabase
  .from("ProfesoresCursos")
  .delete()
  .eq("profesor_id", id)
  .not("curso_id", "in", `(${cursosIds.join(",")})`);

if (errUpsert) {
  console.error(errUpsert);
  showAlert(mStatus, "Error asignando cursos.", "danger");
  return;

  }
  const { error: err2 } = await supabase.from("ProfesoresCursos").insert(rows);

  if (err2) {
  console.error(err2);
  showAlert(mStatus, "Error asignando cursos.", "warning");
  return;
  }

  showAlert(mStatus, `Profesor actualizado ✅ (cursos seleccionados: ${cursosIds.length})`, "success");
  modalEdit.hide();
  await cargarProfesores();
}


// Eliminar con modal
btnConfirmDelete.addEventListener("click", async () => {
  if (!deleteId) return;

  btnConfirmDelete.disabled = true;
  const old = btnConfirmDelete.innerHTML;
  btnConfirmDelete.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Eliminando...`;

  showAlert(deleteStatus, "Eliminando...", "info");

  const { error } = await supabase.from("Profesores").delete().eq("id", deleteId);
  if (error) {
    console.error(error);
    showAlert(deleteStatus, "Error al eliminar.", "danger");
    btnConfirmDelete.disabled = false;
    btnConfirmDelete.innerHTML = old;
    return;
  }

  showAlert(alertTop, "Profesor eliminado 🗑️", "warning");
  deleteId = null;
  modalDelete.hide();
  await cargarProfesores();

  btnConfirmDelete.disabled = false;
  btnConfirmDelete.innerHTML = old;
});

// Init
(async function init() {
  await cargarCarreras();
  await cargarCursos();
  await cargarProfesores();
})();
