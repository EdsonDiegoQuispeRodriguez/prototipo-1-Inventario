# Inventario empresarial — prototipo v4

React + Vite + Ant Design. Conserva el estilo de barra azul y menú lateral de la versión anterior.

## Cambios de esta versión
- Catálogo original y 100 registros adicionales conservados; cada unidad física se muestra en una fila propia, con código de activo único. Los artículos que antes tenían cantidad 6 ahora aparecen como seis filas. Los números de serie DEMO son ficticios.
- **Salidas y despachos** sustituye Descargas y Reservas: el gestor selecciona activos específicos y crea **una solicitud** que los reserva y envía a preparación. El almacenero inicia preparación y despacha la solicitud completa.
- **Transferencias**: una solicitud agrupa varios activos. Al despacharse pasa a `En tránsito`; solo al recibirla en destino se actualiza la ubicación definitiva.
- En la bandeja de almacén, expande cada solicitud para comprobar sus códigos y series antes de confirmar la operación conjunta.
- El resto de módulos se conserva con los mínimos cambios de compatibilidad necesarios para el nuevo modelo.

## Ejecución
`npm install` y `npm run dev`.

## Datos y limitaciones
- Persistencia local en `localStorage` bajo clave `inventario-demo-v4`. Puedes reiniciar desde el botón «Reiniciar demo».
- No hay servidor, autenticación real ni transacciones multiusuario. Es una simulación, no un control de inventario listo para producción.
- Se conservan los nombres/modelos del Excel usados en v3, con distribución y series de demostración. Para consumibles sin serie de fabricante se utiliza el código único de inventario por unidad.
- Las devoluciones siguen siendo una pantalla de demostración y requieren mayor validación de asignación previa antes de pasar a producción.


## Cambios v5
- Ingreso por solicitud de varios activos, creados como PENDIENTE INGRESO hasta recepción física completa.
- RMA desde activos ASIGNADOS, tratamiento Reingreso (USADO / disponible) o DISPOSAL (no disponible).
- Bandeja del almacenero con check por unidad y cierre de solicitud completo.
- Las salidas dejan los activos ASIGNADOS para poder procesar RMA.
- Persistencia local de demostración con clave v5.

Para probar RMA: primero genera y despacha una salida desde un almacén; el activo quedará ASIGNADO y aparecerá en RMA.
