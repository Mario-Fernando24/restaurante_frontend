#!/usr/bin/env python3
"""Genera PDF con cronograma y prompts para desarrollo frontend Angular."""

from datetime import date, timedelta
from pathlib import Path

from fpdf import FPDF

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT = BASE_DIR / 'docs' / 'cronograma_prompts_frontend_angular.pdf'
FONT_DIR = Path(__file__).resolve().parent / 'fonts'

# Inicio sugerido del cronograma (ajustable)
INICIO = date(2026, 6, 30)


class CaucasiaPDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font('DejaVu', 'I', 8)
            self.set_text_color(100, 116, 139)
            self.cell(0, 8, 'Caucasia POS — Cronograma & Prompts Frontend Angular 16', align='L')
            self.cell(0, 8, f'Pagina {self.page_no()}', align='R', new_x='LMARGIN', new_y='NEXT')

    def footer(self):
        self.set_y(-12)
        self.set_font('DejaVu', 'I', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 8, 'Generado para restaurante_frontend — Caucasia', align='C')

    def section_title(self, title, color=(15, 23, 42)):
        self.set_x(10)
        self.ln(4)
        self.set_font('DejaVu', 'B', 14)
        self.set_text_color(*color)
        self.multi_cell(0, 8, title)
        self.set_draw_color(226, 232, 240)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def sub_title(self, title):
        self.ln(2)
        self.set_font('DejaVu', 'B', 11)
        self.set_text_color(51, 65, 85)
        self.multi_cell(0, 6, title)
        self.ln(1)

    def body_text(self, text):
        self.set_x(10)
        self.set_font('DejaVu', '', 9)
        self.set_text_color(51, 65, 85)
        self.multi_cell(0, 5, text)
        self.ln(1)

    def bullet(self, text):
        self.set_x(10)
        self.set_font('DejaVu', '', 9)
        self.set_text_color(51, 65, 85)
        self.multi_cell(0, 5, f'- {text}')

    def prompt_box(self, title, prompt):
        self.set_x(10)
        self.ln(2)
        self.set_fill_color(241, 245, 249)
        self.set_draw_color(203, 213, 225)
        y0 = self.get_y()
        self.set_font('DejaVu', 'B', 9)
        self.set_text_color(30, 41, 59)
        self.cell(0, 6, title, new_x='LMARGIN', new_y='NEXT')
        self.ln(1)
        self.set_font('DejaVu', '', 8)
        self.set_text_color(30, 41, 59)
        x, w = 12, 186
        self.set_x(x)
        self.multi_cell(w, 4.5, prompt, fill=True, border=1)
        self.ln(2)

    def table_row(self, cols, widths, header=False, fills=None):
        if header:
            self.set_font('DejaVu', 'B', 8)
            self.set_fill_color(30, 41, 59)
            self.set_text_color(248, 250, 252)
        else:
            self.set_font('DejaVu', '', 8)
            self.set_text_color(51, 65, 85)
        h = 7
        for i, (col, w) in enumerate(zip(cols, widths)):
            fill = header
            if not header and fills and i < len(fills):
                self.set_fill_color(*fills[i])
                fill = True
            self.cell(w, h, col, border=1, align='C', fill=fill)
        self.ln(h)


def fmt(d):
    return d.strftime('%d/%m/%Y')


def rango(inicio, dias):
    fin = inicio + timedelta(days=dias - 1)
    return fmt(inicio), fmt(fin)


def setup_fonts(pdf):
    candidates = [
        (FONT_DIR / 'DejaVuSans.ttf', FONT_DIR / 'DejaVuSans-Bold.ttf', FONT_DIR / 'DejaVuSans-Oblique.ttf'),
        (
            Path('/System/Library/Fonts/Supplemental/Arial.ttf'),
            Path('/System/Library/Fonts/Supplemental/Arial Bold.ttf'),
            Path('/System/Library/Fonts/Supplemental/Arial Italic.ttf'),
        ),
        (
            Path('/System/Library/Fonts/Supplemental/Arial Unicode.ttf'),
            Path('/System/Library/Fonts/Supplemental/Arial Bold.ttf'),
            Path('/System/Library/Fonts/Supplemental/Arial Italic.ttf'),
        ),
    ]
    regular = bold = italic = None
    for reg, bld, ita in candidates:
        if reg.exists() and bld.exists() and ita.exists():
            regular, bold, italic = reg, bld, ita
            break
    if not regular:
        raise FileNotFoundError('No se encontraron fuentes TTF para el PDF')
    pdf.add_font('DejaVu', '', str(regular))
    pdf.add_font('DejaVu', 'B', str(bold))
    pdf.add_font('DejaVu', 'I', str(italic))


def generar():
    pdf = CaucasiaPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    setup_fonts(pdf)

    # --- Portada ---
    pdf.add_page()
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 0, 210, 297, 'F')
    pdf.ln(50)
    pdf.set_font('DejaVu', 'B', 28)
    pdf.set_text_color(248, 250, 252)
    pdf.cell(0, 14, 'Caucasia POS', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.set_font('DejaVu', '', 16)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 10, 'Cronograma de desarrollo Frontend', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 10, 'Angular 16 + Prompts para Cursor / IA', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(20)
    pdf.set_font('DejaVu', '', 11)
    pdf.set_text_color(203, 213, 225)
    pdf.cell(0, 8, f'Inicio sugerido: {fmt(INICIO)}', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 8, 'Duracion estimada: 10-12 semanas (1 desarrollador)', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 8, 'Referencia CRUD: features/admin/categorias/', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(30)
    pdf.set_font('DejaVu', 'I', 10)
    pdf.cell(0, 8, 'Proyecto: restaurante_frontend  |  API: http://127.0.0.1:8000/api', align='C')

    # --- Cronograma ---
    pdf.add_page()
    pdf.section_title('1. Cronograma de desarrollo')

    sprints = [
        ('Sprint 0', 'Fundacion', 7, 'Core, Auth, Shared UI, Categorias, rutas base'),
        ('Sprint 1', 'Datos maestros', 14, 'Usuarios + Clientes (CRUD admin)'),
        ('Sprint 2', 'Inventario catalogo', 14, 'Insumos + Productos + Recetas'),
        ('Sprint 3', 'Caja & POS', 21, 'Turnos, Punto de venta, Dashboard cajero'),
        ('Sprint 4', 'Ops & reportes', 14, 'Movimientos, Auditoria, Dashboard admin'),
        ('Sprint 5', 'Pulido', 14, 'UX, errores, responsive, tests E2E'),
    ]

    widths = [22, 38, 28, 28, 74]
    pdf.table_row(['Sprint', 'Nombre', 'Inicio', 'Fin', 'Entregables'], widths, header=True)

    cursor = INICIO
    colors = [
        (220, 252, 231), (224, 231, 255), (237, 233, 254),
        (252, 231, 243), (224, 242, 254), (243, 244, 246),
    ]
    for i, (sp, name, days, ent) in enumerate(sprints):
        ini, fin = rango(cursor, days)
        pdf.table_row([sp, name, ini, fin, ent], widths, fills=[colors[i]] * 5)
        cursor += timedelta(days=days)

    pdf.ln(4)
    pdf.body_text(
        'Nota: Sprint 0 esta casi completo (~90%). El camino critico es Sprint 2 -> Sprint 3 (POS). '
        'Ajusta las fechas segun tu disponibilidad real.'
    )

    # --- Dependencias ---
    pdf.section_title('2. Dependencias entre modulos')
    pdf.set_x(10)
    deps = [
        'Categorias (listo) -> Productos -> Recetas -> POS',
        'Insumos -> Recetas + Movimientos inventario',
        'Productos + Arqueo activo -> Punto de venta',
        'Clientes (opcional) -> Ventas',
        'Ventas + Arqueos -> Dashboard admin/cajero',
    ]
    for d in deps:
        pdf.bullet(d)

    # --- Rutas ---
    pdf.section_title('3. Mapa de rutas Angular')
    pdf.set_x(10)
    rutas = [
        ('/auth/login', 'Login', 'Listo'),
        ('/admin/categorias', 'CRUD categorias', 'Listo'),
        ('/admin/usuarios', 'CRUD usuarios', 'Sprint 1'),
        ('/admin/clientes', 'CRUD clientes', 'Sprint 1'),
        ('/admin/insumos', 'CRUD insumos', 'Sprint 2'),
        ('/admin/productos', 'CRUD productos + imagen', 'Sprint 2'),
        ('/admin/recetas', 'Recetas producto-insumo', 'Sprint 2'),
        ('/admin/turnos', 'Historial arqueos', 'Sprint 3'),
        ('/cajero/turno', 'Abrir/cerrar turno', 'Sprint 3'),
        ('/cajero/pos', 'Punto de venta', 'Sprint 3'),
        ('/admin/inventario/movimientos', 'Historial stock', 'Sprint 4'),
        ('/admin/auditoria', 'Trazabilidad', 'Sprint 4'),
    ]
    rw = [55, 70, 35]
    pdf.table_row(['Ruta', 'Descripcion', 'Sprint'], rw, header=True)
    for r, desc, sp in rutas:
        pdf.table_row([r, desc, sp], rw)

    # --- Endpoints ---
    pdf.add_page()
    pdf.section_title('4. Endpoints backend por sprint')
    pdf.set_x(10)
    endpoints = [
        ('S0', 'POST /api/auth/login', 'AuthService', 'Listo'),
        ('S0', 'GET /api/categorias', 'CategoriaService', 'Listo'),
        ('S1', 'GET /api/roles', 'RolService', 'Pendiente'),
        ('S1', 'GET/POST /api/usuarios/*', 'UsuarioService', 'Pendiente'),
        ('S1', 'GET/POST /api/clientes/*', 'ClienteService', 'Pendiente'),
        ('S2', 'GET/POST /api/insumos/*', 'InsumoService', 'Pendiente'),
        ('S2', 'GET/POST /api/productos/*', 'ProductoService', 'Pendiente'),
        ('S2', 'GET/POST /api/recetas-producto/*', 'RecetaService', 'Pendiente'),
        ('S3', 'POST /api/arqueos/abrir', 'ArqueoService', 'Pendiente'),
        ('S3', 'GET /api/arqueos/activo', 'ArqueoService', 'Pendiente'),
        ('S3', 'GET /api/metodos-pago', 'PagoService', 'Pendiente'),
        ('S3', 'POST /api/ventas/crear', 'VentaService', 'Pendiente'),
        ('S4', 'GET /api/movimientos-inventario', 'MovimientoService', 'Pendiente'),
        ('S4', 'GET /api/auditoria', 'AuditoriaService', 'Pendiente'),
    ]
    ew = [12, 62, 38, 28]
    pdf.table_row(['Sp', 'Endpoint', 'Service', 'Estado'], ew, header=True)
    for row in endpoints:
        pdf.table_row(list(row), ew)

    # --- Prompts ---
    pdf.add_page()
    pdf.section_title('5. Prompts listos para Cursor / IA')
    pdf.body_text(
        'Copia y pega cada prompt en Cursor (modo Agent). Ajusta detalles si el backend cambia. '
        'Siempre indica que siga el patron de features/admin/categorias/.'
    )

    prompts = [
        (
            'PROMPT S0 — Extender rutas y navegacion',
            """En el proyecto Angular restaurante_frontend, extiende core/routing/route-paths.ts con segmentos y rutas para: usuarios, clientes, productos, insumos, recetas, turnos, auditoria, pos y turno cajero. Actualiza shared/models/nav.model.ts para que cada item del sidebar ADMIN_NAV y CAJERO_NAV apunte a su ruta real. Agrega rutas placeholder en admin.routes.ts y home.routes.ts con componentes vacios minimo "En construccion". No rompas categorias ni auth. Sigue convenciones existentes.""",
        ),
        (
            'PROMPT S0 — Servicio de notificaciones toast',
            """Crea un NotificationService en restaurante_frontend/src/app/core/services/ con metodos success, error e info. Integralo en CategoriaListComponent para mostrar mensajes al crear o cambiar estado. Usa un componente toast simple en shared/ o alertas nativas si prefieres minimo scope. Estilo coherente con el layout existente.""",
        ),
        (
            'PROMPT S1 — Modulo Usuarios completo',
            """Implementa el modulo admin/usuarios en Angular 16 siguiendo exactamente el patron de features/admin/categorias/. Endpoints: GET /api/usuarios, GET /api/roles, POST /api/usuarios/crear, POST /api/usuarios/{id}/actualizar, POST /api/usuarios/{id}/cambiar_estado. Crea model, service, list component con tabla busqueda paginador, modal crear/editar con selector de rol, confirmacion cambiar estado. Registra ruta /admin/usuarios, route-paths.ts y nav. Guard admin. Usa ApiService, ButtonComponent, InputComponent, ConfirmDialogService.""",
        ),
        (
            'PROMPT S1 — Modulo Clientes completo',
            """Implementa admin/clientes en restaurante_frontend siguiendo el patron de categorias. Endpoints: GET /api/clientes, POST /api/clientes/crear, POST /api/clientes/{id}/actualizar, POST /api/clientes/{id}/estado (o equivalente). Campos: tipo_usuario, tipo_documento (FK codigo), numero_documento, nombre, apellido, correo, telefono, direccion, ciudad, departamento, pais, estado. Formulario con selector tipo documento. Ruta /admin/clientes. Manejo de errores HTTP como en CategoriaService.""",
        ),
        (
            'PROMPT S2 — Modulo Insumos',
            """Crea features/admin/insumos en Angular 16. Endpoints GET /api/insumos y POST /api/insumos/crear. Model con: id_insumo, nombre, unidad_medida (GRAMO|UNIDAD|MILILITRO|LITRO), stock_actual, stock_minimo, costo_unitario, estado. List + form modal. Badge de stock bajo si stock_actual <= stock_minimo. Patron categorias. Ruta /admin/insumos.""",
        ),
        (
            'PROMPT S2 — Modulo Productos con imagen',
            """Implementa admin/productos. Endpoints: GET /api/productos, POST /api/productos/crear, POST /api/productos/{id}/actualizar. Campos: id_categoria (selector desde CategoriaService), nombre, descripcion, precio_venta, tipo_producto (PREPARADO|VENTA_DIRECTA), imagen (file upload multipart), estado. Muestra thumbnail en tabla si hay imagen. Ruta /admin/productos. Reutiliza estilos de categorias.""",
        ),
        (
            'PROMPT S2 — Modulo Recetas',
            """Implementa admin/recetas. Endpoints GET /api/recetas-producto y POST /api/recetas-producto/crear. Formulario: selector producto (solo PREPARADO), selector insumo, cantidad_usada decimal. Validar duplicado producto+insumo en UI. Tabla muestra nombre producto e insumo. Ruta /admin/recetas.""",
        ),
        (
            'PROMPT S3 — Turnos de caja (cajero + admin)',
            """Implementa flujo de arqueos. Service ArqueoService: POST /api/arqueos/abrir, GET /api/arqueos/activo, POST /api/arqueos/{id}/cerrar, GET /api/arqueos. Pantalla /cajero/turno: si no hay turno, form abrir con monto_apertura; si hay turno activo, mostrar resumen y boton cerrar con montos cierre. Admin /admin/turnos: tabla historico. Indicador turno activo en layout cajero. Bloquear POS sin turno.""",
        ),
        (
            'PROMPT S3 — Punto de venta (POS)',
            """Crea /cajero/pos en Angular 16. Requiere turno abierto (GET /api/arqueos/activo). Grid productos activos agrupados por categoria (GET /api/productos). Carrito lateral: cantidad, precio_unitario, subtotal, total. Cliente opcional (GET /api/clientes). Metodos pago desde GET /api/metodos-pago. Campo referencia si aplica. Confirmar con POST /api/ventas/crear enviando id_arqueo, id_cliente opcional, detalles y pagos. UX rapida para tablet. Estilo POS moderno.""",
        ),
        (
            'PROMPT S3 — Dashboard cajero con datos reales',
            """Reemplaza datos mock en HomeDashboardComponent. Muestra: turno activo (ArqueoService), accesos a /cajero/pos y /cajero/turno, resumen ventas del turno si el backend lo permite o placeholder con mensaje. Elimina constantes mock. Loading y error states.""",
        ),
        (
            'PROMPT S4 — Movimientos de inventario',
            """Crea /admin/inventario/movimientos. Solo lectura. GET /api/movimientos-inventario. Tabla: insumo, tipo_movimiento, cantidad, motivo, usuario, fecha. Filtros por tipo y busqueda. Paginacion client-side inicial. Ruta y nav admin.""",
        ),
        (
            'PROMPT S4 — Auditoria',
            """Implementa /admin/auditoria. GET /api/auditoria. Tabla: fecha, usuario, modulo, accion, tabla_afectada, id_registro. Filtro por modulo y rango fechas si aplica. Solo lectura. Estilo tabla admin existente.""",
        ),
        (
            'PROMPT S4 — Dashboard admin KPIs',
            """Actualiza AdminDashboardComponent reemplazando KPIs mock. Muestra tarjetas: categorias activas, productos activos, turno abierto si existe, ultimos movimientos o auditoria. Usa servicios existentes. Si falta endpoint agregado, muestra dato parcial con TODO comentado.""",
        ),
        (
            'PROMPT S5 — Pulido y permisos nav',
            """Filtra ADMIN_NAV y CAJERO_NAV segun rol del usuario logueado. Admin ve todo admin; cajero solo rutas cajero. Interceptor: en 401 limpiar token y redirigir login. Loading spinner en listas. Revisa responsive del POS en 768px.""",
        ),
        (
            'PROMPT GENERICO — Nuevo modulo CRUD',
            """Crea el modulo admin/{MODULO} en restaurante_frontend Angular 16 copiando el patron exacto de features/admin/categorias/: models, service con ApiService, list component, modal form, ruta lazy en admin.routes.ts, entrada en route-paths.ts y nav.model.ts. Endpoints: {LISTAR}, {CREAR}, {ACTUALIZAR}. Manejo errores como CategoriaService.parseError. Guard admin. SCSS coherente con categorias.""",
        ),
    ]

    for title, prompt in prompts:
        if pdf.get_y() > 240:
            pdf.add_page()
        pdf.prompt_box(title, prompt)

    # --- Checklist ---
    pdf.add_page()
    pdf.section_title('6. Checklist por modulo')
    pdf.set_x(10)
    checklist = [
        'Model TypeScript alineado al API',
        'Service con listar, crear, actualizar, cambiarEstado',
        'ListComponent: tabla, busqueda, paginador',
        'Modal o formulario crear/editar',
        'ConfirmDialog antes de cambiar estado',
        'Ruta en admin.routes.ts o home.routes.ts',
        'Entrada en route-paths.ts',
        'Nav sidebar actualizado',
        'Guard de rol aplicado',
        'Probado contra http://127.0.0.1:8000/api',
        'Mensajes de error visibles (toast o alert)',
    ]
    for item in checklist:
        pdf.bullet(f'[ ] {item}')

    pdf.section_title('7. Estructura de carpetas por modulo')
    pdf.set_font('DejaVu', '', 8)
    pdf.set_text_color(30, 41, 59)
    estructura = """features/admin/{modulo}/
  models/{modulo}.model.ts
  services/{modulo}.service.ts
  {modulo}-list/
    {modulo}-list.component.ts
    {modulo}-list.component.html
    {modulo}-list.component.scss

core/routing/route-paths.ts    <- ROUTE_SEGMENTS + ROUTES
shared/models/nav.model.ts     <- ADMIN_NAV / CAJERO_NAV
features/admin/admin.routes.ts <- lazy load"""
    pdf.multi_cell(0, 4.5, estructura, fill=True, border=1)

    pdf.section_title('8. Roles UI')
    pdf.set_x(10)
    roles = [
        'Admin (id_rol=1): /admin/* completo',
        'Cajero: /cajero, /cajero/turno, /cajero/pos unicamente',
        'POS bloqueado sin arqueo ABIERTO',
        'Referencia guards: core/auth/guards/',
    ]
    for r in roles:
        pdf.bullet(r)

    OUTPUT.parent.mkdir(exist_ok=True)
    pdf.output(str(OUTPUT))
    print(f'PDF generado: {OUTPUT}')


if __name__ == '__main__':
    generar()
