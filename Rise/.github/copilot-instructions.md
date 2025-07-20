<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# 12 Week Goals iOS App

Esta es una aplicación iOS desarrollada en Swift que se conecta a una API backend en .NET para crear listas de tareas de 12 semanas en Microsoft To Do.

## Contexto del Proyecto

- **Lenguaje**: Swift 5.0
- **Framework**: UIKit
- **Target iOS**: 17.4+
- **Arquitectura**: MVC (Model-View-Controller)

## Estructura del Proyecto

- `AppDelegate.swift` - Configuración inicial de la aplicación
- `SceneDelegate.swift` - Manejo de escenas de la aplicación
- `ViewController.swift` - Pantalla principal con botón para crear metas
- `CreateGoalsViewController.swift` - Interfaz para crear nuevas metas con formularios dinámicos
- `Models.swift` - Modelos de datos que se sincronizarán con el backend
- `GoalService.swift` - Servicio para comunicación HTTP con el backend API

## Funcionalidades Principales

1. **Crear Grupo de Metas**: Permite definir un nombre y fecha de inicio
2. **Gestión de Metas**: Cada meta puede tener hasta 12 tareas semanales
3. **Integración con Backend**: Se conecta a API .NET que maneja Microsoft Graph
4. **Interfaz Dinámica**: Permite agregar/eliminar metas dinámicamente
5. **Autenticación Microsoft**: Redirige a Safari para autenticación OAuth

## Consideraciones Técnicas

- El proyecto está configurado para desarrollo con cuenta gratuita de Apple Developer
- Se requiere recompilación cada 7 días con cuenta gratuita
- La app se conecta a `localhost:8000` por defecto (configurar IP del servidor)
- Incluye `NSAppTransportSecurity` para permitir HTTP en desarrollo

## Instrucciones para Copilot

- Usar sintaxis Swift 5.0 moderna
- Seguir convenciones de UIKit y patrones MVC
- Mantener consistencia con el estilo de código existente
- Usar constraints programáticos para layout
- Implementar manejo de errores apropiado para llamadas de red
- Considerar la experiencia de usuario en dispositivos iOS
