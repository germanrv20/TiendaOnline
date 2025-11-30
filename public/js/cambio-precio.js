document.addEventListener('DOMContentLoaded', () => {
    // Buscar todos los botones con la clase .btn-cambiar
    const botones = document.querySelectorAll('.btn-cambiar');

    // Función que maneja el click en "Cambiar Precio"
    const cambiar_precio = async(evt) => {
        evt.preventDefault();

        const boton = evt.currentTarget;
        const id = boton.dataset.id; // id del producto

        // Buscar el input y el div de feedback para este producto
        const input = document.querySelector(`.precio-input[data-id="${id}"]`);
        const feedback = document.querySelector(`.mensaje-feedback[data-id="${id}"]`);
        const precioDisplay = document.querySelector(`.precio-display[data-id="${id}"]`);

        if (!input || !feedback) {
            console.warn('Input o feedback no encontrado para id:', id);
            return;
        }

        const nuevoPrecio = input.value;

        // Resetear feedback
        feedback.innerHTML = '';
        feedback.className = 'mensaje-feedback small mt-1 fw-bold';

        // VALIDACIÓN: Comprobar que el precio es un número válido y positivo
        const precioNum = parseFloat(nuevoPrecio);

        if (isNaN(precioNum)) {
            feedback.textContent = "Error: Debes ingresar un número válido";
            feedback.classList.add('text-danger');
            return;
        }

        if (precioNum < 0) {
            feedback.textContent = "Error: El precio no puede ser negativo";
            feedback.classList.add('text-danger');
            return;
        }

        if (precioNum === 0) {
            feedback.textContent = "Error: El precio debe ser mayor que cero";
            feedback.classList.add('text-danger');
            return;
        }

        try {
            const response = await fetch(`/api/productos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({ precio_euros: parseFloat(nuevoPrecio) })
            });

            if (response.ok) {
                const data = await response.json();
                feedback.textContent = '¡Precio actualizado!';
                feedback.classList.add('text-success');

                // Actualizar el input con el valor devuelto por la BD
                if (data.precio_euros !== undefined) {
                    input.value = data.precio_euros;
                }

                // Actualizar el precio visible en la tarjeta
                if (precioDisplay) {
                    precioDisplay.textContent = `${data.precio_euros} €`;
                }
            } else {
                // Error controlado desde el servidor
                let errMsg = 'Error al actualizar';
                try {
                    const errData = await response.json();
                    errMsg = errData.error || errMsg;
                } catch (e) {
                    // ignore
                }
                feedback.textContent = errMsg;
                feedback.classList.add('text-danger');
            }
        } catch (err) {
            console.error(err);
            feedback.textContent = err.message || 'Error de conexión';
            feedback.classList.add('text-danger');
        }
    };

    // Asignar manejador a cada botón
    botones.forEach(boton => {
        boton.addEventListener('click', cambiar_precio);
    });
});