# FemeSalud — Premium Clinical Suite 🏥✨

Plataforma premium de gestión médica diseñada para optimizar los flujos de trabajo de profesionales de la salud y clínicas privadas. Ofrece una experiencia fluida, rápida y segura en la administración de pacientes, citas, facturación e historias clínicas.

<img width="1350" height="640" alt="image" src="https://github.com/user-attachments/assets/142f4f5b-9c57-4c17-b5b1-6c776020b2f7" />

---

## 🚀 Características Principales

*   **📅 Agenda Médica Inteligente**: Sincronización de citas con visualización interactiva. Incluye resolución visual en cascada para horarios superpuestos y filtros avanzados por estado (Completadas, Pendientes, Canceladas).
*   **📑 Historias Clínicas en un Clic**: Expediente médico digital unificado para cada paciente. Historial de consultas, diagnósticos, recetas y notas protegidas.
*   **🎨 Diseñador de Récipes y Documentos**: Herramienta visual integrada para personalizar la identidad visual de todos los PDFs generados (logotipos corporativos, fuentes, membretes y color principal).
*   **📤 Envío de Recetarios (PDF + WhatsApp)**: Generación automática de recetas médicas en formato PDF y envío directo al paciente vía WhatsApp con un solo clic o descarga directa.
*   **💼 Facturación y Finanzas Zen**: Control simplificado de cobros de consultas y descarga de recibos individuales de pago en formato PDF profesional.
*   **📊 Reportes Automatizados**: Generación y exportación de reportes mensuales en PDF desde el Dashboard (Nuevos pacientes, Citas médicas, e Ingresos).
*   **🎯 Metas Diarias y Progreso (Daily Goals)**: Seguimiento de metas financieras y de consultas directamente en el panel de control.
*   **🔒 Seguridad de Grado Clínico**: Control de acceso granular mediante roles de usuario (`admin` y `doctor`) protegidos por Políticas de Seguridad de Fila (RLS) en Supabase.
*   **🌙 Interfaz Adaptable (Modo Claro/Oscuro)**: Diseño responsivo y moderno con soporte completo para modo oscuro y temas personalizados (Tailwind CSS v4).

---

## 🛠️ Stack Tecnológico

*   **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
*   **Enrutador**: [React Router](https://reactrouter.com/) (Anteriormente TanStack Router)
*   **Estilos**: [TailwindCSS v4](https://tailwindcss.com/) + Shadcn UI
*   **Generación de PDFs**: [jsPDF](https://github.com/parallax/jsPDF) + jsPDF-AutoTable
*   **Base de Datos y Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security)
*   **Gestor de Paquetes**: [Bun](https://bun.sh/) (recomendado) o npm / pnpm
*   **Despliegue**: [Vercel](https://vercel.com/) / Netlify

---

## 💻 Configuración Local

Sigue estos pasos para levantar el entorno de desarrollo en tu computadora local:

### 1. Clonar el repositorio
```bash
git clone https://github.com/KevxxAlva/femesalud-zen-flow.git
cd femesalud-zen-flow
```

### 2. Instalar dependencias
Se recomienda utilizar **Bun** para una instalación y compilación ultrarrápida:
```bash
bun install
```
*(O alternativamente: `npm install`)*

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto y agrega tus claves de Supabase:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Ejecutar el Servidor de Desarrollo
Inicia el entorno de desarrollo:
```bash
bun run dev
```
La aplicación estará disponible localmente en `http://localhost:8080`.

### 5. Compilar para Producción
Para validar y empaquetar la aplicación antes de realizar un despliegue:
```bash
bun run build
```

---

## 🌐 Despliegue

La aplicación es un Single Page Application (SPA) renderizado del lado del cliente, por lo que está optimizada para desplegarse fácilmente en plataformas como **Vercel**, **Netlify** o cualquier servidor estático estándar.

Para implementar cambios en producción en un entorno conectado a Git:
```bash
git add .
git commit -m "feat: nuevas mejoras en PDF y UI"
git push origin main
```
