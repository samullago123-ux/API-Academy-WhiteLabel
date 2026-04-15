export const fakeDB = {
  usuarios: [
    { id: 1, nombre: "Daniel", email: "daniel@whitelabel.lat", rol: "admin" },
    { id: 2, nombre: "Andrés", email: "andres@whitelabel.lat", rol: "dev" },
    { id: 3, nombre: "María", email: "maria@ejemplo.com", rol: "user" },
  ],
  productos: [
    { id: 1, nombre: "Plan Starter", precio: 99, moneda: "USD" },
    { id: 2, nombre: "Plan Pro", precio: 299, moneda: "USD" },
    { id: 3, nombre: "Plan Enterprise", precio: 799, moneda: "USD" },
  ],
};

export function simulateAPI(method, endpoint, body = null, headers = {}) {
  const delay = 300 + Math.random() * 700;
  return new Promise((resolve) => {
    setTimeout(() => {
      const parts = endpoint.split("/").filter(Boolean);
      const resource = parts[0];
      const id = parts[1] ? parseInt(parts[1]) : null;

      if (!headers["Authorization"] && !headers["X-API-Key"]) {
        resolve({ status: 401, statusText: "Unauthorized", body: { error: "No se proporcionó autenticación", message: "Incluí un header Authorization o X-API-Key" }, time: delay });
        return;
      }
      if (!fakeDB[resource]) {
        resolve({ status: 404, statusText: "Not Found", body: { error: "Recurso no encontrado", available: Object.keys(fakeDB) }, time: delay });
        return;
      }

      switch (method) {
        case "GET":
          if (id) {
            const item = fakeDB[resource].find((i) => i.id === id);
            if (!item) resolve({ status: 404, statusText: "Not Found", body: { error: `${resource} con id ${id} no existe` }, time: delay });
            else resolve({ status: 200, statusText: "OK", body: item, time: delay });
          } else {
            resolve({ status: 200, statusText: "OK", body: fakeDB[resource], time: delay });
          }
          break;
        case "POST":
          if (!body || !body.nombre) {
            resolve({ status: 400, statusText: "Bad Request", body: { error: "El campo 'nombre' es requerido" }, time: delay });
          } else {
            const newItem = { id: fakeDB[resource].length + 1, ...body };
            fakeDB[resource].push(newItem);
            resolve({ status: 201, statusText: "Created", body: newItem, time: delay });
          }
          break;
        case "PUT":
          if (!id) {
            resolve({ status: 400, statusText: "Bad Request", body: { error: "Se requiere un ID para actualizar" }, time: delay });
          } else {
            const idx = fakeDB[resource].findIndex((i) => i.id === id);
            if (idx === -1) resolve({ status: 404, statusText: "Not Found", body: { error: `No existe ${resource} con id ${id}` }, time: delay });
            else { fakeDB[resource][idx] = { id, ...body }; resolve({ status: 200, statusText: "OK", body: fakeDB[resource][idx], time: delay }); }
          }
          break;
        case "PATCH":
          if (!id) {
            resolve({ status: 400, statusText: "Bad Request", body: { error: "Se requiere un ID para modificar" }, time: delay });
          } else {
            const idx = fakeDB[resource].findIndex((i) => i.id === id);
            if (idx === -1) resolve({ status: 404, statusText: "Not Found", body: { error: `No existe ${resource} con id ${id}` }, time: delay });
            else { fakeDB[resource][idx] = { ...fakeDB[resource][idx], ...body }; resolve({ status: 200, statusText: "OK", body: fakeDB[resource][idx], time: delay }); }
          }
          break;
        case "DELETE":
          if (!id) {
            resolve({ status: 400, statusText: "Bad Request", body: { error: "Se requiere un ID para eliminar" }, time: delay });
          } else {
            const dIdx = fakeDB[resource].findIndex((i) => i.id === id);
            if (dIdx === -1) resolve({ status: 404, statusText: "Not Found", body: { error: "No existe" }, time: delay });
            else { const deleted = fakeDB[resource].splice(dIdx, 1)[0]; resolve({ status: 200, statusText: "OK", body: { message: "Eliminado exitosamente", deleted }, time: delay }); }
          }
          break;
        default:
          resolve({ status: 405, statusText: "Method Not Allowed", body: { error: "Método no soportado" }, time: delay });
      }
    }, delay);
  });
}
