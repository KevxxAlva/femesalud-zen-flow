# FemeSalud — Premium Clinical Suite 🏥✨

Plataforma premium de gestión médica diseñada para optimizar los flujos de trabajo de profesionales de la salud y clínicas privadas. Ofrece una experiencia fluida, rápida y segura en la administración de pacientes, citas e historias clínicas.

<img width="1349" height="641" alt="image" src="https://github.com/user-attachments/assets/38285178-19cc-4851-9785-fde649bc8082" />

---

## 🚀 Características Principales

*   **📅 Agenda Médica Inteligente**: Sincronización de citas en tiempo real para médicos y asistentes. Visualización interactiva y gestión de horarios.
*   **📑 Historias Clínicas en un Clic**: Expediente médico digital unificado para cada paciente. Historial de consultas, diagnósticos, recetas y notas protegidas.
*   **🔒 Seguridad de Grado Clínico**: Control de acceso granular mediante roles de usuario (`admin` y `doctor`) protegidos por Políticas de Seguridad de Fila (RLS) en base de datos.
*   **💼 Facturación y Finanzas Zen**: Control simplificado de cobros de consultas, seguimiento de ingresos y reportes de facturación integrados.
*   **⚡ Arquitectura Moderna SSR**: Renderizado en el servidor mediante **TanStack Start** y **Nitro** para garantizar tiempos de carga instantáneos y optimización SEO premium.

---

## 🛠️ Stack Tecnológico

*   **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
*   **Enrutador y SSR**: [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (con presets de Nitro)
*   **Estilos**: [TailwindCSS v4](https://tailwindcss.com/) + Lightning CSS
*   **Base de Datos y Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security)
*   **Gestor de Paquetes**: [Bun](https://bun.sh/) (recomendado) o npm / pnpm
*   **Despliegue**: [Vercel](https://vercel.com/) (Serverless Edge Functions)

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
Esto generará los archivos estáticos y las funciones Serverless listas para Vercel en el directorio `.vercel/output/`.

---

## 🌐 Despliegue en Vercel

La aplicación está completamente optimizada para desplegarse en **Vercel** usando Serverless Functions. La compilación se realiza a través de Nitro utilizando el archivo `vercel.json` en la raíz:

```json
{
  "framework": "tanstack-start"
}
```

Para implementar cambios en producción, simplemente realiza un push a la rama principal `main`:
```bash
git add .
git commit -m "feat: nuevos cambios"
git push origin main
```
Vercel detectará el commit automáticamente, ejecutará `bun run build` y desplegará la nueva versión en segundos.
