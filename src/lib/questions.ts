import {
  getShuffledOptions,
  mapShuffledToOriginal,
} from "./shuffle";

export interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

export const QUESTIONS: Question[] = [
  {
    text: "¿Cuál es su color favorito?",
    options: ["Rosa", "Azul", "Amarillo", "Verde", "Morado"],
    correctIndex: 2,
  },
  {
    text: "¿Cuál es su segundo nombre?",
    options: ["María", "Estefanía", "Sofía", "Camila", "Valentina"],
    correctIndex: 1,
  },
  {
    text: "¿Cuál es su signo zodiacal?",
    options: ["Leo", "Géminis", "Acuario", "Cáncer", "Virgo"],
    correctIndex: 1,
  },
  {
    text: "¿Qué mate prefiere?",
    options: ["Amargo", "Semi dulce", "Dulce", "Con hierbas", "Tereré"],
    correctIndex: 1,
  },
  {
    text: "¿Cuál es su videojuego favorito?",
    options: [
      "The Last of Us",
      "Resident Evil 4",
      "GTA V",
      "Minecraft",
      "Animal Crossing",
    ],
    correctIndex: 1,
  },
  {
    text: "Si pudiera eliminar una tarea doméstica para siempre, ¿cuál sería?",
    options: [
      "Lavar los platos",
      "Doblar la ropa",
      "Planchar",
      "Barrer",
      "Sacar la basura",
    ],
    correctIndex: 1,
  },
  {
    text: "¿Qué tipo de apocalipsis prefiere?",
    options: [
      "Zombie",
      "Guerra nuclear",
      "Enfermedad biológica",
      "Invasión alienígena",
      "Meteorito gigante",
    ],
    correctIndex: 0,
  },
  {
    text: "¿Cuál es su deporte favorito?",
    options: ["Fútbol", "Vóley", "Hockey", "Natación", "Pádel"],
    correctIndex: 1,
  },
  {
    text: "¿Qué mascota prefiere?",
    options: ["Gato", "Perro", "Conejo", "Hámster", "Caballo"],
    correctIndex: 1,
  },
  {
    text: "¿Cuál es su estación favorita del año?",
    options: ["Invierno", "Verano", "Otoño", "Primavera"],
    correctIndex: 3,
  },
  {
    text: "¿Quién es la persona de este grupo a la que llama primero cuando tiene un chisme jugoso?",
    options: ["Ariel", "Daniela", "Su mamá", "No cuenta", "Nadie del grupo"],
    correctIndex: 1,
  },
  {
    text: "¿Qué número de camiseta de vóley usa?",
    options: ["6", "15", "23", "67", "10"],
    correctIndex: 1,
  },
];

export const TOTAL_QUESTIONS = QUESTIONS.length;

export function getPublicQuestion(index: number, optionOrder: number[] | null) {
  const q = QUESTIONS[index];
  if (!q || !optionOrder) return null;

  return {
    index,
    text: q.text,
    options: getShuffledOptions(q.options, optionOrder),
  };
}

export function checkAnswer(
  questionIndex: number,
  shuffledOptionIndex: number,
  optionOrder: number[]
): boolean {
  const q = QUESTIONS[questionIndex];
  if (!q) return false;
  const originalIndex = mapShuffledToOriginal(shuffledOptionIndex, optionOrder);
  return q.correctIndex === originalIndex;
}

export function getSelectedOptionText(
  questionIndex: number,
  shuffledOptionIndex: number,
  optionOrder: number[]
): string {
  const q = QUESTIONS[questionIndex];
  if (!q) return "";
  const originalIndex = mapShuffledToOriginal(shuffledOptionIndex, optionOrder);
  return q.options[originalIndex];
}

export function getCorrectOptionText(questionIndex: number): string {
  const q = QUESTIONS[questionIndex];
  if (!q) return "";
  return q.options[q.correctIndex];
}
