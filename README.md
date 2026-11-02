# Lettra Colors 1.0

Aplicación para Canva que automatiza la personalización de portadas, contraportadas y lomos de cuadernos escolares.

## Estado del proyecto

Versión 1.0 funcional de uso privado en Canva. Aún no está publicada en su catálogo de aplicaciones.

## Contexto de uso

Desarrollé Lettra Colors para facilitar la personalización de las plantillas escolares de mi emprendimiento, Lettra.

La herramienta trabaja con la estructura y los elementos de los diseños utilizados en el proyecto. Su compatibilidad con otras plantillas requiere revisión y adaptación.

## Problema que resuelve

La personalización manual de cuadernos escolares en Canva requería mucho tiempo, especialmente al modificar colores, portadas, contraportadas, nombres de estudiantes y lomos.

Lettra Colors nació para automatizar estas tareas repetitivas, reducir el tiempo de trabajo y facilitar la personalización de múltiples diseños desde una sola aplicación.

## ¿Cómo funciona?

Lettra Colors es una aplicación integrada en el editor de Canva que permite personalizar diseños de cuadernos escolares de manera más rápida.

La aplicación cuenta con dos funciones principales:

### Personalización de colores

- Permite elegir entre 21 paletas de colores.
- Cambia el fondo de la portada y contraportada.
- Actualiza las franjas laterales y los colores de las ilustraciones SVG.
- Modifica el lomo correspondiente, conservando el borde blanco de sus letras.

### Personalización de datos

- Permite ingresar nombres, apellidos y grado del estudiante.
- Busca los textos originales en las páginas del diseño.
- Reemplaza las coincidencias automáticamente.
- Evita tener que editar cada página manualmente.

## Tecnologías utilizadas

- **TypeScript:** desarrollo de la lógica para automatizar la personalización de los diseños.
- **React:** creación de la interfaz interactiva de Lettra Colors.
- **Canva Apps SDK:** integración de la aplicación con el editor de Canva.
- **SVG:** procesamiento y recoloración de ilustraciones.
- **Node.js y npm:** ejecución y gestión del proyecto durante el desarrollo.
- **Visual Studio Code:** editor utilizado para desarrollar la aplicación.

## Validación técnica

- Revisión de tipos de TypeScript completada sin errores.
- Compilación de la aplicación realizada correctamente con Canva CLI.
- Versión funcional privada: Lettra Colors 1.0.

**Pendiente:** revisión de reglas de ESLint y desarrollo de pruebas automatizadas propias.

## Instalación y ejecución local

### Requisitos

- Node.js 24 y npm 11.
- Git.
- Una cuenta de Canva con acceso al Developer Portal.
- Una aplicación creada en el Developer Portal para vincular este proyecto.

### 1. Descargar el proyecto

```bash
git clone https://github.com/blas-meylin/lettra-colors-canva-app.git
cd lettra-colors-canva-app
```

Si el repositorio es privado, se necesita autorización para descargarlo.

### 2. Instalar las dependencias

```bash
npm ci
```

### 3. Vincular el proyecto con Canva

Iniciar sesión:

```bash
npx @canva/cli login
```

Vincular la carpeta con una aplicación a la que se tenga acceso:

```bash
npx @canva/cli apps link
```

Seguir las indicaciones de la terminal. La vinculación configura el archivo `.env` local.

El archivo `.env.template` contiene los nombres de las variables de configuración. No es necesario completar todas las variables para todos los proyectos.

### 4. Iniciar el entorno de desarrollo

```bash
npm start
```

Abrir el enlace de vista previa de Canva que aparece en la terminal. Mantener la terminal abierta mientras se utiliza la aplicación.

Para detener el servidor, presionar `Ctrl + C`.

### 5. Probar las funciones

Utilizar una copia de un diseño compatible con la estructura de las plantillas de Lettra. Probar los cambios de colores y el reemplazo de textos sobre esa copia.

Descargar el código no proporciona acceso a las plantillas comerciales de Lettra ni publica la aplicación en Canva.

## Comandos de revisión

```bash
npm run lint:types
npm run lint
npm run build
```

Estos comandos permiten revisar los tipos de TypeScript, comprobar las reglas de código y compilar el proyecto. No sustituyen las pruebas de funcionamiento dentro de Canva.

## Capturas de pantalla

### 1. Aplicación integrada en Canva
![Aplicación Lettra Colors en Canva](capturas/01_app_en_canva.png)

### 2. Interfaz de Lettra Colors
![Interfaz de Lettra Colors](capturas/02_interfaz_lettra_colors.png)

### 3. Portada personalizada
![Portada amarilla con datos actualizados](capturas/03_portada_actualizada.png)

### 4. Contraportada personalizada
![Contraportada con datos actualizados](capturas/04_contraportada_actualizada.png)

### 5. Lomos actualizados
![Lomos de cuadernos con diferentes colores](capturas/05_lomos_actualizados.png)
