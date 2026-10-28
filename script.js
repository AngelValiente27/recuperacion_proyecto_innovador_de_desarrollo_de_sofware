
"use strict";

/* =========================================
   EDUCONTROL - GESTION DE ALUMNOS
   ========================================= */

// 1. Almacenamiento local
const CLAVES = {
    alumnos: "educontrol_alumnos",
    materias: "educontrol_materias",
    calificaciones: "educontrol_calificaciones"
};

function cargarDatos(clave) {
    try {
        const datos = localStorage.getItem(clave);
        const resultado = datos ? JSON.parse(datos) : [];
        return Array.isArray(resultado) ? resultado : [];
    } catch (error) {
        console.error("No se pudieron leer los datos:", error);
        return [];
    }
}

function guardarDatos(clave, datos) {
    try {
        localStorage.setItem(clave, JSON.stringify(datos));
        return true;
    } catch (error) {
        console.error("No se pudieron guardar los datos:", error);
        alert("No fue posible guardar los datos. Comprueba el almacenamiento del navegador.");
        return false;
    }
}

let alumnos = cargarDatos(CLAVES.alumnos);
let materias = cargarDatos(CLAVES.materias);
let calificaciones = cargarDatos(CLAVES.calificaciones);

// 2. Utilidades
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function crearId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 9);
}

function obtenerNotasAlumno(alumnoId) {
    return cargarDatos(CLAVES.calificaciones)
        .filter(nota => nota.alumnoId === alumnoId)
        .map(nota => Number(nota.nota))
        .filter(nota => Number.isFinite(nota) && nota >= 0 && nota <= 10);
}

function calcularPromedioAlumno(alumnoId) {
    const notas = obtenerNotasAlumno(alumnoId);

    if (notas.length === 0) {
        return null;
    }

    return notas.reduce((suma, nota) => suma + nota, 0) / notas.length;
}

function obtenerEstado(promedio) {
    if (promedio === null) {
        return '<span class="estado estado-pendiente">Sin notas</span>';
    }

    if (promedio >= 6) {
        return '<span class="estado estado-aprobado">Aprobado</span>';
    }

    return '<span class="estado estado-reprobado">Reprobado</span>';
}

// 3. Referencias HTML
const tablaAlumnos = document.getElementById("tablaAlumnos");
const buscarAlumno = document.getElementById("buscarAlumno");
const btnNuevoAlumno = document.getElementById("btnNuevoAlumno");

// 4. Mostrar alumnos
function renderizarAlumnos(filtro = "") {
    if (!tablaAlumnos) return;

    const busqueda = filtro.trim().toLocaleLowerCase("es");

    const filtrados = alumnos.filter(alumno => {
        const texto = [
            alumno.nie,
            alumno.nombre,
            alumno.apellido,
            alumno.correo
        ].join(" ").toLocaleLowerCase("es");

        return texto.includes(busqueda);
    });

    if (filtrados.length === 0) {
        tablaAlumnos.innerHTML = `
            <tr>
                <td colspan="6" class="mensaje-tabla">
                    ${alumnos.length === 0
                        ? "Todavía no hay alumnos registrados."
                        : "No se encontraron alumnos con esa búsqueda."}
                </td>
            </tr>
        `;
        return;
    }

    tablaAlumnos.innerHTML = filtrados.map(alumno => {
        const promedio = calcularPromedioAlumno(alumno.id);
        const promedioTexto = promedio === null
            ? "—"
            : promedio.toFixed(2);

        return `
            <tr>
                <td>${escaparHTML(alumno.nie)}</td>
                <td>
                    <strong>
                        ${escaparHTML(alumno.nombre)}
                        ${escaparHTML(alumno.apellido)}
                    </strong>
                </td>
                <td>${escaparHTML(alumno.correo)}</td>
                <td>${promedioTexto}</td>
                <td>${obtenerEstado(promedio)}</td>
                <td>
                    <div class="acciones">
                        <button
                            type="button"
                            class="boton-accion"
                            data-accion="editar"
                            data-id="${escaparHTML(alumno.id)}">
                            Editar
                        </button>
                        <button
                            type="button"
                            class="boton-accion boton-eliminar"
                            data-accion="eliminar"
                            data-id="${escaparHTML(alumno.id)}">
                            Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// 5. Estadísticas del panel principal
function actualizarEstadisticas() {
    const materias = cargarDatos(CLAVES.materias);
    const calificaciones = cargarDatos(CLAVES.calificaciones);

    const notasValidas = calificaciones
        .map(registro => Number(registro.nota))
        .filter(nota => Number.isFinite(nota) && nota >= 0 && nota <= 10);

    const promedioGeneral = notasValidas.length
        ? notasValidas.reduce((suma, nota) => suma + nota, 0) /
            notasValidas.length
        : 0;

    const aprobados = alumnos.filter(alumno => {
        const promedio = calcularPromedioAlumno(alumno.id);
        return promedio !== null && promedio >= 6;
    }).length;

    document.getElementById("totalAlumnos").textContent = alumnos.length;
    document.getElementById("totalMaterias").textContent = materias.length;
    document.getElementById("promedioGeneral").textContent =
        promedioGeneral.toFixed(2);
    document.getElementById("totalAprobados").textContent = aprobados;

    const resumen = document.getElementById("resumenActividad");

    if (resumen && alumnos.length > 0) {
        resumen.innerHTML = `
            <div class="resumen-icono">📚</div>
            <h3>Resumen académico actualizado</h3>
            <p>
                Hay ${alumnos.length} alumno(s), ${materias.length}
                materia(s) y ${notasValidas.length}
                calificación(es) registrada(s).
            </p>
        `;
    }
}

// 6. Crear formulario para registrar o editar
function abrirFormularioAlumno(alumnoId = null) {
    const existente = alumnoId
        ? alumnos.find(alumno => alumno.id === alumnoId)
        : null;

    if (alumnoId && !existente) {
        alert("No se encontró el alumno seleccionado.");
        return;
    }

    const modalAnterior = document.getElementById("modalAlumno");

    if (modalAnterior) {
        modalAnterior.remove();
    }

    const modal = document.createElement("div");
    modal.id = "modalAlumno";
    modal.className = "modal-overlay";

    modal.innerHTML = `
        <section class="modal-contenido"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloFormularioAlumno">

            <div class="panel-encabezado">
                <h2 id="tituloFormularioAlumno">
                    ${existente ? "Editar alumno" : "Registrar alumno"}
                </h2>
                <p>Completa la información del estudiante.</p>
            </div>

            <form id="formularioAlumno" class="formulario">
                <div class="campo">
                    <label for="nie">NIE *</label>
                    <input id="nie" name="nie" type="text"
                        maxlength="20" required
                        autocomplete="off"
                        value="${escaparHTML(existente?.nie || "")}"
                        placeholder="Ej. 12345678">
                </div>

                <div class="campo">
                    <label for="nombre">Nombre *</label>
                    <input id="nombre" name="nombre" type="text"
                        maxlength="50" required
                        autocomplete="given-name"
                        value="${escaparHTML(existente?.nombre || "")}"
                        placeholder="Nombre del alumno">
                </div>

                <div class="campo">
                    <label for="apellido">Apellido *</label>
                    <input id="apellido" name="apellido" type="text"
                        maxlength="50" required
                        autocomplete="family-name"
                        value="${escaparHTML(existente?.apellido || "")}"
                        placeholder="Apellido del alumno">
                </div>

                <div class="campo">
                    <label for="correo">Correo electrónico *</label>
                    <input id="correo" name="correo" type="email"
                        maxlength="100" required
                        autocomplete="email"
                        value="${escaparHTML(existente?.correo || "")}"
                        placeholder="alumno@ejemplo.com">
                </div>

                <p class="texto-superior">* Campos obligatorios</p>

                <div class="formulario-acciones">
                    <button type="button"
                        class="boton boton-secundario"
                        id="cancelarAlumno">
                        Cancelar
                    </button>
                    <button type="submit"
                        class="boton boton-principal">
                        ${existente ? "Guardar cambios" : "Registrar alumno"}
                    </button>
                </div>
            </form>
        </section>
    `;

    document.body.appendChild(modal);

    const formulario = document.getElementById("formularioAlumno");

    formulario.elements.nie.focus();

    document.getElementById("cancelarAlumno").addEventListener("click", () => {
        modal.remove();
    });

    modal.addEventListener("click", evento => {
        if (evento.target === modal) {
            modal.remove();
        }
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const datos = new FormData(formulario);

        const nie = String(datos.get("nie")).trim();
        const nombre = String(datos.get("nombre")).trim();
        const apellido = String(datos.get("apellido")).trim();
        const correo = String(datos.get("correo")).trim();

        if (!nie || !nombre || !apellido || !correo) {
            alert("Completa todos los campos obligatorios.");
            return;
        }

        const duplicado = alumnos.some(alumno =>
            alumno.nie.toLocaleLowerCase("es") ===
                nie.toLocaleLowerCase("es") &&
            alumno.id !== alumnoId
        );

        if (duplicado) {
            alert("Ya existe un alumno con ese NIE.");
            formulario.elements.nie.focus();
            return;
        }

        const alumnoActualizado = {
            id: alumnoId || crearId(),
            nie,
            nombre,
            apellido,
            correo
        };

        const nuevosAlumnos = existente
            ? alumnos.map(alumno =>
                alumno.id === alumnoId ? alumnoActualizado : alumno
            )
            : [...alumnos, alumnoActualizado];

        if (guardarDatos(CLAVES.alumnos, nuevosAlumnos)) {
            alumnos = nuevosAlumnos;
            modal.remove();
            renderizarAlumnos(buscarAlumno?.value || "");
            actualizarEstadisticas();

            alert(existente
                ? "Los datos del alumno se actualizaron correctamente."
                : "El alumno se registró correctamente.");
        }
    });
}

// 7. Registrar alumno
if (btnNuevoAlumno) {
    btnNuevoAlumno.addEventListener("click", () => {
        abrirFormularioAlumno();
    });
}

// 8. Buscar alumnos
if (buscarAlumno) {
    buscarAlumno.addEventListener("input", () => {
        renderizarAlumnos(buscarAlumno.value);
    });
}

// 9. Editar y eliminar mediante los botones de la tabla
if (tablaAlumnos) {
    tablaAlumnos.addEventListener("click", evento => {
        const boton = evento.target.closest("button[data-accion]");

        if (!boton) return;

        const alumnoId = boton.dataset.id;
        const accion = boton.dataset.accion;

        if (accion === "editar") {
            abrirFormularioAlumno(alumnoId);
        }

        if (accion === "eliminar") {
            const alumno = alumnos.find(item => item.id === alumnoId);

            if (!alumno) {
                alert("No se encontró el alumno.");
                return;
            }

            const confirmado = confirm(
                `¿Deseas eliminar al alumno ${alumno.nombre} ${alumno.apellido}?`
            );

            if (!confirmado) return;

            const nuevasCalificaciones = cargarDatos(CLAVES.calificaciones)
                .filter(nota => nota.alumnoId !== alumnoId);

            const nuevosAlumnos = alumnos.filter(
                item => item.id !== alumnoId
            );

            if (!guardarDatos(CLAVES.calificaciones, nuevasCalificaciones)) {
                return;
            }

            if (!guardarDatos(CLAVES.alumnos, nuevosAlumnos)) {
                return;
            }

            alumnos = nuevosAlumnos;

            renderizarAlumnos(buscarAlumno?.value || "");
            actualizarEstadisticas();

            alert("El alumno y sus calificaciones asociadas fueron eliminados.");
        }
    });
}

// 10. Navegacion entre secciones
const enlacesNavegacion = document.querySelectorAll(
    ".nav-enlace[data-seccion]"
);

const secciones = document.querySelectorAll(".seccion");
const tituloPagina = document.getElementById("tituloPagina");

const titulos = {
    inicio: "Panel principal",
    alumnos: "Alumnos",
    materias: "Materias",
    calificaciones: "Calificaciones"
};

function mostrarSeccion(nombre) {
    if (!titulos[nombre]) return;

    secciones.forEach(seccion => {
        seccion.classList.toggle("activa", seccion.id === nombre);
    });

    enlacesNavegacion.forEach(enlace => {
        const activo = enlace.dataset.seccion === nombre;
        enlace.classList.toggle("activo", activo);

        if (activo) {
            enlace.setAttribute("aria-current", "page");
        } else {
            enlace.removeAttribute("aria-current");
        }
    });

    if (tituloPagina) {
        tituloPagina.textContent = titulos[nombre];
    }
}

enlacesNavegacion.forEach(enlace => {
    enlace.addEventListener("click", () => {
        mostrarSeccion(enlace.dataset.seccion);
    });
});

// Botones que llevan a otra seccion
document.querySelectorAll("[data-ir]").forEach(boton => {
    boton.addEventListener("click", () => {
        mostrarSeccion(boton.dataset.ir);
    });
});

// 11. Inicializar la aplicacion
renderizarAlumnos();
actualizarEstadisticas();
mostrarSeccion("inicio");

/* ==========================================
   MODULO DE MATERIAS - EDUCONTROL
========================================== */

function renderizarMaterias(filtro = "") {
    const tabla = document.getElementById("tablaMaterias");
    if (!tabla) return;

    const busqueda = filtro.toLowerCase().trim();

    const filtradas = materias.filter(materia =>
        String(materia.codigo || "").toLowerCase().includes(busqueda) ||
        String(materia.nombre || "").toLowerCase().includes(busqueda) ||
        String(materia.descripcion || "").toLowerCase().includes(busqueda)
    );

    if (filtradas.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;padding:20px;">
                    No hay materias registradas.
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = filtradas.map(materia => `
        <tr>
            <td>${escaparHTML(materia.codigo)}</td>
            <td>${escaparHTML(materia.nombre)}</td>
            <td>${escaparHTML(materia.descripcion || "")}</td>
            <td>
                <button type="button"
                    class="btn-secundario"
                    data-accion-materia="editar"
                    data-id="${escaparHTML(materia.id)}">
                    Editar
                </button>
                <button type="button"
                    class="btn-peligro"
                    data-accion-materia="eliminar"
                    data-id="${escaparHTML(materia.id)}">
                    Eliminar
                </button>
            </td>
        </tr>
    `).join("");
}

function abrirFormularioMateria(materiaId = null) {
    const existente = materiaId
        ? materias.find(m => String(m.id) === String(materiaId))
        : null;

    if (materiaId && !existente) {
        alert("No se encontró la materia seleccionada.");
        return;
    }

    document.querySelector(".modal-overlay")?.remove();

    const modal = document.createElement("div");
    modal.className = "modal-overlay";

    modal.innerHTML = `
        <div class="modal-contenido">
            <div class="panel-encabezado">
                <h2>${existente ? "Editar materia" : "Nueva materia"}</h2>
                <button type="button" id="cerrarModalMateria"
                    aria-label="Cerrar formulario">✕</button>
            </div>

            <form id="formularioMateria">
                <label for="codigoMateria">Código</label>
                <input id="codigoMateria" name="codigo"
                    maxlength="20" required
                    value="${escaparHTML(existente?.codigo || "")}"
                    placeholder="Ej. MAT-001">

                <label for="nombreMateria">Nombre de la materia</label>
                <input id="nombreMateria" name="nombre"
                    maxlength="80" required
                    value="${escaparHTML(existente?.nombre || "")}"
                    placeholder="Ej. Matemática">

                <label for="descripcionMateria">Descripción</label>
                <textarea id="descripcionMateria" name="descripcion"
                    maxlength="250" rows="3"
                    placeholder="Describe brevemente la materia">${escaparHTML(existente?.descripcion || "")}</textarea>

                <div class="acciones-formulario">
                    <button type="button" id="cancelarMateria"
                        class="btn-secundario">Cancelar</button>
                    <button type="submit" class="btn-principal">
                        ${existente ? "Guardar cambios" : "Registrar materia"}
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    const cerrar = () => modal.remove();

    modal.querySelector("#cerrarModalMateria").addEventListener("click", cerrar);
    modal.querySelector("#cancelarMateria").addEventListener("click", cerrar);

    modal.addEventListener("click", evento => {
        if (evento.target === modal) cerrar();
    });

    modal.querySelector("#formularioMateria").addEventListener("submit", evento => {
        evento.preventDefault();

        const formulario = evento.currentTarget;
        const codigo = formulario.elements.codigo.value.trim();
        const nombre = formulario.elements.nombre.value.trim();
        const descripcion = formulario.elements.descripcion.value.trim();

        if (!codigo || !nombre) {
            alert("El código y el nombre son obligatorios.");
            return;
        }

        const codigoDuplicado = materias.some(m =>
            String(m.codigo).toLowerCase() === codigo.toLowerCase() &&
            String(m.id) !== String(materiaId)
        );

        if (codigoDuplicado) {
            alert("Ya existe una materia con ese código.");
            return;
        }

        const datosMateria = {
            id: existente ? existente.id : crearId(),
            codigo,
            nombre,
            descripcion
        };

        const indice = materias.findIndex(m =>
            String(m.id) === String(datosMateria.id)
        );

        if (indice >= 0) {
            materias[indice] = datosMateria;
        } else {
            materias.push(datosMateria);
        }

        if (!guardarDatos("educontrol_materias", materias)) {
            if (indice >= 0) {
                materias[indice] = existente;
            } else {
                materias.pop();
            }

            alert("No se pudo guardar la materia. Intenta nuevamente.");
            return;
        }

        cerrar();
        renderizarMaterias(
            document.getElementById("buscarMateria")?.value || ""
        );
        actualizarEstadisticas();
        alert(existente ? "Materia actualizada correctamente." : "Materia registrada correctamente.");
    });
}

/* Botón para registrar materias */
document.getElementById("btnNuevaMateria")
    ?.addEventListener("click", () => abrirFormularioMateria());

/* Buscador de materias */
document.getElementById("buscarMateria")
    ?.addEventListener("input", evento => {
        renderizarMaterias(evento.target.value);
    });

/* Acciones de la tabla de materias */
document.getElementById("tablaMaterias")
    ?.addEventListener("click", evento => {
        const boton = evento.target.closest("[data-accion-materia]");
        if (!boton) return;

        const id = boton.dataset.id;
        const accion = boton.dataset.accionMateria;

        if (accion === "editar") {
            abrirFormularioMateria(id);
            return;
        }

        if (accion === "eliminar") {
            const materia = materias.find(m =>
                String(m.id) === String(id)
            );

            if (!materia) return;

            const tieneCalificaciones = calificaciones.some(n =>
                String(n.materiaId) === String(id)
            );

            if (tieneCalificaciones) {
                alert("No puedes eliminar esta materia porque tiene calificaciones registradas.");
                return;
            }

            if (confirm(`¿Deseas eliminar la materia "${materia.nombre}"?`)) {
                const anteriores = [...materias];
                materias = materias.filter(m =>
                    String(m.id) !== String(id)
                );

                if (!guardarDatos("educontrol_materias", materias)) {
                    materias = anteriores;
                    alert("No se pudo eliminar la materia.");
                    return;
                }

                renderizarMaterias(
                    document.getElementById("buscarMateria")?.value || ""
                );
                actualizarEstadisticas();
            }
        }
    });

/* Mostrar las materias guardadas al iniciar */
renderizarMaterias();


/* ==========================================
   MODULO DE CALIFICACIONES - EDUCONTROL
========================================== */

function renderizarCalificaciones(filtro = "") {
    const tabla = document.getElementById("tablaCalificaciones");
    if (!tabla) return;

    const busqueda = filtro.trim().toLowerCase();

    calificaciones = cargarDatos(CLAVES.calificaciones);

    const filtradas = calificaciones.filter(nota => {
        const alumno = alumnos.find(a =>
            String(a.id) === String(nota.alumnoId)
        );

        const materia = materias.find(m =>
            String(m.id) === String(nota.materiaId)
        );

        const texto = [
            alumno?.nie,
            alumno?.nombre,
            alumno?.apellido,
            materia?.nombre,
            nota.periodo,
            nota.nota
        ].join(" ").toLowerCase();

        return texto.includes(busqueda);
    });

    if (filtradas.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="mensaje-tabla">
                    ${calificaciones.length === 0
                        ? "Todavía no hay calificaciones registradas."
                        : "No se encontraron calificaciones."}
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = filtradas.map(nota => {
        const alumno = alumnos.find(a =>
            String(a.id) === String(nota.alumnoId)
        );

        const materia = materias.find(m =>
            String(m.id) === String(nota.materiaId)
        );

        return `
            <tr>
                <td>${escaparHTML(
                    alumno
                        ? `${alumno.nombre} ${alumno.apellido}`
                        : "Alumno no disponible"
                )}</td>
                <td>${escaparHTML(materia?.nombre || "Materia no disponible")}</td>
                <td>${escaparHTML(nota.periodo || "Sin especificar")}</td>
                <td>${Number(nota.nota).toFixed(2)}</td>
                <td>
                    <button type="button"
                        class="btn-secundario"
                        data-accion-nota="editar"
                        data-id="${escaparHTML(nota.id)}">
                        Editar
                    </button>
                    <button type="button"
                        class="btn-peligro"
                        data-accion-nota="eliminar"
                        data-id="${escaparHTML(nota.id)}">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function abrirFormularioNota(notaId = null) {
    if (alumnos.length === 0) {
        alert("Primero debes registrar al menos un alumno.");
        return;
    }

    if (materias.length === 0) {
        alert("Primero debes registrar al menos una materia.");
        return;
    }

    const existente = notaId
        ? calificaciones.find(n =>
            String(n.id) === String(notaId)
        )
        : null;

    if (notaId && !existente) {
        alert("No se encontró la calificación.");
        return;
    }

    document.getElementById("modalNota")?.remove();

    const modal = document.createElement("div");
    modal.id = "modalNota";
    modal.className = "modal-overlay";

    modal.innerHTML = `
        <section class="modal-contenido"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloFormularioNota">

            <div class="panel-encabezado">
                <h2 id="tituloFormularioNota">
                    ${existente ? "Editar calificación" : "Registrar calificación"}
                </h2>
                <p>Ingresa los datos de la nota del estudiante.</p>
            </div>

            <form id="formularioNota">
                <div class="campo">
                    <label for="alumnoNota">Alumno *</label>
                    <select id="alumnoNota" name="alumnoId" required>
                        <option value="">Selecciona un alumno</option>
                        ${alumnos.map(a => `
                            <option value="${escaparHTML(a.id)}"
                                ${String(existente?.alumnoId) === String(a.id)
                                    ? "selected" : ""}>
                                ${escaparHTML(a.nie)} -
                                ${escaparHTML(a.nombre)} ${escaparHTML(a.apellido)}
                            </option>
                        `).join("")}
                    </select>
                </div>

                <div class="campo">
                    <label for="materiaNota">Materia *</label>
                    <select id="materiaNota" name="materiaId" required>
                        <option value="">Selecciona una materia</option>
                        ${materias.map(m => `
                            <option value="${escaparHTML(m.id)}"
                                ${String(existente?.materiaId) === String(m.id)
                                    ? "selected" : ""}>
                                ${escaparHTML(m.codigo)} - ${escaparHTML(m.nombre)}
                            </option>
                        `).join("")}
                    </select>
                </div>

                <div class="campo">
                    <label for="periodoNota">Periodo académico *</label>
                    <input id="periodoNota" name="periodo"
                        type="text" maxlength="40" required
                        placeholder="Ej. Primer periodo"
                        value="${escaparHTML(existente?.periodo || "")}">
                </div>

                <div class="campo">
                    <label for="valorNota">Nota (0 a 10) *</label>
                    <input id="valorNota" name="nota"
                        type="number" min="0" max="10" step="0.01"
                        required
                        value="${existente ? escaparHTML(existente.nota) : ""}"
                        placeholder="Ej. 8.50">
                </div>

                <div class="acciones-formulario">
                    <button type="button" id="cancelarNota"
                        class="btn-secundario">Cancelar</button>
                    <button type="submit" class="btn-principal">
                        ${existente ? "Guardar cambios" : "Registrar nota"}
                    </button>
                </div>
            </form>
        </section>
    `;

    document.body.appendChild(modal);

    const cerrar = () => modal.remove();

    document.getElementById("cancelarNota")
        .addEventListener("click", cerrar);

    modal.addEventListener("click", evento => {
        if (evento.target === modal) cerrar();
    });

    document.getElementById("formularioNota")
        .addEventListener("submit", evento => {
            evento.preventDefault();

            const formulario = evento.currentTarget;
            const alumnoId = formulario.elements.alumnoId.value;
            const materiaId = formulario.elements.materiaId.value;
            const periodo = formulario.elements.periodo.value.trim();
            const valor = formulario.elements.nota.value;
            const nota = Number(valor);

            if (!alumnoId || !materiaId || !periodo || valor === "") {
                alert("Completa todos los campos obligatorios.");
                return;
            }

            if (!Number.isFinite(nota) || nota < 0 || nota > 10) {
                alert("La nota debe estar entre 0 y 10.");
                return;
            }

            const registro = {
                id: existente ? existente.id : crearId(),
                alumnoId,
                materiaId,
                periodo,
                nota
            };

            const anteriores = [...calificaciones];

            calificaciones = existente
                ? calificaciones.map(n =>
                    String(n.id) === String(notaId) ? registro : n
                )
                : [...calificaciones, registro];

            if (!guardarDatos(CLAVES.calificaciones, calificaciones)) {
                calificaciones = anteriores;
                return;
            }

            cerrar();
            renderizarCalificaciones(
                document.getElementById("buscarCalificacion")?.value || ""
            );
            renderizarAlumnos(
                document.getElementById("buscarAlumno")?.value || ""
            );
            actualizarEstadisticas();

            alert(existente
                ? "Calificación actualizada correctamente."
                : "Calificación registrada correctamente.");
        });
}

/* Botón para registrar calificaciones */
document.getElementById("btnNuevaNota")
    ?.addEventListener("click", () => abrirFormularioNota());

/* Búsqueda de calificaciones */
document.getElementById("buscarCalificacion")
    ?.addEventListener("input", evento => {
        renderizarCalificaciones(evento.target.value);
    });

/* Editar y eliminar calificaciones */
document.getElementById("tablaCalificaciones")
    ?.addEventListener("click", evento => {
        const boton = evento.target.closest("[data-accion-nota]");
        if (!boton) return;

        const id = boton.dataset.id;
        const accion = boton.dataset.accionNota;

        if (accion === "editar") {
            abrirFormularioNota(id);
            return;
        }

        if (accion === "eliminar") {
            const nota = calificaciones.find(n =>
                String(n.id) === String(id)
            );

            if (!nota) return;

            if (!confirm("¿Deseas eliminar esta calificación?")) {
                return;
            }

            const anteriores = [...calificaciones];

            calificaciones = calificaciones.filter(n =>
                String(n.id) !== String(id)
            );

            if (!guardarDatos(CLAVES.calificaciones, calificaciones)) {
                calificaciones = anteriores;
                return;
            }

            renderizarCalificaciones(
                document.getElementById("buscarCalificacion")?.value || ""
            );
            renderizarAlumnos(
                document.getElementById("buscarAlumno")?.value || ""
            );
            actualizarEstadisticas();

            alert("Calificación eliminada correctamente.");
        }
    });

/* Mostrar calificaciones al iniciar */
renderizarCalificaciones();
