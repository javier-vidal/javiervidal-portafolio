import { Link } from './profile';

export interface Project {
  course: string;
  status: string;
  name: string;
  description: string;
  stack: string[];
  link: Link | null;
}

export const MENU_SECTION = {
  title: 'La carta',
  intro: 'Proyectos servidos y otros que siguen en la cocina.',
};

export const PROJECTS: Project[] = [
  {
    course: 'Plato principal',
    status: 'En la cocina',
    name: 'Gestión Peluquería',
    description:
      'Sistema para registrar clientas y su historial de visitas, pensado para usarse en tablet durante la atención. Cada ficha guarda alergias, preferencias y cumpleaños, las visitas se ordenan de la más reciente a la más antigua, y un programa de fidelización avisa cuando una clienta llega a su séptima visita.',
    stack: ['Angular', 'Go', 'PostgreSQL', 'Docker'],
    link: null,
  },
  {
    course: 'Entrada',
    status: 'Servido',
    name: 'Este portafolio',
    description:
      'El sitio que estás viendo, con una API propia para el formulario de contacto. Prerenderizado para cargar rápido y posicionarse bien, accesible, adaptado a móviles y con un ciclo de día que avanza mientras recorres la página.',
    stack: ['Angular 22', 'TypeScript', 'Go', 'Cloudflare Pages', 'Render'],
    link: { label: 'Ver cómo está hecho', href: '#bajo-el-capo' },
  },
];
