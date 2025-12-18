import { supabase } from "./supabaseClient.js";
sessionStorage.setItem("auth", "1");

// DOM Document Object Model
// Elementos del formulario (Crear)
const form = document.getElementById("curso-form");
const inputId = document.getElementById("curso-id"); 
const inputCodigo = document.getElementById("codigo");
const inputNombre = document.getElementById("nombre");
const inputCreditos = document.getElementById("creditos");
const btnSave = document.getElementById("btn-save");
const btnCancel = document.getElementById("btn-cancel");
const statusDiv = document.getElementById("status");
const alertTop = document.getElementById("alert-top");
let listaCursos = document.getElementById("lista-cursos");


// Elementos de filtro
const filtroTexto = document.getElementById("filtro-texto");
const btnFiltrar = document.getElementById("btn-filtrar");
const btnLimpiar = document.getElementById("btn-limpiar");


// Modal (Editar)
const modalEl = document.getElementById("modalEditarCurso");
const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
const mId = document.getElementById("modal-curso-id");
const mCodigo = document.getElementById("modal-codigo");
const mNombre = document.getElementById("modal-nombre");
const mCreditos = document.getElementById("modal-creditos");
const mStatus = document.getElementById("modal-status");
const btnModalGuardar = document.getElementById("btn-modal-guardar");

// Modal Confirm Delete
const modalDeleteEl = document.getElementById("modalConfirmDelete");
const modalDelete = modalDeleteEl ? new bootstrap.Modal(modalDeleteEl) : null;
const deleteInfo = document.getElementById("delete-info");
const deleteStatus = document.getElementById("delete-status");
const btnConfirmDelete = document.getElementById("btn-confirm-delete");
let deleteIdPendiente = null;

if (modalDeleteEl) {
  modalDeleteEl.addEventListener("hidden.bs.modal", () => {
    deleteIdPendiente = null;
    if (deleteStatus) deleteStatus.innerHTML = "";
    if (deleteInfo) deleteInfo.textContent = "";
    if (btnConfirmDelete) {
      btnConfirmDelete.disabled = false;
      btnConfirmDelete.innerHTML = "Sí, eliminar";
    }
  });
}

// Eventos

// Crear curso (siempre INSERT desde el form principal)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigo = inputCodigo.value.trim();
  const nombre = inputNombre.value.trim();
  const creditos = parseInt(inputCreditos.value.trim(), 10);

  if (!codigo || !nombre || Number.isNaN(creditos)) return;

clearAlert(statusDiv);
clearAlert(alertTop);
showAlert(statusDiv, "Guardando...", "info");

const ok = await crearCurso(codigo, nombre, creditos);

if (ok) {
  showAlert(statusDiv, "Curso guardado ✅", "success");
  limpiarFormularioCrear();
  cargarCursos();
} else {
  showAlert(statusDiv, "Error al guardar el curso.", "danger");
}
});

// Botón cancelar del form
btnCancel.addEventListener("click", () => {
  limpiarFormularioCrear();
});

// Clicks de tabla (Editar / Eliminar)
listaCursos.addEventListener("click", async (e) => {
  const btnDelete = e.target.closest(".btn-delete");
  const btnEdit = e.target.closest(".btn-edit");

  // Eliminar
if (btnDelete) {
  if (!modalDelete) {
    alert("Falta el modal de confirmación o el script Bootstrap bundle.");
    return;
  }

  deleteIdPendiente = btnDelete.getAttribute("data-id");

  // Información: mostrar el curso (código/nombre)
  const tr = btnDelete.closest("tr");
  const codigo = tr?.children?.[0]?.textContent ?? "";
  const nombre = tr?.children?.[1]?.textContent ?? "";
  deleteInfo.textContent = codigo || nombre ? `Curso: ${codigo} - ${nombre}` : "";

  deleteStatus.innerHTML = "";
  modalDelete.show();
  return;
}

  // Editar (Abrir modal)
  if (btnEdit) {
    if (!modal) {
      alert("Falta el modal o el script de Bootstrap bundle.");
      return;
    }

    mId.value = btnEdit.dataset.id;
    mCodigo.value = btnEdit.dataset.codigo;
    mNombre.value = btnEdit.dataset.nombre;
    mCreditos.value = btnEdit.dataset.creditos;

    mStatus.textContent = "";
    mStatus.className = "small";

    modal.show();
  }
});

// Guardar cambios del modal (UPDATE)
if (btnModalGuardar) {
  btnModalGuardar.addEventListener("click", async () => {
    const id = (mId?.value || "").trim();
    const codigo = (mCodigo?.value || "").trim();
    const nombre = (mNombre?.value || "").trim();
    const creditos = parseInt(mCreditos?.value || "", 10);

    if (!id || !codigo || !nombre || Number.isNaN(creditos)) {
      mStatus.textContent = "Complete todos los campos correctamente.";
      mStatus.className = "text-danger small";
      return;
    }

clearAlert(mStatus);
showAlert(mStatus, "Actualizando...", "info");

const ok = await actualizarCurso(id, codigo, nombre, creditos);

if (!ok) {
  showAlert(mStatus, "Error al actualizar el curso.", "danger");
  return;
}

showAlert(alertTop, "Curso actualizado ✅", "success");
modal.hide();
cargarCursos();

  });
}

// Filtro
btnFiltrar.addEventListener("click", () => filtrarCursos());
btnLimpiar.addEventListener("click", () => {
  filtroTexto.value = "";
  cargarCursos();
});

if (btnConfirmDelete) {
  btnConfirmDelete.addEventListener("click", async () => {
    if (!deleteIdPendiente) return;

    // Evitar doble click
    btnConfirmDelete.disabled = true;
    const oldText = btnConfirmDelete.innerHTML;
    btnConfirmDelete.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Eliminando...`;

    // Mensaje en el modal
    if (typeof showAlert === "function") {
      showAlert(deleteStatus, "Eliminando...", "info");
    } else {
      deleteStatus.textContent = "Eliminando...";
      deleteStatus.className = "text-muted small";
    }

    const ok = await eliminarCursos(deleteIdPendiente);

    if (!ok) {
      // Error: NO cerrar modal
      if (typeof showAlert === "function") {
        showAlert(deleteStatus, "Error al eliminar el curso. Intente de nuevo.", "danger");
      } else {
        deleteStatus.textContent = "Error al eliminar el curso.";
        deleteStatus.className = "text-danger small";
      }

      // Rehabilitar botón
      btnConfirmDelete.disabled = false;
      btnConfirmDelete.innerHTML = oldText;
      return;
    }

    // Éxito: cerrar y refrescar
    if (typeof showAlert === "function") {
      showAlert(alertTop, "Curso eliminado 🗑️", "warning");
    }

    deleteIdPendiente = null;
    modalDelete.hide();
    cargarCursos();

    // Restaurar botón para la próxima vez
    btnConfirmDelete.disabled = false;
    btnConfirmDelete.innerHTML = oldText;
  });
}

// Funciones UI
function limpiarFormularioCrear() {
  form.reset();
  inputId.value = ""; // por compatibilidad
  document.getElementById("form-title").textContent = "Registrar curso";
  btnSave.textContent = "Guardar";
  btnCancel.style.display = "none"; // si lo quieres siempre visible, quita esto
}

// Filtro por código o nombre en las filas ya pintadas
function filtrarCursos() {
  const texto = filtroTexto.value.trim().toLowerCase();

  if (texto === "") {
    cargarCursos();
    return;
  }

  const filas = listaCursos.querySelectorAll("tr");

  filas.forEach((fila) => {
    const codigo = fila.children[0].textContent.toLowerCase();
    const nombre = fila.children[1].textContent.toLowerCase();

    fila.style.display = (codigo.includes(texto) || nombre.includes(texto)) ? "" : "none";
  });
}


// Cargar tabla
async function cargarCursos() {
  let { data: cursos, error } = await supabase.from("Cursos").select("*");

  if (error) {
    console.error("Error al cargar cursos:", error);
    return;
  }

  listaCursos.innerHTML = "";

  cursos.forEach((curso) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${curso.codigo}</td>
      <td class="text-start">${curso.nombre}</td>
      <td>${curso.creditos}</td>
      <td>
        <div class="d-flex justify-content-center gap-2">
          <button class="btn btn-sm btn-warning btn-edit"
            data-id="${curso.id}"
            data-codigo="${curso.codigo}"
            data-nombre="${curso.nombre}"
            data-creditos="${curso.creditos}">
            ✏️ Editar
          </button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${curso.id}">
            🗑️ Eliminar
          </button>
        </div>
      </td>
    `;

    listaCursos.appendChild(tr);
  });
}


// CRUD
async function crearCurso(codigo, nombre, creditos) {
  const curso = { codigo, nombre, creditos };
  const { error } = await supabase.from("Cursos").insert([curso]);
  if (error) {
    console.error(error);
    return false;
  }
  return true;
}

async function actualizarCurso(id, codigo, nombre, creditos) {
  const { error } = await supabase
    .from("Cursos")
    .update({ codigo, nombre, creditos })
    .eq("id", id);

  if (error) {
    console.error(error);
    return false;
  }
  return true;
}

async function eliminarCursos(id) {
  const { error } = await supabase.from("Cursos").delete().eq("id", id);
  if (error) {
    console.error(error);
    return false;
  }
  return true;
}


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

// Init
cargarCursos();