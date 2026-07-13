# Comandos

Registro de los comandos usados para inicializar y configurar este proyecto (Node.js + TypeScript + Express).

## 1. Inicializar el proyecto npm

```bash
npm init -y
```

Genera el `package.json` inicial.

## 2. Instalar dependencias de producción

```bash
npm install express cors dotenv
```

- `express`: framework del servidor HTTP.
- `cors`: middleware para habilitar CORS.
- `dotenv`: carga variables de entorno desde un archivo `.env`.

## 3. Instalar dependencias de desarrollo

```bash
npm install -D typescript @types/node @types/express @types/cors tsx
```

- `typescript`: compilador de TypeScript.
- `@types/node`, `@types/express`, `@types/cors`: tipados para Node/Express/CORS.
- `tsx`: ejecuta y observa (`watch`) archivos TypeScript en desarrollo sin necesidad de compilar antes (usa esbuild por debajo).

> Nota: originalmente se probó `ts-node-dev`, pero resultó incompatible con la versión instalada de TypeScript (v7), por lo que se reemplazó por `tsx`.

## 4. Generar la configuración de TypeScript

```bash
npx tsc --init
```

Luego se editó manualmente `tsconfig.json` para ajustar `rootDir`, `outDir`, `module`, `target`, etc.

## 5. Scripts de npm (definidos en `package.json`)

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

### Uso:

```bash
# Levantar el servidor en modo desarrollo (con recarga automática)
npm run dev

# Compilar TypeScript a JavaScript (genera la carpeta dist/)
npm run build

# Ejecutar la versión compilada (producción)
npm start
```

## 6. Verificar tipos sin compilar

```bash
npx tsc --noEmit
```

## Estructura del proyecto

```
DelphosOnboarding-backend/
├── src/
│   └── index.ts        # Punto de entrada del servidor Express
├── dist/                # Salida compilada (generada, ignorada en git)
├── .env.example          # Ejemplo de variables de entorno
├── .gitignore
├── COMANDOS.md
├── package.json
├── tsconfig.json
└── README.md
```

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar los valores:

```bash
cp .env.example .env
```
