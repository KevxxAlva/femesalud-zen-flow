# CONCLUSIONES Y RECOMENDACIONES

**Enfoque: Cierre y proyección.**

El presente acápite constituye el cierre académico, reflexivo y proyectivo del Proyecto Socio-Integrador, donde se sintetizan los hallazgos más significativos derivados de la ejecución técnica, la interacción con la comunidad médica del consultorio FemeSalud y la aplicación de los conocimientos del PNF en Informática.

---

## Conclusiones

De acuerdo con las directrices normativas de la UPTLLJR, las conclusiones dan respuesta lógica, secuencial y verificable a cada uno de los cuatro (04) objetivos específicos planteados en la investigación:

1. **En relación con el primer objetivo específico (*Diagnosticar la situación actual de los procesos de historias clínicas, citas y control operativo en FemeSalud*)**:  
   Se constató de manera inequívoca que la gestión manual basada en expedientes físicos de cartón, agendas en papel y talonarios de récipes manuscritos generaba severos cuellos de botella en la atención diaria. El diagnóstico participativo reveló retrasos promedio de 18 minutos en la revisión de antecedentes ginecológicos, riesgos constantes de pérdida o deterioro físico de la información confidencial de las pacientes y desajustes en la coordinación de turnos entre la recepción y el consultorio de la Dra. Carli Sole, validando plenamente la necesidad perentoria de una solución informática a medida.

2. **En relación con el segundo objetivo específico (*Diseñar la arquitectura lógica, conceptual y prototipos de interfaz del sistema web*)**:  
   Se diseñó una arquitectura de software robusta, escalable y modular, fundamentada en el paradigma de aplicaciones reactivas de una sola página (SPA). Se formalizó el modelado conceptual a través de diagramas UML (Casos de Uso, Actividades y Secuencia) y se estructuró un modelo relacional en PostgreSQL compuesto por ocho (08) entidades altamente normalizadas que capturan fielmente las variables biomédicas de la ginecología y obstetricia (fórmulas obstétricas, FUM, FPP y ecografías). Asimismo, el diseño ergonómico de interfaces con enfoque *Mobile-First* garantizó una experiencia de usuario fluida y adaptable a dispositivos táctiles.

3. **En relación con el tercer objetivo específico (*Desarrollar los módulos funcionales de la aplicación web utilizando React 19, TypeScript, Tailwind CSS y Supabase*)**:  
   Se materializó exitosamente la plataforma web **FemeSalud (Medizen)**, integrando un conjunto de tecnologías de última generación. Destaca la implementación pionera de una **bóveda de seguridad criptográfica local** en el navegador basada en los algoritmos estándar `PBKDF2` y `AES-GCM` de 256 bits, la cual permite a la especialista médica desbloquear su sesión de trabajo en menos de un segundo mediante un teclado numérico táctil de PIN de 4 dígitos sin comprometer las credenciales maestras. Se integró una agenda interactiva sincronizada en tiempo real mediante WebSockets y un motor dinámico de renderizado documental con `jsPDF` para la emisión instantánea de prescripciones médicas y su envío automatizado a WhatsApp.

4. **En relación con el cuarto objetivo específico (*Evaluar la funcionalidad, seguridad, usabilidad y rendimiento del sistema web*)**:  
   La aplicación de pruebas funcionales de caja negra y pruebas de estrés arrojó un **100% de casos de prueba aprobados**, evidenciando ausencia de errores críticos en los cálculos obstétricos, en la integridad transaccional y en los flujos de cobro multimoneda. El análisis comparativo de resultados demostró una **reducción del 69,4% en el tiempo de registro en consulta**, una **disminución del 96,7% en el acceso a antecedentes clínicos** y la **erradicación total de expedientes extraviados**, alcanzando un índice de satisfacción del 100% por parte de la especialista médica y del personal administrativo.

En conclusión general, el desarrollo e implantación de FemeSalud demuestra el alto valor formativo y transformador del Programa Nacional de Formación en Informática de la UPTLLJR, entregando una solución soberana, segura y de calidad internacional que moderniza el ejercicio médico privado en el municipio Leonardo Infante del estado Guárico.

---

## Recomendaciones

Con el propósito de asegurar la sostenibilidad en el tiempo, la preservación de la seguridad informática y la escalabilidad del sistema web desarrollado, se formulan las siguientes recomendaciones estratégicas:

### Para el Consultorio FemeSalud y la Dra. Carli Sole:
1. **Políticas de Respaldo y Cuidado Operativo**: Aunque la base de datos en Supabase cuenta con replicación continua en la nube, se sugiere realizar exportaciones mensuales de los respaldos lógicos en formato SQL o CSV a una unidad física de almacenamiento externa cifrada.
2. **Higiene Criptográfica y Seguridad de Accesos**: Cambiar de manera periódica (cada 60 o 90 días) el PIN de desbloqueo de 4 dígitos y la contraseña maestra de acceso al panel de administración de Supabase, evitando compartir el código de seguridad con terceros no autorizados.
3. **Equipamiento de Apoyo en Consultorio**: Considerar la incorporación de un dispositivo móvil tipo tableta de al menos 10 pulgadas dotada de lápiz óptico (*stylus*) en el escritorio de consulta, permitiendo a la especialista registrar gráficos anatómicos y firmas digitales manuscritas directamente sobre la historia médica.
4. **Alimentación Eléctrica Ininterrumpida**: Mantener una unidad de respaldo de energía (UPS) en el enrutador de internet y en los equipos de escritorio del consultorio para mitigar las fluctuaciones eléctricas locales en la ciudad de Valle de la Pascua.

### Para la Universidad Politécnica Territorial de los Llanos "Juana Ramírez" (UPTLLJR):
1. **Líneas de Investigación en Informática Médica**: Promover la consolidación de una línea de investigación específica dedicada al desarrollo de Sistemas de Información en Salud (HIS) y registros médicos electrónicos de código abierto, aprovechando el impacto directo que estos proyectos tienen sobre las comunidades e instituciones de la región de los llanos venezolanos.
2. **Repositorio Institucional de Soluciones Libres**: Crear un repositorio institucional de paquetes, plantillas y componentes de software desarrollados en el PNF en Informática (arquitecturas con React, Supabase y criptografía Web Crypto API) para que sirvan de marco referencial y reutilizable a futuras cohortes de estudiantes de Trayecto II, III y IV.

### Para Futuras Investigaciones y Líneas de Continuidad:
1. **Portal del Paciente y Notificaciones Push**: Diseñar e integrar un módulo o aplicación web progresiva orientada exclusivamente a las pacientes de FemeSalud, permitiéndoles consultar el calendario de sus próximas citas, descargar sus récipes médicos pasados y recibir recordatorios de toma de medicamentos vía notificaciones push o SMS.
2. **Telemedicina y Consultas a Distancia**: Incorporar un módulo de videoconferencia segura punto a punto mediante protocolos WebRTC para la atención ginecológica preliminar o revisión de exámenes de laboratorio a pacientes radicadas en zonas rurales lejanas de Valle de la Pascua (El Socorro, Tucupido, Zaraza).
3. **Inteligencia Artificial y Análisis Predictivo**: Integrar modelos de aprendizaje automático supervisado (*Machine Learning*) para el análisis de curvas de crecimiento fetal y detección temprana de factores de riesgo asociados a la preeclampsia o diabetes gestacional, apoyando la toma de decisiones clínicas de la especialista.
