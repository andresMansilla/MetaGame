<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MetaGame Lobby 3D</title>
    <!-- Se remueve Tailwind para usar el CSS puro del usuario -->
    
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            overflow: hidden; 
            font-family: Arial, sans-serif;
            /* Añadir padding al body para que el contenido no quede bajo el header/footer/menu */
            padding-top: 80px; /* Altura del header */
            padding-bottom: 60px; /* Altura del footer */
        }

        /* ===============================
            Header y Footer (UI)
        =============================== */
        header, footer {
            position: fixed;
            left: 0;
            width: 100%;
            z-index: 10; 
            /* Estilos del usuario */
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 50px;
        }

        header {
            top: 0;
            height: 80px;
            border-bottom-left-radius: 20px;
            border-bottom-right-radius: 20px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
            transition: background 0.3s ease;
        }

        footer {
            bottom: 0;
            height: 60px;
            justify-content: center;
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;
        }

        /* ===============================
            Fondo 3D (Canvas)
        =============================== */
        #three-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 0;
        }

        /* ===============================
            Menú Lateral Derecho (Right Menu)
        =============================== */
        #right-menu {
            position: fixed; /* Fija el elemento en la ventana */
            top: 50%; /* Lo mueve a la mitad de la altura de la ventana */
            right: 30px; /* Separación del borde derecho. Puedes ajustar este valor. */
            transform: translateY(-50%); /* Centra el menú verticalmente */
            z-index: 20; 
            
            /* Estética */
            background-color: rgba(255, 255, 255, 0.9); /* Fondo blanco semitransparente */
            border-radius: 12px;
            padding: 15px 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .side-nav {
            display: flex;
            flex-direction: column; /* Coloca los enlaces uno encima del otro */
            gap: 10px; /* Espacio entre los enlaces */
        }

        .side-nav a {
            display: block; /* Ocupa todo el ancho */
            padding: 8px;
            text-align: center;
            text-decoration: none;
            color: #172a5a; /* Texto azul oscuro */
            font-weight: bold;
            border-radius: 5px;
            transition: background-color 0.3s ease;
        }

        .side-nav a:hover {
            background-color: #d1f2c9; /* Color de fondo claro al pasar el ratón (similar al canvas) */
        }

        /* Estilo específico para el icono de lupa */
        .side-nav .search-icon {
            font-size: 1.5em; /* Lupa más grande */
            color: #172a5a;
            border: 2px solid #172a5a;
            border-radius: 50%; /* Lo hace redondo */
            width: 30px;
            height: 30px;
            line-height: 30px; /* Centra el ícono verticalmente */
            margin-bottom: 5px;
        }

        .side-nav .search-icon:hover {
            background-color: #172a5a;
            color: white;
        }
    </style>

    <!-- Importmap del usuario para THREE.js (mantenido por contexto 3D) -->
    <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
      }
    }
    </script>
</head>
<body>

    <!-- Header Principal: Mantiene la estructura interna original, el estilo lo da el nuevo CSS -->
    <header>
        <!-- Contenido original del header -->
        <div style="display: flex; align-items: center;">
            <div>
                <!-- El nuevo CSS define el color del texto como 'white' -->
                <h1 style="font-size: 1.5rem; font-weight: bold;">MetaGame Lobby</h1>
                <h3 style="font-size: 0.875rem;">Tu tablero, tus cartas, tu victoria</h3>
            </div>
            
            <!-- Navegación horizontal original -->
            <nav style="margin-left: 2rem;">
                <a href="Home.html" style="color: white; margin-left: 1rem; text-decoration: none;">Inicio</a>
                <a href="oca.html" style="color: white; margin-left: 1rem; text-decoration: none;">Juego de la oca</a>
                <a href="uno.html" style="color: white; margin-left: 1rem; text-decoration: none;">UNO</a>
            </nav>
        </div>

        <!-- Lupa para Buscar (Search Icon) -->
        <!-- Se usa un estilo básico para el botón ya que el CSS del usuario no lo cubre -->
        <button style="background: none; border: none; color: white; cursor: pointer; padding: 5px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </button>
    </header>

    <!-- Menú Lateral Permanente (Right Menu) - Ahora fijo a la derecha según el CSS -->
    <aside id="right-menu">
        <nav class="side-nav">
            <!-- Icono de búsqueda según el CSS proporcionado para .side-nav .search-icon -->
            <a href="#" class="search-icon">🔎</a>
            
            <!-- Navegación de Pastillas (manteniendo los enlaces originales) -->
            <a href="Home.html">Inicio</a>
            <a href="oca.html">Juego de la Oca</a>
            <a href="uno.html">UNO</a>
            <a href="#">Descubrir Juegos</a>
            <a href="#">Configuración</a>
        </nav>
    </aside>

    <!-- Contenido principal: El canvas 3D (Ahora es el fondo fijo) -->
    <canvas id="three-canvas"></canvas>

    <!-- Footer -->
    <footer>
        <div>© 2025 MetaGame | Tu tablero, tus cartas, tu victoria</div>
    </footer>

    <!-- Script de JavaScript ORIGINAL: Reañadido según petición del usuario -->
    <script type="module" src="js/mesa.js"></script>

</body>
</html>