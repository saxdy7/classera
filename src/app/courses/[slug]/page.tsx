import { LearningLayout } from '@/components/shared/LearningLayout';
import { CourseDetailContent } from './CourseDetailContent';

export default async function CourseDetailPage() {
    return (
        <LearningLayout>
            <CourseDetailContent />
        </LearningLayout>
    );
}
