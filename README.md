# Financia App - Tracker de Finanzas Personales 📈💰

**Financia App** es una aplicación multiplataforma (móvil y web) desarrollada con **React Native** y **Expo** para gestionar tus finanzas personales de manera ágil, segura y totalmente en la nube. 

Permite organizar ingresos y gastos, definir presupuestos por categorías, dar seguimiento a metas de ahorro y visualizar el balance neto en tiempo real.

👉 **Demo Web:** [https://financia-app-67634.web.app](https://financia-app-67634.web.app)

---

## 🚀 Características Principales

- **Gestión Multi-Cuentas:** Registro y balance de cuentas de ahorros, efectivo, inversiones y tarjetas de crédito en múltiples divisas (Soles - PEN, Dólares - USD).
- **Control de Presupuestos:** Define límites de gastos mensuales divididos por categorías clave (Gastos Fijos, Gastos Libres de Culpa, Ahorro e Inversión) para mantener tus finanzas bajo control.
- **Metas de Ahorro:** Crea metas personalizadas, define montos objetivo y realiza abonos parciales visualizando el progreso en tiempo real.
- **Autenticación con Google:** Inicio de sesión seguro con Google Sign-In, compatible nativamente en Android y mediante Pop-up en la versión web.
- **Datos Seguros en la Nube:** Integración completa con **Firebase Firestore** para el almacenamiento de datos en tiempo real, garantizando aislamiento total para cada usuario.

---

## 🛠️ Tecnologías y Librerías Utilizadas

- **Framework:** [React Native](https://reactnative.dev/) (SDK 54) con [Expo](https://expo.dev/)
- **Base de Datos y Auth:** [Firebase v12](https://firebase.google.com/) (Firestore Database, Authentication y Hosting)
- **Navegación:** [React Navigation v7](https://reactnavigation.org/)
- **Iconos:** Lucide Icons (`lucide-react-native`) y Expo Vector Icons
- **Gestión del Estado:** React Context API (AuthContext)
- **Inicio de Sesión Nativo:** `@react-native-google-signin/google-signin`

---

## ⚙️ Estructura de Carpetas a Subir

Este repositorio incluye la estructura estándar de un proyecto Expo:
- `src/` - Código fuente de la app (pantallas, navegación, servicios de base de datos, lógica de autenticación).
- `assets/` - Recursos visuales e imágenes de la aplicación.
- `app.json`, `package.json` - Configuraciones esenciales de Expo y dependencias.
- `firebase.json` - Configuración para el despliegue automático en Firebase Hosting.

> ℹ️ **Nota de Seguridad:** Las carpetas `node_modules/`, `.expo/`, y carpetas de build local están excluidas mediante el archivo `.gitignore` para no subir archivos basura al repositorio.

---

## 💻 Configuración Local e Instalación

Sigue estos pasos para ejecutar el proyecto en tu máquina local:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/finance-app.git
   cd finance-app
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo de Expo:**
   ```bash
   npx expo start
   ```

4. **Ejecutar en tu dispositivo:**
   - Para probar en la Web: Presiona `w` en la consola.
   - Para probar en Android o iOS: Escanea el código QR desde la app **Expo Go** (para flujos sin dependencias nativas complejas) o genera un build de desarrollo con `npx expo run:android` / `npx expo run:ios`.

---

## 🌐 Despliegue en Firebase Hosting

Para compilar y actualizar la versión web en producción:

1. Generar la compilación estática web:
   ```bash
   npx expo export --platform web
   ```

2. Desplegar los archivos generados en `/dist` a Firebase Hosting:
   ```bash
   npx firebase-tools deploy --only hosting
   ```
