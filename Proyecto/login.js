import { supabase } from "./supabaseClient.js";
const { data } = await supabase.auth.getSession();
if (data.session) {
  sessionStorage.setItem("auth", "1");
  window.location.replace("pages/menu.html");
}
const form = document.getElementById("login-form");
const correo = document.getElementById("correo");
const password = document.getElementById("password");
const btnRegister = document.getElementById("btn-register");
const status = document.getElementById("login-status");

function show(msg, type = "info") {
  status.innerHTML = `
    <div class="alert alert-${type} py-2 mb-0" role="alert">${msg}</div>
  `;
}

// LOGIN
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  show("Ingresando...", "info");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo.value.trim(),
    password: password.value.trim(),
  });

  if (error) {
    show("Credenciales inválidas o usuario no existe.", "danger");
    return;
  }

  // Marcar sesión para tus páginas (opcional, pero útil)
  sessionStorage.setItem("auth", "1");

  // Ir al menú SIN permitir volver con atrás
  window.location.replace("login.html");
});

// REGISTRO
btnRegister.addEventListener("click", async () => {
  show("Registrando...", "info");

  const { data, error } = await supabase.auth.signUp({
    email: correo.value.trim(),
    password: password.value.trim(),
  });

  if (error) {
    show("Error registrando: " + error.message, "danger");
    return;
  }

  show("Usuario creado ✅. Ya puedes iniciar sesión (si pide verificación, revisa tu correo).", "success");
});
