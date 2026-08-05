# STREAMERO - DOCUMENTO DE DISEÑO (VERSIÓN 2)

Este proyecto reemplaza la idea anterior. No quiero un simple simulador de streamer. Quiero un juego centrado en el MODO CARRERA y el MERCADO DE PASES entre canales de streaming argentinos.

-----------------------------------------
CONCEPTO
-----------------------------------------

El jugador controla a un streamer argentino que comenzó transmitiendo desde su casa.

Con el paso del tiempo fue formando una pequeña comunidad y algunos clips comenzaron a hacerse conocidos.

Ese crecimiento llamó la atención de un canal de streaming que decide ofrecerle su primer contrato.

A partir de ahí comienza su carrera profesional.

El objetivo no es simplemente conseguir seguidores.

El objetivo es construir la mejor carrera posible, tomando decisiones, cambiando de canal en el momento adecuado y convirtiéndose en una de las figuras más importantes del streaming argentino.

-----------------------------------------
INTRODUCCIÓN
-----------------------------------------

Durante años transmitiste desde tu casa por simple diversión.

Con el tiempo empezaste a formar una pequeña comunidad.

No eras el streamer más grande, pero quienes te seguían siempre estaban ahí.

Un par de clips comenzaron a circular por las redes y tu nombre empezó a sonar dentro del ambiente.

Ese crecimiento llamó la atención de un canal de streaming.

Hoy recibiste tu primera propuesta.

Tu carrera profesional está a punto de comenzar.

[Comenzar Carrera]

-----------------------------------------
ESTRUCTURA GENERAL
-----------------------------------------

La partida dura 12 temporadas.

Cada temporada contiene:

Evento 1

↓

Evento 2

↓

Evento 3

↓

Resumen de temporada

Cada DOS temporadas ocurre un Mercado de Pases.

Es decir:

Temporada 1

3 eventos

Temporada 2

3 eventos

↓

Mercado de Pases

Temporada 3

3 eventos

Temporada 4

3 eventos

↓

Mercado de Pases

...

Hasta la Temporada 12.

-----------------------------------------
MERCADO DE PASES
-----------------------------------------

El Mercado de Pases es una pantalla especial.

No es un evento normal.

Dependiendo del rendimiento del jugador pueden aparecer distintas ofertas.

No siempre aparecerán todos los canales.

Un buen rendimiento hace que aparezcan mejores propuestas.

Un mal rendimiento puede hacer que ningún canal quiera contratarte.

Incluso puede ocurrir que tu contrato simplemente sea renovado.

O que tengas que continuar como creador independiente hasta recibir una nueva oportunidad.

-----------------------------------------
OFERTAS
-----------------------------------------

NO mostrar números de sueldo.

Nadie conoce realmente cuánto cobran los streamers.

Las ofertas mostrarán únicamente una estimación.

Ejemplo:

PORTERIX

Remuneración
💰💰💰
Media

Alcance
⭐⭐⭐⭐
Alto

Exigencia
🟢 Baja

-----------------------------------------

AGLO

Remuneración
💰💰💰💰💰
Muy alta

Alcance
⭐⭐⭐⭐⭐
Muy alto

Exigencia
🔴 Alta

-----------------------------------------

ASS

Remuneración
💰💰
Baja

Alcance
⭐⭐⭐
Medio

Exigencia
🟢 Baja

-----------------------------------------

No utilizar atributos como:

Libertad editorial

Ideología

Sesgo

Ni ningún juicio sobre medios reales.

Todo debe mantenerse neutral.

-----------------------------------------
ESTADÍSTICAS
-----------------------------------------

Tres únicamente.

👥 Seguidores

Representan la popularidad.

❤️ Reputación

Determina qué canales estarán interesados en contratarte.

💰 Dinero

Representa el dinero acumulado durante toda la carrera.

Los contratos aumentan el dinero ganado por temporada, pero nunca muestran el sueldo exacto.

-----------------------------------------
EVENTOS
-----------------------------------------

Cada temporada tiene exactamente 3 eventos.

Cada evento ofrece entre 2 y 3 decisiones.

Cada decisión tiene una probabilidad de éxito o fracaso.

Normalmente:

50% éxito

50% fracaso

Si el jugador ya es una figura reconocida, las probabilidades mejoran.

Cada resultado modifica las estadísticas.

Ejemplo:

+ seguidores

- seguidores

+ reputación

- reputación

+ dinero

etc.

-----------------------------------------
EVENTOS SEGÚN EL CANAL
-----------------------------------------

Los eventos cambian dependiendo del canal donde trabaje el jugador.

Ejemplos:

PORTERIX

- Torneos
- Gaming
- Colaboraciones
- Eventos de entretenimiento

ASS

- Cobertura de fútbol
- Debates deportivos
- Entrevistas

AGLO

- Programas especiales
- Coberturas importantes
- Invitados

Cada canal debe sentirse distinto.

-----------------------------------------
FILOSOFÍA DEL JUEGO
-----------------------------------------

No existe un canal "mejor".

Todos tienen ventajas y desventajas.

La decisión correcta depende del tipo de carrera que quiera hacer el jugador.

-----------------------------------------
FIN DE TEMPORADA
-----------------------------------------

Al terminar cada temporada aparece un resumen.

Ejemplo:

FIN DE TEMPORADA 5

Seguidores obtenidos

Cambio de reputación

Dinero ganado

Canal actual

Luego comienza la siguiente temporada.

-----------------------------------------
FIN DEL JUEGO
-----------------------------------------

Después de la Temporada 12 aparece un resumen completo de la carrera.

Ejemplo:

Tu carrera terminó.

Canales donde trabajaste.

Cuántas temporadas estuviste en cada uno.

Seguidores finales.

Reputación final.

Dinero acumulado.

Canal donde terminaste.

Y una valoración final.

Por ejemplo:

Figura histórica

Gran carrera

Buena carrera

Carrera discreta

Carrera olvidable

-----------------------------------------
OBJETIVO DE DESARROLLO
-----------------------------------------

Quiero un juego con aspecto profesional.

No un prototipo.

Debe sentirse como un verdadero Modo Carrera inspirado en los juegos deportivos, pero adaptado al mundo del streaming argentino.

El código debe ser limpio, modular, comentado y fácil de ampliar.

Los eventos deben almacenarse como datos independientes del motor del juego para poder agregar cientos de eventos nuevos sin modificar la lógica principal.