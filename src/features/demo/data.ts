import type { CourseView } from "@/features/learning/components/learning-dashboard";
export const demoCourses: CourseView[] = [
  {
    id: "endo",
    title: "Endodontologie",
    description: "Verstehe die Grundlagen. Verbinde Wissen und Praxis.",
    access: "FREE",
    chapters: [
      {
        id: "c1",
        title: "Den Zahn von innen verstehen",
        lessons: [
          {
            id: "zahnaufbau",
            title: "Der Aufbau eines Zahns",
            minutes: 5,
            done: true,
          },
          {
            id: "pulpa",
            title: "Pulpa: das lebendige Zentrum",
            minutes: 6,
            done: false,
          },
          {
            id: "dentin",
            title: "Dentin und seine Strukturen",
            minutes: 5,
            done: false,
          },
          {
            id: "rueckblick",
            title: "Zeit für deinen Wissenscheck",
            minutes: 4,
            done: false,
          },
        ],
      },
      {
        id: "c2",
        title: "Wissen verknüpfen und vertiefen",
        lessons: [
          {
            id: "anatomie",
            title: "Anatomie im Überblick",
            minutes: 8,
            done: false,
          },
        ],
      },
    ],
  },
  ...[
    "Zahnerhaltung",
    "Parodontologie",
    "Kinderzahnheilkunde",
    "Kieferorthopädie",
    "Implantologie",
  ].map((title, i) => ({
    id: `course${i}`,
    title,
    description: "Ein neues Fachgebiet für deinen Lernweg.",
    access: "PRO",
    chapters: [],
  })),
];
