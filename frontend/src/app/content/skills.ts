export interface SkillLevel {
  name: string;
  rank: number;
  description: string;
  skills: string[];
}

export const SKILLS_SECTION = {
  title: 'Entrenamiento',
  intro:
    'Como en cualquier ejercicio corporal o deporte, cada habilidad tiene su progresión. Estas son las mías.',
  footnote: 'Forma de trabajo: Scrum · Kanban · equipos ágiles',
};

// Rango maximo de la progresion; define cuantas barras se dibujan.
export const MAX_RANK = 4;

export const SKILL_LEVELS: SkillLevel[] = [
  {
    name: 'Dominado',
    rank: 4,
    description: 'Lo uso a diario y puedo construir con ello de punta a punta.',
    skills: [
      'React',
      'Next.js (App Router)',
      'TypeScript',
      'JavaScript',
      'Node.js con Express',
      '.NET C# con Entity Framework',
      'APIs REST',
      'PostgreSQL',
      'SQL Server',
    ],
  },
  {
    name: 'Con soltura',
    rank: 3,
    description: 'Lo he usado en proyectos reales y me muevo con confianza.',
    skills: [
      'Vue.js',
      'React Native',
      'Redux',
      'Zustand',
      'Material UI',
      'React Hook Form + Zod',
      'MongoDB',
      'MySQL',
      'Git',
      'GitHub y GitLab',
      'Postman',
      'Figma',
    ],
  },
  {
    name: 'En entornos configurados',
    rank: 2,
    description: 'Lo uso dentro de infraestructura ya montada por un equipo.',
    skills: ['AWS Cognito', 'DynamoDB', 'Docker', 'Kubernetes (AWS EKS)', 'GitLab CI/CD'],
  },
  {
    name: 'En progresión',
    rank: 1,
    description: 'Lo que estoy aprendiendo ahora, construyendo este sitio y mis proyectos.',
    skills: ['Angular', 'Go'],
  },
];
