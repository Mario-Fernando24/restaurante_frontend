# Plan de desarrollo Frontend — Caucasia POS

Documento de referencia para organizar tareas, sprints y entregables del frontend Angular 16.

---

## 1. Estado actual

| Área | Estado | Detalle |
|------|--------|---------|
| **Auth & Core** | ✅ ~95% | Login, JWT, guards por rol, interceptor, layout |
| **Shared UI** | ✅ ~85% | Button, Input, Paginator, Sidebar, ConfirmDialog |
| **Categorías** | ✅ ~90% | CRUD conectado al API — **módulo de referencia** |
| **Dashboard admin** | 🟡 ~15% | UI con datos mock, sin API |
| **Dashboard cajero** | 🟡 ~10% | UI con datos mock, sin API |
| **Resto de módulos** | ❌ 0% | Solo aparecen en el sidebar, sin rutas ni servicios |

**Progreso global estimado:** ~18% del backend integrado (~4 de ~25 endpoints consumidos).

---

## 2. Principios de organización

### 2.1 Un módulo = una feature Angular

Cada dominio del backend debe vivir en `src/app/features/` con esta estructura:

```
features/admin/<modulo>/
├── models/<modulo>.model.ts
├── services/<modulo>.service.ts
├── <modulo>-list/
│   ├── <modulo>-list.component.ts
│   ├── <modulo>-list.component.html
│   └── <modulo>-list.component.scss
└── (opcional) <modulo>-form/   ← modal o página aparte
```

### 2.2 Patrón CRUD (copiar de Categorías)

Para cada módulo admin repetir este flujo:

1. **Model** — interfaces TypeScript alineadas con la respuesta del API.
2. **Service** — métodos `listar`, `crear`, `actualizar`, `cambiarEstado` usando `ApiService`.
3. **ListComponent** — tabla + búsqueda + paginador + botón crear.
4. **Formulario** — modal reutilizando `InputComponent` y `ButtonComponent`.
5. **Ruta** — lazy load en `admin.routes.ts`.
6. **Nav** — actualizar `nav.model.ts` y `route-paths.ts`.

> **Referencia:** `features/admin/categorias/`

### 2.3 Fuente única de rutas

Toda ruta nueva debe registrarse en `core/routing/route-paths.ts`:

```typescript
export const ROUTE_SEGMENTS = {
  // ...
  USUARIOS: 'usuarios',
  CLIENTES: 'clientes',
  PRODUCTOS: 'productos',
  // ...
};

export const ROUTES = {
  // ...
  ADMIN_USUARIOS: '/admin/usuarios',
  ADMIN_CLIENTES: '/admin/clientes',
  // ...
};
```

### 2.4 Convención de tareas (issue / ticket)

Cada tarea debe incluir:

| Campo | Ejemplo |
|-------|---------|
| **Módulo** | `admin/clientes` |
| **Tipo** | `feature` / `bug` / `refactor` / `chore` |
| **Endpoint(s)** | `GET /api/clientes`, `POST /api/clientes/crear` |
| **Ruta UI** | `/admin/clientes` |
| **Rol** | Admin / Cajero / Ambos |
| **Criterio de done** | Lista carga datos reales, crear funciona, estado cambia |

---

## 3. Mapa de rutas planificado

```
/auth/login                          ← ✅ Login

/admin                               ← Dashboard admin (KPIs reales — Sprint 4)
/admin/categorias                    ← ✅ CRUD categorías
/admin/usuarios                      ← Sprint 1
/admin/clientes                      ← Sprint 1
/admin/productos                     ← Sprint 2
/admin/insumos                       ← Sprint 2
/admin/recetas                       ← Sprint 2
/admin/inventario/movimientos        ← Sprint 4
/admin/turnos                        ← Sprint 3 (historial arqueos)
/admin/auditoria                     ← Sprint 4

/cajero                              ← Dashboard cajero (Sprint 3)
/cajero/turno                        ← Abrir / cerrar arqueo (Sprint 3)
/cajero/pos                          ← Punto de venta (Sprint 3)
```

---

## 4. Sprints recomendados

### Sprint 0 — Fundación (Semana 1) ✅ casi completo

**Objetivo:** Base sólida reutilizable.

| # | Tarea | Prioridad | Estimación |
|---|-------|-----------|------------|
| 0.1 | Extender `route-paths.ts` con todos los segmentos | Alta | 2h |
| 0.2 | Conectar sidebar a rutas reales (aunque la pantalla esté vacía) | Alta | 3h |
| 0.3 | Eliminar carpeta duplicada `admin-dashboard/admin-dashboard/` | Baja | 30m |
| 0.4 | Extraer patrón CRUD genérico de Categorías (opcional) | Media | 4h |
| 0.5 | Servicio de notificaciones toast para errores/éxito | Media | 3h |

**Entregable:** Navegación coherente; patrón documentado.

---

### Sprint 1 — Datos maestros (Semanas 2–3)

**Objetivo:** Admin puede gestionar usuarios y clientes.

#### Usuarios (`/admin/usuarios`)

| # | Tarea | Endpoint backend |
|---|-------|------------------|
| 1.1 | Model `Usuario`, `Rol` | — |
| 1.2 | Service: listar, crear, actualizar, cambiar estado | `GET/POST usuarios/*` |
| 1.3 | Service: listar roles (selector) | `GET roles` |
| 1.4 | ListComponent con tabla y filtros | — |
| 1.5 | Modal crear/editar usuario | — |
| 1.6 | Ruta + nav + guard admin | — |

#### Clientes (`/admin/clientes`)

| # | Tarea | Endpoint backend |
|---|-------|------------------|
| 1.7 | Model `Cliente`, `TipoDocumento` | — |
| 1.8 | Service CRUD completo | `GET/POST clientes/*` |
| 1.9 | ListComponent + formulario | — |
| 1.10 | Selector tipo documento | `GET tipos-documento` (si existe) o hardcode inicial |

**Entregable:** 2 módulos admin funcionales. **Estimación total:** 5–8 días.

---

### Sprint 2 — Inventario catálogo (Semanas 4–5)

**Objetivo:** Catálogo de insumos, productos y recetas listo para el POS.

#### Insumos (`/admin/insumos`)

| # | Tarea | Endpoint |
|---|-------|----------|
| 2.1 | Model + Service | `GET/POST insumos/*` |
| 2.2 | List + form (unidad medida, stock, costo) | — |

#### Productos (`/admin/productos`)

| # | Tarea | Endpoint |
|---|-------|----------|
| 2.3 | Model + Service | `GET/POST productos/*` |
| 2.4 | List + form con selector categoría | — |
| 2.5 | Upload imagen producto | `POST productos/crear` (multipart) |
| 2.6 | Badge tipo: PREPARADO / VENTA_DIRECTA | — |

#### Recetas (`/admin/recetas`)

| # | Tarea | Endpoint |
|---|-------|----------|
| 2.7 | Model + Service | `GET/POST recetas-producto/*` |
| 2.8 | Form: selector producto + insumo + cantidad | — |
| 2.9 | Validación UK (producto + insumo) en UI | — |

**Entregable:** Catálogo completo. **Estimación:** 8–10 días.

**Dependencias:** Sprint 1 no es bloqueante, pero Categorías ya debe estar ✅.

---

### Sprint 3 — Caja & POS ★ (Semanas 6–8)

**Objetivo:** Flujo operativo del cajero — mayor valor de negocio.

> Este sprint desbloquea el uso real del sistema en el restaurante.

#### Turnos de caja (`/cajero/turno`)

| # | Tarea | Endpoint |
|---|-------|----------|
| 3.1 | Service arqueos | `POST arqueos/abrir`, `GET arqueos/activo`, `POST arqueos/{id}/cerrar` |
| 3.2 | Pantalla abrir turno (monto apertura) | — |
| 3.3 | Indicador turno activo en layout cajero | — |
| 3.4 | Pantalla cerrar turno (montos, diferencia) | — |
| 3.5 | Admin: historial turnos (`/admin/turnos`) | `GET arqueos` |

#### Punto de venta (`/cajero/pos`)

| # | Tarea | Endpoint |
|---|-------|----------|
| 3.6 | Grid productos por categoría | `GET productos` |
| 3.7 | Carrito (cantidad, subtotal, total) | — |
| 3.8 | Selector cliente opcional | `GET clientes` |
| 3.9 | Selector método de pago + referencia | `GET metodos-pago` |
| 3.10 | Confirmar venta | `POST ventas/crear` |
| 3.11 | Bloqueo POS si no hay turno abierto | `GET arqueos/activo` |

#### Dashboard cajero (`/cajero`)

| # | Tarea | Detalle |
|---|-------|---------|
| 3.12 | Reemplazar mock por datos reales | Turno activo, ventas del día |
| 3.13 | Accesos rápidos a POS y turno | — |

**Entregable:** POS funcional end-to-end. **Estimación:** 12–15 días.

**Dependencias:** Sprint 2 (productos) es **bloqueante**.

---

### Sprint 4 — Operaciones & reportes (Semanas 9–10)

**Objetivo:** Visibilidad operativa para el administrador.

| # | Tarea | Endpoint |
|---|-------|----------|
| 4.1 | Movimientos inventario (solo lectura) | `GET movimientos-inventario` |
| 4.2 | Filtros por insumo, tipo, fecha | — |
| 4.3 | Auditoría (tabla + filtros) | `GET auditoria` |
| 4.4 | Dashboard admin con KPIs reales | Puede requerir endpoints nuevos en backend |
| 4.5 | Paginación server-side donde aplique | — |

**Entregable:** Panel admin completo. **Estimación:** 6–8 días.

---

### Sprint 5 — Pulido (continuo)

| # | Tarea |
|---|-------|
| 5.1 | Visibilidad de nav por rol (ocultar admin al cajero) |
| 5.2 | Manejo global de errores HTTP (401 → logout) |
| 5.3 | Loading states en todas las listas |
| 5.4 | Responsive POS en tablet |
| 5.5 | Tests E2E: login → categoría → venta |

---

## 5. Matriz de dependencias

```
Sprint 0 (Fundación)
    └── Sprint 1 (Usuarios, Clientes)
            └── Sprint 2 (Insumos, Productos, Recetas)
                    └── Sprint 3 (Turnos, POS) ★ crítico
                            └── Sprint 4 (Movimientos, Auditoría, Dashboard)
```

| Módulo | Depende de |
|--------|------------|
| Productos | Categorías ✅ |
| Recetas | Productos + Insumos |
| POS | Productos + Arqueo activo |
| Ventas | Clientes (opcional), Métodos pago |
| Dashboard | Ventas + Arqueos |

---

## 6. Checklist por módulo (plantilla)

Copiar esto en cada issue de GitHub/Jira:

```markdown
## Módulo: [nombre]

- [ ] Model TypeScript creado
- [ ] Service con todos los endpoints
- [ ] ListComponent con tabla y búsqueda
- [ ] Formulario crear/editar
- [ ] Confirmación antes de cambiar estado
- [ ] Ruta en admin.routes.ts / home.routes.ts
- [ ] Entrada en route-paths.ts
- [ ] Nav sidebar actualizado
- [ ] Guard de rol aplicado
- [ ] Probado contra API local (127.0.0.1:8000)
- [ ] Mensajes de error visibles al usuario
```

---

## 7. Endpoints backend → frontend

| Backend | Frontend service | Sprint |
|---------|------------------|--------|
| `POST auth/login` | AuthService ✅ | — |
| `GET categorias` | CategoriaService ✅ | — |
| `GET roles` | RolService | S1 |
| `GET/POST usuarios/*` | UsuarioService | S1 |
| `GET/POST clientes/*` | ClienteService | S1 |
| `GET/POST insumos/*` | InsumoService | S2 |
| `GET/POST productos/*` | ProductoService | S2 |
| `GET/POST recetas-producto/*` | RecetaService | S2 |
| `POST arqueos/abrir` | ArqueoService | S3 |
| `GET arqueos/activo` | ArqueoService | S3 |
| `GET metodos-pago` | PagoService | S3 |
| `POST ventas/crear` | VentaService | S3 |
| `GET movimientos-inventario` | MovimientoService | S4 |
| `GET auditoria` | AuditoriaService | S4 |

---

## 8. Roles y permisos UI

| Pantalla | Admin (id_rol=1) | Cajero |
|----------|------------------|--------|
| Dashboard admin | ✅ | ❌ |
| Usuarios, Clientes, Categorías | ✅ | ❌ |
| Productos, Insumos, Recetas | ✅ | ❌ (solo lectura en POS) |
| Turnos historial | ✅ | ❌ |
| Auditoría | ✅ | ❌ |
| Dashboard cajero | ❌ | ✅ |
| POS / Ventas | ❌ | ✅ |
| Abrir/cerrar turno | ❌ | ✅ |

---

## 9. Riesgos y decisiones pendientes

| Riesgo | Acción |
|--------|--------|
| No existe `GET ventas` en backend | Agregar endpoint o mostrar ventas vía arqueo/auditoría |
| Paginación client-side en categorías | Migrar a server-side cuando el backend lo soporte |
| CORS en desarrollo | Verificar `config/settings.py` o agregar `proxy.conf.json` |
| Imágenes producto | Formulario multipart; mostrar preview en listado |

---

## 10. Resumen ejecutivo

1. **Ya está hecho:** Auth, layout, shared UI, categorías.
2. **Siguiente paso inmediato:** Sprint 1 (usuarios + clientes) — bajo riesgo, alto aprendizaje del patrón.
3. **Prioridad de negocio:** Sprint 3 (POS) — requiere Sprint 2 antes.
4. **Regla de oro:** Cada módulo nuevo sigue el patrón de `admin/categorias`.
5. **Duración estimada total:** 10–12 semanas con 1 desarrollador frontend.
