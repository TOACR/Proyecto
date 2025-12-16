import { supabase } from "../supabaseClient.js";

async function guard() {
  const { data, error } = await supabase.auth.getSession();

  // Si no hay sesión real de Supabase -> login
  if (error || !data.session) {
    sessionStorage.removeItem("auth");
    window.location.replace("../index.html");
    return;
  }

  // Si sí hay sesión -> marca auth local para tu app (opcional)
  sessionStorage.setItem("auth", "1");
}

guard();

// Botón Salir
document.addEventListener("DOMContentLoaded", () => {
  const btnSalir = document.getElementById("btn-salir");
  if (!btnSalir) return;

  btnSalir.addEventListener("click", async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    sessionStorage.removeItem("auth");
    window.location.replace("../index.html");
  });
});
