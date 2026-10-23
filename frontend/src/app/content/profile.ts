export interface Link {
  label: string;
  href: string;
}

export interface Profile {
  greeting: string;
  subtitle: string;
  summary: string;
  actions: Link[];
}

export interface Contact {
  title: string;
  text: string;
  linkedinLabel: string;
  formTitle: string;
  emailText: string;
  email: string;
  linkedinUrl: string | null;
  cvUrl: string | null;
  footer: string;
}

export const PROFILE: Profile = {
  greeting: 'Hola, soy Javier Vidal',
  subtitle: 'Full Stack Developer · Valparaíso, Chile',
  summary:
    'He construido aplicaciones web desde la interfaz que usa la gente hasta la API y la base de datos que la sostienen. Llevo más de 4 años trabajando con React, Next.js, .NET y Node.js, en proyectos que van desde plataformas para el sector público hasta herramientas a la medida de pequeños negocios.',
  actions: [
    { label: 'Ver mi recorrido', href: '#ruta' },
    { label: 'Contactarme', href: '#contacto' },
  ],
};

export const CONTACT: Contact = {
  title: '¿Conversamos?',
  text: 'Si tienes un proyecto en mente, una oportunidad laboral o quieres saber más de mi trabajo, escríbeme. Respondo todos los mensajes.',
  linkedinLabel: 'Escríbeme por LinkedIn',
  formTitle: '¿Prefieres escribirme directo?',
  emailText: 'También puedes escribirme a mi correo:',
  email: 'dev@javiervidal.cl',
  linkedinUrl: 'https://www.linkedin.com/in/javier-vidal-desarrollador-web',
  // CV descargable fuera por ahora.
  cvUrl: null,
  footer: 'Hecho por Javier Vidal · 2026',
};
