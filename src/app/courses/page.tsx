import { LearningLayout } from '@/components/shared/LearningLayout';
import { CoursesContent } from './CoursesContent';

export default async function CoursesPage() {
    return (
        <LearningLayout>
            <CoursesContent />
        </LearningLayout>
    );
}
