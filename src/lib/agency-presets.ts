export interface StageSeed {
  sortOrder: number;
  title: string;
  description: string;
  status: "DONE" | "IN_PROGRESS" | "PENDING";
  dueDate: string;
  completedAt: string | null;
  deliverableNote: string;
}

export interface SurveyQuestion {
  id: string;
  label: string;
  type: "choice" | "text" | "textarea";
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

function addDaysIso(baseDate: Date, days: number): string {
  const d = new Date(baseDate.getTime());
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildDefaultStages(family: string, baseDate = new Date(), paymentVerified = true): StageSeed[] {
  const today = addDaysIso(baseDate, 0);
  const fam = (family || "BRANDING").toUpperCase();

  if (fam === "WEB") {
    return [
      {
        sortOrder: 1,
        title: "1. Registro de Orden, Contrato MSA y Abono Inicial",
        description: "Validación de compra, emisión de contrato MSA en MiamSign y comprobante SUNAT.",
        status: paymentVerified ? "DONE" : "IN_PROGRESS",
        dueDate: today,
        completedAt: paymentVerified ? today : null,
        deliverableNote: paymentVerified
          ? "Ya hecho: Orden registrada y comprobante inicial validado."
          : "En validación del abono y firma del contrato.",
      },
      {
        sortOrder: 2,
        title: "2. Encuesta Brief Web, Accesos y Mapa de Secciones",
        description: "Recolección de objetivos comerciales, paleta, textos y dominio .COM.",
        status: paymentVerified ? "IN_PROGRESS" : "PENDING",
        dueDate: addDaysIso(baseDate, 2),
        completedAt: null,
        deliverableNote: "Por hacer: Completa tu encuesta en la pestaña Encuesta Brief.",
      },
      {
        sortOrder: 3,
        title: "3. Prototipo Visual UX/UI y Arquitectura Responsive",
        description: "Diseño visual adaptado a móviles y escritorio para aprobación inicial.",
        status: "PENDING",
        dueDate: addDaysIso(baseDate, 7),
        completedAt: null,
        deliverableNote: "Falta: Presentación de enlace demo interactivo.",
      },
      {
        sortOrder: 4,
        title: "4. Desarrollo, Pasarelas/WhatsApp y 3 Rondas de Revisión",
        description: "Programación, formularios, SEO técnico y ajustes consolidados.",
        status: "PENDING",
        dueDate: addDaysIso(baseDate, 14),
        completedAt: null,
        deliverableNote: "Falta: Tus comentarios finales y pruebas en vivo.",
      },
      {
        sortOrder: 5,
        title: "5. Saldo 50% y Publicación en Producción + Respaldos",
        description: "Despliegue final SSL, capacitación rápida y entrega en Bóveda 180 días.",
        status: "PENDING",
        dueDate: addDaysIso(baseDate, 18),
        completedAt: null,
        deliverableNote: "Falta: Liquidación 50% y publicación oficial.",
      },
    ];
  }

  if (fam === "MIAMBOT") {
    return [
      {
        sortOrder: 1,
        title: "1. Suscripción MiamBot IA, Contrato y Onboarding",
        description: "Activación de licencia SaaS, contrato mensual y generación de cuenta.",
        status: paymentVerified ? "DONE" : "IN_PROGRESS",
        dueDate: today,
        completedAt: paymentVerified ? today : null,
        deliverableNote: paymentVerified
          ? "Ya hecho: Cuenta activada y contrato listo."
          : "En espera de confirmación.",
      },
      {
        sortOrder: 2,
        title: "2. Encuesta de Flujos IA, Tono y Reglas de Atención",
        description: "Definición de preguntas frecuentes, horarios y derivación a WhatsApp humano.",
        status: paymentVerified ? "IN_PROGRESS" : "PENDING",
        dueDate: addDaysIso(baseDate, 1),
        completedAt: null,
        deliverableNote: "Completa la encuesta y sube tu catálogo PDF en Bóveda.",
      },
      {
        sortOrder: 3,
        title: "3. Entrenamiento Motor RAG y Conexión Oficial Meta API",
        description: "Carga de catálogo PDF/Excel y conexión segura a WhatsApp / redes.",
        status: "PENDING",
        dueDate: addDaysIso(baseDate, 3),
        completedAt: null,
        deliverableNote: "Falta: Pruebas guiadas en sandbox real.",
      },
      {
        sortOrder: 4,
        title: "4. Puesta en Marcha 24/7 y Manual Operativo",
        description: "Bot respondiendo clientes automáticamente + guía descargable en tu Bóveda.",
        status: "PENDING",
        dueDate: addDaysIso(baseDate, 4),
        completedAt: null,
        deliverableNote: "Falta: Validación final en vivo.",
      },
    ];
  }

  // BRANDING default
  return [
    {
      sortOrder: 1,
      title: "1. Contrato MSA y Validación del Abono Inicial",
      description: "Registro formal del pedido, comprobante SUNAT y apertura de tu Bóveda.",
      status: paymentVerified ? "DONE" : "IN_PROGRESS",
      dueDate: today,
      completedAt: paymentVerified ? today : null,
      deliverableNote: paymentVerified
        ? "Ya hecho: Orden registrada y abono inicial validado."
        : "En validación.",
    },
    {
      sortOrder: 2,
      title: "2. Encuesta Brief y Referencias Visuales",
      description: "Cuestionario creativo de marca para alinear estilo, colores y público.",
      status: paymentVerified ? "IN_PROGRESS" : "PENDING",
      dueDate: addDaysIso(baseDate, 2),
      completedAt: null,
      deliverableNote: "Siguiente paso: responde tu Encuesta Brief para arrancar diseño.",
    },
    {
      sortOrder: 3,
      title: "3. Propuestas Conceptuales de Identidad",
      description: "Presentación de conceptos vectoriales, tipografía y aplicaciones reales.",
      status: "PENDING",
      dueDate: addDaysIso(baseDate, 7),
      completedAt: null,
      deliverableNote: "Falta: Subida de propuestas en PDF a tu Bóveda.",
    },
    {
      sortOrder: 4,
      title: "4. Rondas de Revisión y Ajustes Consolidados",
      description: "Hasta 3 rondas de refinamiento sobre la propuesta elegida.",
      status: "PENDING",
      dueDate: addDaysIso(baseDate, 11),
      completedAt: null,
      deliverableNote: "Falta: Tu selección y observaciones.",
    },
    {
      sortOrder: 5,
      title: "5. Saldo 50% y Liberación de Editables (.AI, .SVG, .PDF)",
      description: "Entrega del paquete final completo y manual de marca en Bóveda 180 días.",
      status: "PENDING",
      dueDate: addDaysIso(baseDate, 14),
      completedAt: null,
      deliverableNote: "Falta: Liquidación final y descarga completa.",
    },
  ];
}

export function buildDefaultSurvey(family: string, serviceName: string): {
  title: string;
  questions: SurveyQuestion[];
} {
  const fam = (family || "BRANDING").toUpperCase();

  if (fam === "WEB") {
    return {
      title: `Brief Web & Arquitectura — ${serviceName}`,
      questions: [
        {
          id: "q_objetivo",
          label: "¿Cuál es el objetivo principal de tu sitio web?",
          type: "choice",
          options: ["Generar leads por WhatsApp", "Vender online (E-Commerce)", "Presencia corporativa B2B", "Reservas / Citas"],
          required: true,
        },
        {
          id: "q_dominio",
          label: "¿Ya cuentas con dominio (.com / .pe) o deseas que lo registremos?",
          type: "text",
          placeholder: "Ej. miempresa.com / Quiero dominio nuevo",
          required: true,
        },
        {
          id: "q_secciones",
          label: "¿Qué secciones o páginas necesitas sí o sí?",
          type: "textarea",
          placeholder: "Ej. Inicio, Servicios, Catálogo, Nosotros, Contacto con mapa...",
          required: true,
        },
        {
          id: "q_referencias",
          label: "Pega 2 o 3 enlaces de webs cuyo estilo visual te guste",
          type: "textarea",
          placeholder: "https://...",
        },
      ],
    };
  }

  if (fam === "MIAMBOT") {
    return {
      title: `Brief MiamBot IA & Flujos — ${serviceName}`,
      questions: [
        {
          id: "q_canales",
          label: "¿Por qué canales atiende principalmente tu negocio?",
          type: "choice",
          options: ["Solo WhatsApp Oficial", "WhatsApp + Instagram", "WhatsApp + TikTok + Messenger", "Todos los canales"],
          required: true,
        },
        {
          id: "q_tono",
          label: "¿Cómo prefieres que responda la Inteligencia Artificial?",
          type: "choice",
          options: ["Cercano y amigable", "Ejecutivo y directo", "Técnico / Médico", "Vendedor consultivo"],
          required: true,
        },
        {
          id: "q_objetivo_bot",
          label: "¿Qué debe lograr el bot en cada conversación?",
          type: "textarea",
          placeholder: "Ej. Responder precios del catálogo PDF, pedir datos del cliente y agendar cita.",
          required: true,
        },
        {
          id: "q_horario",
          label: "Horario para derivar casos complejos a un asesor humano",
          type: "text",
          placeholder: "Ej. Lunes a Sábado 9:00 am – 7:00 pm",
        },
      ],
    };
  }

  return {
    title: `Brief Creativo de Marca — ${serviceName}`,
    questions: [
      {
        id: "q_personalidad",
        label: "¿Qué personalidad debe proyectar tu marca?",
        type: "choice",
        options: ["Minimalista & Premium", "Tecnológica & Moderna", "Cálida & Artesanal", "Corporativa & Sólida"],
        required: true,
      },
      {
        id: "q_publico",
        label: "Describe a tu cliente ideal (edad, sector o ciudad)",
        type: "textarea",
        placeholder: "Ej. Emprendedores y gerentes de 25 a 45 años en Lima...",
        required: true,
      },
      {
        id: "q_colores",
        label: "Colores que te gustan (o colores que NO debemos usar)",
        type: "text",
        placeholder: "Ej. Negro con verde esmeralda; evitar rosado",
        required: true,
      },
      {
        id: "q_nombre_slogan",
        label: "Nombre exacto que irá en el logotipo y eslogan opcional",
        type: "text",
        placeholder: "Ej. Killa Café · Tostado de Altura",
      },
    ],
  };
}
