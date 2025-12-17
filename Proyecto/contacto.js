import { supabase } from "./supabaseClient.js"; 

// Helpers UI
function showAlert(container, message, type = "info") {
  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    </div>
  `;
}

function setLoading(btn, loading, textLoading = "Enviando...") {
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset._oldText ??= btn.innerHTML;
  btn.innerHTML = loading
    ? `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${textLoading}`
    : btn.dataset._oldText;
}

// DOM
const form = document.querySelector("form.needs-validation");
const statusDiv = document.getElementById("form-status") || (() => {
  // creamos debajo del botón para no romper HTML actual
  const d = document.createElement("div");
  d.id = "form-status";
  d.className = "mt-3";
  form?.appendChild(d);
  return d;
})();

const iNombre = document.getElementById("nombre");
const iCorreo = document.getElementById("correo");
const iAsunto = document.getElementById("asunto");
const iMensaje = document.getElementById("mensaje");
const btnEnviar = form?.querySelector('button[type="submit"]');

// Honeypot (anti-bots). Si no existe en HTML, lo agregamos invisible.
let honeypot = form?.querySelector('input[name="empresa"]');
if (form && !honeypot) {
  honeypot = document.createElement("input");
  honeypot.type = "text";
  honeypot.name = "empresa";
  honeypot.autocomplete = "off";
  honeypot.tabIndex = -1;
  honeypot.style.position = "absolute";
  honeypot.style.left = "-9999px";
  honeypot.style.height = "1px";
  honeypot.style.width = "1px";
  form.appendChild(honeypot);
}

// Contador de caracteres (opcional, pero útil)
const maxMsg = 500;
if (iMensaje) {
  iMensaje.maxLength = maxMsg;

  const counter = document.createElement("div");
  counter.className = "text-muted small mt-1";
  counter.id = "msg-counter";
  iMensaje.parentElement?.appendChild(counter);

  const updateCounter = () => {
    const len = iMensaje.value.length;
    counter.textContent = `${len}/${maxMsg} caracteres`;
  };
  iMensaje.addEventListener("input", updateCounter);
  updateCounter();
}

// =====================
// Bootstrap Validation + Submit
// =====================
(function initValidationAndSubmit() {
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Validación Bootstrap/HTML5
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      showAlert(statusDiv, "Revise los campos marcados en rojo.", "danger");
      return;
    }

    // Honeypot (si el bot llenó el campo oculto)
    if (honeypot && honeypot.value.trim() !== "") {
      // Silencioso para no ayudar al bot
      return;
    }

    // Payload a guardar
const payload = {
  nombre: iNombre.value.trim(),
  correo: iCorreo.value.trim(),
  asunto: iAsunto.value.trim() || null,
  mensaje: iMensaje.value.trim()
};


    // Reglas extra opcionales
    if (payload.mensaje.length < 5) {
      showAlert(statusDiv, "El mensaje es muy corto (mínimo 5 caracteres).", "warning");
      return;
    }

    try {
      setLoading(btnEnviar, true);
      showAlert(statusDiv, "Enviando mensaje...", "info");

      // Insert en Supabase
      const { error } = await supabase
        .from("Contactos")
        .insert([payload]);

      if (error) {
        console.error(error);
        showAlert(
          statusDiv,
          `No se pudo enviar el mensaje. (${error.message || "Error"})`,
          "danger"
        );
        setLoading(btnEnviar, false);
        return;
      }

      showAlert(statusDiv, "Mensaje enviado correctamente ✅", "success");
      form.reset();
      form.classList.remove("was-validated");

      // reset contador si existe
      const counter = document.getElementById("msg-counter");
      if (counter) counter.textContent = `0/${maxMsg} caracteres`;

      setLoading(btnEnviar, false);

    } catch (err) {
      console.error(err);
      showAlert(statusDiv, "Error inesperado enviando el mensaje.", "danger");
      setLoading(btnEnviar, false);
    }
  }, false);
})();

// =====================
// Salir (si lo usas)
// =====================
document.getElementById("btn-salir")?.addEventListener("click", (e) => {
  e.preventDefault();
  // Si tú manejas sesión en localStorage/sessionStorage, limpia aquí:
  // localStorage.removeItem("token");
  // sessionStorage.clear();
  window.location.href = "./index.html"; // ajusta si tu login tiene otro nombre
});
