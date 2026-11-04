export type PathLesson = {
  id: string;
  title: string;
  minutes: number;
  done: boolean;
  available?: boolean;
};
export type CourseView = {
  id: string;
  title: string;
  description: string;
  access: string;
  specialtyId?: string;
  specialtyTitle?: string;
  chapters: {
    id: string;
    title: string;
    guide?: string;
    lessons: PathLesson[];
  }[];
};
export function pathState(course: CourseView) {
  const lessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const next = lessons.find((lesson) => !lesson.done);
  return {
    completed: lessons.filter((lesson) => lesson.done).length,
    total: lessons.length,
    currentId: next?.available === false ? undefined : next?.id,
    state(lesson: PathLesson): "done" | "current" | "locked" {
      if (lesson.available === false) return "locked";
      if (lesson.done) return "done";
      return lesson.id === next?.id ? "current" : "locked";
    },
  };
}
