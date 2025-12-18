import { supabase } from "./supabaseClient.js";

const path = window.location.pathname.toLowerCase();
const isLogin = path.endsWith("/login.html");

async function guard() {

  //  No aplicar guard en login
  if (isLogin) return;

  const { data, error } = await supabase.auth.getSession();

  // Si no hay sesión real de Supabase -> login
  if (error || !data?.session) {
    sessionStorage.removeItem("auth");
    window.location.replace("../login.html");
    return;
  }

  // Si sí hay sesión -> marca auth local para tu app
  sessionStorage.setItem("auth", "1");
}

guard();

// Botón Salir
document.addEventListener("DOMContentLoaded", () => {
  const btnSalir = document.getElementById("btn-salir");

  if (btnSalir) {
    btnSalir.addEventListener("click", async (e) => {
      e.preventDefault();

      // Cierra sesión REAL de Supabase
      await supabase.auth.signOut();

      // Limpiar todo
      sessionStorage.clear();
      localStorage.removeItem("usuario");
      localStorage.removeItem("token");

      // Desde /pages/* hacia login en raíz
      window.location.replace("../login.html");
    });
  }
});