import { supabase } from "./supabaseClient.js";

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
  const { data, error } = await supabase
    .from("Carreras")
    .select("id,nombre")
    .order("nombre");

  if (error) {
    console.error(error);
    showAlert(alertTop, "Error cargando carreras.", "danger");
    return;
  }

  // Select del form
  selCarrera.innerHTML = `<option value="">-- Seleccione --</option>`;
  // Select del modal
  mCarrera.innerHTML = `<option value="">-- Seleccione --</option>`;

  data.forEach((c) => {
    selCarrera.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
    mCarrera.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
  });
}

// ======= Cargar estudiantes =======
let cacheEstudiantes = [];

async function cargarEstudiantes() {
  clearAlert(alertTop);

  // FK carrera_id -> Carreras.id para poder traer el nombre así
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

  // 👇 Nuevo: llena combo de matrícula si existe
  cargarComboEstudiantesMatricula();
}

function pintarTabla(estudiantes) {
  lista.innerHTML = "";

  estudiantes.forEach((e) => {
    const tr = document.createElement("tr");
    const carreraNombre = e.Carreras?.nombre ?? "—";

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

// ======= Combo Matricula: estudiantes =======
function cargarComboEstudiantesMatricula() {
  const selEstudiante = document.getElementById("sel-estudiante");
  if (!selEstudiante) return; // si la sección no existe, no hacemos nada

  selEstudiante.innerHTML = cacheEstudiantes
    .map((e) => {
      const label = `${e.apellido1 ?? ""} ${e.apellido2 ?? ""}, ${e.nombre} (${e.correo})`.trim();
      return `<option value="${e.id}">${label}</option>`;
    })
    .join("");
}

// ======= Filtro =======
function filtrar() {
  const t = filtroTexto.value.trim().toLowerCase();
  if (!t) {
    pintarTabla(cacheEstudiantes);
    return;
  }

  const filtrados = cacheEstudiantes.filter((e) => {
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
    carrera_id: selCarrera.value,
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
  await cargarEstudiantes();

  // 👇 Nuevo: si existe la matrícula, refresca para que aparezca el estudiante nuevo
  await recargarMatriculaSiExiste();
});

// ======= Click tabla (editar / eliminar) =======
lista.addEventListener("click", (ev) => {

  // ==========================
  // CLICK EN FILA → MATRÍCULA
  // ==========================
  const tr = ev.target.closest("tr");
  if (tr && tr.children.length) {
    const estudianteId = tr.children[0]?.textContent?.trim();
    const selEstudiante = document.getElementById("sel-estudiante");

    if (selEstudiante && estudianteId) {
      selEstudiante.value = estudianteId;

      // Disparar recarga de matrícula
      selEstudiante.dispatchEvent(new Event("change"));
    }
  }

  // ==========================
  // BOTONES EDITAR / ELIMINAR
  // ==========================
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
    carrera_id: mCarrera.value,
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
  await cargarEstudiantes();

  // 👇 Nuevo
  await recargarMatriculaSiExiste();
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
  await cargarEstudiantes();

  // 👇 Nuevo
  await recargarMatriculaSiExiste();

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

// ===========================
// MATRÍCULA DE CURSOS
// ===========================
let _matriculaReady = false;

async function initMatricula() {
  const selEstudiante = document.getElementById("sel-estudiante");
  const selCurso = document.getElementById("sel-curso");
  const btnMatricular = document.getElementById("btn-matricular");
  const btnRecargar = document.getElementById("btn-recargar-matricula");
  const tbodyMat = document.querySelector("#tbl-matriculados tbody");

  if (!selEstudiante || !selCurso || !btnMatricular || !tbodyMat) return;

  _matriculaReady = true;

  let cacheCursos = [];

  async function cargarCursosCache() {
    const { data, error } = await supabase
      .from("Cursos")
      .select("id,codigo,nombre")
      .order("codigo", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }
    cacheCursos = data ?? [];
  }

  async function getCursosMatriculadosIds(estudianteId) {
    const { data, error } = await supabase
      .from("EstudiantesCursos")
      .select("curso_id")
      .eq("estudiante_id", estudianteId);

    if (error) {
      console.error(error);
      return new Set();
    }
    return new Set((data ?? []).map((x) => x.curso_id));
  }

  async function cargarCursosDisponiblesCombo(estudianteId) {
    const matriculados = await getCursosMatriculadosIds(estudianteId);
    const disponibles = cacheCursos.filter((c) => !matriculados.has(c.id));

    selCurso.innerHTML = disponibles
      .map((c) => `<option value="${c.id}">${c.codigo} - ${c.nombre}</option>`)
      .join("");

    if (!disponibles.length) selCurso.innerHTML = "";
  }

  async function cargarTablaMatriculados(estudianteId) {
    const { data, error } = await supabase
      .from("EstudiantesCursos")
      .select("id, curso_id, Cursos(codigo,nombre)")
      .eq("estudiante_id", estudianteId)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    tbodyMat.innerHTML = (data ?? [])
      .map((row) => {
        const c = row.Cursos;
        return `
          <tr>
            <td>${c?.codigo ?? ""}</td>
            <td>${c?.nombre ?? ""}</td>
            <td>
              <button class="btn btn-sm btn-danger" data-ecid="${row.id}">
                Quitar
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  async function recargarMatriculaUI() {
    const estudianteId = Number(selEstudiante.value);
    if (!estudianteId) return;

    await cargarCursosDisponiblesCombo(estudianteId);
    await cargarTablaMatriculados(estudianteId);
  }

  // Eventos
  selEstudiante.addEventListener("change", recargarMatriculaUI);

  if (btnRecargar) {
    btnRecargar.addEventListener("click", recargarMatriculaUI);
  }

  btnMatricular.addEventListener("click", async () => {
    const estudianteId = Number(selEstudiante.value);
    const cursoId = Number(selCurso.value);

    if (!estudianteId || !cursoId) return;

    const { error } = await supabase
      .from("EstudiantesCursos")
      .insert([{ estudiante_id: estudianteId, curso_id: cursoId }]);

    if (error) {
      console.error(error);
      alert("No se pudo matricular (posiblemente ya está matriculado).");
      return;
    }

    await recargarMatriculaUI();
  });

  // Delegación: quitar matrícula
  tbodyMat.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-ecid]");
    if (!btn) return;

    const ecId = Number(btn.dataset.ecid);

    const { error } = await supabase.from("EstudiantesCursos").delete().eq("id", ecId);

    if (error) {
      console.error(error);
      alert("No se pudo quitar la matrícula.");
      return;
    }

    await recargarMatriculaUI();
  });

  // Init
  await cargarCursosCache();
  cargarComboEstudiantesMatricula();
  if (selEstudiante.value) await recargarMatriculaUI();
}

// Si existe matrícula, recarga UI (sin fallar si no está la sección)
async function recargarMatriculaSiExiste() {
  if (!_matriculaReady) return;
  const selEstudiante = document.getElementById("sel-estudiante");
  if (!selEstudiante) return;

  // Mantener selección si todavía existe
  const prev = selEstudiante.value;
  cargarComboEstudiantesMatricula();
  if ([...selEstudiante.options].some((o) => o.value === prev)) {
    selEstudiante.value = prev;
  }

  // Disparar refresco (reusa el handler de change)
  selEstudiante.dispatchEvent(new Event("change"));
}

// ======= Init =======
(async function init() {
  await cargarCarreras();
  await cargarEstudiantes();
  await initMatricula();
})();
