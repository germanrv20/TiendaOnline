// public/js/cambio-precio.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Identificar todos los botones
    const botones = document.querySelectorAll('.btn-cambiar');

    const cambiar_precio = (evt) => {
        evt.preventDefault();
        const boton = evt.currentTarget;
        const id = boton.dataset.id; // ID del producto

        // 2. Referencias a los elementos del DOM
        const input_precio = document.querySelector(`.precio-input[data-id="${id}"]`);
        const feedback = document.querySelector(`.mensaje-feedback[data-id="${id}"]`);

        //texto que queremos cambiar visualmente
        const texto_precio = document.querySelector(`.precio-display[data-id="${id}"]`);

        // 3. Validaciones previas
        const entrada_del_input = input_precio.value;
        const nuevoPrecio = parseFloat(entrada_del_input);

        // Limpiar mensajes anteriores
        if (feedback) {
            feedback.innerHTML = '';
            feedback.className = 'mensaje-feedback small mt-1 fw-bold';
        }

        if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
            if (feedback) {
                feedback.textContent = "El precio no puede ser negativo.";
                feedback.classList.add('text-danger');
            }
            return;
        }

        // Estructura fetch
        fetch(`/api/productos/${id}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({ precio_euros: nuevoPrecio })
            })
            .then(res => {
                // Si el servidor responde con error (ej: 400 o 403), lanzamos error manual
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || 'Error desconocido'); });
                }
                return res.json();
            })
            .then(res => {
                console.log("Respuesta:", res);

                //  Actualizar el input con el valor real ---
                input_precio.value = res.precio_euros;

                //  Poner mensaje de éxito ---
                if (feedback) {
                    feedback.textContent = "¡Precio actualizado!";
                    feedback.classList.add('text-success');

                }

                if (texto_precio) {
                    texto_precio.textContent = `${res.precio_euros} €`;
                }
            })
            .catch(err => {
                console.error(err);
                // Poner mensaje de error
                if (feedback) {
                    feedback.textContent = err.message || "Error de conexión";
                    feedback.classList.add('text-danger');
                }
            });
    };

    // 5. Asignar el manejador a cada botón (bucle clásico)
    for (const boton of botones) {
        boton.addEventListener('click', cambiar_precio);
    }
});