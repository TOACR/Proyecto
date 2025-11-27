import { supabase } from "./supabaseClient.js";

const form = document.getElementById("curso-form");
const inputId = document.getElementById("curso-id");
const inputCodigo = document.getElementById("codigo");
const inputNombre = document.getElementById("nombre");
const inputCreditos = document.getElementById("creditos");
const btnSave = document.getElementById("btn-save");
const btnCancel = document.getElementById("btn-cancel");
const statusDiv = document.getElementById("status");
let editando = false;
let listaCursos = document.getElementById("lista-cursos");


//===============================
//Eventos
//===============================
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const codigo = inputCodigo.value.trim();
    const nombre = inputNombre.value.trim();
    const creditos = parseInt(inputCreditos.value.trim());
    if (editando) {}
    else {await crearCurso(codigo, nombre, creditos);}
    form.reset();
});
   
listaCursos.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-delete")) {
        const id = e.target.getAttribute("data-id");
        await eliminarCrusos(id);
        cargarCursos();
    }
});

//===============================
//CRUD (CREATE, READ, UPDATE, DELETE)
//===============================

async function cargarCursos() {
    let { data: cursos, error } = await supabase.from("Cursos").select("*");
    console.log(cursos);

    if (error) {
        console.error("Error al cargar cursos:", error);
        return;
    }

    // Limpiar el cuerpo de la tabla
    listaCursos.innerHTML = "";

    cursos.forEach(curso => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${curso.codigo}</td>
            <td>${curso.nombre}</td>
            <td>${curso.creditos}</td>
            <td>
                <button class="btn-delete" data-id="${curso.id}">
                    Eliminar
                </button>
            </td>
        `;

        listaCursos.appendChild(tr);
    });
}

//Crear curso
async function crearCurso(codigo, nombre, creditos) {
    const curso = { codigo, nombre, creditos };
    let { error } = await supabase.from("Cursos").insert([curso]);
    if (error) {
        console.error(error);
    }
    cargarCursos();
}

async function eliminarCrusos(id) {
        let { error } = await supabase.from("Cursos").delete().eq("id", id);
        if (error) {
            console.error(error);
        }
       
}
cargarCursos();