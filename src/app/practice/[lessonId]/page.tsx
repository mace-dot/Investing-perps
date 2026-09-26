import { PracticeSession } from "@/components/practice-session";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return <PracticeSession lessonId={lessonId} />;
}
