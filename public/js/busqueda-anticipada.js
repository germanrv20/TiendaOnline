document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const input = document.getElementById('input-busqueda');
    const contador = document.getElementById('contador-resultados');
    const spinner = document.getElementById('spinner');


    const tarjetas = document.getElementById('resultados-grid');
    const template = document.getElementById('plantilla-producto');


    let timeoutId;

    // Evento al escribir
    input.addEventListener('input', (e) => {
        const texto = e.target.value.trim();
        clearTimeout(timeoutId);

        if (texto.length < 3) {
            tarjetas.innerHTML = ''; // Limpiar resultados
            contador.textContent = '';
            spinner.classList.add('hidden');
            return;
        }

        spinner.classList.remove('hidden');

        // Debounce (esperar a que deje de escribir)
        timeoutId = setTimeout(() => {
            buscarProductos(texto);
        }, 300);
    });

    const buscarProductos = (query) => {
        fetch(`/api/busqueda-anticipada/${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(productos => {
                spinner.classList.add('hidden');
                contador.textContent = `Encontrados ${productos.length} productos`;

                // Limpiar tarjetas anteriores
                tarjetas.innerHTML = '';

                if (productos.length === 0) {
                    tarjetas.innerHTML = `<p class="col-span-full text-center text-gray-400 mt-10">No se encontraron productos.</p>`;
                    return;
                }

                // Recorrer y mostrar cada producto usando la función
                productos.forEach(p => {
                    muestraProducto(p);
                });
            })
            .catch(err => {
                console.error(err);
                spinner.classList.add('hidden');
                contador.textContent = "Error al buscar";
            });
    };

    function muestraProducto(p) {
        // 1. Clonar la plantilla
        const clonado = template.content.cloneNode(true);

        // 2. Rellenar la información (Sustituir datos)
        const img = clonado.querySelector('.card-img');
        img.src = p.url_img;
        img.alt = p.texto_1;

        clonado.querySelector('.card-title').textContent = p.texto_1;
        clonado.querySelector('.card-subtitle').textContent = p.categoría;

        // Lógica de precio (rebajado o normal)
        const precio = p.precio_rebajado > 0 ? p.precio_rebajado : p.precio_euros;
        clonado.querySelector('.card-price').textContent = `${precio} €`;

        // 3. Añadir al DOM ('tarjetas')
        tarjetas.appendChild(clonado);
    }
});