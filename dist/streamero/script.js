// ============================================================
// STREAMERO â€” script.js
// Juego de simulaciÃ³n de carrera en el streaming argentino.
// HTML + CSS + JS puro. Sin frameworks, sin dependencias.
// ============================================================

'use strict';

// â”€â”€â”€ DATOS: CANALES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Cada canal tiene colores propios, una figura asociada y
// estadÃ­sticas que se muestran en el Mercado de Pases.

const CANALES = {
  ORTERIX: {
    id: 'ORTERIX',
    short: 'ORTERIX',
    tagline: 'Humor Â· Rock Â· Deportes',
    desc: 'El canal mÃ¡s irreverente. Humor Ã¡cido, rock en vivo y deportes sin protocolo. Azuquita Rodrigues es la estrella.',
    figura: 'Azuquita Rodrigues',
    remuneracion: 3,
    alcance: 4,
    exigencia: 'Media',
    passiveMoney: 12,
    color: '#7c3aed',
    accent: '#a78bfa',
    glow: 'rgba(124,58,237,0.35)',
  },
  ALGA: {
    id: 'ALGA',
    short: 'ALGA',
    tagline: 'Humor Â· Entrevistas Â· Caos controlado',
    desc: 'ImprovisaciÃ³n al mÃ¡ximo nivel. Migue Granate convirtiÃ³ el caos en un formato. Todo puede pasar en vivo.',
    figura: 'Migue Granate',
    remuneracion: 4,
    alcance: 4,
    exigencia: 'Media',
    passiveMoney: 18,
    color: '#d97706',
    accent: '#fbbf24',
    glow: 'rgba(217,119,6,0.35)',
  },
  ASS: {
    id: 'ASS',
    short: 'ASS',
    tagline: 'FÃºtbol y nada mÃ¡s',
    desc: 'Sin distracciones. Solo fÃºtbol. Fabio Assado y su equipo son los referentes del anÃ¡lisis futbolÃ­stico en streaming.',
    figura: 'Fabio Assado',
    remuneracion: 2,
    alcance: 3,
    exigencia: 'Baja',
    passiveMoney: 7,
    color: '#0284c7',
    accent: '#38bdf8',
    glow: 'rgba(2,132,199,0.35)',
  },
  'RUZU TV': {
    id: 'RUZU TV',
    short: 'RUZU TV',
    tagline: 'Humor Â· Primeras citas Â· Actualidad',
    desc: 'Humor subido de tono, charlas banales de primeras citas y actualidad sin filtro. Nico Bognato al frente de todo.',
    figura: 'Nico Bognato',
    remuneracion: 3,
    alcance: 3,
    exigencia: 'Baja',
    passiveMoney: 10,
    color: '#db2777',
    accent: '#f472b6',
    glow: 'rgba(219,39,119,0.35)',
  },
  RENDER: {
    id: 'RENDER',
    short: 'RENDER',
    tagline: 'PolÃ­tica Â· Actualidad Â· Entrevistas',
    desc: 'Periodismo de fondo. TomÃ¡s Report lleva el anÃ¡lisis polÃ­tico al streaming. Cuidado: el canal puede cambiar de manos.',
    figura: 'TomÃ¡s Report',
    remuneracion: 4,
    alcance: 4,
    exigencia: 'Alta',
    passiveMoney: 14,
    color: '#9f1239',
    accent: '#fb7185',
    glow: 'rgba(159,18,57,0.35)',
  },
  CARANCHO: {
    id: 'CARANCHO',
    short: 'CARANCHO',
    tagline: 'PolÃ­tica oficialista Â· Libertarismo',
    desc: 'Plataforma de propaganda del movimiento libertario. El Gordo Pan es la voz del canal. Mismo dueÃ±o que RENDER.',
    figura: 'El Gordo Pan',
    remuneracion: 4,
    alcance: 3,
    exigencia: 'Alta',
    passiveMoney: 16,
    color: '#a16207',
    accent: '#fde047',
    glow: 'rgba(161,98,7,0.35)',
  },
  QUERATINA: {
    id: 'QUERATINA',
    short: 'QUERATINA',
    tagline: 'Peronismo Â· Actualidad Â· Cine Â· Entrevistas',
    desc: 'Canal de cabecera del peronismo en el streaming. PolÃ­tica partidaria, actualidad nacional, cine argentino y entrevistas de fondo. Pepe Racinclub es la voz y la cara del proyecto.',
    figura: 'Pepe Racinclub',
    remuneracion: 3,
    alcance: 4,
    exigencia: 'Alta',
    passiveMoney: 13,
    color: '#1d4ed8',
    accent: '#93c5fd',
    glow: 'rgba(29,78,216,0.35)',
  },
  FUTUPOP: {
    id: 'FUTUPOP',
    short: 'FUTUPOP',
    tagline: 'Actualidad Â· PolÃ­tica Â· Entrevistas Â· MÃºsica',
    desc: 'El canal que lo mezcla todo sin vergÃ¼enza. PolÃ­tica, actualidad, entrevistas y mÃºsica en la misma grilla. Furia Mentolini conduce con una energÃ­a que no para.',
    figura: 'Furia Mentolini',
    remuneracion: 3,
    alcance: 3,
    exigencia: 'Media',
    passiveMoney: 11,
    color: '#0e7490',
    accent: '#22d3ee',
    glow: 'rgba(14,116,144,0.35)',
  },
};

// Lista ordenada de IDs de canales (para el mercado de pases)
const TODOS_LOS_CANALES = Object.keys(CANALES);

// â”€â”€â”€ DATOS: EVENTOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Cada canal tiene 5 eventos. Cada evento tiene tÃ­tulo,
// descripciÃ³n y 2 opciones (A y B), cada una con:
//   text       â†’ texto de la opciÃ³n
//   detail     â†’ subtÃ­tulo explicativo
//   prob       â†’ probabilidad de Ã©xito (0.0 a 1.0)
//   exito      â†’ { seguidores, dinero, mensaje }
//   fracaso    â†’ { seguidores, dinero, mensaje }
//
// El evento especial de RENDER tiene specialOutcome: 'forcedTransfer'
// en ambas opciones (fracaso y exito), lo que fuerza el mercado de pases.

const RENDER_SOLD_TITLE      = 'âš¡ RENDER FUE VENDIDO';
const MOSQUITA_FART_TITLE     = 'COBERTURA MUNDIAL';
const CO_CONDUCTOR_TITLE      = 'Tension en Costra Team';
const ALGA_CAR_TITLE          = 'El Auto que Casi Choca en la Puerta';
const ORTERIX_BOXING_TITLE    = 'El Boxeo de los Streamers';
const WARIO_PAY_TITLE         = 'Wario Mengolini Quiere Pagarte en Partes';
const QUERATINA_SONG_TITLE    = 'La CanciÃ³n de la Estrella de Mar';
const TUBERCULOSIS_TITLE      = 'Brote de Tuberculosis en el Canal';

const EVENTOS = {

  ORTERIX: [
    {
      title: 'El Recital de la DÃ©cada',
      desc: 'ORTERIX cubre en vivo el festival de rock mÃ¡s grande del aÃ±o. Azuquita Rodrigues te nomina para la transmisiÃ³n principal.',
      opciones: [
        { text: 'Tomar la conducciÃ³n del stream completo', detail: 'Protagonismo total, riesgo total.', prob: 0.52,
          exito:   { seg: 11000, din: 5, msg: 'Robaste el show. La transmisiÃ³n fue lo mÃ¡s visto del festival.' },
          fracaso: { seg: -4000, din: 0, msg: 'Los nervios se notaron demasiado. La audiencia no perdonÃ³.' } },
        { text: 'Cubrir el backstage con entrevistas', detail: 'MÃ¡s espontÃ¡neo y cercano.', prob: 0.74,
          exito:   { seg: 6000, din: 3, msg: 'Entrevistas espontÃ¡neas que se convirtieron en los clips de la noche.' },
          fracaso: { seg: 800, din: 1, msg: 'Cobertura correcta pero sin momentos que se recuerden.' } },
      ],
    },
    {
      title: 'El Bit de Humor que Nadie Esperaba',
      desc: 'Azuquita Rodrigues lanza un desafÃ­o de humor en vivo y te menciona por nombre. Millones miran.',
      opciones: [
        { text: 'Sumarte sin pensarlo', detail: 'Pura reacciÃ³n, sin calcular.', prob: 0.50,
          exito:   { seg: 13000, din: 3, msg: 'La reacciÃ³n genuina hizo explotar el chat. Clips por todos lados.' },
          fracaso: { seg: -5000, din: 0, msg: 'No era tu momento. La comparaciÃ³n con Azuquita fue cruel.' } },
        { text: 'Responder con tu propio bit preparado', detail: 'ControlÃ¡s la situaciÃ³n.', prob: 0.63,
          exito:   { seg: 8000, din: 2, msg: 'Sorprendiste a todos con un bit propio. Ganaste terreno en ORTERIX.' },
          fracaso: { seg: -2000, din: 0, msg: 'El bit preparado se notÃ³ demasiado. Se rieron de vos, no con vos.' } },
      ],
    },
    {
      title: 'Hot Take Deportivo',
      desc: 'ORTERIX organiza un panel donde cada uno dice su opiniÃ³n mÃ¡s polÃ©mica sobre deporte.',
      opciones: [
        { text: 'El hot take mÃ¡s arriesgado que tenÃ©s', detail: 'Decir lo que nadie se anima.', prob: 0.44,
          exito:   { seg: 16000, din: 4, msg: 'Tu opiniÃ³n explotÃ³ en redes. Mitad te odia, mitad te adora. Ambos te siguen.' },
          fracaso: { seg: -8000, din: 0, msg: 'La opiniÃ³n cayÃ³ fatal. Trending topic por las razones equivocadas.' } },
        { text: 'OpiniÃ³n fuerte pero con respaldo', detail: 'PolÃ©mica con argumentos.', prob: 0.67,
          exito:   { seg: 8000, din: 2, msg: 'PosiciÃ³n sÃ³lida. La audiencia te tomÃ³ en serio y siguiÃ³ el debate.' },
          fracaso: { seg: -2000, din: 0, msg: 'QuedÃ³ como una opiniÃ³n a medias. No convenciÃ³ a nadie.' } },
      ],
    },
    {
      title: 'Collab Oficial con Azuquita',
      desc: 'El streamer estrella de ORTERIX te propone hacer un stream conjunto. Es un salto enorme de visibilidad.',
      opciones: [
        { text: 'Aceptar y cederle el protagonismo', detail: 'Venir a sumar, no a competir.', prob: 0.68,
          exito:   { seg: 14000, din: 4, msg: 'El stream fue un Ã©xito. La comunidad de Azuquita te adoptÃ³.' },
          fracaso: { seg: -3000, din: 0, msg: 'Quedaste opacado. La audiencia ni te registrÃ³ al lado suyo.' } },
        { text: 'Proponer un formato donde los dos brillen', detail: 'Negociar los tÃ©rminos creativos.', prob: 0.48,
          exito:   { seg: 20000, din: 6, msg: 'El formato fue brillante. Ambos crecieron. Hablan de ustedes como dupla.' },
          fracaso: { seg: -6000, din: 0, msg: 'La negociaciÃ³n enfriÃ³ la idea. La collab saliÃ³ sin la energÃ­a del principio.' } },
      ],
    },
    {
      title: 'MaratÃ³n Gaming 12 Horas',
      desc: 'ORTERIX organiza su maratÃ³n anual y te quieren como uno de los protagonistas. 12 horas en vivo.',
      opciones: [
        { text: 'Estar las 12 horas sin parar', detail: 'Compromiso total con el evento.', prob: 0.46,
          exito:   { seg: 14000, din: 5, msg: 'Llegaste al final. El chat enloqueciÃ³ en la hora 12. HistÃ³rico.' },
          fracaso: { seg: 2000, din: 1, msg: 'Te quedaste dormido en hora 9. El clip se viralizÃ³, pero no como querÃ­as.' } },
        { text: 'Hacer los horarios pico y descansar', detail: 'Calidad sobre cantidad.', prob: 0.74,
          exito:   { seg: 7000, din: 2, msg: 'Cada apariciÃ³n fue de alto nivel. El canal quedÃ³ muy conforme.' },
          fracaso: { seg: 1000, din: 1, msg: 'Tu ausencia en horas clave fue notada. No causaste impacto.' } },
      ],
    },
    {
      title: ORTERIX_BOXING_TITLE,
      desc: 'Azuquita Rodrigues arma el evento del aÃ±o: boxeo de streamers. Hay sponsors, hay cÃ¡mara, hay expectativa. Y te quiere a vos adentro del ring.',
      isSpecial: true,
      opciones: [
        { text: 'AceptÃ¡s y entrenÃ¡s a fondo', detail: 'Si vas, vas en serio.', prob: 0.50,
          exito:   { seg: 20000, din: 6, msg: 'Diste un show inolvidable. Alzaste el cinto ante miles de espectadores. ORTERIX explotÃ³ de orgullo.' },
          fracaso: { seg: -15000, din: 0, msg: 'Te lo tomaste demasiado en serio. Dejaste inconsciente al Puerro en el primer round. Las redes te destruyeron: "Es un psicÃ³pata."' } },
        { text: 'AceptÃ¡s pero lo tomÃ¡s tranqui', detail: 'Un show, no una guerra.', prob: 0.55,
          exito:   { seg: 10000, din: 3, msg: 'Tu rival tampoco entrenÃ³. Dieron un buen show y ganaste por puntos. El chat lo disfrutÃ³ de principio a fin.' },
          fracaso: { seg: -8000, din: 0, msg: 'Te cagaron a trompadas durante tres rounds. Las redes llenaron de memes sobre lo inÃºtil que sos peleando.' } },
      ],
    },
    {
      title: WARIO_PAY_TITLE,
      desc: 'Wario Mengolini, el dueÃ±o de ORTERIX, te llama a una reuniÃ³n sorpresa. Quiere pagarte el sueldo en cuotas por "un tema de flujo de caja". La cara de duda que ponÃ©s no le importa.',
      opciones: [
        { text: 'AceptÃ¡s. Algo es algo.', detail: 'No es el momento de hacerse el difÃ­cil.', prob: 1,
          exito:   { seg: 2000, din: -4, msg: 'Aceptaste sin drama. Wario lo tomÃ³ como un gesto de lealtad. La plata llegÃ³ en tres cuotas, pero el canal te empezÃ³ a dar mÃ¡s espacio.' },
          fracaso: { seg: 0, din: 0, msg: '' } },
        { text: 'Te negÃ¡s. El sueldo es el sueldo.', detail: 'Tus derechos son tus derechos.', prob: 0,
          exito:   { seg: 0, din: 0, msg: '' },
          fracaso: { seg: -2000, din: 0, msg: 'Wario te palmea la espalda y se va. Al dÃ­a siguiente te llaman: "El canal va en otra direcciÃ³n." SalÃ­s a buscar trabajo.', specialOutcome: 'forcedTransfer' } },
      ],
    },
  ],

  ALGA: [
    {
      title: 'Panel de ImprovisaciÃ³n con Migue',
      desc: 'Migue Granate te invita a su segmento estrella de improvisaciÃ³n. El caos es el formato.',
      opciones: [
        { text: 'Soltar todo, puro instinto', detail: 'Sin preparaciÃ³n, sin freno.', prob: 0.48,
          exito:   { seg: 17000, din: 5, msg: 'Fue el segmento mÃ¡s visto del mes. Migue te abrazÃ³ al terminar.' },
          fracaso: { seg: -8000, din: 0, msg: 'Te bloqueaste en vivo. El silencio fue incÃ³modo para todos.' } },
        { text: 'Preparar algunos bits de antemano', detail: 'ImprovisaciÃ³n con estructura.', prob: 0.70,
          exito:   { seg: 9000, din: 3, msg: 'La preparaciÃ³n se notÃ³ de buena manera. SÃ³lido y entretenido.' },
          fracaso: { seg: -2000, din: 0, msg: 'Los bits preparados chocaron con el caos de Migue. No fluyÃ³.' } },
      ],
    },
    {
      title: 'Entrevista en Modo Caos',
      desc: 'ALGA consigue una figura famosa. El formato: preguntas sin filtro, respuestas sin ediciÃ³n. Migue te da la silla.',
      opciones: [
        { text: 'Ir al caos total sin ningÃºn lÃ­mite', detail: 'El show sobre todo.', prob: 0.40,
          exito:   { seg: 22000, din: 7, msg: 'La entrevista mÃ¡s comentada del aÃ±o. El invitado se convirtiÃ³ en meme.' },
          fracaso: { seg: -9000, din: 0, msg: 'El invitado se fue al corte. ALGA tuvo que pedir disculpas pÃºblicas.' } },
        { text: 'Caos controlado: gracioso pero respetuoso', detail: 'Equilibrio entre show y forma.', prob: 0.73,
          exito:   { seg: 12000, din: 4, msg: 'Entrevista memorable. El invitado quedÃ³ bien y vos quedaste mejor.' },
          fracaso: { seg: -3000, din: 0, msg: 'El equilibrio no se encontrÃ³. Ni caos ni entrevista real.' } },
      ],
    },
    {
      title: 'El Clip Viral de Migue te Involucra',
      desc: 'Un momento de Migue se viraliza masivamente y te mencionÃ³ por nombre. Las redes arden.',
      opciones: [
        { text: 'Publicar contenido propio de inmediato', detail: 'Surfear la ola antes de que baje.', prob: 0.56,
          exito:   { seg: 15000, din: 4, msg: 'El timing fue perfecto. Tu contenido llegÃ³ cuando todos te buscaban.' },
          fracaso: { seg: -5000, din: 0, msg: 'El contenido que publicaste no estuvo a la altura del momento.' } },
        { text: 'Hacer un live conjunto con Migue', detail: 'Aprovechar su base directamente.', prob: 0.67,
          exito:   { seg: 11000, din: 3, msg: 'El live conjunto fue el cierre perfecto del momento viral.' },
          fracaso: { seg: -1000, din: 0, msg: 'La coordinaciÃ³n fallÃ³. El live saliÃ³ tarde y el momento ya habÃ­a pasado.' } },
      ],
    },
    {
      title: 'Programa Especial de Entrevistas',
      desc: 'ALGA hace una maratÃ³n de entrevistas. Te asignan el invitado mÃ¡s difÃ­cil de manejar de toda la grilla.',
      opciones: [
        { text: 'Abrazar la dificultad, hacer algo diferente', detail: 'El riesgo como estrategia.', prob: 0.42,
          exito:   { seg: 24000, din: 8, msg: 'Lo imposible se volviÃ³ el segmento mÃ¡s comentado. Leyenda.' },
          fracaso: { seg: -10000, din: 0, msg: 'El invitado te dominÃ³ en vivo. La diferencia fue demasiado visible.' } },
        { text: 'Entrevista clÃ¡sica con humor estratÃ©gico', detail: 'Jugar sobre seguro con estilo.', prob: 0.71,
          exito:   { seg: 13000, din: 4, msg: 'Entrevista fluida y con momentos de humor que la hicieron especial.' },
          fracaso: { seg: -2000, din: 0, msg: 'El invitado difÃ­cil pudo con vos. Resultado plano.' } },
      ],
    },
    {
      title: 'Debate EspontÃ¡neo en Vivo',
      desc: 'En el medio de un stream, Migue lanza un debate no planeado y te da la palabra sin aviso previo.',
      opciones: [
        { text: 'Tomar el debate y llevarlo al extremo', detail: 'ImprovisaciÃ³n pura.', prob: 0.47,
          exito:   { seg: 19000, din: 5, msg: 'El debate explotÃ³. Tu posiciÃ³n fue la mÃ¡s discutida de la noche.' },
          fracaso: { seg: -7000, din: 0, msg: 'No tenÃ­as argumentos listos. Quedaste sin respuestas convincentes.' } },
        { text: 'Aportar desde un lugar mÃ¡s tranquilo', detail: 'No todo tiene que ser extremo.', prob: 0.68,
          exito:   { seg: 8000, din: 2, msg: 'La calma contrastÃ³ bien con el caos. Tu voz se diferenciÃ³.' },
          fracaso: { seg: -1000, din: 0, msg: 'Quedaste opacado entre las voces mÃ¡s fuertes del panel.' } },
      ],
    },
    {
      title: 'DÃ­a Homenaje a Pito Faez',
      desc: 'ALGA organiza un homenaje especial a Pito Faez. En pleno programa, Migue Granate te pasa el micrÃ³fono y te ofrece cantar un tema del artista en vivo.',
      opciones: [
        { text: 'CantÃ¡s. Total, estamos en ALGA.', detail: 'Si no es acÃ¡, Â¿dÃ³nde?', prob: 0.45,
          exito:   { seg: 16000, din: 4, msg: 'La rompiste. El chat explotÃ³, Migue se emocionÃ³ y el homenaje quedÃ³ para la historia de ALGA.' },
          fracaso: { seg: -11000, din: 0, msg: 'Desafinaste de principio a fin. El clip circulÃ³ toda la semana pero no de la manera que querÃ­as.' } },
        { text: 'Te negÃ¡s. No es lo tuyo.', detail: 'Cada uno en lo suyo.', prob: 0.60,
          exito:   { seg: 6000, din: 2, msg: 'El homenaje fue Ã©pico igual. Tu negativa fue honesta y te ganaste el respeto del canal.' },
          fracaso: { seg: -4000, din: -3, msg: 'Migue lo tomÃ³ como falta de compromiso con el espÃ­ritu del canal. Te empezaron a dar menos espacio en la grilla.' } },
      ],
    },
    {
      title: 'Un nene habla de política en vivo',
      desc: 'Trajiste a la estrella infantil Jota a tu programa y el estudio se lleno de niños. Le acercÃ¡s el micrÃ³fono a uno de ellos. El nene grita "TODOS ACÃ� ODIAMOS AL PRESIDENTE".',
      opciones: [
        { text: 'Le sacÃ¡s el micrÃ³fono y cambias de tema', detail: 'No querÃ©s quilombo.', prob: 0.60,
          exito:   { seg: 1000, din: 0, msg: 'Fuiste rÃ¡pido y nadie se dio cuenta. La entrevista siguiÃ³ su curso.' },
          fracaso: { seg: -5000, din: 0, msg: 'En el arrebato le pegÃ¡s al nene sin querer y este llora. Las redes te matan.' } },
        { text: 'Te reÃ­s de la ocurrencia', detail: 'Confiemos en el caos.', prob: 0.40,
          exito:   { seg: 2000, din: 0, msg: 'Tu risa contagia al resto del equipo. Queda como un clip gracioso.' },
          fracaso: { seg: -2000, din: 0, msg: 'En las redes te tildan de golpista. El presidente comparte el clip y comenta "Asi operan los zurdos".' } },
      ],
    },
    {
      title: 'Sketch polÃ©mico',
      desc: 'En una lluvia de ideas dijiste que querÃ­as hacer una parodia del pesebre. Lo llevaste a cabo, te pusiste un paÃ±al y fingiste ser JesÃºs pero a la gente no le gustÃ³.',
      opciones: [
        { text: 'PedÃ­s disculpas al dÃ­a siguiente', detail: 'Con eso no se jode', prob: 0.70,
          exito:   { seg: 500, din: 0, msg: 'La mayorÃ­a te perdona y pasas pÃ¡gina rÃ¡pido' },
          fracaso: { seg: -5000, din: 0, msg: 'No lograste sonar convincente y te reÃ­ste de los nervios. Peor.' } },
        { text: 'DefendÃ©s el sketch', detail: 'El humor sana', prob: 0.30,
          exito:   { seg: 8000, din: 0, msg: 'Das un discurso sobre la doble moral y sobre el humor. Te los metiste a todos en el bolsillo' },
          fracaso: { seg: 0, din: 0, msg: 'Granate te llama en privado y te echa.', specialOutcome: 'forcedTransfer' } },
      ],
    },
    {
      title: ALGA_CAR_TITLE,
      desc: 'EstÃ¡s transmitiendo en vivo desde la entrada del canal cuando un auto frena de golpe a centÃ­metros tuyo. El susto es real.',
      isForced: true,
      opciones: [
        { text: 'CONTINUAR', detail: '', prob: 0,
          exito:   { seg: 0, din: 0, msg: '' },
          fracaso: { seg: 9000, din: -3, msg: 'Saliste corriendo con el micrÃ³fono puesto. El clip se volviÃ³ viral en minutos. Ganaste seguidores pero en el ambiente ahora te llaman "el cagÃ³n de ALGA".' } },
      ],
    },
  ],

  ASS: [
    {
      title: 'ClÃ¡sico Argentino en Vivo',
      desc: 'ASS cubre el partido mÃ¡s importante del aÃ±o. Fabio Assado te ofrece un lugar en la transmisiÃ³n principal.',
      opciones: [
        { text: 'AnÃ¡lisis tÃ©cnico en tiempo real', detail: 'Datos, contexto, profundidad.', prob: 0.62,
          exito:   { seg: 10000, din: 3, msg: 'PrecisiÃ³n quirÃºrgica. Los hinchas te aceptaron como voz autorizada.' },
          fracaso: { seg: -2000, din: 1, msg: 'Errores en los anÃ¡lisis durante momentos clave. Las crÃ­ticas dolieron.' } },
        { text: 'Panel de debate post-partido', detail: 'El fÃºtbol como disparador.', prob: 0.55,
          exito:   { seg: 12000, din: 3, msg: 'Debate encendido. Los clips circularon toda la noche en redes.' },
          fracaso: { seg: -3000, din: 0, msg: 'El debate se descontrolÃ³. ASS quedÃ³ expuesto negativamente.' } },
      ],
    },
    {
      title: 'Entrevista Exclusiva con Figura del FÃºtbol',
      desc: 'ASS tiene acceso a una de las grandes figuras del fÃºtbol argentino. Fabio Assado te confÃ­a la entrevista.',
      opciones: [
        { text: 'Las preguntas que nadie se anima a hacer', detail: 'Periodismo que incomoda.', prob: 0.38,
          exito:   { seg: 23000, din: 7, msg: 'Preguntaste lo que todos querÃ­an saber. Entrevista histÃ³rica del canal.' },
          fracaso: { seg: -5000, din: 0, msg: 'El jugador se cerrÃ³ en banda. Un desastre en vivo frente a todos.' } },
        { text: 'Entrevista cÃ¡lida y sin presiÃ³n', detail: 'Que el entrevistado se abra solo.', prob: 0.74,
          exito:   { seg: 11000, din: 3, msg: 'El jugador se abriÃ³ y dijo cosas que nunca habÃ­a dicho. Oro puro.' },
          fracaso: { seg: 1000, din: 1, msg: 'Correcta pero previsible. Sin momentos propios que la distingan.' } },
      ],
    },
    {
      title: 'Debate de Fichajes PolÃ©mico',
      desc: 'Una transferencia importante sacude al fÃºtbol argentino. ASS quiere voces fuertes.',
      opciones: [
        { text: 'OpiniÃ³n contundente y sin filtros', detail: 'Decir lo que se piensa.', prob: 0.44,
          exito:   { seg: 17000, din: 4, msg: 'AnÃ¡lisis valiente y fundamentado. Trending topic de la noche.' },
          fracaso: { seg: -9000, din: 0, msg: 'OpiniÃ³n que cayÃ³ fatal entre los hinchas mÃ¡s numerosos. Crisis.' } },
        { text: 'Presentar todos los Ã¡ngulos', detail: 'Ecuanimidad como ventaja.', prob: 0.72,
          exito:   { seg: 6000, din: 2, msg: 'AnÃ¡lisis serio y equilibrado. ASS valorÃ³ el profesionalismo.' },
          fracaso: { seg: -1000, din: 1, msg: 'Te vieron sin posiciÃ³n propia. Nadie quedÃ³ conforme.' } },
      ],
    },
    {
      title: 'Ciclo de Debate Semanal de Fabio',
      desc: 'Fabio Assado propone un ciclo semanal y te quiere como figura fija. Es un compromiso largo.',
      opciones: [
        { text: 'Ser el conductor, no el panelista', detail: 'Tomar las riendas completamente.', prob: 0.55,
          exito:   { seg: 14000, din: 6, msg: 'El ciclo se convirtiÃ³ en referencia del debate futbolÃ­stico argentino.' },
          fracaso: { seg: -4000, din: 1, msg: 'El formato no cuajÃ³. Los nÃºmeros no convencieron a Fabio ni al canal.' } },
        { text: 'Aceptar el rol de panelista destacado', detail: 'Menos exposiciÃ³n, menos riesgo.', prob: 0.74,
          exito:   { seg: 5000, din: 3, msg: 'Tus intervenciones fueron siempre las mÃ¡s citadas del programa.' },
          fracaso: { seg: -1000, din: 2, msg: 'Buen panelista, pero sin momentos propios que te distingan del resto.' } },
      ],
    },
    {
      title: 'Cobertura del Mundial Sub-20',
      desc: 'ASS tiene los derechos del torneo. Fabio Assado quiere que seas la cara de la cobertura.',
      opciones: [
        { text: 'Cobertura total, partido a partido', detail: 'La voz del torneo completo.', prob: 0.55,
          exito:   { seg: 14000, din: 5, msg: 'Fuiste la voz del torneo. Completo, apasionado, omnipresente.' },
          fracaso: { seg: -2000, din: 2, msg: 'El desgaste se notÃ³. Los Ãºltimos partidos fueron de baja calidad.' } },
        { text: 'Solo los partidos de mayor impacto', detail: 'Calidad sobre presencia.', prob: 0.68,
          exito:   { seg: 7000, din: 3, msg: 'Cobertura selectiva de alta calidad. El canal quedÃ³ mÃ¡s que conforme.' },
          fracaso: { seg: -1000, din: 2, msg: 'Algunos fans sintieron que no estuviste cuando mÃ¡s se te necesitaba.' } },
      ],
    },
  ],

  'RUZU TV': [
    {
      title: 'Panel de Primeras Citas en Vivo',
      desc: 'RUZU TV hace su segmento estrella: comentar primeras citas reales en tiempo real. Nico Bognato te pone al frente.',
      opciones: [
        { text: 'Ser el mÃ¡s irreverente del panel', detail: 'Sin autocensura, todo vale.', prob: 0.52,
          exito:   { seg: 12000, din: 3, msg: 'Tus comentarios fueron los mÃ¡s citados. El segmento explotÃ³ por vos.' },
          fracaso: { seg: -6000, din: 0, msg: 'Pasaste el lÃ­mite. Las personas en pantalla se ofendieron en vivo.' } },
        { text: 'El que da los consejos inesperadamente buenos', detail: 'Contraste inesperado.', prob: 0.70,
          exito:   { seg: 7000, din: 2, msg: 'El contraste entre el caos y tus consejos fue el momento del programa.' },
          fracaso: { seg: -1000, din: 0, msg: 'Los consejos serios no pegaron en un formato tan caÃ³tico.' } },
      ],
    },
    {
      title: 'DesafÃ­o de Humor Sin Filtros de Nico',
      desc: 'Nico Bognato lanza el desafÃ­o mÃ¡s famoso de RUZU: el chiste mÃ¡s arriesgado posible. Millones esperando.',
      opciones: [
        { text: 'Ir sin lÃ­mites, sin autocensura', detail: 'Todo o nada.', prob: 0.40,
          exito:   { seg: 17000, din: 4, msg: 'El chiste se convirtiÃ³ en leyenda del canal. Nico te aplaudiÃ³ de pie.' },
          fracaso: { seg: -10000, din: 0, msg: 'Cruzaste una lÃ­nea que no se debÃ­a cruzar. Crisis mediÃ¡tica.' } },
        { text: 'Arriesgado pero con criterio propio', detail: 'LÃ­mite elegido, no impuesto.', prob: 0.66,
          exito:   { seg: 9000, din: 3, msg: 'El chiste funcionÃ³ y quedaste bien parado. Raro y difÃ­cil lograrlo en RUZU.' },
          fracaso: { seg: -3000, din: 0, msg: 'Nico considerÃ³ que faltÃ³ valentÃ­a. La audiencia de RUZU lo notÃ³.' } },
      ],
    },
    {
      title: 'Cobertura de Actualidad al Estilo RUZU',
      desc: 'Un tema serio del dÃ­a, pero RUZU lo quiere con su filtro: caÃ³tico, directo y sin protocolo.',
      opciones: [
        { text: 'Sumarte al caos sin pensar demasiado', detail: 'Fluir con el formato.', prob: 0.56,
          exito:   { seg: 11000, din: 2, msg: 'Fue lo que RUZU necesitaba. Natural, caÃ³tico y muy visto.' },
          fracaso: { seg: -4000, din: 0, msg: 'Sin control ni estructura, el segmento fue un quilombo sin gracia.' } },
        { text: 'Aportar algo de anÃ¡lisis entre las risas', detail: 'Contenido entre el ruido.', prob: 0.67,
          exito:   { seg: 7000, din: 3, msg: 'El contraste te diferenciÃ³. Te vieron como una voz distinta en RUZU.' },
          fracaso: { seg: -1000, din: 0, msg: 'El anÃ¡lisis serio matÃ³ el ritmo del segmento. No encajÃ³.' } },
      ],
    },
    {
      title: 'Collab Picante con Nico Bognato',
      desc: 'Nico propone un stream de dos horas solo con vos. El formato explÃ­cito: sin temas prohibidos.',
      opciones: [
        { text: 'Aceptar sin condiciones', detail: 'Total apertura al formato.', prob: 0.50,
          exito:   { seg: 15000, din: 4, msg: 'Dos horas de contenido que el canal jamÃ¡s olvidarÃ¡. HistÃ³rico para RUZU.' },
          fracaso: { seg: -7000, din: 0, msg: 'El stream se fue a un lugar del que ninguno pudo salir bien parado.' } },
        { text: 'Establecer un lÃ­mite claro antes', detail: 'Tus reglas en el juego de Nico.', prob: 0.63,
          exito:   { seg: 8000, din: 2, msg: 'La tensiÃ³n entre tus lÃ­mites y el estilo de Nico fue el mejor contenido.' },
          fracaso: { seg: -2000, din: 0, msg: 'Nico se aburriÃ³ rÃ¡pido. El lÃ­mite le quitÃ³ la gracia al formato.' } },
      ],
    },
    {
      title: 'Debate Banal que se Pone Serio',
      desc: 'Empieza como un debate sobre comida o mÃºsica y termina tocando un nervio real. Nico te da la palabra.',
      opciones: [
        { text: 'Llevarlo al nivel serio sin avergonzarte', detail: 'El fondo emerge naturalmente.', prob: 0.57,
          exito:   { seg: 10000, din: 3, msg: 'El viraje fue el mejor momento del programa. Nadie lo vio venir.' },
          fracaso: { seg: -3000, din: 0, msg: 'El tono serio matÃ³ el humor y el nuevo tema tampoco cuajÃ³.' } },
        { text: 'Mantenerlo liviano y bajar la tensiÃ³n', detail: 'Humor como herramienta.', prob: 0.71,
          exito:   { seg: 6000, din: 2, msg: 'Salvaste el momento. El segmento terminÃ³ bien y todos quedaron cÃ³modos.' },
          fracaso: { seg: 0, din: 0, msg: 'Ni un lado ni el otro. El programa terminÃ³ sin pena ni gloria.' } },
      ],
    },
  ],

  RENDER: [
    {
      title: 'Entrevista a PolÃ­tico PolÃ©mico',
      desc: 'RENDER consiguiÃ³ al polÃ­tico mÃ¡s debatido del momento. TomÃ¡s Report te confÃ­a la entrevista.',
      opciones: [
        { text: 'Las preguntas que nadie se anima a hacer', detail: 'Periodismo sin concesiones.', prob: 0.40,
          exito:   { seg: 21000, din: 6, msg: 'Preguntaste lo que todo el paÃ­s querÃ­a escuchar. Clip millonario.' },
          fracaso: { seg: -8000, din: 0, msg: 'El polÃ­tico se enojÃ³ y cortÃ³ la entrevista. EscÃ¡ndalo para RENDER.' } },
        { text: 'Entrevista equilibrada y periodÃ­sticamente sÃ³lida', detail: 'Forma sobre show.', prob: 0.74,
          exito:   { seg: 11000, din: 4, msg: 'Entrevista rigurosa. Ganaste credibilidad en el ambiente polÃ­tico.' },
          fracaso: { seg: -2000, din: 0, msg: 'El polÃ­tico manejÃ³ la entrevista a su favor. Quedaste por debajo.' } },
      ],
    },
    {
      title: 'Debate de Actualidad en Vivo',
      desc: 'Hay una noticia urgente. TomÃ¡s Report te manda al aire en diez minutos. Sin tiempo de preparar nada.',
      opciones: [
        { text: 'Improvisar con lo que sabÃ©s', detail: 'Confiar en el conocimiento acumulado.', prob: 0.50,
          exito:   { seg: 13000, din: 3, msg: 'La improvisaciÃ³n fue sÃ³lida. Te reconocieron como alguien que sabe.' },
          fracaso: { seg: -5000, din: 0, msg: 'Los errores factuales en vivo destruyeron la credibilidad del segmento.' } },
        { text: 'Pedir diez minutos para informarte bien', detail: 'La preparaciÃ³n como responsabilidad.', prob: 0.67,
          exito:   { seg: 8000, din: 3, msg: 'La espera valiÃ³ la pena. El anÃ¡lisis fue de los mejores del canal.' },
          fracaso: { seg: -2000, din: 0, msg: 'Para cuando saliste, la noticia ya la habÃ­an cubierto todos los demÃ¡s.' } },
      ],
    },
    {
      title: 'InvestigaciÃ³n PeriodÃ­stica Propia',
      desc: 'TomÃ¡s Report te propone llevar una investigaciÃ³n propia al aire. El tema es sensible y el impacto puede ser enorme.',
      opciones: [
        { text: 'Publicar ahora, el tiempo es clave', detail: 'El primero en llegar gana.', prob: 0.38,
          exito:   { seg: 26000, din: 8, msg: 'La investigaciÃ³n fue el tema del aÃ±o. RENDER es la fuente de todos.' },
          fracaso: { seg: -12000, din: 0, msg: 'Datos sin verificar. La desmentida fue peor que la nota original.' } },
        { text: 'Verificar cada dato antes de salir', detail: 'La credibilidad se construye despacio.', prob: 0.76,
          exito:   { seg: 15000, din: 5, msg: 'InvestigaciÃ³n impecable. Nadie pudo impugnar un solo dato.' },
          fracaso: { seg: -1000, din: 0, msg: 'La verificaciÃ³n tardÃ³ demasiado. Otro medio publicÃ³ primero.' } },
      ],
    },
    {
      title: 'Cobertura de Crisis PolÃ­tica',
      desc: 'Estalla una crisis de gobierno. RENDER entra en modo 24/7 y te proponen como cara visible de la cobertura.',
      opciones: [
        { text: 'Estar al aire las 24 horas', detail: 'El canal antes que todo.', prob: 0.47,
          exito:   { seg: 19000, din: 6, msg: 'Fuiste la referencia de la crisis. El paÃ­s entero miraba RENDER y a vos.' },
          fracaso: { seg: -4000, din: 0, msg: 'El agotamiento se vio. En hora 18 ya no habÃ­a anÃ¡lisis, solo errores.' } },
        { text: 'Coberturas de 4 horas con anÃ¡lisis profundo', detail: 'Sostenible y de calidad.', prob: 0.69,
          exito:   { seg: 12000, din: 4, msg: 'Cobertura de alta calidad. Te diferenciaste del ruido de los demÃ¡s medios.' },
          fracaso: { seg: -1000, din: 0, msg: 'La audiencia querÃ­a continuidad. Tus ausencias entre bloques los alejaron.' } },
      ],
    },
    // â”€â”€ EVENTO: El co-conductor se entera en vivo que serÃ¡ echado
    {
      title: CO_CONDUCTOR_TITLE,
      desc: 'En plena transmisiÃ³n, tu co-conductor se entera de que va a ser despedido. Explota en el aire: insulta al canal, a los dueÃ±os, a todos. Las redes arden. Vos estÃ¡s ahÃ­ al lado.',
      opciones: [
        { text: 'No decÃ­s nada. DejÃ¡s que pase.', detail: 'Silencio estratÃ©gico.', prob: 0.60,
          exito:   { seg: 5000, din: 3, msg: 'Echan al conductor y no a vos. RENDER te ve como alguien que sabe mantener la calma.' },
          fracaso: { seg: -9000, din: 0, msg: 'Las redes te destruyen: "Tibio", "CÃ³mplice del canal", "Sin carÃ¡cter". El hateo dura semanas.' } },
        { text: 'Lo apoyÃ¡s con chistes irÃ³nicos en vivo', detail: 'AcompaÃ±arlo con humor.', prob: 0.40,
          exito:   { seg: 14000, din: 2, msg: 'Las redes te aman. "El que estuvo con su compaÃ±ero hasta el final." Momento histÃ³rico del canal.' },
          fracaso: { seg: -6000, din: -4, msg: 'Los dueÃ±os te citan al dÃ­a siguiente: "Por hacerte el vivo en un momento serio, tu contrato se rescinde." Te echan.', specialOutcome: 'forcedTransfer' } },
      ],
    },

    // â”€â”€ EVENTO FORZADO: Brote de tuberculosis (sin opciones reales, resultado siempre negativo)
    {
      title: TUBERCULOSIS_TITLE,
      desc: 'Un brote de tuberculosis en el estudio se expande sin control. Te contagiÃ¡s. PerdÃ©s un mes de programa, tus nÃºmeros tardan en recuperarse y varios invitados que tenÃ­as planeados se dan de baja por tu ausencia.',
      isForced: true,
      opciones: [
        { text: 'CONTINUAR', detail: '', prob: 0,
          exito:   { seg: 0, din: 0, msg: '' },
          fracaso: { seg: -11000, din: -5, msg: 'Un mes sin stream. Los nÃºmeros cayeron y los invitados cancelaron. Cuando volviste, tuviste que empezar casi de cero.' } },
      ],
    },

    // â”€â”€ EVENTO ESPECIAL Ãºnico por partida: Mosquita Fart al Mundial
    {
      title: 'COBERTURA MUNDIAL',
      desc: 'Durante el programa en vivo te enterÃ¡s que el canal mandarÃ¡ a Mosquita Fart para la cobertura del Mundial. A la piba le tirÃ¡s una pelota y le saca los gajos.',
      isSpecial: true,
      opciones: [
        { text: 'MirÃ¡s a cÃ¡mara con cara de "Daaaale"', detail: 'Que el pÃºblico lo interprete.', prob: 0.55,
          exito:   { seg: 3000, din: 4, msg: 'Todos lo leyeron como un chiste. Tu cara se viralizÃ³ y el canal, en lugar de enojarse, te subiÃ³ el sueldo para calmarte.' },
          fracaso: { seg: -4000, din: -3, msg: 'En el corte se acerca el productor: "RespetÃ¡ los rangos." Te bajan el sueldo y te advierten formalmente.' } },
        { text: 'Te quejÃ¡s por redes', detail: 'DecÃ­s lo que pensÃ¡s pÃºblicamente.', prob: 0.40,
          exito:   { seg: 12000, din: -2, msg: 'Los fans te aman y tu posteo se hace viral. Pero los dueÃ±os te tienen entre ceja y ceja. El ambiente interno se pone tenso.' },
          fracaso: { seg: -7000, din: 0, msg: 'Los dueÃ±os no perdonan la queja pÃºblica. Te llaman y te dicen que tu contrato no se renueva. SalÃ­s a buscar canal.', specialOutcome: 'forcedTransfer' } },
      ],
    },

    // â”€â”€ EVENTO ESPECIAL: solo ocurre una vez (state.renderSold lo controla)
    {
      title: RENDER_SOLD_TITLE,
      desc: 'A mitad de temporada, RENDER anuncia que fue adquirido por un nuevo grupo mediÃ¡tico. Todos los contratos del staff quedan rescindidos de inmediato. No hay apelaciÃ³n posible.',
      isSpecial: true,
      opciones: [
        { text: 'Intentar quedarte en el canal reformado', detail: 'QuizÃ¡s el nuevo dueÃ±o te renueve.', prob: 0.05,
          exito:   { seg: 3000, din: 0, msg: 'El nuevo dueÃ±o decidiÃ³ renovarte por una sola temporada... rarÃ­simo.', specialOutcome: 'forcedTransfer' },
          fracaso: { seg: -5000, din: 0, msg: 'El nuevo dueÃ±o no renovÃ³ ningÃºn contrato. Te quedÃ¡s sin trabajo de un dÃ­a para el otro.', specialOutcome: 'forcedTransfer' } },
        { text: 'Agarrar las cosas y salir antes de que te echen', detail: 'Salir con dignidad.', prob: 0.95,
          exito:   { seg: 1000, din: 3, msg: 'Saliste con dignidad. En el ambiente todos saben lo que pasÃ³ y te respetan por eso.', specialOutcome: 'forcedTransfer' },
          fracaso: { seg: -2000, din: 0, msg: 'La salida se hizo pÃºblica de mala manera. Igual te fuiste, pero sin la mejor imagen.', specialOutcome: 'forcedTransfer' } },
      ],
    },
  ],

  CARANCHO: [
    {
      title: 'Propaganda en Horario Central',
      desc: 'El Gordo Pan quiere que defiendas la posiciÃ³n del gobierno en vivo durante el horario de mayor audiencia. Sin matices.',
      opciones: [
        { text: 'Defender al 100%, sin fisuras', detail: 'La lÃ­nea del canal, completa.', prob: 0.67,
          exito:   { seg: 9000, din: 5, msg: 'El Gordo Pan te felicitÃ³ en vivo. El canal quedÃ³ muy satisfecho.' },
          fracaso: { seg: -5000, din: 0, msg: 'Hubo un momento donde no tenÃ­as respuesta. El canal lo notÃ³.' } },
        { text: 'Matizar el mensaje sutilmente', detail: 'Un gramo de honestidad propia.', prob: 0.38,
          exito:   { seg: 16000, din: 3, msg: 'El matiz generÃ³ debate y paradÃ³jicamente aumentÃ³ la audiencia.' },
          fracaso: { seg: -8000, din: 0, msg: 'CARANCHO no tolera matices. El Gordo Pan lo tomÃ³ como una traiciÃ³n.' } },
      ],
    },
    {
      title: 'Entrevista a Funcionario Oficialista',
      desc: 'El Gordo Pan consiguiÃ³ un ministro. El formato es claro: preguntas amigables, ninguna incomodidad.',
      opciones: [
        { text: 'Seguir el guiÃ³n del canal al pie de la letra', detail: 'La entrevista que el canal quiere.', prob: 0.72,
          exito:   { seg: 7000, din: 5, msg: 'El funcionario quedÃ³ contento. El canal tambiÃ©n. El trabajo, hecho.' },
          fracaso: { seg: -3000, din: 0, msg: 'Incluso siguiendo el guiÃ³n, algo saliÃ³ mal. El funcionario se molestÃ³.' } },
        { text: 'Lanzar una pregunta incÃ³moda de rebote', detail: 'Un momento de periodismo real.', prob: 0.33,
          exito:   { seg: 19000, din: 6, msg: 'La pregunta incÃ³moda se viralizÃ³. Inesperadamente, incluso CARANCHO la celebrÃ³.' },
          fracaso: { seg: -10000, din: 0, msg: 'El Gordo Pan cortÃ³ tu micrÃ³fono en vivo. Crisis interna sin precedentes.' } },
      ],
    },
    {
      title: 'Evento de CampaÃ±a en Vivo',
      desc: 'CARANCHO organiza un evento polÃ­tico masivo. El Gordo Pan quiere que seas el streamer estrella de la cobertura.',
      opciones: [
        { text: 'Cobertura con entusiasmo total', detail: 'Comprometerte con el evento.', prob: 0.63,
          exito:   { seg: 11000, din: 5, msg: 'Tu energÃ­a contagiÃ³. El evento fue un Ã©xito y vos fuiste parte de eso.' },
          fracaso: { seg: -2000, din: 0, msg: 'El evento tuvo problemas tÃ©cnicos. Tu cobertura los amplificÃ³.' } },
        { text: 'Cobertura neutral, sin tomar partido', detail: 'El periodismo por sobre la polÃ­tica.', prob: 0.42,
          exito:   { seg: 7000, din: 2, msg: 'La neutralidad en CARANCHO fue vista como valentÃ­a. Inusual y efectiva.' },
          fracaso: { seg: -9000, din: 0, msg: 'CARANCHO no contratÃ³ a alguien neutral. Te dejaron fuera del evento principal.' } },
      ],
    },
    {
      title: 'Te Piden Atacar a un Periodista Rival',
      desc: 'La direcciÃ³n del canal te manda un mensaje claro: tenÃ©s que ir contra un periodista de otro medio en vivo.',
      opciones: [
        { text: 'Hacerlo: seguir la lÃ­nea del canal', detail: 'Prioridad al contrato.', prob: 0.57,
          exito:   { seg: 9000, din: 4, msg: 'El ataque fue efectivo segÃºn los estÃ¡ndares de CARANCHO. El canal quedÃ³ conforme.' },
          fracaso: { seg: -5000, din: 0, msg: 'El periodista atacado respondiÃ³ mejor. Te hiciste quedar mal a vos mismo.' } },
        { text: 'Negarte a atacar a otra persona', detail: 'Tu integridad primero.', prob: 0.48,
          exito:   { seg: 13000, din: 3, msg: 'La negativa se viralizÃ³. ParadÃ³jicamente, ganaste seguidores fuera de CARANCHO.' },
          fracaso: { seg: -10000, din: 0, msg: 'CARANCHO no negocia la lÃ­nea editorial. Tu posiciÃ³n dentro del canal peligra.' } },
      ],
    },
    {
      title: 'El EscÃ¡ndalo: CARANCHO y RENDER, el Mismo DueÃ±o',
      desc: 'Sale a la luz que CARANCHO y RENDER tienen el mismo propietario. El escÃ¡ndalo mediÃ¡tico es monumental.',
      opciones: [
        { text: 'Defender la situaciÃ³n en nombre del canal', detail: 'El canal te pide que salgas a aclarar.', prob: 0.45,
          exito:   { seg: 6000, din: 6, msg: 'Lograste bajar la temperatura. El canal te lo agradeciÃ³ con un bono.' },
          fracaso: { seg: -12000, din: 0, msg: 'La defensa fue insostenible. Te convirtieron en el blanco de todas las crÃ­ticas.' } },
        { text: 'Salir del tema con humor y esquivar', detail: 'No querer saber nada.', prob: 0.64,
          exito:   { seg: 7000, din: 2, msg: 'El humor desactivÃ³ el momento. El canal respirÃ³ aliviado.' },
          fracaso: { seg: -4000, din: 0, msg: 'El chiste cayÃ³ pÃ©simo en un momento serio. Peor el remedio que la enfermedad.' } },
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
          fracaso: { seg: -4000, din: 0, msg: 'Los panelistas te pasaron por encima. Perdiste el control y el canal quedÃ³ expuesto.' } },
        { text: 'Sumarte al debate y tomar posiciÃ³n', detail: 'Bancar la lÃ­nea del canal.', prob: 0.48,
          exito:   { seg: 14000, din: 4, msg: 'Tu posiciÃ³n fue clara y contundente. La militancia te adoptÃ³. El panel fue trending.' },
          fracaso: { seg: -7000, din: 0, msg: 'La interna del movimiento te comiÃ³. Quedaste en el medio de un fuego cruzado del que no pudiste salir.' } },
      ],
    },
    {
      title: 'Entrevista a un Referente del Movimiento',
      desc: 'QUERATINA consiguiÃ³ a una figura histÃ³rica del peronismo. Pepe Racinclub te confÃ­a la entrevista. La audiencia del canal la espera hace semanas.',
      opciones: [
        { text: 'Preguntas crÃ­ticas, periodismo sin concesiones', detail: 'La figura lo merece.', prob: 0.42,
          exito:   { seg: 19000, din: 5, msg: 'Preguntaste lo que nadie se animaba a preguntar. La entrevista fue histÃ³rica para el canal.' },
          fracaso: { seg: -8000, din: 0, msg: 'El referente se cerrÃ³ y la entrevista muriÃ³ antes de empezar. QUERATINA no te lo perdonÃ³ fÃ¡cil.' } },
        { text: 'Entrevista respetuosa y de fondo', detail: 'Que el entrevistado se abra solo.', prob: 0.72,
          exito:   { seg: 11000, din: 3, msg: 'La figura hablÃ³ como nunca. Momento emotivo que el canal usÃ³ durante semanas.' },
          fracaso: { seg: -2000, din: 0, msg: 'Correcta pero sin momentos propios. La audiencia esperaba mÃ¡s profundidad.' } },
      ],
    },
    {
      title: 'Cobertura del Festival de Cine Nacional',
      desc: 'QUERATINA cubre el festival de cine argentino mÃ¡s importante del aÃ±o. Te mandan a vos a la alfombra roja y a las funciones.',
      opciones: [
        { text: 'AnÃ¡lisis cinematogrÃ¡fico serio, pelÃ­cula por pelÃ­cula', detail: 'El cine merece respeto.', prob: 0.60,
          exito:   { seg: 8000, din: 3, msg: 'Tu cobertura fue la mÃ¡s completa del festival. El ambiente cinÃ©filo te empezÃ³ a seguir.' },
          fracaso: { seg: -2000, din: 0, msg: 'El anÃ¡lisis fue demasiado tÃ©cnico para la audiencia habitual del canal. Los nÃºmeros no acompaÃ±aron.' } },
        { text: 'Entrevistas al paso en la alfombra roja', detail: 'El espectÃ¡culo por sobre el anÃ¡lisis.', prob: 0.65,
          exito:   { seg: 12000, din: 4, msg: 'Los clips de las entrevistas circularon en todos lados. Momento espontÃ¡neo que hizo quedar bien al canal.' },
          fracaso: { seg: -3000, din: 0, msg: 'Un director conocido te cortÃ³ la entrevista en vivo porque no te sabÃ­a el nombre. Viral, pero no del bueno.' } },
      ],
    },
    {
      title: 'EscÃ¡ndalo PolÃ­tico en Vivo',
      desc: 'Un dirigente cercano al canal protagoniza un escÃ¡ndalo en plena jornada. QUERATINA quiere reacciÃ³n inmediata al aire.',
      opciones: [
        { text: 'Cubrirlo con datos y contexto, sin apasionamiento', detail: 'Periodismo antes que militancia.', prob: 0.58,
          exito:   { seg: 10000, din: 3, msg: 'Tu cobertura fue seria y equilibrada. Te diferenciaste del ruido general.' },
          fracaso: { seg: -3000, din: 0, msg: 'El canal esperaba mÃ¡s compromiso con la lÃ­nea editorial. Quedaste como tibio.' } },
        { text: 'Opinar fuerte desde la lÃ­nea del canal', detail: 'Bancar la posiciÃ³n sin dudar.', prob: 0.46,
          exito:   { seg: 16000, din: 4, msg: 'La posiciÃ³n fue contundente. La audiencia fiel de QUERATINA te aplaudiÃ³ de pie.' },
          fracaso: { seg: -9000, din: 0, msg: 'El escÃ¡ndalo terminÃ³ siendo un fiasco y vos quedaste defendiendo lo indefendible en vivo.' } },
      ],
    },
    {
      title: 'Pepe Racinclub te Manda al Frente',
      desc: 'En plena transmisiÃ³n, Pepe Racinclub te nombra frente a cÃ¡mara y te pide que des tu opiniÃ³n sobre un tema en el que no tenÃ©s posiciÃ³n clara. Sin aviso, sin tiempo.',
      opciones: [
        { text: 'Bancarte el momento y opinar igual', detail: 'Improvisar con lo que tenÃ©s.', prob: 0.50,
          exito:   { seg: 13000, din: 3, msg: 'La improvisaciÃ³n saliÃ³ sÃ³lida. Pepe te guiÃ±Ã³ el ojo al corte. Ganaste terreno en QUERATINA.' },
          fracaso: { seg: -6000, din: 0, msg: 'La opiniÃ³n improvisada fue un desastre. Las redes lo agarraron y no lo soltaron.' } },
        { text: 'Devolverle la pelota a Pepe con una pregunta', detail: 'Redirigir sin quedar expuesto.', prob: 0.64,
          exito:   { seg: 7000, din: 2, msg: 'La maniobra fue elegante. Pepe lo tomÃ³ con humor y la situaciÃ³n se resolviÃ³.' },
          fracaso: { seg: -3000, din: 0, msg: 'Pepe no aceptÃ³ la devoluciÃ³n. Te dejÃ³ en el aire frente a toda la audiencia.' } },
      ],
    },
    {
      title: QUERATINA_SONG_TITLE,
      desc: 'Un seguidor compuso una canciÃ³n dedicada a una estrella de mar con un culo pronunciado. Sin que nadie lo planificara, el tema te involucra y te hacÃ©s viral en TikTok durante toda la semana.',
      isSpecial: true,
      opciones: [
        { text: 'Te montÃ¡s en el viral. Lo compartÃ­s, lo bailÃ¡s, lo hacÃ©s tuyo.', detail: 'Si ya sos meme, mejor serlo con dignidad.', prob: 0.58,
          exito:   { seg: 22000, din: 0, msg: 'El momento fue glorioso. Millones de vistas, apareciste en todos los medios y la canciÃ³n sonÃ³ en un programa de TV. Pepe Racinclub no entendiÃ³ nada pero festejÃ³ igual.' },
          fracaso: { seg: -5000, din: 0, msg: 'El intento de montarte en el viral quedÃ³ forzado. Las redes lo sintieron artificial y el chiste se convirtiÃ³ en otro chiste, pero sobre vos.' } },
        { text: 'Lo ignorÃ¡s. QUERATINA es un canal serio.', detail: 'La imagen polÃ­tica primero.', prob: 0.52,
          exito:   { seg: 3000, din: 0, msg: 'La decisiÃ³n de no comentarlo fue leÃ­da como madurez. El viral pasÃ³ solo y tu imagen dentro del canal quedÃ³ intacta.' },
          fracaso: { seg: -8000, din: 0, msg: 'Ignorarlo fue un error. Todo el mundo hablaba del tema y tu silencio hizo que parecieras molesto. Las redes te hicieron meme igual, pero sin que pudieras controlar el relato.' } },
      ],
    },
  ],

  FUTUPOP: [
    {
      title: 'Entrevista PolÃ­tica que Deriva en Jam Session',
      desc: 'Un polÃ­tico polÃ©mico acepta venir a FUTUPOP. La entrevista arranca seria, pero hay una guitarra en el set y el invitado la mira fijo.',
      opciones: [
        { text: 'Mantenerlo en el carril polÃ­tico, sin distracciones', detail: 'La seriedad del tema lo exige.', prob: 0.62,
          exito:   { seg: 8000, din: 3, msg: 'Entrevista rigurosa. Furia Mentolini te felicitÃ³. El canal te posicionÃ³ como voz polÃ­tica seria.' },
          fracaso: { seg: -3000, din: 0, msg: 'El polÃ­tico fue evasivo y vos no pudiste sacarlo de los lugares comunes. Entrevista plana.' } },
        { text: 'Dejar que fluya hacia la guitarra y la mÃºsica', detail: 'El momento manda.', prob: 0.48,
          exito:   { seg: 17000, din: 4, msg: 'El clip del polÃ­tico tocando la guitarra se viralizÃ³ en todo el paÃ­s. FUTUPOP fue trending topic.' },
          fracaso: { seg: -5000, din: 0, msg: 'El momento musical fue forzado y el polÃ­tico se incomodÃ³. La entrevista no tuvo ni fondo polÃ­tico ni momento memorable.' } },
      ],
    },
    {
      title: 'Panel de Actualidad que Explota',
      desc: 'FUTUPOP arma un panel con cuatro voces muy distintas sobre el tema del momento. Furia te da la moderaciÃ³n.',
      opciones: [
        { text: 'Moderar con mano firme, sin perder el hilo', detail: 'El orden hace el contenido.', prob: 0.65,
          exito:   { seg: 9000, din: 3, msg: 'Panel intenso pero controlado. Te ganaste el respeto del ambiente periodÃ­stico.' },
          fracaso: { seg: -2000, din: 0, msg: 'Dos panelistas se fueron a las manos verbalmente y vos perdiste el control del debate.' } },
        { text: 'Dejar que el caos haga el espectÃ¡culo', detail: 'El conflicto es el contenido.', prob: 0.44,
          exito:   { seg: 18000, din: 5, msg: 'El panel fue un escÃ¡ndalo glorioso. Todos hablaban de FUTUPOP al dÃ­a siguiente.' },
          fracaso: { seg: -8000, din: 0, msg: 'El panel explotÃ³ de verdad. Un invitado se fue en vivo y otro amenazÃ³ con demandar al canal.' } },
      ],
    },
    {
      title: 'Collab con Furia Mentolini',
      desc: 'Furia te propone hacer un stream de dos horas juntos, mitad polÃ­tica, mitad mÃºsica. La audiencia del canal entera va a estar mirando.',
      opciones: [
        { text: 'Dejar que Furia lleve el timÃ³n', detail: 'Es su casa. Sumarte sin competir.', prob: 0.70,
          exito:   { seg: 11000, din: 4, msg: 'La dupla funcionÃ³ de diez. La comunidad de Furia te adoptÃ³ sin resistencia.' },
          fracaso: { seg: -2000, din: 0, msg: 'Quedaste opacado al lado de Furia. La audiencia ni te registrÃ³.' } },
        { text: 'Proponer una estructura donde los dos brillen por igual', detail: 'Negociar los tÃ©rminos.', prob: 0.46,
          exito:   { seg: 20000, din: 6, msg: 'El formato fue brillante. Empezaron a hablar de ustedes como la dupla del aÃ±o en FUTUPOP.' },
          fracaso: { seg: -5000, din: 0, msg: 'Furia no recibiÃ³ bien la propuesta. El stream saliÃ³ tenso y sin la chispa que tenÃ­a que tener.' } },
      ],
    },
    {
      title: 'Lanzamiento Musical con PolÃ©mica PolÃ­tica',
      desc: 'Un artista importante estrena su disco en FUTUPOP. Pero una de las letras tiene una referencia polÃ­tica muy directa y los medios ya estÃ¡n encima.',
      opciones: [
        { text: 'Cubrir el lanzamiento y esquivar la polÃ©mica', detail: 'La mÃºsica, sin el ruido.', prob: 0.58,
          exito:   { seg: 7000, din: 3, msg: 'El lanzamiento fue un Ã©xito limpio. El artista quedÃ³ contento y el canal tambiÃ©n.' },
          fracaso: { seg: -2000, din: 0, msg: 'La audiencia esperaba que tocaras el tema polÃ­tico. Al evitarlo, quedaste como tibio.' } },
        { text: 'Meterle el tema polÃ­tico de frente', detail: 'Darle al lanzamiento el contexto real.', prob: 0.50,
          exito:   { seg: 15000, din: 4, msg: 'Entrevista de fondo. La mezcla de mÃºsica y polÃ­tica fue exactamente lo que FUTUPOP necesitaba.' },
          fracaso: { seg: -6000, din: 0, msg: 'El artista se cerrÃ³ cuando empezaste con la polÃ­tica. La entrevista se cortÃ³ antes de tiempo.' } },
      ],
    },
    {
      title: 'Cobertura en Vivo de una Protesta',
      desc: 'Estalla una protesta masiva y FUTUPOP quiere ser el canal que la cubre desde adentro. Furia te manda a vos al piso.',
      opciones: [
        { text: 'Cobertura periodÃ­stica, con contexto y datos', detail: 'Informar antes que opinar.', prob: 0.63,
          exito:   { seg: 12000, din: 4, msg: 'Cobertura de alta calidad. Te posicionaste como referente de periodismo de calle en el canal.' },
          fracaso: { seg: -3000, din: 0, msg: 'La situaciÃ³n se descontrolÃ³ y tu transmisiÃ³n se cortÃ³ justo en el momento clave.' } },
        { text: 'Mezclarte con los manifestantes y transmitir desde adentro', detail: 'El periodismo inmersivo.', prob: 0.45,
          exito:   { seg: 21000, din: 5, msg: 'Las imÃ¡genes que conseguiste desde adentro de la protesta fueron las mÃ¡s vistas del dÃ­a.' },
          fracaso: { seg: -9000, din: 0, msg: 'Te reconocieron como streamer y la situaciÃ³n se complicÃ³. Tuviste que cortar la transmisiÃ³n y salir corriendo.' } },
      ],
    },
  ],

};

// â”€â”€â”€ ESTADO DEL JUEGO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Objeto central que representa toda la partida en curso.
// Se muta directamente (sin inmutabilidad) para simplificar el cÃ³digo.

const state = {
  phase:         'intro',   // pantalla activa
  streamerName:  '',        // nombre elegido por el jugador
  season:        1,         // temporada actual (1â€“12)
  eventIndex:    0,         // Ã­ndice del evento dentro de la temporada (0, 1, 2)
  currentChannel: null,     // ID del canal activo (string)
  followers:     5200,      // estadÃ­stica de seguidores
  money:         0,         // dinero acumulado (en miles: 1 = $1K)
  careerHistory: [],        // [{ channel, seasons }] historial de canales
  currentEvents: [],        // eventos de la temporada en curso (array de 3)
  lastResult:    null,      // resultado del Ãºltimo evento procesado
  seasonAccum:   { seg: 0, din: 0 },  // acumulado de la temporada
  isFirstMarket:     true,   // true solo en el primer mercado de pases
  renderSold:        false,  // si RENDER ya fue vendido (evento especial)
  mosquitaFartSeen:  false,  // si Mosquita Fart ya fue al Mundial (evento Ãºnico)
  algaCarSeen:       false,  // si el evento del auto ya ocurriÃ³ (evento Ãºnico)
  orterixBoxingSeen: false,  // si el boxeo de streamers ya ocurriÃ³ (evento Ãºnico)
  warioPaySeen:      false,  // si Wario eligiÃ³ la opciÃ³n B (nunca mÃ¡s aparece)
  queratinaSongSeen: false,  // si la canciÃ³n de la estrella de mar ya ocurriÃ³ (evento Ãºnico)
  coConductorSeen:   false,  // si el co-conductor fue echado en vivo (evento Ãºnico)
  tuberculosisSeen:  false,  // si el brote de tuberculosis ya ocurriÃ³ (evento Ãºnico)
};

// â”€â”€â”€ UTILIDADES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Escapa HTML para prevenir XSS al mostrar input del usuario */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Formatea un nÃºmero de seguidores (ej: 5200 â†’ '5K') */
function fmtSeg(n) {
  const v = Math.abs(n);
  if (v >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (v >= 1000)    return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

/** Formatea dinero en miles (ej: 14 â†’ '$14K', 1200 â†’ '$1.2M') */
function fmtDin(n) {
  const v = Math.abs(n);
  if (v >= 1000) return `$${(n / 1000).toFixed(1)}M`;
  return `$${n}K`;
}

/** Devuelve HTML coloreado para un cambio de estadÃ­stica */
function deltaHtml(v, isMoney = false) {
  if (v === 0) return `<span class="delta-neutral">â€”</span>`;
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

/** Devuelve la valoraciÃ³n final segÃºn el puntaje acumulado */
function getFinalRating() {
  const score = state.followers / 1000;
  if (score >= 350) return { label: 'Figura HistÃ³rica', emoji: 'ðŸ†', color: '#f59e0b' };
  if (score >= 230) return { label: 'Gran Carrera',      emoji: 'ðŸŒŸ', color: '#a78bfa' };
  if (score >= 140) return { label: 'Buena Carrera',     emoji: 'ðŸ‘', color: '#4ade80' };
  if (score >= 70)  return { label: 'Carrera Discreta',  emoji: 'ðŸ™‚', color: '#38bdf8' };
  return               { label: 'Carrera Olvidable',  emoji: 'ðŸ˜¶', color: '#6b7280' };
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

// â”€â”€â”€ HUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Actualiza todos los elementos del HUD con el estado actual */
function updateHud() {
  const c = canal(state.currentChannel);

  // Canal y nombre
  document.getElementById('hud-channel').textContent = c.short;
  document.getElementById('hud-name').textContent    = state.streamerName ? `| ${state.streamerName}` : '';

  // EstadÃ­sticas
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

// â”€â”€â”€ RENDERIZADO DE PANTALLAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Cada funciÃ³n devuelve una cadena HTML que se inyecta en #screen.
// Los botones usan atributos data-action / data-* para el handler delegado.

function renderIntro() {
  return `
    <div class="screen-center">
      <div class="intro-wrap">
        <div>
          <p class="label-mono">Streaming argentino Â· Modo Carrera</p>
          <h1 class="title-hero">STREAMERO</h1>
          <div class="divider-glow" style="margin-top:0.75rem"></div>
        </div>

        <div class="intro-story">
          <p>Durante aÃ±os transmitiste desde tu casa por simple diversiÃ³n.</p>
          <p>Con el tiempo empezaste a formar una pequeÃ±a comunidad. No eras el streamer mÃ¡s grande, pero quienes te seguÃ­an siempre estaban ahÃ­.</p>
          <p>Un par de clips comenzaron a circular por las redes y tu nombre empezÃ³ a sonar dentro del ambiente.</p>
          <p class="highlight">Ese crecimiento llamÃ³ la atenciÃ³n de un canal de streaming.</p>
          <p class="highlight" style="font-size:1rem">Hoy recibiste tu primera propuesta.</p>
          <p class="highlight-accent">Tu carrera profesional estÃ¡ a punto de comenzar.</p>
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
          <h2 class="section-title" style="margin-top:0.5rem">Â¿CÃ³mo te<br>llaman?</h2>
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
    const labels  = { rem: ['','MÃ­nima','Baja','Media','Alta','Muy alta'], alc: ['','MÃ­nimo','Bajo','Medio','Alto','Muy alto'] };
    const demColor = c.exigencia === 'Alta' ? '#f87171' : c.exigencia === 'Media' ? '#fbbf24' : '#4ade80';
    const demIcon  = c.exigencia === 'Alta' ? 'ðŸ”´' : c.exigencia === 'Media' ? 'ðŸŸ¡' : 'ðŸŸ¢';
    const figHtml  = c.figura ? `<p class="channel-card-figure" style="color:${c.accent}">Figura: ${escapeHtml(c.figura)}</p>` : '';
    const badgeHtml = isCurr ? `<span class="badge badge-current badge-top-right" style="background:${c.color}">Renovar</span>` : '';

    return `
      <button class="channel-card" data-action="choose-channel" data-channel="${escapeHtml(id)}"
              style="${bg};${border};${shadow}">
        ${badgeHtml}
        <div>
          <p class="channel-card-name" style="color:${c.accent}">${escapeHtml(c.short)}</p>
          <p class="channel-card-tagline">${escapeHtml(c.tagline)}</p>
          <p class="channel-card-desc mt-1">${escapeHtml(c.desc)}</p>
          ${figHtml}
        </div>
        <div class="channel-card-stats">
          <div class="channel-stat-block">
            <label>RemuneraciÃ³n</label>
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
          ${isFirst ? 'Primera propuesta' : `Mercado de Pases Â· Tras Temporada ${state.season - 1}`}
        </p>
        <h2 class="section-title" style="margin-top:0.4rem">
          ${isFirst ? 'Tu Primer Contrato' : 'Mercado de Pases'}
        </h2>
        <p class="text-muted mt-1" style="font-size:0.85rem">
          ${isFirst ? 'Los canales que llegaron a vos. ElegÃ­ bien.' : 'Las propuestas que llegaron esta ventana. El orden es al azar.'}
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

  // Puntos de progreso del evento (3 eventos por temporada)
  const dotsHtml = [0,1,2].map(i => {
    const w  = i === idx ? '28px' : '16px';
    const bg = i < idx ? c.color : i === idx ? c.accent : 'rgba(255,255,255,0.08)';
    return `<span class="ev-dot" style="width:${w};background:${bg}"></span>`;
  }).join('');

  const specialBadge = ev.isSpecial
    ? `<span class="badge badge-special" style="margin-bottom:0.75rem;display:inline-block">EVENTO ESPECIAL</span>`
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
      <div class="event-header">
        <div>
          <p class="label-mono">Temporada ${state.season} Â· Evento ${idx + 1}/3</p>
          <div class="event-progress-dots" style="margin-top:0.5rem">${dotsHtml}</div>
        </div>
        <span class="event-channel-badge" style="background:${c.color}20;color:${c.accent};border-color:${c.color}40">
          ${escapeHtml(c.short)}
        </span>
      </div>

      <div class="event-card${ev.isSpecial ? ' is-special' : ''}">
        ${specialBadge}
        <h2 class="event-title">${escapeHtml(ev.title.replace('âš¡ ', ''))}</h2>
        <p class="event-desc">${escapeHtml(ev.desc)}</p>
      </div>

      <div class="event-options">
        <p class="event-options-label">Â¿QuÃ© decidÃ­s?</p>
        ${opcionesHtml}
      </div>
    </div>
  `;
}

function renderEventResult() {
  const r   = state.lastResult;
  const ok  = r.wasSuccess;
  const forced = !!r.delta.specialOutcome;

  const emoji      = forced ? 'ðŸšï¸' : ok ? 'ðŸ”¥' : 'ðŸ’§';
  const statusText = forced ? 'Canal vendido' : ok ? 'Â¡Ã‰xito!' : 'Fracaso';
  const statusCls  = forced ? 'sold' : ok ? 'success' : 'failure';
  const cardCls    = forced ? 'sold' : ok ? 'success' : 'failure';

  const soldNotice = forced ? `
    <div class="result-sold-notice">
      âš¡ Vas al Mercado de Pases de inmediato. TenÃ©s que encontrar nuevo canal.
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
          ${escapeHtml(r.eventTitle.replace('âš¡ ', ''))}
        </h2>
        <p class="result-option-text" style="margin-top:0.4rem">"${escapeHtml(r.optionText)}"</p>
      </div>

      <div class="result-card ${cardCls}" style="width:100%">
        <p class="result-message">${escapeHtml(r.delta.msg)}</p>
        ${soldNotice}
        <div class="divider"></div>
        <div class="result-deltas">
          <div class="result-delta-item">
            <label>ðŸ‘¥ Seguidores</label>
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
  const isMarket = !isLast && state.season % 2 === 0;

  let nextLabel;
  if (isLast)       nextLabel = 'Ver resumen final &rarr;';
  else if (isMarket) nextLabel = 'Ir al Mercado de Pases &rarr;';
  else               nextLabel = `Comenzar Temporada ${state.season + 1} &rarr;`;

  const marketNotice = isMarket ? `
    <div class="market-notice">
      âš¡ Se abre el Mercado de Pases. PodÃ©s quedarte o cambiar de canal.
    </div>
  ` : '';

  return `
    <div class="summary-wrap">
      <div class="summary-header">
        <p class="label-mono">Resumen</p>
        <h2 class="section-title" style="margin-top:0.3rem">Temporada ${state.season}</h2>
        <p class="summary-subtitle">
          ${state.streamerName ? escapeHtml(state.streamerName) + ' Â· ' : ''}<span style="color:${c.accent}">${escapeHtml(c.short)}</span>
        </p>
      </div>

      <div class="card-table" style="width:100%">
        <div class="card-table-header">Movimientos de la temporada</div>
        <div class="card-table-row">
          <span class="card-table-label">ðŸ‘¥ Seguidores</span>
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

  // EstadÃ­sticas finales
  const statsHtml = `
    <div class="gameover-stats">
      <div class="gameover-stat">
        <span class="icon">ðŸ‘¥</span>
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
        <p class="label-mono" style="text-align:center">Fin de Carrera Â· 12 Temporadas</p>
        ${state.streamerName ? `<p class="gameover-name" style="margin-top:0.5rem">${escapeHtml(state.streamerName)}</p>` : ''}
        <h2 class="gameover-title" style="margin-top:0.5rem">Tu Carrera<br>TerminÃ³</h2>
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

// â”€â”€â”€ TRANSICIONES ENTRE PANTALLAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Mapa de fases â†’ funciÃ³n de render */
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

  // Actualizar HUD si estÃ¡ visible
  if (showHud) updateHud();

  // ConfiguraciÃ³n post-render especÃ­fica por pantalla
  afterRender(phase);
}

/**
 * LÃ³gica extra que necesita acceso al DOM ya renderizado.
 * Se ejecuta inmediatamente despuÃ©s de inyectar el HTML.
 */
function afterRender(phase) {
  if (phase === 'naming') {
    const input = document.getElementById('name-input');
    const btn   = document.getElementById('btn-confirm-name');
    if (!input || !btn) return;

    input.focus();

    // Habilitar/deshabilitar el botÃ³n segÃºn el valor del input
    input.addEventListener('input', () => {
      btn.disabled = input.value.trim().length === 0;
    });

    // Confirmar con Enter
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmName();
    });
  }
}

// â”€â”€â”€ ACCIONES DEL JUEGO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  state.currentEvents   = pickEvents(channelId, 3);
  state.eventIndex      = 0;
  state.seasonAccum     = { seg: 0, din: 0 };

  applyChannelColors(channelId);
  goTo('event');
}

/** El jugador elige una opciÃ³n en un evento */
function chooseOption(optionIdx) {
  const ev  = state.currentEvents[state.eventIndex];
  const opt = ev.opciones[optionIdx];
  if (!opt) return;

  // Marcar eventos Ãºnicos por partida como vistos en el momento de la elecciÃ³n
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

/** El jugador continÃºa desde la pantalla de resultado */
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
  if (state.eventIndex < 2) {
    state.eventIndex++;
    goTo('event');
  } else {
    goTo('seasonSummary');
  }
}

/** El jugador continÃºa desde el resumen de temporada */
function continueSeason() {
  const passive = (CANALES[state.currentChannel] ? CANALES[state.currentChannel].passiveMoney : 0);
  state.money += passive;

  updateCareerHistory();

  if (state.season >= 12) { goTo('gameOver'); return; }

  const nextSeason = state.season + 1;
  const goMarket   = state.season % 2 === 0;

  state.season = nextSeason;

  if (goMarket) {
    goTo('transferMarket');
  } else {
    state.currentEvents = pickEvents(state.currentChannel, 3);
    state.eventIndex    = 0;
    state.seasonAccum   = { seg: 0, din: 0 };
    goTo('event');
  }
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

// â”€â”€â”€ HANDLER DELEGADO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Un Ãºnico listener en #screen para todos los clics del juego.
// Los botones declaran data-action="..." con parÃ¡metros opcionales.

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
    default: console.warn('AcciÃ³n desconocida:', action);
  }
});

// â”€â”€â”€ INICIO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Arrancar el juego mostrando la pantalla de introducciÃ³n
goTo('intro');

