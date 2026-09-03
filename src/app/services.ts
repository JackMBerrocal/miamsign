export type ServiceCategory = 
  | "IDENTIDAD CORPORATIVA" 
  | "PAPELERÍA CORPORATIVA" 
  | "DISEÑO DIGITAL"
  | "DESARROLLO WEB BÁSICO"
  | "DESARROLLO WEB CON BD"
  | "PAQUETES INTEGRALES PROMOCIONALES"
  | "PLANES MENSUALES: REDES SOCIALES"
  | "PAQUETES: WEB + REDES SOCIALES"
  | "PAQUETES DIGITALES COMPLETOS";

export type BaseTemplateType = "BRANDING" | "WEB" | "MIAMBOT";

export interface MiamService {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  deliverables: string[];
  price: string;
  deliveryTime: string;
  baseTemplate: BaseTemplateType;
  defaultPaymentType: "50_50" | "100_UPFRONT" | "MONTHLY";
}

export const CATALOG: MiamService[] = [
  // IDENTIDAD CORPORATIVA
  {
    id: "id_logo",
    category: "IDENTIDAD CORPORATIVA",
    name: "Diseño de Logotipo",
    description: "Presentación de propuestas conceptuales con diseño vectorial minimalista y paleta de colores base para tu marca.",
    deliverables: [
      "2 a 3 propuestas conceptuales",
      "Diseño vectorial minimalista y paleta de colores base",
      "Archivos editables (AI, EPS) y exportados (PNG, JPG, SVG)"
    ],
    price: "531.00 PEN",
    deliveryTime: "5 a 7 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "id_visual",
    category: "IDENTIDAD CORPORATIVA",
    name: "Visual Identity",
    description: "Definición del estilo visual complementario para unificar toda la comunicación de tu marca.",
    deliverables: [
      "Tipografías corporativas (primaria y secundaria)",
      "Paleta de colores extendida (HEX, RGB, CMYK)",
      "Patrones o texturas visuales y moodboard fotográfico"
    ],
    price: "224.20 PEN",
    deliveryTime: "3 a 5 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "id_brand",
    category: "IDENTIDAD CORPORATIVA",
    name: "Brand Guidelines",
    description: "Manual de marca corporativo completo para garantizar el uso correcto de tu identidad gráfica.",
    deliverables: [
      "Manual de Marca corporativo en PDF",
      "Normas de uso, grilla, áreas de respeto y escala mínima",
      "Mockups básicos de aplicación"
    ],
    price: "377.60 PEN",
    deliveryTime: "7 a 10 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },

  // PAPELERÍA CORPORATIVA
  {
    id: "pap_tarjeta",
    category: "PAPELERÍA CORPORATIVA",
    name: "Tarjeta Personal",
    description: "Diseño profesional de tarjetas de presentación listas para llevar a la imprenta.",
    deliverables: [
      "Diseño de tiro y retiro (dos caras)",
      "Adaptación para hasta 3 perfiles distintos",
      "Formato PDF con marcas de corte y sangría"
    ],
    price: "141.60 PEN",
    deliveryTime: "2 a 3 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "pap_membrete",
    category: "PAPELERÍA CORPORATIVA",
    name: "Hoja Membretada",
    description: "Estructura institucional para tus documentos físicos y digitales.",
    deliverables: [
      "Diseño de la estructura del membrete",
      "Formato digital para imprenta (PDF)",
      "Plantilla editable en Microsoft Word"
    ],
    price: "224.20 PEN",
    deliveryTime: "2 a 3 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "pap_folder",
    category: "PAPELERÍA CORPORATIVA",
    name: "Folder Carpetas",
    description: "Diseño exterior e interior de carpetas corporativas para entrega de documentos.",
    deliverables: [
      "Diseño exterior e interior con bolsillo",
      "Adaptación del troquel y archivo final para imprenta"
    ],
    price: "259.60 PEN",
    deliveryTime: "3 a 5 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "pap_brochure_3",
    category: "PAPELERÍA CORPORATIVA",
    name: "Brochure 3 Cuerpos (Tira y Retira)",
    description: "Material informativo detallado con maquetación completa y diseño en 6 paneles.",
    deliverables: [
      "Maquetación completa de la información",
      "Diagramación visual y selección fotográfica",
      "Diseño en 6 paneles totales listos para impresión"
    ],
    price: "460.20 PEN",
    deliveryTime: "5 a 7 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "pap_brochure_a4",
    category: "PAPELERÍA CORPORATIVA",
    name: "Brochure A-4 Dos Cuerpos",
    description: "Diseño y diagramación tipo díptico tamaño A-4 abierto para presentar tus servicios.",
    deliverables: [
      "Diseño tipo díptico (A-4 abierto)",
      "Distribución estructurada de servicios o productos"
    ],
    price: "342.20 PEN",
    deliveryTime: "4 a 6 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "pap_volante",
    category: "PAPELERÍA CORPORATIVA",
    name: "Volante 2 Lados (1/4 Oficio)",
    description: "Pieza gráfica promocional de doble cara diseñada para impacto rápido y legibilidad.",
    deliverables: [
      "Diseño promocional o informativo en doble cara",
      "Optimización de legibilidad"
    ],
    price: "177.00 PEN",
    deliveryTime: "2 a 4 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "pap_triptico",
    category: "PAPELERÍA CORPORATIVA",
    name: "Tríptico A-4",
    description: "Diseño estándar en tres cuerpos, ideal para ferias, activaciones o presentaciones formales.",
    deliverables: [
      "Diseño estructurado en tres cuerpos",
      "Distribución de información clave y archivos editables"
    ],
    price: "259.60 PEN",
    deliveryTime: "4 a 5 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },

  // DISEÑO DIGITAL
  {
    id: "dig_mailing",
    category: "DISEÑO DIGITAL",
    name: "Mailing Diseño",
    description: "Diseño gráfico estructurado para boletines informativos o promociones por correo.",
    deliverables: [
      "Diseño gráfico del boletín",
      "Imágenes seccionadas y listas para montar (ej. Mailchimp)"
    ],
    price: "212.40 PEN",
    deliveryTime: "3 a 4 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "dig_banner_jpg",
    category: "DISEÑO DIGITAL",
    name: "Banner Estático JPG",
    description: "Pieza gráfica en alta resolución adaptada para sitios web o plataformas publicitarias.",
    deliverables: [
      "1 pieza gráfica en alta resolución",
      "Adaptación a medidas específicas web/ads en JPG"
    ],
    price: "118.00 PEN",
    deliveryTime: "2 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "dig_banner_gif",
    category: "DISEÑO DIGITAL",
    name: "Banner GIF Animado",
    description: "Animación ligera para captar la atención en espacios publicitarios web.",
    deliverables: [
      "Animación ligera frame por frame",
      "Transiciones dinámicas básicas optimizadas para web"
    ],
    price: "177.00 PEN",
    deliveryTime: "3 a 4 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "dig_banner_ae",
    category: "DISEÑO DIGITAL",
    name: "Banner Animado After Effects",
    description: "Motion graphics fluidos y profesionales para campañas digitales de alto impacto.",
    deliverables: [
      "Motion graphics avanzados y efectos profesionales",
      "Entrega en formato MP4 o WebM"
    ],
    price: "224.20 PEN",
    deliveryTime: "4 a 5 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "dig_post_img",
    category: "DISEÑO DIGITAL",
    name: "Post para Redes Sociales Imagen",
    description: "Diseño optimizado para el feed de tus redes sociales.",
    deliverables: [
      "Diseño de 1 post estático (cuadrado 1:1 o vertical 4:5)",
      "Estilo alineado al manual de marca"
    ],
    price: "70.80 PEN",
    deliveryTime: "1 a 2 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },
  {
    id: "dig_post_vid",
    category: "DISEÑO DIGITAL",
    name: "Post Videos Redes 1080x1920",
    description: "Edición de video en formato vertical optimizado para Reels, TikTok o Shorts.",
    deliverables: [
      "Edición en formato vertical con transiciones",
      "Subtítulos dinámicos y música libre de derechos"
    ],
    price: "118.00 PEN",
    deliveryTime: "2 a 3 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "100_UPFRONT"
  },

  // DESARROLLO WEB BÁSICO
  {
    id: "web_landing",
    category: "DESARROLLO WEB BÁSICO",
    name: "Landing Page Estática",
    description: "Página de aterrizaje responsiva de una sola sección, enfocada en conversión de leads.",
    deliverables: [
      "Diseño One Page responsivo con SEO técnico básico",
      "Formulario de contacto y botón flotante de WhatsApp"
    ],
    price: "1,050.20 PEN",
    deliveryTime: "7 a 10 días hábiles",
    baseTemplate: "WEB",
    defaultPaymentType: "50_50"
  },
  {
    id: "web_info3",
    category: "DESARROLLO WEB BÁSICO",
    name: "Sitio Web Informativo (3 Páginas)",
    description: "Estructura web clásica para presentar la información clave de tu empresa.",
    deliverables: [
      "3 Páginas (Inicio, Nosotros, Servicios/Contacto)",
      "Diseño UI/UX limpio y adaptable a móviles"
    ],
    price: "1,770.00 PEN",
    deliveryTime: "10 a 15 días hábiles",
    baseTemplate: "WEB",
    defaultPaymentType: "50_50"
  },
  {
    id: "web_corp5",
    category: "DESARROLLO WEB BÁSICO",
    name: "Sitio Web Corporativo Básico (5 Páginas)",
    description: "Presencia digital completa para tu empresa con certificación de seguridad.",
    deliverables: [
      "5 Páginas (Inicio, Nosotros, Servicios, Galería/Blog, Contacto)",
      "Certificado SSL básico y alta en Google Search Console"
    ],
    price: "2,360.00 PEN",
    deliveryTime: "15 a 20 días hábiles",
    baseTemplate: "WEB",
    defaultPaymentType: "50_50"
  },

  // DESARROLLO WEB CON BD
  {
    id: "webbd_cms",
    category: "DESARROLLO WEB CON BD",
    name: "Sitio Web Dinámico (Con Panel Admin)",
    description: "Sitio web corporativo escalable gestionado mediante un administrador de contenidos (CMS).",
    deliverables: [
      "Estructura web corporativa completa con CMS seguro",
      "Capacidad de auto-editar textos e imágenes y crear artículos"
    ],
    price: "3,422.00 PEN",
    deliveryTime: "25 a 30 días hábiles",
    baseTemplate: "WEB",
    defaultPaymentType: "50_50"
  },
  {
    id: "webbd_eco",
    category: "DESARROLLO WEB CON BD",
    name: "E-Commerce Básico",
    description: "Tienda virtual completa con pasarela de pagos integrada para vender tus productos 24/7.",
    deliverables: [
      "Carrito de compras funcional y subida de 20 a 30 productos",
      "Integración de pasarelas y panel de gestión de pedidos"
    ],
    price: "4,720.00 PEN",
    deliveryTime: "30 a 45 días hábiles",
    baseTemplate: "WEB",
    defaultPaymentType: "50_50"
  },
  {
    id: "webbd_sys",
    category: "DESARROLLO WEB CON BD",
    name: "Sistema Personalizado con BD",
    description: "Arquitectura de software a la medida utilizando tecnologías modernas y escalables.",
    deliverables: [
      "Arquitectura robusta a la medida (Node.js, Docker)",
      "Modelado de BD, roles de usuario e integraciones API avanzadas"
    ],
    price: "5,900.00 PEN",
    deliveryTime: "45 a 60 días hábiles",
    baseTemplate: "WEB",
    defaultPaymentType: "50_50"
  },

  // PAQUETES INTEGRALES PROMOCIONALES
  {
    id: "paq_emp",
    category: "PAQUETES INTEGRALES PROMOCIONALES",
    name: "Paquete Emprendedor",
    description: "Ideal para negocios que recién empiezan.",
    deliverables: [
      "Diseño de logotipo y tarjeta personal",
      "4 posts para redes sociales y 1 banner"
    ],
    price: "890.00 PEN",
    deliveryTime: "10 a 15 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "50_50"
  },
  {
    id: "paq_ide",
    category: "PAQUETES INTEGRALES PROMOCIONALES",
    name: "Paquete Identidad de Marca",
    description: "Para negocios que quieren verse profesionales.",
    deliverables: [
      "Diseño de logotipo y Visual Identity",
      "Brand Guidelines (manual básico de marca)",
      "Tarjeta personal y Hoja membretada"
    ],
    price: "1,250.00 PEN",
    deliveryTime: "15 a 20 días hábiles",
    baseTemplate: "BRANDING",
    defaultPaymentType: "50_50"
  },
  {
    id: "paq_webini",
    category: "PAQUETES INTEGRALES PROMOCIONALES",
    name: "Paquete Web Inicial",
    description: "Perfecto para negocios que necesitan presencia online.",
    deliverables: [
      "Landing Page profesional adaptada a celular",
      "Formulario de contacto e Integración con WhatsApp",
      "BONO: Dominio .COM + hosting por 1 año gratis"
    ],
    price: "1,150.00 PEN",
    deliveryTime: "10 a 15 días hábiles",
    baseTemplate: "WEB",
    defaultPaymentType: "50_50"
  },

  // PLANES MENSUALES: REDES SOCIALES
  {
    id: "plan_starter",
    category: "PLANES MENSUALES: REDES SOCIALES",
    name: "Plan Starter",
    description: "Ideal para negocios que recién empiezan en redes.",
    deliverables: [
      "6 publicaciones mensuales (3 estáticos, 2 carruseles, 1 reel)",
      "Diseño profesional, redacción de copys y hashtags optimizados"
    ],
    price: "390.00 PEN",
    deliveryTime: "Mensual",
    baseTemplate: "MIAMBOT",
    defaultPaymentType: "MONTHLY"
  },
  {
    id: "plan_growth",
    category: "PLANES MENSUALES: REDES SOCIALES",
    name: "Plan Crecimiento",
    description: "Para negocios que quieren posicionarse y generar interacción.",
    deliverables: [
      "10 publicaciones mensuales (4 estáticos, 3 carruseles, 3 reels)",
      "Diseño estratégico profesional, copys y parrilla de contenido"
    ],
    price: "690.00 PEN",
    deliveryTime: "Mensual",
    baseTemplate: "MIAMBOT",
    defaultPaymentType: "MONTHLY"
  },
  {
    id: "plan_prime",
    category: "PLANES MENSUALES: REDES SOCIALES",
    name: "Plan Prime",
    description: "Para marcas que quieren crecer fuerte y verse profesionales.",
    deliverables: [
      "15 publicaciones mensuales (5 estáticos, 5 carruseles, 5 reels)",
      "Estrategia de contenido mensual, parrilla, highlights y optimización"
    ],
    price: "990.00 PEN",
    deliveryTime: "Mensual",
    baseTemplate: "MIAMBOT",
    defaultPaymentType: "MONTHLY"
  },

  // PAQUETES: WEB + REDES SOCIALES
  {
    id: "paq_presencia",
    category: "PAQUETES: WEB + REDES SOCIALES",
    name: "Paquete Presencia Digital",
    description: "Ideal para emprendedores que necesitan presencia online.",
    deliverables: [
      "Landing Page Profesional (Adaptada a celulares, WhatsApp, formulario)",
      "Redes Sociales: 6 publicaciones mensuales (Plan Starter)",
      "BONO: Dominio .COM + hosting por 1 año gratis"
    ],
    price: "1,290.00 PEN",
    deliveryTime: "15 a 20 días hábiles (Lanzamiento)",
    baseTemplate: "MIAMBOT",
    defaultPaymentType: "50_50"
  },
  {
    id: "paq_negocio",
    category: "PAQUETES: WEB + REDES SOCIALES",
    name: "Paquete Negocio Digital",
    description: "Para negocios que quieren verse profesionales.",
    deliverables: [
      "Sitio Web Informativo (3 páginas: Inicio, Servicios, Contacto)",
      "Redes Sociales: 10 publicaciones mensuales (Plan Crecimiento)",
      "BONO: Dominio .COM + hosting por 1 año gratis"
    ],
    price: "2,150.00 PEN",
    deliveryTime: "20 a 25 días hábiles (Lanzamiento)",
    baseTemplate: "MIAMBOT",
    defaultPaymentType: "50_50"
  },
  {
    id: "paq_marcaprem",
    category: "PAQUETES: WEB + REDES SOCIALES",
    name: "Paquete Marca Digital Premium",
    description: "Para negocios que quieren crecer fuerte online.",
    deliverables: [
      "Sitio Web Corporativo (5 páginas: Inicio, Servicios, Nosotros, Portafolio, Contacto)",
      "Redes Sociales: 15 publicaciones mensuales (Plan Prime)",
      "BONO: Dominio .COM + hosting por 1 año gratis"
    ],
    price: "2,890.00 PEN",
    deliveryTime: "25 a 30 días hábiles (Lanzamiento)",
    baseTemplate: "MIAMBOT",
    defaultPaymentType: "50_50"
  },

  // PAQUETES DIGITALES COMPLETOS
  {
    id: "paq_comp_start",
    category: "PAQUETES DIGITALES COMPLETOS",
    name: "Starter Emprendedor",
    description: "Ideal para quienes están iniciando su negocio.",
    deliverables: [
      "Branding: Diseño de logotipo profesional",
      "Web: Landing Page adaptada a celular",
      "Redes sociales: 6 publicaciones mensuales",
      "BONO: Dominio .COM + hosting por 1 año gratis"
    ],
    price: "1,750.00 PEN",
    deliveryTime: "20 a 25 días hábiles (Lanzamiento)",
    baseTemplate: "MIAMBOT",
    defaultPaymentType: "50_50"
  },
  {
    id: "paq_comp_pro",
    category: "PAQUETES DIGITALES COMPLETOS",
    name: "Marca Profesional",
    description: "Perfecto para negocios que quieren verse profesionales.",
    deliverables: [
      "Branding: Diseño de logotipo, Identidad visual y Manual básico",
      "Web: Sitio web informativo (3 páginas) adaptado a celular",
      "Redes sociales: 10 publicaciones mensuales",
      "BONO: Dominio .COM + hosting por 1 año gratis"
    ],
    price: "2,990.00 PEN",
    deliveryTime: "25 a 30 días hábiles (Lanzamiento)",
    baseTemplate: "MIAMBOT",
    defaultPaymentType: "50_50"
  },
  {
    id: "paq_comp_prem",
    category: "PAQUETES DIGITALES COMPLETOS",
    name: "Negocio Digital Premium",
    description: "Para marcas que quieren posicionarse fuerte.",
    deliverables: [
      "Branding completo: Diseño de logotipo, Identidad visual y Brand Guidelines",
      "Web corporativa: 5 páginas",
      "Redes sociales: 15 publicaciones mensuales y estrategia de contenido",
      "BONO: Dominio .COM + hosting por 1 año gratis"
    ],
    price: "4,100.00 PEN",
    deliveryTime: "35 a 45 días hábiles (Lanzamiento)",
    baseTemplate: "MIAMBOT",
    defaultPaymentType: "50_50"
  }
];
