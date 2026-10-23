export interface ExperienceStop {
  name: string;
  role: string;
  period: string;
  summary: string;
  parallel?: boolean;
}

export const ROUTE_SECTION = {
  title: 'La ruta',
  intro: 'Cada parada me dejó algo. Este es el camino hasta ahora.',
  earlyDaysIntro:
    'Antes de especializarme en full stack, pasé por consultoría, análisis funcional y mis primeras prácticas como desarrollador.',
  education: 'Formación: Ingeniería en Informática, Duoc UC (2017 – 2020)',
};

export const MAIN_STOPS: ExperienceStop[] = [
  {
    name: 'Tecnova IT Solutions',
    role: 'Development Engineer',
    period: 'Marzo 2025 – Actualidad',
    summary:
      'Desarrollo aplicaciones para el sector público con Next.js y React en el frontend, y Node.js con Express en el backend, organizado en capas y conectado a PostgreSQL y MongoDB. Trabajo con autenticación en AWS Cognito, uso Docker en el desarrollo y acompaño los despliegues en Kubernetes mediante GitLab CI/CD, revisando y siguiendo los pipelines cuando algo falla.',
  },
  {
    name: 'Propal',
    role: 'Full Stack Developer',
    period: 'Febrero 2024 – Febrero 2026',
    summary:
      'Construí interfaces en React pensadas para tablets y móviles, con componentes reutilizables y estado global con Redux. En el backend desarrollé APIs REST en .NET C# con modelado de datos en SQL Server. Además, armaba prototipos funcionales para validar requerimientos con el cliente desde etapas tempranas y gestionaba los despliegues a producción.',
  },
  {
    name: 'Ministerio Buenas Nuevas',
    role: 'Web Developer',
    period: 'Octubre 2022 – Actualidad',
    summary:
      'Desarrollo interfaces con Vue.js y React en proyectos de largo plazo, y apoyo en tareas de backend con PHP y Laravel, usando Firebase (Firestore) como base de datos en algunos proyectos. Trabajo en sprints con un equipo ágil, coordinado con Jira y Slack, y gestiono pull requests en GitHub.',
    parallel: true,
  },  
  {
    name: 'Profesional independiente',
    role: 'Web Developer',
    period: 'Enero 2023 – Enero 2024',
    summary:
      'Desarrollé soluciones web completas en React y .NET C# a la medida de cada cliente. Me encargaba de todo el ciclo: levantar requerimientos, construir, validar entregables y publicar en producción.',
  },
];

export const EARLY_STOPS: ExperienceStop[] = [
  {
    name: 'Envision',
    role: 'Desarrollador Web / Consultor',
    period: 'Dic 2021 – Nov 2022',
    summary:
      'Aplicaciones móviles con Framework7, prototipos y automatización de procesos con SharePoint.',
  },
  {
    name: 'Emerix',
    role: 'Analista Funcional',
    period: 'Mar 2021 – Dic 2021',
    summary: 'Definición de requerimientos y análisis de rendimiento bajo Scrum.',
  },
  {
    name: 'Scipion SpA',
    role: 'Desarrollador Front-end (práctica)',
    period: 'Ago 2020 – Dic 2020',
    summary: 'Interfaces con JavaScript, HTML y CSS, y consumo de APIs.',
  },
  {
    name: 'Medios Regionales',
    role: 'Desarrollador Back-end (práctica)',
    period: 'Dic 2018 – Feb 2019',
    summary: 'Desarrollo con Laravel y Vue.js.',
  },
];
