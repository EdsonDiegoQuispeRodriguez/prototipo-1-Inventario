# Prototipo de Inventario Empresarial v2.0

React + Vite + Ant Design. Interfaz inspirada en la plantilla original «Control de Solicitudes FSO y Activos»: barra superior azul oscuro, menú lateral blanco, selección celeste, paneles blancos y tarjetas KPI con bordes de colores.

## Ejecutar

```bash
npm install
npm run dev
```

En PowerShell con scripts bloqueados: `npm.cmd install` y `npm.cmd run dev`.

## Alcance

- 4 roles simulados: Supervisor, Gestor, Almacenero y Usuario.
- 4 almacenes: Lima, Moquegua, T7 y Truckshop.
- Pantallas completas: dashboard, inventario y ficha con campos del Excel, ingreso, descarga, reserva/liberación, transferencia, operaciones físicas, devolución e historial.
- Datos DEMO basados en categorías y nombres de columnas del Excel original, **no es una migración completa ni contiene datos personales reales**.
- Reservas y solicitudes comprometen disponibilidad; entregas reducen stock físico; traslados tienen fase en tránsito y recepción.
- Estado de la demo persistido en localStorage del navegador; «Reiniciar demo» restaura datos ficticios.

## Limitaciones conocidas

Prototipo sin autenticación, SharePoint ni transacciones multiusuario. Las validaciones de roles son de interfaz y no son seguridad real. El stock de activos serializados debe normalizarse por unidad en producción; el prototipo muestra una simulación simplificada. Las devoluciones no están vinculadas todavía a una entrega concreta y requieren validación antes de producción. El historial no es inmutable y localStorage no es una fuente empresarial de verdad. La operación de reserva física del almacenero y la gestión de incidencias se desarrollarán en la siguiente iteración.

## Estructura

- `src/App.jsx`: layout, menú y permisos visuales.
- `src/context/InventoryContext.jsx`: estado y lógica compartida.
- `src/data/seed.js`: datos ficticios y diccionario de campos basado en Excel.
- `src/pages/*`: pantallas independientes.
- `src/styles/main.css`: diseño visual.

## Cambios v3
- El selector global de almacén se eliminó de la barra superior; Descargas, Reservas y Transferencias tienen su propio selector obligatorio.
- Estas operaciones disponen de listado y pantalla de creación con búsqueda, filtros de categoría/subcategoría y carrito multítem.
- Las operaciones agrupadas generan líneas vinculadas por `batchId` para que la bandeja existente del almacenero pueda prepararlas.
- Se añadieron 100 registros de demostración basados en **categorías, marcas y modelos** de la hoja `VISTA IM-STOCK ACTUAL NUEVO` del Excel original. **Series, cantidades y distribución por almacén son ficticias**, no equivalen a existencias verificadas.
- La selección por subcategoría LAPTOP se realiza mediante filtros de tabla, no mediante un desplegable con miles de artículos.
- Se conservan las demás pantallas. El almacén global anterior permanece internamente para compatibilidad con las pantallas no modificadas; su selector se retiró de la cabecera.
