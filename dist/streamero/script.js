// ============================================================
// STREAMERO — script.js
// Juego de simulación de carrera en el streaming argentino.
// HTML + CSS + JS puro. Sin frameworks, sin dependencias.
// ============================================================

'use strict';

// ─── DATOS: CANALES ──────────────────────────────────────────
// Cada canal tiene colores propios, una figura asociada y
// estadísticas que se muestran en el Mercado de Pases.

const CANALES = {
  ORTERIX: {
    id: 'ORTERIX',
    short: 'ORTERIX',
    tagline: 'Humor, rock y deportes',
    desc: 'Entre recitales, deportes y humor. Programa estrella: "Bajen un cambio".',
    figura: 'Azuquita Rodrigues',
    remuneracion: 3,
    alcance: 4,
    exigencia: 'Media',
    passiveMoney: 12,
    color: '#7c3aed',
    accent: '#a78bfa',
    glow: 'rgba(124,58,237,0.35)',
    logo: '../../assets/logos/orterix.png',
  },
  ALGA: {
    id: 'ALGA',
    short: 'ALGA',
    tagline: 'Humor, entrevistas, improvisación y caos controlado',
    desc: 'El canal más relajado del streaming argentino. Nadie sabe exactamente qué va a pasar cuando comienza un programa. Programa estrella: "Flashee que flotaba".',
    figura: 'Migue Granate',
    remuneracion: 4,
    alcance: 4,
    exigencia: 'Media',
    passiveMoney: 18,
    color: '#d97706',
    accent: '#fbbf24',
    glow: 'rgba(217,119,6,0.35)',
    logo: '../../assets/logos/alga.png',
  },
  ASS: {
    id: 'ASS',
    short: 'ASS',
    tagline: 'Fútbol',
    desc: 'Si rueda una pelota, ASS está ahí. Programa estrella: "No podemos vender".',
    figura: 'Fabio Assado',
    remuneracion: 2,
    alcance: 3,
    exigencia: 'Baja',
    passiveMoney: 7,
    color: '#0284c7',
    accent: '#38bdf8',
    glow: 'rgba(2,132,199,0.35)',
    logo: '../../assets/logos/ass.png',
  },
  'RUZU TV': {
    id: 'RUZU TV',
    short: 'RUZU TV',
    tagline: 'Humor, primeras citas y actualidad',
    desc: 'Un canal donde cualquier conversación puede terminar siendo viral. Programa estrella: "Nadie habla".',
    figura: 'Nico Bognato',
    remuneracion: 3,
    alcance: 3,
    exigencia: 'Baja',
    passiveMoney: 10,
    color: '#db2777',
    accent: '#f472b6',
    glow: 'rgba(219,39,119,0.35)',
    logo: '../../assets/logos/ruzu.png',
  },
  RENDER: {
    id: 'RENDER',
    short: 'RENDER',
    tagline: 'Política, actualidad, entrevistas y entretenimiento',
    desc: 'La actualidad nunca descansa. Programa estrella: "Hubo algo acá".',
    figura: 'Tomás Report',
    remuneracion: 4,
    alcance: 4,
    exigencia: 'Alta',
    passiveMoney: 14,
    color: '#9f1239',
    accent: '#fb7185',
    glow: 'rgba(159,18,57,0.35)',
    logo: '../../assets/logos/render.png',
  },
  CARANCHO: {
    id: 'CARANCHO',
    short: 'CARANCHO',
    tagline: 'Política oficialista libertaria',
    desc: 'El canal más alineado con el oficialismo. Programa estrella: "La Visa".',
    figura: 'El Gordo Pan',
    remuneracion: 4,
    alcance: 3,
    exigencia: 'Alta',
    passiveMoney: 16,
    color: '#a16207',
    accent: '#fde047',
    glow: 'rgba(161,98,7,0.35)',
    logo: '../../assets/logos/carancho.png',
  },
  QUERATINA: {
    id: 'QUERATINA',
    short: 'QUERATINA',
    tagline: 'Política, entrevistas y cultura',
    desc: 'Debates largos, análisis y entrevistas profundas. Programa estrella: "Industria popular".',
    figura: 'Pepe Racinclub',
    remuneracion: 3,
    alcance: 4,
    exigencia: 'Alta',
    passiveMoney: 13,
    color: '#1d4ed8',
    accent: '#93c5fd',
    glow: 'rgba(29,78,216,0.35)',
    logo: '../../assets/logos/queratina.png',
  },
  FUTUPOP: {
    id: 'FUTUPOP',
    short: 'FUTUPOP',
    tagline: 'Música, cultura y actualidad',
    desc: 'Donde la cultura también es protagonista. Programa estrella: "Mira a quien traje".',
    figura: 'Furia Mentolini',
    remuneracion: 3,
    alcance: 3,
    exigencia: 'Media',
    passiveMoney: 11,
    color: '#0e7490',
    accent: '#22d3ee',
    glow: 'rgba(14,116,144,0.35)',
    logo: '../../assets/logos/futupop.png',
  },
};

// Lista ordenada de IDs de canales (para el mercado de pases)
const TODOS_LOS_CANALES = Object.keys(CANALES);

// ─── DATOS: EVENTOS ──────────────────────────────────────────
// Cada canal tiene 5 eventos. Cada evento tiene título,
// descripción y 2 opciones (A y B), cada una con:
//   text       → texto de la opción
//   detail     → subtítulo explicativo
//   prob       → probabilidad de éxito (0.0 a 1.0)
//   exito      → { seguidores, dinero, mensaje }
//   fracaso    → { seguidores, dinero, mensaje }
//
// El evento especial de RENDER tiene specialOutcome: 'forcedTransfer'
// en ambas opciones (fracaso y exito), lo que fuerza el mercado de pases.

const RENDER_SOLD_TITLE      = '⚡ RENDER FUE VENDIDO';
const MOSQUITA_FART_TITLE     = 'COBERTURA MUNDIAL';
const CO_CONDUCTOR_TITLE      = 'Tension en Costra Team';
const ALGA_CAR_TITLE          = 'El Auto que Casi Choca en la Puerta';
const ORTERIX_BOXING_TITLE    = 'El Boxeo de los Streamers';
const WARIO_PAY_TITLE         = 'Wario Mengolini Quiere Pagarte en Partes';
const QUERATINA_SONG_TITLE    = 'La Canción de la Estrella de Mar';
const TUBERCULOSIS_TITLE      = 'Brote de Tuberculosis en el Canal';

const EVENTOS = {

  ORTERIX: [
    {
      title: 'El Recital de la Década',
      desc: 'ORTERIX cubre en vivo el festival de rock más grande del año. Azuquita Rodrigues te nomina para la transmisión principal.',
      opciones: [
        { text: 'Tomar la conducción del stream completo', detail: 'Protagonismo total, riesgo total.', prob: 0.52,
          exito:   { seg: 11000, din: 5, msg: 'Robaste el show. La transmisión fue lo más visto del festival.' },
          fracaso: { seg: -4000, din: 0, msg: 'Los nervios se notaron demasiado. La audiencia no perdonó.' } },
        { text: 'Cubrir el backstage con entrevistas', detail: 'Más espontáneo y cercano.', prob: 0.74,
          exito:   { seg: 6000, din: 3, msg: 'Entrevistas espontáneas que se convirtieron en los clips de la noche.' },
          fracaso: { seg: 800, din: 1, msg: 'Cobertura correcta pero sin momentos que se recuerden.' } },
      ],
    },
    {
      title: 'El Bit de Humor que Nadie Esperaba',
      desc: 'Azuquita Rodrigues lanza un desafío de humor en vivo y te menciona por nombre. Millones miran.',
      opciones: [
        { text: 'Sumarte sin pensarlo', detail: 'Pura reacción, sin calcular.', prob: 0.50,
          exito:   { seg: 13000, din: 3, msg: 'La reacción genuina hizo explotar el chat. Clips por todos lados.' },
          fracaso: { seg: -5000, din: 0, msg: 'No era tu momento. La comparación con Azuquita fue cruel.' } },
        { text: 'Responder con tu propio bit preparado', detail: 'Controlás la situación.', prob: 0.63,
          exito:   { seg: 8000, din: 2, msg: 'Sorprendiste a todos con un bit propio. Ganaste terreno en ORTERIX.' },
          fracaso: { seg: -2000, din: 0, msg: 'El bit preparado se notó demasiado. Se rieron de vos, no con vos.' } },
      ],
    },
    {
      title: 'Hot Take Deportivo',
      desc: 'ORTERIX organiza un panel donde cada uno dice su opinión más polémica sobre deporte.',
      opciones: [
        { text: 'El hot take más arriesgado que tenés', detail: 'Decir lo que nadie se anima.', prob: 0.44,
          exito:   { seg: 16000, din: 4, msg: 'Tu opinión explotó en redes. Mitad te odia, mitad te adora. Ambos te siguen.' },
          fracaso: { seg: -8000, din: 0, msg: 'La opinión cayó fatal. Trending topic por las razones equivocadas.' } },
        { text: 'Opinión fuerte pero con respaldo', detail: 'Polémica con argumentos.', prob: 0.67,
          exito:   { seg: 8000, din: 2, msg: 'Posición sólida. La audiencia te tomó en serio y siguió el debate.' },
          fracaso: { seg: -2000, din: 0, msg: 'Quedó como una opinión a medias. No convenció a nadie.' } },
      ],
    },
    {
      title: 'Collab Oficial con Azuquita',
      desc: 'El streamer estrella de ORTERIX te propone hacer un stream conjunto. Es un salto enorme de visibilidad.',
      opciones: [
        { text: 'Aceptar y cederle el protagonismo', detail: 'Venir a sumar, no a competir.', prob: 0.68,
          exito:   { seg: 14000, din: 4, msg: 'El stream fue un éxito. La comunidad de Azuquita te adoptó.' },
          fracaso: { seg: -3000, din: 0, msg: 'Quedaste opacado. La audiencia ni te registró al lado suyo.' } },
        { text: 'Proponer un formato donde los dos brillen', detail: 'Negociar los términos creativos.', prob: 0.48,
          exito:   { seg: 20000, din: 6, msg: 'El formato fue brillante. Ambos crecieron. Hablan de ustedes como dupla.' },
          fracaso: { seg: -6000, din: 0, msg: 'La negociación enfrió la idea. La collab salió sin la energía del principio.' } },
      ],
    },
    {
      title: 'Maratón Gaming 12 Horas',
      desc: 'ORTERIX organiza su maratón anual y te quieren como uno de los protagonistas. 12 horas en vivo.',
      opciones: [
        { text: 'Estar las 12 horas sin parar', detail: 'Compromiso total con el evento.', prob: 0.46,
          exito:   { seg: 14000, din: 5, msg: 'Llegaste al final. El chat enloqueció en la hora 12. Histórico.' },
          fracaso: { seg: 2000, din: 1, msg: 'Te quedaste dormido en hora 9. El clip se viralizó, pero no como querías.' } },
        { text: 'Hacer los horarios pico y descansar', detail: 'Calidad sobre cantidad.', prob: 0.74,
          exito:   { seg: 7000, din: 2, msg: 'Cada aparición fue de alto nivel. El canal quedó muy conforme.' },
          fracaso: { seg: 1000, din: 1, msg: 'Tu ausencia en horas clave fue notada. No causaste impacto.' } },
      ],
    },
    {
      title: ORTERIX_BOXING_TITLE,
      desc: 'Azuquita Rodrigues arma el evento del año: boxeo de streamers. Hay sponsors, hay cámara, hay expectativa. Y te quiere a vos adentro del ring.',
      isSpecial: true,
      opciones: [
        { text: 'Aceptás y entrenás a fondo', detail: 'Si vas, vas en serio.', prob: 0.50,
          exito:   { seg: 20000, din: 6, msg: 'Diste un show inolvidable. Alzaste el cinto ante miles de espectadores. ORTERIX explotó de orgullo.' },
          fracaso: { seg: -15000, din: 0, msg: 'Te lo tomaste demasiado en serio. Dejaste inconsciente al Puerro en el primer round. Las redes te destruyeron: "Es un psicópata."' } },
        { text: 'Aceptás pero lo tomás tranqui', detail: 'Un show, no una guerra.', prob: 0.55,
          exito:   { seg: 10000, din: 3, msg: 'Tu rival tampoco entrenó. Dieron un buen show y ganaste por puntos. El chat lo disfrutó de principio a fin.' },
          fracaso: { seg: -8000, din: 0, msg: 'Te cagaron a trompadas durante tres rounds. Las redes llenaron de memes sobre lo inútil que sos peleando.' } },
      ],
    },
    {
      title: WARIO_PAY_TITLE,
      desc: 'Wario Mengolini, el dueño de ORTERIX, te llama a una reunión sorpresa. Quiere pagarte el sueldo en cuotas por "un tema de flujo de caja". La cara de duda que ponés no le importa.',
      opciones: [
        { text: 'Aceptás. Algo es algo.', detail: 'No es el momento de hacerse el difícil.', prob: 1,
          exito:   { seg: 2000, din: -4, msg: 'Aceptaste sin drama. Wario lo tomó como un gesto de lealtad. La plata llegó en tres cuotas, pero el canal te empezó a dar más espacio.' },
          fracaso: { seg: 0, din: 0, msg: '' } },
        { text: 'Te negás. El sueldo es el sueldo.', detail: 'Tus derechos son tus derechos.', prob: 0,
          exito:   { seg: 0, din: 0, msg: '' },
          fracaso: { seg: -2000, din: 0, msg: 'Wario te palmea la espalda y se va. Al día siguiente te llaman: "El canal va en otra dirección." Salís a buscar trabajo.', specialOutcome: 'forcedTransfer' } },
      ],
    },
  ],

  ALGA: [
    {
      title: 'Panel de Improvisación con Migue',
      desc: 'Migue Granate te invita a su segmento estrella de improvisación. El caos es el formato.',
      opciones: [
        { text: 'Soltar todo, puro instinto', detail: 'Sin preparación, sin freno.', prob: 0.48,
          exito:   { seg: 17000, din: 5, msg: 'Fue el segmento más visto del mes. Migue te abrazó al terminar.' },
          fracaso: { seg: -8000, din: 0, msg: 'Te bloqueaste en vivo. El silencio fue incómodo para todos.' } },
        { text: 'Preparar algunos bits de antemano', detail: 'Improvisación con estructura.', prob: 0.70,
          exito:   { seg: 9000, din: 3, msg: 'La preparación se notó de buena manera. Sólido y entretenido.' },
          fracaso: { seg: -2000, din: 0, msg: 'Los bits preparados chocaron con el caos de Migue. No fluyó.' } },
      ],
    },
    {
      title: 'Entrevista en Modo Caos',
      desc: 'ALGA consigue una figura famosa. El formato: preguntas sin filtro, respuestas sin edición. Migue te da la silla.',
      opciones: [
        { text: 'Ir al caos total sin ningún límite', detail: 'El show sobre todo.', prob: 0.40,
          exito:   { seg: 22000, din: 7, msg: 'La entrevista más comentada del año. El invitado se convirtió en meme.' },
          fracaso: { seg: -9000, din: 0, msg: 'El invitado se fue al corte. ALGA tuvo que pedir disculpas públicas.' } },
        { text: 'Caos controlado: gracioso pero respetuoso', detail: 'Equilibrio entre show y forma.', prob: 0.73,
          exito:   { seg: 12000, din: 4, msg: 'Entrevista memorable. El invitado quedó bien y vos quedaste mejor.' },
          fracaso: { seg: -3000, din: 0, msg: 'El equilibrio no se encontró. Ni caos ni entrevista real.' } },
      ],
    },
    {
      title: 'El Clip Viral de Migue te Involucra',
      desc: 'Un momento de Migue se viraliza masivamente y te mencionó por nombre. Las redes arden.',
      opciones: [
        { text: 'Publicar contenido propio de inmediato', detail: 'Surfear la ola antes de que baje.', prob: 0.56,
          exito:   { seg: 15000, din: 4, msg: 'El timing fue perfecto. Tu contenido llegó cuando todos te buscaban.' },
          fracaso: { seg: -5000, din: 0, msg: 'El contenido que publicaste no estuvo a la altura del momento.' } },
        { text: 'Hacer un live conjunto con Migue', detail: 'Aprovechar su base directamente.', prob: 0.67,
          exito:   { seg: 11000, din: 3, msg: 'El live conjunto fue el cierre perfecto del momento viral.' },
          fracaso: { seg: -1000, din: 0, msg: 'La coordinación falló. El live salió tarde y el momento ya había pasado.' } },
      ],
    },
    {
      title: 'Programa Especial de Entrevistas',
      desc: 'ALGA hace una maratón de entrevistas. Te asignan el invitado más difícil de manejar de toda la grilla.',
      opciones: [
        { text: 'Abrazar la dificultad, hacer algo diferente', detail: 'El riesgo como estrategia.', prob: 0.42,
          exito:   { seg: 24000, din: 8, msg: 'Lo imposible se volvió el segmento más comentado. Leyenda.' },
          fracaso: { seg: -10000, din: 0, msg: 'El invitado te dominó en vivo. La diferencia fue demasiado visible.' } },
        { text: 'Entrevista clásica con humor estratégico', detail: 'Jugar sobre seguro con estilo.', prob: 0.71,
          exito:   { seg: 13000, din: 4, msg: 'Entrevista fluida y con momentos de humor que la hicieron especial.' },
          fracaso: { seg: -2000, din: 0, msg: 'El invitado difícil pudo con vos. Resultado plano.' } },
      ],
    },
    {
      title: 'Debate Espontáneo en Vivo',
      desc: 'En el medio de un stream, Migue lanza un debate no planeado y te da la palabra sin aviso previo.',
      opciones: [
        { text: 'Tomar el debate y llevarlo al extremo', detail: 'Improvisación pura.', prob: 0.47,
          exito:   { seg: 19000, din: 5, msg: 'El debate explotó. Tu posición fue la más discutida de la noche.' },
          fracaso: { seg: -7000, din: 0, msg: 'No tenías argumentos listos. Quedaste sin respuestas convincentes.' } },
        { text: 'Aportar desde un lugar más tranquilo', detail: 'No todo tiene que ser extremo.', prob: 0.68,
          exito:   { seg: 8000, din: 2, msg: 'La calma contrastó bien con el caos. Tu voz se diferenció.' },
          fracaso: { seg: -1000, din: 0, msg: 'Quedaste opacado entre las voces más fuertes del panel.' } },
      ],
    },
    {
      title: 'Día Homenaje a Pito Faez',
      desc: 'ALGA organiza un homenaje especial a Pito Faez. En pleno programa, Migue Granate te pasa el micrófono y te ofrece cantar un tema del artista en vivo.',
      opciones: [
        { text: 'Cantás. Total, estamos en ALGA.', detail: 'Si no es acá, ¿dónde?', prob: 0.45,
          exito:   { seg: 16000, din: 4, msg: 'La rompiste. El chat explotó, Migue se emocionó y el homenaje quedó para la historia de ALGA.' },
          fracaso: { seg: -11000, din: 0, msg: 'Desafinaste de principio a fin. El clip circuló toda la semana pero no de la manera que querías.' } },
        { text: 'Te negás. No es lo tuyo.', detail: 'Cada uno en lo suyo.', prob: 0.60,
          exito:   { seg: 6000, din: 2, msg: 'El homenaje fue épico igual. Tu negativa fue honesta y te ganaste el respeto del canal.' },
          fracaso: { seg: -4000, din: -3, msg: 'Migue lo tomó como falta de compromiso con el espíritu del canal. Te empezaron a dar menos espacio en la grilla.' } },
      ],
    },
    {
      title: 'Un nene habla de política en vivo',
      desc: 'Trajiste a la estrella infantil Jota a tu programa y el estudio se lleno de niños. Le acercás el micrófono a uno de ellos. El nene grita "TODOS ACÁ ODIAMOS AL PRESIDENTE".',
      opciones: [
        { text: 'Le sacás el micrófono y cambias de tema', detail: 'No querés quilombo.', prob: 0.60,
          exito:   { seg: 1000, din: 0, msg: 'Fuiste rápido y nadie se dio cuenta. La entrevista siguió su curso.' },
          fracaso: { seg: -5000, din: 0, msg: 'En el arrebato le pegás al nene sin querer y este llora. Las redes te matan.' } },
        { text: 'Te reís de la ocurrencia', detail: 'Confiemos en el caos.', prob: 0.40,
          exito:   { seg: 2000, din: 0, msg: 'Tu risa contagia al resto del equipo. Queda como un clip gracioso.' },
          fracaso: { seg: -2000, din: 0, msg: 'En las redes te tildan de golpista. El presidente comparte el clip y comenta "Asi operan los zurdos".' } },
      ],
    },
    {
      title: 'Sketch polémico',
      desc: 'En una lluvia de ideas dijiste que querías hacer una parodia del pesebre. Lo llevaste a cabo, te pusiste un pañal y fingiste ser Jesús pero a la gente no le gustó.',
      opciones: [
        { text: 'Pedís disculpas al día siguiente', detail: 'Con eso no se jode', prob: 0.70,
          exito:   { seg: 500, din: 0, msg: 'La mayoría te perdona y pasas página rápido' },
          fracaso: { seg: -5000, din: 0, msg: 'No lograste sonar convincente y te reíste de los nervios. Peor.' } },
        { text: 'Defendés el sketch', detail: 'El humor sana', prob: 0.30,
          exito:   { seg: 8000, din: 0, msg: 'Das un discurso sobre la doble moral y sobre el humor. Te los metiste a todos en el bolsillo' },
          fracaso: { seg: 0, din: 0, msg: 'Granate te llama en privado y te echa.', specialOutcome: 'forcedTransfer' } },
      ],
    },
    {
      title: ALGA_CAR_TITLE,
      desc: 'Estás transmitiendo en vivo desde la entrada del canal cuando un auto frena de golpe a centímetros tuyo. El susto es real.',
      isForced: true,
      opciones: [
        { text: 'CONTINUAR', detail: '', prob: 0,
          exito:   { seg: 0, din: 0, msg: '' },
          fracaso: { seg: 9000, din: -3, msg: 'Saliste corriendo con el micrófono puesto. El clip se volvió viral en minutos. Ganaste seguidores pero en el ambiente ahora te llaman "el cagón de ALGA".' } },
      ],
    },
  ],

  ASS: [
    {
      title: 'Clásico Argentino en Vivo',
      desc: 'ASS cubre el partido más importante del año. Fabio Assado te ofrece un lugar en la transmisión principal.',
      opciones: [
        { text: 'Análisis técnico en tiempo real', detail: 'Datos, contexto, profundidad.', prob: 0.62,
          exito:   { seg: 10000, din: 3, msg: 'Precisión quirúrgica. Los hinchas te aceptaron como voz autorizada.' },
          fracaso: { seg: -2000, din: 1, msg: 'Errores en los análisis durante momentos clave. Las críticas dolieron.' } },
        { text: 'Panel de debate post-partido', detail: 'El fútbol como disparador.', prob: 0.55,
          exito:   { seg: 12000, din: 3, msg: 'Debate encendido. Los clips circularon toda la noche en redes.' },
          fracaso: { seg: -3000, din: 0, msg: 'El debate se descontroló. ASS quedó expuesto negativamente.' } },
      ],
    },
    {
      title: 'Entrevista Exclusiva con Figura del Fútbol',
      desc: 'ASS tiene acceso a una de las grandes figuras del fútbol argentino. Fabio Assado te confía la entrevista.',
      opciones: [
        { text: 'Las preguntas que nadie se anima a hacer', detail: 'Periodismo que incomoda.', prob: 0.38,
          exito:   { seg: 23000, din: 7, msg: 'Preguntaste lo que todos querían saber. Entrevista histórica del canal.' },
          fracaso: { seg: -5000, din: 0, msg: 'El jugador se cerró en banda. Un desastre en vivo frente a todos.' } },
        { text: 'Entrevista cálida y sin presión', detail: 'Que el entrevistado se abra solo.', prob: 0.74,
          exito:   { seg: 11000, din: 3, msg: 'El jugador se abrió y dijo cosas que nunca había dicho. Oro puro.' },
          fracaso: { seg: 1000, din: 1, msg: 'Correcta pero previsible. Sin momentos propios que la distingan.' } },
      ],
    },
    {
      title: 'Debate de Fichajes Polémico',
      desc: 'Una transferencia importante sacude al fútbol argentino. ASS quiere voces fuertes.',
      opciones: [
        { text: 'Opinión contundente y sin filtros', detail: 'Decir lo que se piensa.', prob: 0.44,
          exito:   { seg: 17000, din: 4, msg: 'Análisis valiente y fundamentado. Trending topic de la noche.' },
          fracaso: { seg: -9000, din: 0, msg: 'Opinión que cayó fatal entre los hinchas más numerosos. Crisis.' } },
        { text: 'Presentar todos los ángulos', detail: 'Ecuanimidad como ventaja.', prob: 0.72,
          exito:   { seg: 6000, din: 2, msg: 'Análisis serio y equilibrado. ASS valoró el profesionalismo.' },
          fracaso: { seg: -1000, din: 1, msg: 'Te vieron sin posición propia. Nadie quedó conforme.' } },
      ],
    },
    {
      title: 'Ciclo de Debate Semanal de Fabio',
      desc: 'Fabio Assado propone un ciclo semanal y te quiere como figura fija. Es un compromiso largo.',
      opciones: [
        { text: 'Ser el conductor, no el panelista', detail: 'Tomar las riendas completamente.', prob: 0.55,
          exito:   { seg: 14000, din: 6, msg: 'El ciclo se convirtió en referencia del debate futbolístico argentino.' },
          fracaso: { seg: -4000, din: 1, msg: 'El formato no cuajó. Los números no convencieron a Fabio ni al canal.' } },
        { text: 'Aceptar el rol de panelista destacado', detail: 'Menos exposición, menos riesgo.', prob: 0.74,
          exito:   { seg: 5000, din: 3, msg: 'Tus intervenciones fueron siempre las más citadas del programa.' },
          fracaso: { seg: -1000, din: 2, msg: 'Buen panelista, pero sin momentos propios que te distingan del resto.' } },
      ],
    },
    {
      title: 'Cobertura del Mundial Sub-20',
      desc: 'ASS tiene los derechos del torneo. Fabio Assado quiere que seas la cara de la cobertura.',
      opciones: [
        { text: 'Cobertura total, partido a partido', detail: 'La voz del torneo completo.', prob: 0.55,
          exito:   { seg: 14000, din: 5, msg: 'Fuiste la voz del torneo. Completo, apasionado, omnipresente.' },
          fracaso: { seg: -2000, din: 2, msg: 'El desgaste se notó. Los últimos partidos fueron de baja calidad.' } },
        { text: 'Solo los partidos de mayor impacto', detail: 'Calidad sobre presencia.', prob: 0.68,
          exito:   { seg: 7000, din: 3, msg: 'Cobertura selectiva de alta calidad. El canal quedó más que conforme.' },
          fracaso: { seg: -1000, din: 2, msg: 'Algunos fans sintieron que no estuviste cuando más se te necesitaba.' } },
      ],
    },
  ],

  'RUZU TV': [
    {
      title: 'Panel de Primeras Citas en Vivo',
      desc: 'RUZU TV hace su segmento estrella: comentar primeras citas reales en tiempo real. Nico Bognato te pone al frente.',
      opciones: [
        { text: 'Ser el más irreverente del panel', detail: 'Sin autocensura, todo vale.', prob: 0.52,
          exito:   { seg: 12000, din: 3, msg: 'Tus comentarios fueron los más citados. El segmento explotó por vos.' },
          fracaso: { seg: -6000, din: 0, msg: 'Pasaste el límite. Las personas en pantalla se ofendieron en vivo.' } },
        { text: 'El que da los consejos inesperadamente buenos', detail: 'Contraste inesperado.', prob: 0.70,
          exito:   { seg: 7000, din: 2, msg: 'El contraste entre el caos y tus consejos fue el momento del programa.' },
          fracaso: { seg: -1000, din: 0, msg: 'Los consejos serios no pegaron en un formato tan caótico.' } },
      ],
    },
    {
      title: 'Desafío de Humor Sin Filtros de Nico',
      desc: 'Nico Bognato lanza el desafío más famoso de RUZU: el chiste más arriesgado posible. Millones esperando.',
      opciones: [
        { text: 'Ir sin límites, sin autocensura', detail: 'Todo o nada.', prob: 0.40,
          exito:   { seg: 17000, din: 4, msg: 'El chiste se convirtió en leyenda del canal. Nico te aplaudió de pie.' },
          fracaso: { seg: -10000, din: 0, msg: 'Cruzaste una línea que no se debía cruzar. Crisis mediática.' } },
        { text: 'Arriesgado pero con criterio propio', detail: 'Límite elegido, no impuesto.', prob: 0.66,
          exito:   { seg: 9000, din: 3, msg: 'El chiste funcionó y quedaste bien parado. Raro y difícil lograrlo en RUZU.' },
          fracaso: { seg: -3000, din: 0, msg: 'Nico consideró que faltó valentía. La audiencia de RUZU lo notó.' } },
      ],
    },
    {
      title: 'Cobertura de Actualidad al Estilo RUZU',
      desc: 'Un tema serio del día, pero RUZU lo quiere con su filtro: caótico, directo y sin protocolo.',
      opciones: [
        { text: 'Sumarte al caos sin pensar demasiado', detail: 'Fluir con el formato.', prob: 0.56,
          exito:   { seg: 11000, din: 2, msg: 'Fue lo que RUZU necesitaba. Natural, caótico y muy visto.' },
          fracaso: { seg: -4000, din: 0, msg: 'Sin control ni estructura, el segmento fue un quilombo sin gracia.' } },
        { text: 'Aportar algo de análisis entre las risas', detail: 'Contenido entre el ruido.', prob: 0.67,
          exito:   { seg: 7000, din: 3, msg: 'El contraste te diferenció. Te vieron como una voz distinta en RUZU.' },
          fracaso: { seg: -1000, din: 0, msg: 'El análisis serio mató el ritmo del segmento. No encajó.' } },
      ],
    },
    {
      title: 'Collab Picante con Nico Bognato',
      desc: 'Nico propone un stream de dos horas solo con vos. El formato explícito: sin temas prohibidos.',
      opciones: [
        { text: 'Aceptar sin condiciones', detail: 'Total apertura al formato.', prob: 0.50,
          exito:   { seg: 15000, din: 4, msg: 'Dos horas de contenido que el canal jamás olvidará. Histórico para RUZU.' },
          fracaso: { seg: -7000, din: 0, msg: 'El stream se fue a un lugar del que ninguno pudo salir bien parado.' } },
        { text: 'Establecer un límite claro antes', detail: 'Tus reglas en el juego de Nico.', prob: 0.63,
          exito:   { seg: 8000, din: 2, msg: 'La tensión entre tus límites y el estilo de Nico fue el mejor contenido.' },
          fracaso: { seg: -2000, din: 0, msg: 'Nico se aburrió rápido. El límite le quitó la gracia al formato.' } },
      ],
    },
    {
      title: 'Debate Banal que se Pone Serio',
      desc: 'Empieza como un debate sobre comida o música y termina tocando un nervio real. Nico te da la palabra.',
      opciones: [
        { text: 'Llevarlo al nivel serio sin avergonzarte', detail: 'El fondo emerge naturalmente.', prob: 0.57,
          exito:   { seg: 10000, din: 3, msg: 'El viraje fue el mejor momento del programa. Nadie lo vio venir.' },
          fracaso: { seg: -3000, din: 0, msg: 'El tono serio mató el humor y el nuevo tema tampoco cuajó.' } },
        { text: 'Mantenerlo liviano y bajar la tensión', detail: 'Humor como herramienta.', prob: 0.71,
          exito:   { seg: 6000, din: 2, msg: 'Salvaste el momento. El segmento terminó bien y todos quedaron cómodos.' },
          fracaso: { seg: 0, din: 0, msg: 'Ni un lado ni el otro. El programa terminó sin pena ni gloria.' } },
      ],
    },
  ],

  RENDER: [
    {
      title: 'Entrevista a Político Polémico',
      desc: 'RENDER consiguió al político más debatido del momento. Tomás Report te confía la entrevista.',
      opciones: [
        { text: 'Las preguntas que nadie se anima a hacer', detail: 'Periodismo sin concesiones.', prob: 0.40,
          exito:   { seg: 21000, din: 6, msg: 'Preguntaste lo que todo el país quería escuchar. Clip millonario.' },
          fracaso: { seg: -8000, din: 0, msg: 'El político se enojó y cortó la entrevista. Escándalo para RENDER.' } },
        { text: 'Entrevista equilibrada y periodísticamente sólida', detail: 'Forma sobre show.', prob: 0.74,
          exito:   { seg: 11000, din: 4, msg: 'Entrevista rigurosa. Ganaste credibilidad en el ambiente político.' },
          fracaso: { seg: -2000, din: 0, msg: 'El político manejó la entrevista a su favor. Quedaste por debajo.' } },
      ],
    },
    {
      title: 'Debate de Actualidad en Vivo',
      desc: 'Hay una noticia urgente. Tomás Report te manda al aire en diez minutos. Sin tiempo de preparar nada.',
      opciones: [
        { text: 'Improvisar con lo que sabés', detail: 'Confiar en el conocimiento acumulado.', prob: 0.50,
          exito:   { seg: 13000, din: 3, msg: 'La improvisación fue sólida. Te reconocieron como alguien que sabe.' },
          fracaso: { seg: -5000, din: 0, msg: 'Los errores factuales en vivo destruyeron la credibilidad del segmento.' } },
        { text: 'Pedir diez minutos para informarte bien', detail: 'La preparación como responsabilidad.', prob: 0.67,
          exito:   { seg: 8000, din: 3, msg: 'La espera valió la pena. El análisis fue de los mejores del canal.' },
          fracaso: { seg: -2000, din: 0, msg: 'Para cuando saliste, la noticia ya la habían cubierto todos los demás.' } },
      ],
    },
    {
      title: 'Investigación Periodística Propia',
      desc: 'Tomás Report te propone llevar una investigación propia al aire. El tema es sensible y el impacto puede ser enorme.',
      opciones: [
        { text: 'Publicar ahora, el tiempo es clave', detail: 'El primero en llegar gana.', prob: 0.38,
          exito:   { seg: 26000, din: 8, msg: 'La investigación fue el tema del año. RENDER es la fuente de todos.' },
          fracaso: { seg: -12000, din: 0, msg: 'Datos sin verificar. La desmentida fue peor que la nota original.' } },
        { text: 'Verificar cada dato antes de salir', detail: 'La credibilidad se construye despacio.', prob: 0.76,
          exito:   { seg: 15000, din: 5, msg: 'Investigación impecable. Nadie pudo impugnar un solo dato.' },
          fracaso: { seg: -1000, din: 0, msg: 'La verificación tardó demasiado. Otro medio publicó primero.' } },
      ],
    },
    {
      title: 'Cobertura de Crisis Política',
      desc: 'Estalla una crisis de gobierno. RENDER entra en modo 24/7 y te proponen como cara visible de la cobertura.',
      opciones: [
        { text: 'Estar al aire las 24 horas', detail: 'El canal antes que todo.', prob: 0.47,
          exito:   { seg: 19000, din: 6, msg: 'Fuiste la referencia de la crisis. El país entero miraba RENDER y a vos.' },
          fracaso: { seg: -4000, din: 0, msg: 'El agotamiento se vio. En hora 18 ya no había análisis, solo errores.' } },
        { text: 'Coberturas de 4 horas con análisis profundo', detail: 'Sostenible y de calidad.', prob: 0.69,
          exito:   { seg: 12000, din: 4, msg: 'Cobertura de alta calidad. Te diferenciaste del ruido de los demás medios.' },
          fracaso: { seg: -1000, din: 0, msg: 'La audiencia quería continuidad. Tus ausencias entre bloques los alejaron.' } },
      ],
    },
    // ── EVENTO: El co-conductor se entera en vivo que será echado
    {
      title: CO_CONDUCTOR_TITLE,
      desc: 'En plena transmisión, tu co-conductor se entera de que va a ser despedido. Explota en el aire: insulta al canal, a los dueños, a todos. Las redes arden. Vos estás ahí al lado.',
      opciones: [
        { text: 'No decís nada. Dejás que pase.', detail: 'Silencio estratégico.', prob: 0.60,
          exito:   { seg: 5000, din: 3, msg: 'Echan al conductor y no a vos. RENDER te ve como alguien que sabe mantener la calma.' },
          fracaso: { seg: -9000, din: 0, msg: 'Las redes te destruyen: "Tibio", "Cómplice del canal", "Sin carácter". El hateo dura semanas.' } },
        { text: 'Lo apoyás con chistes irónicos en vivo', detail: 'Acompañarlo con humor.', prob: 0.40,
          exito:   { seg: 14000, din: 2, msg: 'Las redes te aman. "El que estuvo con su compañero hasta el final." Momento histórico del canal.' },
          fracaso: { seg: -6000, din: -4, msg: 'Los dueños te citan al día siguiente: "Por hacerte el vivo en un momento serio, tu contrato se rescinde." Te echan.', specialOutcome: 'forcedTransfer' } },
      ],
    },

    // ── EVENTO FORZADO: Brote de tuberculosis (sin opciones reales, resultado siempre negativo)
    {
      title: TUBERCULOSIS_TITLE,
      desc: 'Un brote de tuberculosis en el estudio se expande sin control. Te contagiás. Perdés un mes de programa, tus números tardan en recuperarse y varios invitados que tenías planeados se dan de baja por tu ausencia.',
      isForced: true,
      opciones: [
        { text: 'CONTINUAR', detail: '', prob: 0,
          exito:   { seg: 0, din: 0, msg: '' },
          fracaso: { seg: -11000, din: -5, msg: 'Un mes sin stream. Los números cayeron y los invitados cancelaron. Cuando volviste, tuviste que empezar casi de cero.' } },
      ],
    },

    // ── EVENTO ESPECIAL único por partida: Mosquita Fart al Mundial
    {
      title: 'COBERTURA MUNDIAL',
      desc: 'Durante el programa en vivo te enterás que el canal mandará a Mosquita Fart para la cobertura del Mundial. A la piba le tirás una pelota y le saca los gajos.',
      isSpecial: true,
      opciones: [
        { text: 'Mirás a cámara con cara de "Daaaale"', detail: 'Que el público lo interprete.', prob: 0.55,
          exito:   { seg: 3000, din: 4, msg: 'Todos lo leyeron como un chiste. Tu cara se viralizó y el canal, en lugar de enojarse, te subió el sueldo para calmarte.' },
          fracaso: { seg: -4000, din: -3, msg: 'En el corte se acerca el productor: "Respetá los rangos." Te bajan el sueldo y te advierten formalmente.' } },
        { text: 'Te quejás por redes', detail: 'Decís lo que pensás públicamente.', prob: 0.40,
          exito:   { seg: 12000, din: -2, msg: 'Los fans te aman y tu posteo se hace viral. Pero los dueños te tienen entre ceja y ceja. El ambiente interno se pone tenso.' },
          fracaso: { seg: -7000, din: 0, msg: 'Los dueños no perdonan la queja pública. Te llaman y te dicen que tu contrato no se renueva. Salís a buscar canal.', specialOutcome: 'forcedTransfer' } },
      ],
    },

    // ── EVENTO ESPECIAL: solo ocurre una vez (state.renderSold lo controla)
    {
      title: RENDER_SOLD_TITLE,
      desc: 'A mitad de temporada, RENDER anuncia que fue adquirido por un nuevo grupo mediático. Todos los contratos del staff quedan rescindidos de inmediato. No hay apelación posible.',
      isSpecial: true,
      opciones: [
        { text: 'Intentar quedarte en el canal reformado', detail: 'Quizás el nuevo dueño te renueve.', prob: 0.05,
          exito:   { seg: 3000, din: 0, msg: 'El nuevo dueño decidió renovarte por una sola temporada... rarísimo.', specialOutcome: 'forcedTransfer' },
          fracaso: { seg: -5000, din: 0, msg: 'El nuevo dueño no renovó ningún contrato. Te quedás sin trabajo de un día para el otro.', specialOutcome: 'forcedTransfer' } },
        { text: 'Agarrar las cosas y salir antes de que te echen', detail: 'Salir con dignidad.', prob: 0.95,
          exito:   { seg: 1000, din: 3, msg: 'Saliste con dignidad. En el ambiente todos saben lo que pasó y te respetan por eso.', specialOutcome: 'forcedTransfer' },
          fracaso: { seg: -2000, din: 0, msg: 'La salida se hizo pública de mala manera. Igual te fuiste, pero sin la mejor imagen.', specialOutcome: 'forcedTransfer' } },
      ],
    },
  ],

  CARANCHO: [
    {
      title: 'Propaganda en Horario Central',
      desc: 'El Gordo Pan quiere que defiendas la posición del gobierno en vivo durante el horario de mayor audiencia. Sin matices.',
      opciones: [
        { text: 'Defender al 100%, sin fisuras', detail: 'La línea del canal, completa.', prob: 0.67,
          exito:   { seg: 9000, din: 5, msg: 'El Gordo Pan te felicitó en vivo. El canal quedó muy satisfecho.' },
          fracaso: { seg: -5000, din: 0, msg: 'Hubo un momento donde no tenías respuesta. El canal lo notó.' } },
        { text: 'Matizar el mensaje sutilmente', detail: 'Un gramo de honestidad propia.', prob: 0.38,
          exito:   { seg: 16000, din: 3, msg: 'El matiz generó debate y paradójicamente aumentó la audiencia.' },
          fracaso: { seg: -8000, din: 0, msg: 'CARANCHO no tolera matices. El Gordo Pan lo tomó como una traición.' } },
      ],
    },
    {
      title: 'Entrevista a Funcionario Oficialista',
      desc: 'El Gordo Pan consiguió un ministro. El formato es claro: preguntas amigables, ninguna incomodidad.',
      opciones: [
        { text: 'Seguir el guión del canal al pie de la letra', detail: 'La entrevista que el canal quiere.', prob: 0.72,
          exito:   { seg: 7000, din: 5, msg: 'El funcionario quedó contento. El canal también. El trabajo, hecho.' },
          fracaso: { seg: -3000, din: 0, msg: 'Incluso siguiendo el guión, algo salió mal. El funcionario se molestó.' } },
        { text: 'Lanzar una pregunta incómoda de rebote', detail: 'Un momento de periodismo real.', prob: 0.33,
          exito:   { seg: 19000, din: 6, msg: 'La pregunta incómoda se viralizó. Inesperadamente, incluso CARANCHO la celebró.' },
          fracaso: { seg: -10000, din: 0, msg: 'El Gordo Pan cortó tu micrófono en vivo. Crisis interna sin precedentes.' } },
      ],
    },
    {
      title: 'Evento de Campaña en Vivo',
      desc: 'CARANCHO organiza un evento político masivo. El Gordo Pan quiere que seas el streamer estrella de la cobertura.',
      opciones: [
        { text: 'Cobertura con entusiasmo total', detail: 'Comprometerte con el evento.', prob: 0.63,
          exito:   { seg: 11000, din: 5, msg: 'Tu energía contagió. El evento fue un éxito y vos fuiste parte de eso.' },
          fracaso: { seg: -2000, din: 0, msg: 'El evento tuvo problemas técnicos. Tu cobertura los amplificó.' } },
        { text: 'Cobertura neutral, sin tomar partido', detail: 'El periodismo por sobre la política.', prob: 0.42,
          exito:   { seg: 7000, din: 2, msg: 'La neutralidad en CARANCHO fue vista como valentía. Inusual y efectiva.' },
          fracaso: { seg: -9000, din: 0, msg: 'CARANCHO no contrató a alguien neutral. Te dejaron fuera del evento principal.' } },
      ],
    },
    {
      title: 'Te Piden Atacar a un Periodista Rival',
      desc: 'La dirección del canal te manda un mensaje claro: tenés que ir contra un periodista de otro medio en vivo.',
      opciones: [
        { text: 'Hacerlo: seguir la línea del canal', detail: 'Prioridad al contrato.', prob: 0.57,
          exito:   { seg: 9000, din: 4, msg: 'El ataque fue efectivo según los estándares de CARANCHO. El canal quedó conforme.' },
          fracaso: { seg: -5000, din: 0, msg: 'El periodista atacado respondió mejor. Te hiciste quedar mal a vos mismo.' } },
        { text: 'Negarte a atacar a otra persona', detail: 'Tu integridad primero.', prob: 0.48,
          exito:   { seg: 13000, din: 3, msg: 'La negativa se viralizó. Paradójicamente, ganaste seguidores fuera de CARANCHO.' },
          fracaso: { seg: -10000, din: 0, msg: 'CARANCHO no negocia la línea editorial. Tu posición dentro del canal peligra.' } },
      ],
    },
    {
      title: 'El Escándalo: CARANCHO y RENDER, el Mismo Dueño',
      desc: 'Sale a la luz que CARANCHO y RENDER tienen el mismo propietario. El escándalo mediático es monumental.',
      opciones: [
        { text: 'Defender la situación en nombre del canal', detail: 'El canal te pide que salgas a aclarar.', prob: 0.45,
          exito:   { seg: 6000, din: 6, msg: 'Lograste bajar la temperatura. El canal te lo agradeció con un bono.' },
          fracaso: { seg: -12000, din: 0, msg: 'La defensa fue insostenible. Te convirtieron en el blanco de todas las críticas.' } },
        { text: 'Salir del tema con humor y esquivar', detail: 'No querer saber nada.', prob: 0.64,
          exito:   { seg: 7000, din: 2, msg: 'El humor desactivó el momento. El canal respiró aliviado.' },
          fracaso: { seg: -4000, din: 0, msg: 'El chiste cayó pésimo en un momento serio. Peor el remedio que la enfermedad.' } },
      ],
    },
  ],

  QUERATINA: [
    {
      title: 'Panel Peronista de Alto Voltaje',
      desc: 'QUERATINA arma un panel con dirigentes, militantes y periodistas del palo. El tema: la interna del movimiento. Pepe Racinclub te pone a moderar.',
      opciones: [
        { text: 'Moderar con mano firme sin tomar partido', detail: 'Periodismo por sobre la militancia.', prob: 0.55,
          exito:   { seg: 9000, din: 3, msg: 'Panel intenso pero ordenado. Te ganaste el respeto de los distintos sectores del movimiento.' },
          fracaso: { seg: -4000, din: 0, msg: 'Los panelistas te pasaron por encima. Perdiste el control y el canal quedó expuesto.' } },
        { text: 'Sumarte al debate y tomar posición', detail: 'Bancar la línea del canal.', prob: 0.48,
          exito:   { seg: 14000, din: 4, msg: 'Tu posición fue clara y contundente. La militancia te adoptó. El panel fue trending.' },
          fracaso: { seg: -7000, din: 0, msg: 'La interna del movimiento te comió. Quedaste en el medio de un fuego cruzado del que no pudiste salir.' } },
      ],
    },
    {
      title: 'Entrevista a un Referente del Movimiento',
      desc: 'QUERATINA consiguió a una figura histórica del peronismo. Pepe Racinclub te confía la entrevista. La audiencia del canal la espera hace semanas.',
      opciones: [
        { text: 'Preguntas críticas, periodismo sin concesiones', detail: 'La figura lo merece.', prob: 0.42,
          exito:   { seg: 19000, din: 5, msg: 'Preguntaste lo que nadie se animaba a preguntar. La entrevista fue histórica para el canal.' },
          fracaso: { seg: -8000, din: 0, msg: 'El referente se cerró y la entrevista murió antes de empezar. QUERATINA no te lo perdonó fácil.' } },
        { text: 'Entrevista respetuosa y de fondo', detail: 'Que el entrevistado se abra solo.', prob: 0.72,
          exito:   { seg: 11000, din: 3, msg: 'La figura habló como nunca. Momento emotivo que el canal usó durante semanas.' },
          fracaso: { seg: -2000, din: 0, msg: 'Correcta pero sin momentos propios. La audiencia esperaba más profundidad.' } },
      ],
    },
    {
      title: 'Cobertura del Festival de Cine Nacional',
      desc: 'QUERATINA cubre el festival de cine argentino más importante del año. Te mandan a vos a la alfombra roja y a las funciones.',
      opciones: [
        { text: 'Análisis cinematográfico serio, película por película', detail: 'El cine merece respeto.', prob: 0.60,
          exito:   { seg: 8000, din: 3, msg: 'Tu cobertura fue la más completa del festival. El ambiente cinéfilo te empezó a seguir.' },
          fracaso: { seg: -2000, din: 0, msg: 'El análisis fue demasiado técnico para la audiencia habitual del canal. Los números no acompañaron.' } },
        { text: 'Entrevistas al paso en la alfombra roja', detail: 'El espectáculo por sobre el análisis.', prob: 0.65,
          exito:   { seg: 12000, din: 4, msg: 'Los clips de las entrevistas circularon en todos lados. Momento espontáneo que hizo quedar bien al canal.' },
          fracaso: { seg: -3000, din: 0, msg: 'Un director conocido te cortó la entrevista en vivo porque no te sabía el nombre. Viral, pero no del bueno.' } },
      ],
    },
    {
      title: 'Escándalo Político en Vivo',
      desc: 'Un dirigente cercano al canal protagoniza un escándalo en plena jornada. QUERATINA quiere reacción inmediata al aire.',
      opciones: [
        { text: 'Cubrirlo con datos y contexto, sin apasionamiento', detail: 'Periodismo antes que militancia.', prob: 0.58,
          exito:   { seg: 10000, din: 3, msg: 'Tu cobertura fue seria y equilibrada. Te diferenciaste del ruido general.' },
          fracaso: { seg: -3000, din: 0, msg: 'El canal esperaba más compromiso con la línea editorial. Quedaste como tibio.' } },
        { text: 'Opinar fuerte desde la línea del canal', detail: 'Bancar la posición sin dudar.', prob: 0.46,
          exito:   { seg: 16000, din: 4, msg: 'La posición fue contundente. La audiencia fiel de QUERATINA te aplaudió de pie.' },
          fracaso: { seg: -9000, din: 0, msg: 'El escándalo terminó siendo un fiasco y vos quedaste defendiendo lo indefendible en vivo.' } },
      ],
    },
    {
      title: 'Pepe Racinclub te Manda al Frente',
      desc: 'En plena transmisión, Pepe Racinclub te nombra frente a cámara y te pide que des tu opinión sobre un tema en el que no tenés posición clara. Sin aviso, sin tiempo.',
      opciones: [
        { text: 'Bancarte el momento y opinar igual', detail: 'Improvisar con lo que tenés.', prob: 0.50,
          exito:   { seg: 13000, din: 3, msg: 'La improvisación salió sólida. Pepe te guiñó el ojo al corte. Ganaste terreno en QUERATINA.' },
          fracaso: { seg: -6000, din: 0, msg: 'La opinión improvisada fue un desastre. Las redes lo agarraron y no lo soltaron.' } },
        { text: 'Devolverle la pelota a Pepe con una pregunta', detail: 'Redirigir sin quedar expuesto.', prob: 0.64,
          exito:   { seg: 7000, din: 2, msg: 'La maniobra fue elegante. Pepe lo tomó con humor y la situación se resolvió.' },
          fracaso: { seg: -3000, din: 0, msg: 'Pepe no aceptó la devolución. Te dejó en el aire frente a toda la audiencia.' } },
      ],
    },
    {
      title: QUERATINA_SONG_TITLE,
      desc: 'Un seguidor compuso una canción dedicada a una estrella de mar con un culo pronunciado. Sin que nadie lo planificara, el tema te involucra y te hacés viral en TikTok durante toda la semana.',
      isSpecial: true,
      opciones: [
        { text: 'Te montás en el viral. Lo compartís, lo bailás, lo hacés tuyo.', detail: 'Si ya sos meme, mejor serlo con dignidad.', prob: 0.58,
          exito:   { seg: 22000, din: 0, msg: 'El momento fue glorioso. Millones de vistas, apareciste en todos los medios y la canción sonó en un programa de TV. Pepe Racinclub no entendió nada pero festejó igual.' },
          fracaso: { seg: -5000, din: 0, msg: 'El intento de montarte en el viral quedó forzado. Las redes lo sintieron artificial y el chiste se convirtió en otro chiste, pero sobre vos.' } },
        { text: 'Lo ignorás. QUERATINA es un canal serio.', detail: 'La imagen política primero.', prob: 0.52,
          exito:   { seg: 3000, din: 0, msg: 'La decisión de no comentarlo fue leída como madurez. El viral pasó solo y tu imagen dentro del canal quedó intacta.' },
          fracaso: { seg: -8000, din: 0, msg: 'Ignorarlo fue un error. Todo el mundo hablaba del tema y tu silencio hizo que parecieras molesto. Las redes te hicieron meme igual, pero sin que pudieras controlar el relato.' } },
      ],
    },
  ],

  FUTUPOP: [
    {
      title: 'Entrevista Política que Deriva en Jam Session',
      desc: 'Un político polémico acepta venir a FUTUPOP. La entrevista arranca seria, pero hay una guitarra en el set y el invitado la mira fijo.',
      opciones: [
        { text: 'Mantenerlo en el carril político, sin distracciones', detail: 'La seriedad del tema lo exige.', prob: 0.62,
          exito:   { seg: 8000, din: 3, msg: 'Entrevista rigurosa. Furia Mentolini te felicitó. El canal te posicionó como voz política seria.' },
          fracaso: { seg: -3000, din: 0, msg: 'El político fue evasivo y vos no pudiste sacarlo de los lugares comunes. Entrevista plana.' } },
        { text: 'Dejar que fluya hacia la guitarra y la música', detail: 'El momento manda.', prob: 0.48,
          exito:   { seg: 17000, din: 4, msg: 'El clip del político tocando la guitarra se viralizó en todo el país. FUTUPOP fue trending topic.' },
          fracaso: { seg: -5000, din: 0, msg: 'El momento musical fue forzado y el político se incomodó. La entrevista no tuvo ni fondo político ni momento memorable.' } },
      ],
    },
    {
      title: 'Panel de Actualidad que Explota',
      desc: 'FUTUPOP arma un panel con cuatro voces muy distintas sobre el tema del momento. Furia te da la moderación.',
      opciones: [
        { text: 'Moderar con mano firme, sin perder el hilo', detail: 'El orden hace el contenido.', prob: 0.65,
          exito:   { seg: 9000, din: 3, msg: 'Panel intenso pero controlado. Te ganaste el respeto del ambiente periodístico.' },
          fracaso: { seg: -2000, din: 0, msg: 'Dos panelistas se fueron a las manos verbalmente y vos perdiste el control del debate.' } },
        { text: 'Dejar que el caos haga el espectáculo', detail: 'El conflicto es el contenido.', prob: 0.44,
          exito:   { seg: 18000, din: 5, msg: 'El panel fue un escándalo glorioso. Todos hablaban de FUTUPOP al día siguiente.' },
          fracaso: { seg: -8000, din: 0, msg: 'El panel explotó de verdad. Un invitado se fue en vivo y otro amenazó con demandar al canal.' } },
      ],
    },
    {
      title: 'Collab con Furia Mentolini',
      desc: 'Furia te propone hacer un stream de dos horas juntos, mitad política, mitad música. La audiencia del canal entera va a estar mirando.',
      opciones: [
        { text: 'Dejar que Furia lleve el timón', detail: 'Es su casa. Sumarte sin competir.', prob: 0.70,
          exito:   { seg: 11000, din: 4, msg: 'La dupla funcionó de diez. La comunidad de Furia te adoptó sin resistencia.' },
          fracaso: { seg: -2000, din: 0, msg: 'Quedaste opacado al lado de Furia. La audiencia ni te registró.' } },
        { text: 'Proponer una estructura donde los dos brillen por igual', detail: 'Negociar los términos.', prob: 0.46,
          exito:   { seg: 20000, din: 6, msg: 'El formato fue brillante. Empezaron a hablar de ustedes como la dupla del año en FUTUPOP.' },
          fracaso: { seg: -5000, din: 0, msg: 'Furia no recibió bien la propuesta. El stream salió tenso y sin la chispa que tenía que tener.' } },
      ],
    },
    {
      title: 'Lanzamiento Musical con Polémica Política',
      desc: 'Un artista importante estrena su disco en FUTUPOP. Pero una de las letras tiene una referencia política muy directa y los medios ya están encima.',
      opciones: [
        { text: 'Cubrir el lanzamiento y esquivar la polémica', detail: 'La música, sin el ruido.', prob: 0.58,
          exito:   { seg: 7000, din: 3, msg: 'El lanzamiento fue un éxito limpio. El artista quedó contento y el canal también.' },
          fracaso: { seg: -2000, din: 0, msg: 'La audiencia esperaba que tocaras el tema político. Al evitarlo, quedaste como tibio.' } },
        { text: 'Meterle el tema político de frente', detail: 'Darle al lanzamiento el contexto real.', prob: 0.50,
          exito:   { seg: 15000, din: 4, msg: 'Entrevista de fondo. La mezcla de música y política fue exactamente lo que FUTUPOP necesitaba.' },
          fracaso: { seg: -6000, din: 0, msg: 'El artista se cerró cuando empezaste con la política. La entrevista se cortó antes de tiempo.' } },
      ],
    },
    {
      title: 'Cobertura en Vivo de una Protesta',
      desc: 'Estalla una protesta masiva y FUTUPOP quiere ser el canal que la cubre desde adentro. Furia te manda a vos al piso.',
      opciones: [
        { text: 'Cobertura periodística, con contexto y datos', detail: 'Informar antes que opinar.', prob: 0.63,
          exito:   { seg: 12000, din: 4, msg: 'Cobertura de alta calidad. Te posicionaste como referente de periodismo de calle en el canal.' },
          fracaso: { seg: -3000, din: 0, msg: 'La situación se descontroló y tu transmisión se cortó justo en el momento clave.' } },
        { text: 'Mezclarte con los manifestantes y transmitir desde adentro', detail: 'El periodismo inmersivo.', prob: 0.45,
          exito:   { seg: 21000, din: 5, msg: 'Las imágenes que conseguiste desde adentro de la protesta fueron las más vistas del día.' },
          fracaso: { seg: -9000, din: 0, msg: 'Te reconocieron como streamer y la situación se complicó. Tuviste que cortar la transmisión y salir corriendo.' } },
      ],
    },
  ],

};

// ─── ESTADO DEL JUEGO ────────────────────────────────────────
// Objeto central que representa toda la partida en curso.
// Se muta directamente (sin inmutabilidad) para simplificar el código.

const state = {
  phase:         'intro',   // pantalla activa
  streamerName:  '',        // nombre elegido por el jugador
  season:        1,         // temporada actual (1–12)
  eventIndex:    0,         // índice del evento dentro de la temporada (0, 1, 2, 3)
  currentChannel: null,     // ID del canal activo (string)
  followers:     5200,      // estadística de seguidores
  money:         0,         // dinero acumulado (en miles: 1 = $1K)
  careerHistory: [],        // [{ channel, seasons }] historial de canales
  currentEvents: [],        // eventos de la temporada en curso (array de 4)
  lastResult:    null,      // resultado del último evento procesado
  seasonAccum:   { seg: 0, din: 0 },  // acumulado de la temporada
  isFirstMarket:     true,   // el primer mercado se abre al inicio de la carrera
  renderSold:        false,  // si RENDER ya fue vendido (evento especial)
  mosquitaFartSeen:  false,  // si Mosquita Fart ya fue al Mundial (evento único)
  algaCarSeen:       false,  // si el evento del auto ya ocurrió (evento único)
  orterixBoxingSeen: false,  // si el boxeo de streamers ya ocurrió (evento único)
  warioPaySeen:      false,  // si Wario eligió la opción B (nunca más aparece)
  queratinaSongSeen: false,  // si la canción de la estrella de mar ya ocurrió (evento único)
  coConductorSeen:   false,  // si el co-conductor fue echado en vivo (evento único)
  tuberculosisSeen:  false,  // si el brote de tuberculosis ya ocurrió (evento único)
};

// ─── UTILIDADES ──────────────────────────────────────────────

/** Escapa HTML para prevenir XSS al mostrar input del usuario */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Formatea un número de seguidores (ej: 5200 → '5K') */
function fmtSeg(n) {
  const v = Math.abs(n);
  if (v >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (v >= 1000)    return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

/** Formatea dinero en miles (ej: 14 → '$14K', 1200 → '$1.2M') */
function fmtDin(n) {
  const v = Math.abs(n);
  if (v >= 1000) return `$${(n / 1000).toFixed(1)}M`;
  return `$${n}K`;
}

/** Devuelve HTML coloreado para un cambio de estadística */
function deltaHtml(v, isMoney = false) {
  if (v === 0) return `<span class="delta-neutral">—</span>`;
  const label = isMoney ? fmtDin(Math.abs(v)) : fmtSeg(Math.abs(v));
  const sign  = v > 0 ? '+' : '-';
  const cls   = v > 0 ? 'delta-pos' : 'delta-neg';
  return `<span class="${cls}">${sign}${label}</span>`;
}

/** Baraja un array en-lugar usando Fisher-Yates */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Elige `count` eventos aleatorios para un canal.
 *  Si renderSold=true, excluye el evento de venta de RENDER. */
function pickEvents(channelId, count) {
  const pool = (EVENTOS[channelId] || []).filter(function(ev) {
    if (state.renderSold       && ev.title === RENDER_SOLD_TITLE)   return false;
    if (state.mosquitaFartSeen && ev.title === MOSQUITA_FART_TITLE) return false;
    if (state.algaCarSeen      && ev.title === ALGA_CAR_TITLE)        return false;
    if (state.orterixBoxingSeen && ev.title === ORTERIX_BOXING_TITLE) return false;
    if (state.warioPaySeen      && ev.title === WARIO_PAY_TITLE)       return false;
    if (state.queratinaSongSeen && ev.title === QUERATINA_SONG_TITLE)  return false;
    if (state.coConductorSeen   && ev.title === CO_CONDUCTOR_TITLE)    return false;
    if (state.tuberculosisSeen  && ev.title === TUBERCULOSIS_TITLE)    return false;
    return true;
  });
  return shuffle(pool).slice(0, count);
}

/** Devuelve 4 canales para el Mercado de Pases.
 *  Si no es el primer mercado, el canal actual siempre aparece (renovar).
 *  Si RENDER fue vendido y el jugador fue echado, no vuelve a ofrecerse. */
function buildOffers() {
  const pool = TODOS_LOS_CANALES.filter(id => {
    if (state.renderSold && id === 'RENDER') return false;
    return id !== state.currentChannel;
  });

  const shuffled = shuffle(pool);

  if (state.isFirstMarket) {
    return shuffled.slice(0, 4);
  }

  const offers = [];
  if (!(state.renderSold && state.currentChannel === 'RENDER')) {
    offers.push(state.currentChannel);
  }

  while (offers.length < 4 && shuffled.length > 0) {
    offers.push(shuffled.shift());
  }

  return offers;
}

/** Genera los pips HTML para un nivel n de 5 */
function pipsHtml(n) {
  let html = '<div class="pips">';
  for (let i = 0; i < 5; i++) {
    html += `<span class="pip${i < n ? ' filled' : ''}"></span>`;
  }
  return html + '</div>';
}

/** Devuelve el logo del canal o un placeholder si falta. */
function renderChannelLogoHtml(channelId, className) {
  const c = canal(channelId);
  const cls = className || 'channel-card-logo';
  if (c.logo) {
    return `
      <div class="${cls}">
        <img src="${escapeHtml(c.logo)}" alt="${escapeHtml(c.short)} logo" loading="lazy" />
      </div>
    `;
  }
  const label = escapeHtml(c.short.slice(0, 2));
  return `
    <div class="${cls}">
      <span class="channel-logo-placeholder">${label}</span>
    </div>
  `;
}

/** Devuelve la valoración final según el puntaje acumulado */
function getFinalRating() {
  const score = state.followers / 1000;
  if (score >= 350) return { label: 'Figura Histórica', emoji: '🏆', color: '#f59e0b' };
  if (score >= 230) return { label: 'Gran Carrera',      emoji: '🌟', color: '#a78bfa' };
  if (score >= 140) return { label: 'Buena Carrera',     emoji: '👏', color: '#4ade80' };
  if (score >= 70)  return { label: 'Carrera Discreta',  emoji: '🙂', color: '#38bdf8' };
  return               { label: 'Carrera Olvidable',  emoji: '😶', color: '#6b7280' };
}

/** Accede al canal activo de forma segura */
function canal(id) {
  return CANALES[id || state.currentChannel] || CANALES.ORTERIX;
}

/** Aplica los colores del canal activo como variables CSS en :root */
function applyChannelColors(channelId) {
  const c = canal(channelId);
  const root = document.documentElement;
  root.style.setProperty('--ch-color',  c.color);
  root.style.setProperty('--ch-accent', c.accent);
  root.style.setProperty('--ch-glow',   c.glow);
}

// ─── HUD ─────────────────────────────────────────────────────

/** Actualiza todos los elementos del HUD con el estado actual */
function updateHud() {
  const c = canal(state.currentChannel);

  // Canal y nombre
  const hudChannel = document.getElementById('hud-channel');
  const hudName = document.getElementById('hud-name');
  if (state.isFirstMarket) {
    hudChannel.textContent = '';
  } else {
    hudChannel.textContent = c.short;
  }
  hudName.textContent = state.streamerName ? `| ${state.streamerName}` : '';

  // Estadísticas
  document.getElementById('hud-followers').querySelector('span').textContent = fmtSeg(state.followers);

  // Puntos de progreso de temporadas
  const container = document.getElementById('hud-seasons');
  let dotsHtml = '';
  for (let i = 1; i <= 12; i++) {
    const past    = i < state.season;
    const current = i === state.season;
    const size    = current ? 8 : 5;
    const bg      = past ? '#7c3aed' : current ? c.accent : '#1e1e3a';
    const border  = current ? `border: 1px solid ${c.color};` : '';
    dotsHtml += `<span class="season-dot" style="width:${size}px;height:${size}px;background:${bg};${border}" title="Temporada ${i}"></span>`;
  }
  dotsHtml += `<span class="season-label">T${state.season}/12</span>`;
  container.innerHTML = dotsHtml;
}

/** Muestra u oculta el HUD */
function setHudVisible(visible) {
  document.getElementById('hud').classList.toggle('hidden', !visible);
}

// ─── RENDERIZADO DE PANTALLAS ─────────────────────────────────
// Cada función devuelve una cadena HTML que se inyecta en #screen.
// Los botones usan atributos data-action / data-* para el handler delegado.

function renderIntro() {
  return `
    <div class="screen-center">
      <div class="intro-wrap">
        <div>
          <p class="label-mono">Streaming argentino · Modo Carrera</p>
          <h1 class="title-hero">STREAMERO</h1>
          <div class="divider-glow" style="margin-top:0.75rem"></div>
        </div>

        <div class="intro-story">
          <p>Durante años transmitiste desde tu casa por simple diversión.</p>
          <p>Con el tiempo empezaste a formar una pequeña comunidad. No eras el streamer más grande, pero quienes te seguían siempre estaban ahí.</p>
          <p>Un par de clips comenzaron a circular por las redes y tu nombre empezó a sonar dentro del ambiente.</p>
          <p class="highlight">Ese crecimiento llamó la atención de un canal de streaming.</p>
          <p class="highlight" style="font-size:1rem">Hoy recibiste tu primera propuesta.</p>
          <p class="highlight-accent">Tu carrera profesional está a punto de comenzar.</p>
        </div>

        <button class="btn btn-primary btn-full" data-action="go-naming">
          Comenzar Carrera &rarr;
        </button>
      </div>
    </div>
  `;
}

function renderNaming() {
  return `
    <div class="screen-center">
      <div class="naming-wrap">
        <div>
          <p class="label-mono">Antes de empezar</p>
          <h2 class="section-title" style="margin-top:0.5rem">¿Cómo te<br>llaman?</h2>
          <p class="text-muted mt-1" style="font-size:0.88rem">Tu nombre de streamer. Con ese nombre vas a construir toda tu carrera.</p>
        </div>

        <div style="width:100%;display:flex;flex-direction:column;gap:0.75rem">
          <input
            id="name-input"
            class="input-text"
            type="text"
            maxlength="24"
            placeholder="xXTuNombreXx"
            autocomplete="off"
            spellcheck="false"
          />
          <button class="btn btn-primary btn-full" data-action="confirm-name" id="btn-confirm-name" disabled>
            Confirmar nombre
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderTransferMarket() {
  const offers = buildOffers();
  const isFirst = state.isFirstMarket;

  const cardsHtml = offers.map(id => {
    const c       = canal(id);
    const isCurr  = !isFirst && id === state.currentChannel;
    const border  = `border-color: ${c.color}55`;
    const bg      = `background: linear-gradient(140deg, ${c.color}14, ${c.accent}08)`;
    const shadow  = isCurr ? `box-shadow: 0 0 20px ${c.glow}` : '';
    const labels  = { rem: ['','Mínima','Baja','Media','Alta','Muy alta'], alc: ['','Mínimo','Bajo','Medio','Alto','Muy alto'] };
    const demColor = c.exigencia === 'Alta' ? '#f87171' : c.exigencia === 'Media' ? '#fbbf24' : '#4ade80';
    const demIcon  = c.exigencia === 'Alta' ? '🔴' : c.exigencia === 'Media' ? '🟡' : '🟢';
    const figHtml  = c.figura ? `<p class="channel-card-figure" style="color:${c.accent}">Figura: ${escapeHtml(c.figura)}</p>` : '';
    const badgeHtml = isCurr ? `<span class="badge badge-current badge-top-right" style="background:${c.color}">Renovar</span>` : '';

    return `
      <button class="channel-card" data-action="choose-channel" data-channel="${escapeHtml(id)}"
              style="${bg};${border};${shadow}">
        ${badgeHtml}
        <div class="channel-card-header">
          ${renderChannelLogoHtml(id)}
          <div>
            <p class="channel-card-name" style="color:${c.accent}">${escapeHtml(c.short)}</p>
            <p class="channel-card-tagline">${escapeHtml(c.tagline)}</p>
          </div>
        </div>
        <p class="channel-card-desc mt-1">${escapeHtml(c.desc)}</p>
        ${figHtml}
        <div class="channel-card-stats">
          <div class="channel-stat-block">
            <label>Remuneración</label>
            ${pipsHtml(c.remuneracion)}
            <span class="text-muted" style="font-size:0.68rem">${labels.rem[c.remuneracion]}</span>
          </div>
          <div class="channel-stat-block">
            <label>Alcance</label>
            ${pipsHtml(c.alcance)}
            <span class="text-muted" style="font-size:0.68rem">${labels.alc[c.alcance]}</span>
          </div>
          <div class="channel-stat-block">
            <label>Exigencia</label>
            <span style="font-size:1.1rem">${demIcon}</span>
            <span class="demand-label" style="color:${demColor}">${c.exigencia}</span>
          </div>
        </div>
      </button>
    `;
  }).join('');

  const accentColor = isFirst ? '#f59e0b' : '#f59e0b';

  return `
    <div class="container-wide">
      <div class="market-header">
        <p class="label-mono" style="color:${accentColor}">
          ${isFirst ? 'Primera propuesta' : `Mercado de Pases · Tras Temporada ${state.season - 1}`}
        </p>
        <h2 class="section-title" style="margin-top:0.4rem">
          ${isFirst ? 'Tu Primer Contrato' : 'Mercado de Pases'}
        </h2>
        <p class="text-muted mt-1" style="font-size:0.85rem">
          ${isFirst ? 'Los canales que llegaron a vos. Elegí bien.' : 'Las propuestas que llegaron esta ventana. El orden es al azar.'}
        </p>
      </div>
      <div class="market-grid">${cardsHtml}</div>
    </div>
  `;
}

function renderEvent() {
  const ev  = state.currentEvents[state.eventIndex];
  const c   = canal();
  const idx = state.eventIndex;

  // Puntos de progreso del evento (4 eventos por temporada)
  const dotsHtml = [0,1,2,3].map(i => {
    const w  = i === idx ? '28px' : '16px';
    const bg = i < idx ? c.color : i === idx ? c.accent : 'rgba(255,255,255,0.08)';
    return `<span class="ev-dot" style="width:${w};background:${bg}"></span>`;
  }).join('');

  const specialBadge = ev.isSpecial
    ? `<span class="badge badge-special" style="margin-bottom:0.75rem;display:inline-block">EVENTO ESPECIAL</span>`
    : '';

  const logoBgHtml = c.logo
    ? `<img class="event-logo-bg" src="${escapeHtml(c.logo)}" alt="" />`
    : '';

  const opcionesHtml = ev.opciones.map((op, i) => `
    <button class="btn-option" data-action="choose-option" data-idx="${i}">
      <div class="btn-option-inner">
        <span class="btn-option-letter" style="background:${c.color}28;color:${c.accent}">
          ${String.fromCharCode(65 + i)}
        </span>
        <span>
          <span class="btn-option-text">${escapeHtml(op.text)}</span>
          <span class="btn-option-detail">${escapeHtml(op.detail)}</span>
        </span>
      </div>
    </button>
  `).join('');

  return `
    <div class="event-wrap">
      ${logoBgHtml}
      <div class="event-header">
        <div>
          <p class="label-mono">Temporada ${state.season} · Evento ${idx + 1}/4</p>
          <div class="event-progress-dots" style="margin-top:0.5rem">${dotsHtml}</div>
        </div>
        <div class="event-channel-meta">
          ${renderChannelLogoHtml(state.currentChannel, 'event-channel-logo')}
          <span class="event-channel-badge" style="background:${c.color}20;color:${c.accent};border-color:${c.color}40">
            ${escapeHtml(c.short)}
          </span>
        </div>
      </div>

      <div class="event-card${ev.isSpecial ? ' is-special' : ''}">
        ${specialBadge}
        <h2 class="event-title">${escapeHtml(ev.title.replace('⚡ ', ''))}</h2>
        <p class="event-desc">${escapeHtml(ev.desc)}</p>
      </div>

      <div class="event-options">
        <p class="event-options-label">¿Qué decidís?</p>
        ${opcionesHtml}
      </div>
    </div>
  `;
}

function renderEventResult() {
  const r   = state.lastResult;
  const ok  = r.wasSuccess;
  const forced = !!r.delta.specialOutcome;

  const emoji      = forced ? '🏚️' : ok ? '🔥' : '💧';
  const statusText = forced ? 'Canal vendido' : ok ? '¡Éxito!' : 'Fracaso';
  const statusCls  = forced ? 'sold' : ok ? 'success' : 'failure';
  const cardCls    = forced ? 'sold' : ok ? 'success' : 'failure';

  const soldNotice = forced ? `
    <div class="result-sold-notice">
      ⚡ Vas al Mercado de Pases de inmediato. Tenés que encontrar nuevo canal.
    </div>
  ` : '';

  const btnClass = forced ? 'btn-danger' : ok ? 'btn-success' : 'btn-channel';
  const btnLabel = forced ? 'Ir al Mercado de Pases &rarr;' : 'Continuar &rarr;';

  return `
    <div class="result-wrap">
      <div>
        <div class="result-emoji">${emoji}</div>
      </div>

      <div>
        <p class="result-status ${statusCls}">${escapeHtml(statusText)}</p>
        <h2 class="result-event-title" style="margin-top:0.4rem">
          ${escapeHtml(r.eventTitle.replace('⚡ ', ''))}
        </h2>
        <p class="result-option-text" style="margin-top:0.4rem">"${escapeHtml(r.optionText)}"</p>
      </div>

      <div class="result-card ${cardCls}" style="width:100%">
        <p class="result-message">${escapeHtml(r.delta.msg)}</p>
        ${soldNotice}
        <div class="divider"></div>
        <div class="result-deltas">
          <div class="result-delta-item">
            <label>👥 Seguidores</label>
            ${deltaHtml(r.delta.seg)}
          </div>
        </div>
      </div>

      <button class="btn ${btnClass} btn-full" data-action="continue-result">
        ${btnLabel}
      </button>
    </div>
  `;
}

function renderSeasonSummary() {
  const c       = canal();
  const passive = c.passiveMoney;
  const isLast  = state.season === 12;

  let nextLabel;
  if (isLast) nextLabel = 'Ver resumen final →';
  else        nextLabel = 'Ir al Mercado de Pases →';

  const marketNotice = !isLast ? `
    <div class="market-notice">
      ⚡ Se abre el Mercado de Pases. Podés quedarte o cambiar de canal.
    </div>
  ` : '';

  return `
    <div class="summary-wrap">
      <div class="summary-header">
        <p class="label-mono">Resumen</p>
        <h2 class="section-title" style="margin-top:0.3rem">Temporada ${state.season}</h2>
        <p class="summary-subtitle">
          ${state.streamerName ? escapeHtml(state.streamerName) + ' · ' : ''}
          ${renderChannelLogoHtml(state.currentChannel, 'summary-channel-logo')}
          <span style="color:${c.accent}">${escapeHtml(c.short)}</span>
        </p>
      </div>

      <div class="card-table" style="width:100%">
        <div class="card-table-header">Movimientos de la temporada</div>
        <div class="card-table-row">
          <span class="card-table-label">👥 Seguidores</span>
          ${deltaHtml(state.seasonAccum.seg)}
        </div>
      </div>

      ${marketNotice}

      <button class="btn btn-channel btn-full" data-action="continue-season"
              style="background:linear-gradient(135deg,${c.color},${c.accent})">
        ${nextLabel}
      </button>
    </div>
  `;
}

function renderGameOver() {
  const rating = getFinalRating();

  // Estadísticas finales
  const statsHtml = `
    <div class="gameover-stats">
      <div class="gameover-stat">
        <span class="icon">👥</span>
        <span class="value">${fmtSeg(state.followers)}</span>
        <label>Seguidores finales</label>
      </div>
    </div>
  `;

  // Historial de canales
  const histHtml = state.careerHistory.length === 0
    ? '<div class="card-table-row"><span class="text-muted">Sin historial disponible.</span></div>'
    : state.careerHistory.map(entry => {
        const c = canal(entry.channel);
        return `
          <div class="card-table-row">
            <div class="history-channel-row" style="width:100%">
              <div style="display:flex;align-items:center;gap:0.6rem;min-width:0">
                <span class="history-dot" style="background:${c.color}"></span>
                <div class="history-channel-info">
                  <span class="history-channel-name" style="color:${c.accent}">${escapeHtml(c.short)}</span>
                  ${c.figura ? `<span class="history-channel-figure">${escapeHtml(c.figura)}</span>` : ''}
                </div>
              </div>
              <span class="history-seasons">${entry.seasons} temp.</span>
            </div>
          </div>
        `;
      }).join('') + `
        <div class="card-table-row">
          <span class="card-table-label">Canal donde terminaste</span>
          <span class="history-channel-name" style="color:${canal().accent}">${escapeHtml(canal().short)}</span>
        </div>
      `;

  return `
    <div class="gameover-wrap">
      <div>
        <p class="label-mono" style="text-align:center">Fin de Carrera · 12 Temporadas</p>
        ${state.streamerName ? `<p class="gameover-name" style="margin-top:0.5rem">${escapeHtml(state.streamerName)}</p>` : ''}
        <h2 class="gameover-title" style="margin-top:0.5rem">Tu Carrera<br>Terminó</h2>
      </div>

      <div class="rating-badge" style="background:${rating.color}18;border:1px solid ${rating.color}55;color:${rating.color}">
        <span>${rating.emoji}</span> ${escapeHtml(rating.label.toUpperCase())}
      </div>

      ${statsHtml}

      <div class="card-table" style="width:100%">
        <div class="card-table-header">Historial de canales</div>
        ${histHtml}
      </div>

      <button class="btn btn-primary btn-full" data-action="new-game">
        Nueva Carrera
      </button>
    </div>
  `;
}

// ─── TRANSICIONES ENTRE PANTALLAS ────────────────────────────

/** Mapa de fases → función de render */
const RENDERS = {
  intro:          renderIntro,
  naming:         renderNaming,
  transferMarket: renderTransferMarket,
  event:          renderEvent,
  eventResult:    renderEventResult,
  seasonSummary:  renderSeasonSummary,
  gameOver:       renderGameOver,
};

/** Fases donde el HUD NO debe mostrarse */
const PHASES_NO_HUD = new Set(['intro', 'naming', 'gameOver']);

/**
 * Transiciona a una nueva fase: actualiza state.phase, aplica
 * colores del canal, renderiza la pantalla y actualiza el HUD.
 */
function goTo(phase) {
  state.phase = phase;

  const screen = document.getElementById('screen');

  // Aplicar colores del canal activo al CSS
  if (state.currentChannel) applyChannelColors(state.currentChannel);

  // Mostrar u ocultar el HUD
  const showHud = !PHASES_NO_HUD.has(phase);
  setHudVisible(showHud);
  screen.classList.toggle('no-hud', !showHud);

  // Inyectar HTML de la pantalla
  var renderFn = RENDERS[phase];
  screen.innerHTML = renderFn ? renderFn() : '';

  // Actualizar HUD si está visible
  if (showHud) updateHud();

  // Configuración post-render específica por pantalla
  afterRender(phase);
}

/**
 * Lógica extra que necesita acceso al DOM ya renderizado.
 * Se ejecuta inmediatamente después de inyectar el HTML.
 */
function afterRender(phase) {
  if (phase === 'naming') {
    const input = document.getElementById('name-input');
    const btn   = document.getElementById('btn-confirm-name');
    if (!input || !btn) return;

    input.focus();

    // Habilitar/deshabilitar el botón según el valor del input
    input.addEventListener('input', () => {
      btn.disabled = input.value.trim().length === 0;
    });

    // Confirmar con Enter
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmName();
    });
  }
}

// ─── ACCIONES DEL JUEGO ───────────────────────────────────────

/** El jugador confirma su nombre de streamer */
function confirmName() {
  const input = document.getElementById('name-input');
  const name  = input ? input.value.trim() : '';
  if (!name) return;
  state.streamerName = name;
  goTo('transferMarket');
}

/** El jugador elige un canal en el Mercado de Pases */
function chooseChannel(channelId) {
  if (!CANALES[channelId]) return;

  state.currentChannel  = channelId;
  state.isFirstMarket   = false;
  state.currentEvents   = pickEvents(channelId, 4);
  state.eventIndex      = 0;
  state.seasonAccum     = { seg: 0, din: 0 };

  applyChannelColors(channelId);
  goTo('event');
}

/** El jugador elige una opción en un evento */
function chooseOption(optionIdx) {
  const ev  = state.currentEvents[state.eventIndex];
  const opt = ev.opciones[optionIdx];
  if (!opt) return;

  // Marcar eventos únicos por partida como vistos en el momento de la elección
  if (ev.title === MOSQUITA_FART_TITLE)                          state.mosquitaFartSeen  = true;
  if (ev.title === ALGA_CAR_TITLE)                               state.algaCarSeen       = true;
  if (ev.title === ORTERIX_BOXING_TITLE)                         state.orterixBoxingSeen = true;
  if (ev.title === WARIO_PAY_TITLE && optionIdx === 1)           state.warioPaySeen      = true;
  if (ev.title === QUERATINA_SONG_TITLE)                         state.queratinaSongSeen = true;
  if (ev.title === CO_CONDUCTOR_TITLE)                           state.coConductorSeen   = true;
  if (ev.title === TUBERCULOSIS_TITLE)                           state.tuberculosisSeen  = true;

  const success = Math.random() < opt.prob;
  const outcome = success ? opt.exito : opt.fracaso;

  // Aplicar cambios al estado
  state.followers = Math.max(0, state.followers + outcome.seg);
  state.money    += outcome.din;

  // Acumular para el resumen de temporada
  state.seasonAccum.seg += outcome.seg;
  state.seasonAccum.din += outcome.din;

  // Guardar el resultado para mostrarlo en pantalla
  state.lastResult = {
    eventTitle: ev.title,
    optionText: opt.text,
    wasSuccess: success,
    delta: outcome,
  };

  updateHud();
  goTo('eventResult');
}

/** El jugador continúa desde la pantalla de resultado */
function continueResult() {
  const outcome = state.lastResult ? state.lastResult.delta : null;

  // Forced transfer: cualquier evento que te saque del canal de inmediato
  if (outcome && outcome.specialOutcome === 'forcedTransfer') {
    // Solo marcar renderSold si fue el evento de venta del canal
    if (state.lastResult && state.lastResult.eventTitle === RENDER_SOLD_TITLE) {
      state.renderSold = true;
    }
    updateCareerHistory();
    state.money += (CANALES[state.currentChannel] ? CANALES[state.currentChannel].passiveMoney : 0);

    if (state.season >= 12) { goTo('gameOver'); return; }
    state.season++;
    goTo('transferMarket');
    return;
  }

  // Siguiente evento de la temporada
  if (state.eventIndex < 3) {
    state.eventIndex++;
    goTo('event');
  } else {
    goTo('seasonSummary');
  }
}

/** El jugador continúa desde el resumen de temporada */
function continueSeason() {
  const passive = (CANALES[state.currentChannel] ? CANALES[state.currentChannel].passiveMoney : 0);
  state.money += passive;

  updateCareerHistory();

  if (state.season >= 12) { goTo('gameOver'); return; }

  state.season = state.season + 1;
  goTo('transferMarket');
}

/** Actualiza el historial de carrera para el canal actual */
function updateCareerHistory() {
  const entry = state.careerHistory.find(e => e.channel === state.currentChannel);
  if (entry) {
    entry.seasons++;
  } else {
    state.careerHistory.push({ channel: state.currentChannel, seasons: 1 });
  }
}

/** Reinicia el juego completamente */
function newGame() {
  // Resetear todos los valores al estado inicial
  Object.assign(state, {
    phase:         'intro',
    streamerName:  '',
    season:        1,
    eventIndex:    0,
    currentChannel: null,
    followers:     5200,
    money:         0,
    careerHistory: [],
    currentEvents: [],
    lastResult:    null,
    seasonAccum:   { seg: 0, din: 0 },
    isFirstMarket:    true,
    renderSold:       false,
    mosquitaFartSeen: false,
    algaCarSeen:       false,
    orterixBoxingSeen: false,
    warioPaySeen:      false,
    queratinaSongSeen: false,
    coConductorSeen:   false,
    tuberculosisSeen:  false,
  });

  // Resetear colores al canal base
  document.documentElement.style.setProperty('--ch-color',  '#7c3aed');
  document.documentElement.style.setProperty('--ch-accent', '#a78bfa');
  document.documentElement.style.setProperty('--ch-glow',   'rgba(124,58,237,0.35)');

  goTo('intro');
}

// ─── HANDLER DELEGADO ─────────────────────────────────────────
// Un único listener en #screen para todos los clics del juego.
// Los botones declaran data-action="..." con parámetros opcionales.

document.getElementById('screen').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;

  switch (action) {
    case 'go-naming':       goTo('naming');                          break;
    case 'confirm-name':    confirmName();                           break;
    case 'choose-channel':  chooseChannel(btn.dataset.channel);      break;
    case 'choose-option':   chooseOption(parseInt(btn.dataset.idx)); break;
    case 'continue-result': continueResult();                        break;
    case 'continue-season': continueSeason();                        break;
    case 'new-game':        newGame();                               break;
    default: console.warn('Acción desconocida:', action);
  }
});

// ─── INICIO ───────────────────────────────────────────────────

// Arrancar el juego mostrando la pantalla de introducción
goTo('intro');
