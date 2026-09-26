# Medizen — Suite Clínica Inteligente 🏥✨

<div align="center">

![Medizen Logo](public/favicon.svg)

**Plataforma de alta resolución para la gestión médica integral, administración clínica y flujo de trabajo sin fricción.**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Bun](https://img.shields.io/badge/Bun-Package%20Manager-FBF0DF?style=flat-square&logo=bun&logoColor=black)](https://bun.sh/)

</div>

---

## 🌟 Acerca de Medizen

**Medizen** (*Medicina + Zen Flow*) nace para transformar la gestión clínica tradicional eliminando el caos de papeles, la lentitud y los sistemas rígidos. Diseñada con una estética moderna, minimalista y ultra fluida, permite a médicos, administradores y personal de recepción coordinar citas, expedientes, facturación e inventario con la máxima velocidad y seguridad.

---

## 🚀 Módulos y Características Principales

### 🔒 Acceso Rápido con PIN de 4 Dígitos & Bóveda Local
* **Bóveda Cifrada en el Dispositivo**: Una vez que un usuario inicia sesión con sus credenciales, el dispositivo queda vinculado de forma segura.
* **Cifrado Robusto**: Utiliza la Web Cryptography API (`PBKDF2` + `AES-GCM` de 256 bits) con un **cifrador criptográfico puro de respaldo** compatible universalmente con navegadores móviles en conexiones locales HTTP y HTTPS.
* **Entrada Rápida OTP**: Desbloqueo inmediato en 1 segundo con teclado visual de 4 dígitos, selector de cuentas múltiples y animaciones hápticas de error.

### 📱 Experiencia Mobile-First 100% Responsiva
* **Barra Superior Flotante (`md:hidden`)**: Con acceso al menú lateral, isotipo de Medizen, nombre de la clínica en tiempo real y selector de temas.
* **Menú Lateral Deslizable (Mobile Drawer)**: Panel táctil con efecto *backdrop-blur* y cierre automático al navegar.
* **Barra de Navegación Inferior (Bottom Nav)**: Acceso directo con el pulgar a las áreas más utilizadas: *Dashboard, Agenda, Pacientes, Servicios y Facturación*.
* **Tarjetas y Formularios Adaptables**: Espaciados y tamaños de toque optimizados para pantallas táctiles de cualquier tamaño.

### 📅 Agenda Inteligente & Citas en Tiempo Real
* **Calendario Interactivo**: Visualización por día, semana y mes con resolución visual en cascada para turnos solapados.
* **Sincronización WebSocket**: Los cambios de estado (Pendiente, En Consulta, Completada, Cancelada) se reflejan instantáneamente en todos los dispositivos conectados mediante Supabase Realtime.
* **Filtros por Especialidad y Doctor**: Búsqueda rápida de citas por paciente o médico tratante.

### 🩺 Pacientes y Expedientes Clínicos
* **Ficha Médica Digital Unificada**: Información demográfica, antecedentes patológicos, familiares, alergias y tipo de sangre.
* **Historial de Consultas**: Evoluciones médicas cronológicas, motivos de consulta, exámenes físicos y diagnósticos.
* **Especialidades Médicas Multiversales**: Soporte adaptativo para Ginecología, Obstetricia, Medicina General, Pediatría y múltiples ramas médicas.

### 💊 Servicios y Procedimientos Médicos
* **Catálogo Centralizado**: Registro de consultas, ecografías, procedimientos quirúrgicos y análisis clínicos.
* **Honorarios y Duración Estimada**: Configuración de costos base y tiempos estándar por servicio.

### 💳 Finanzas, Facturación & Caja Chica
* **Cuentas Financieras**: Gestión de cuentas bancarias, bóvedas en efectivo y caja chica en tiempo real.
* **Métodos de Pago Multimoneda**: Registro y conciliación de cobros en Dólares (USD), Bolívares (VES), Zelle, Pago Móvil, Tarjetas y Transferencias.
* **Módulo de Compras y Egresos**: Registro de adquisiciones a proveedores y gastos operativos de la clínica.
* **Facturación Profesional**: Emisión de facturas electrónicas con cálculo de subtotales, coberturas de seguro y descarga de recibos individuales en PDF.

### 📦 Inventario y Stock de Suministros
* **Control de Existencias**: Almacén central de insumos médicos, fármacos y material descartable.
* **Alertas de Reposición**: Umbrales de stock mínimo para evitar desabastecimiento en procedimientos críticos.

### 📄 Generador de Récipes y Documentos Clínicos
* **Diseñador Visual de Récipes**: Personalización de logotipos, colores institucionales, membretes, tipografías y pies de página.
* **Exportación en Alta Definición (PDF)**: Descarga directa de recetas médicas, justificativos de asistencia y reposos médicos oficiales.
* **Envío Instantáneo por WhatsApp**: Envío directo de la prescripción al número del paciente en un solo toque.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool & Bundler** | [Vite 6](https://vite.dev/) |
| **Enrutamiento** | [TanStack Router](https://tanstack.com/router) *(Type-safe routing)* |
| **Estado y Caché Servidor** | [TanStack React Query v5](https://tanstack.com/query) |
| **Estilos & UI** | [TailwindCSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) + [Framer Motion](https://www.framer.com/motion/) |
| **Backend & Base de Datos** | [Supabase](https://supabase.com/) *(PostgreSQL, RLS, Auth, WebSockets Realtime)* |
| **Generación de Documentos** | [jsPDF](https://github.com/parallax/jsPDF) + `jspdf-autotable` |
| **Motor de Ejecución / Paquetes** | [Bun](https://bun.sh/) *(o Node.js / npm)* |

---

## 💻 Instalación y Puesta en Marcha

Sigue estos pasos para levantar el entorno de desarrollo en tu máquina local:

### 1. Clonar el repositorio
```bash
git clone https://github.com/KevxxAlva/femesalud-zen-flow.git
cd femesalud-zen-flow
```

### 2. Instalar dependencias
Recomendamos utilizar **Bun** para máxima velocidad:
```bash
bun install
```
*(O alternativamente: `npm install`)*

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

### 4. Iniciar el Servidor de Desarrollo
```bash
bun run dev
```
La aplicación iniciará en `http://localhost:5173` (o `http://localhost:8080`).

### 5. Compilar para Producción
```bash
bun run build
```

---

## 📁 Estructura del Proyecto

```text
femesalud-zen-flow/
├── public/
│   ├── favicon.svg          # Isotipo oficial Medizen (Möbius Zen)
│   └── ...
├── src/
│   ├── components/          # Componentes de UI, diálogos y vistas de módulos
│   │   ├── finance/         # Cuentas, métodos de pago y compras
│   │   ├── physical-asset/  # Inventario y control de stocks
│   │   ├── settings/        # Diseñador visual de récipes
│   │   ├── ui/              # Componentes base Radix UI / Tailwind
│   │   ├── AppSidebar.tsx   # Barra lateral con menú drawer móvil
│   │   ├── BottomNavBar.tsx # Barra de navegación inferior táctil
│   │   └── ...
│   ├── hooks/               # Hooks personalizados (autenticación, sync realtime)
│   ├── integrations/        # Cliente de Supabase y esquemas tipados
│   ├── lib/
│   │   ├── api/             # Capa de servicios y consultas API
│   │   ├── auth/            # Bóveda cifrada y autenticación rápida por PIN
│   │   └── pdf/             # Motores de generación de récipes y reportes PDF
│   ├── routes/              # Árbol de rutas TanStack Router
│   │   ├── _authenticated/  # Rutas protegidas por sesión
│   │   └── auth.tsx         # Pantalla de acceso, PIN y recuperación
│   ├── App.css              # Variables CSS y tokens de diseño
│   └── main.tsx             # Punto de entrada de la aplicación
├── index.html               # Plantilla HTML con branding oficial Medizen
└── package.json
```

---

## 🔒 Seguridad y Privacidad

* **Row Level Security (RLS)**: Cada consulta a la base de datos está validada a nivel de fila según el rol y pertenencia del usuario (`admin`, `doctor`, `recepcionista`).
* **Bóveda Criptográfica en Cliente**: Las claves de seguridad de 4 dígitos derivan llaves de cifrado independientes sin exponer contraseñas en texto plano.
* **Control de Auditoría**: Trazabilidad de accesos y modificaciones en registros médicos y financieros.

---

<div align="center">

Desarrollado con dedicación para profesionales de la salud.  
**Medizen — Medicina en Flujo Continuo.**

</div>
