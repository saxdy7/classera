import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// AI-powered course recommendations
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user profile with specialization
        const { data: profile } = await supabase
            .from('users')
            .select('specialization, role')
            .eq('id', user.id)
            .single();

        // Get user's test performance to identify weak areas
        const { data: testSubmissions } = await supabase
            .from('test_submissions')
            .select(`
        percentage,
        test:tests(title, questions)
      `)
            .eq('student_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        // Get enrolled courses to avoid recommending them
        const { data: enrolledCourses } = await supabase
            .from('course_enrollments')
            .select('course_id, external_course_id')
            .eq('user_id', user.id);

        const enrolledIds = new Set(enrolledCourses?.map(e => e.course_id || e.external_course_id) || []);

        // Prepare recommendations based on specialization
        const specialization = profile?.specialization || 'Full Stack Development';
        const recommendations = generateRecommendations(specialization, testSubmissions || [], enrolledIds);

        // Get available mentor courses matching skills
        const { data: mentorCourses } = await supabase
            .from('mentor_courses')
            .select(`
        *,
        mentor:users!mentor_courses_mentor_id_fkey(full_name, avatar_url)
      `)
            .eq('is_published', true)
            .limit(5);

        // Analyze weak areas from test performance
        const weakAreas = analyzeWeakAreas(testSubmissions || []);

        return NextResponse.json({
            personalized: {
                specialization,
                weakAreas,
                recommendations
            },
            mentorCourses: mentorCourses?.filter(c => !enrolledIds.has(c.id)) || [],
            learningPath: generateLearningPath(specialization)
        });
    } catch (error: any) {
        console.error('Error generating recommendations:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

function generateRecommendations(specialization: string, testResults: any[], enrolledIds: Set<string>) {
    // Course recommendations by specialization
    const specializationCourses: Record<string, any[]> = {
        'Full Stack Development': [
            { id: 'ext_1', title: 'The Complete Web Developer Bootcamp', platform: 'Udemy', instructor: 'Dr. Angela Yu', rating: 4.7, price: '$84.99', skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'], level: 'Beginner', type: 'paid', image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400' },
            { id: 'ext_2', title: 'Full Stack Web Development', platform: 'Coursera', instructor: 'Meta', rating: 4.7, price: '$49/month', skills: ['React', 'JavaScript', 'APIs'], level: 'Intermediate', type: 'paid', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400' },
            { id: 'ext_3', title: 'Responsive Web Design Certification', platform: 'freeCodeCamp', instructor: 'freeCodeCamp', rating: 4.8, price: 'Free', skills: ['HTML', 'CSS', 'Flexbox', 'Grid'], level: 'Beginner', type: 'free', image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400' },
        ],
        'AI/ML': [
            { id: 'ext_4', title: 'Machine Learning Specialization', platform: 'Coursera', instructor: 'Andrew Ng', rating: 4.9, price: 'Free (Audit)', skills: ['Python', 'Machine Learning', 'Deep Learning'], level: 'Beginner', type: 'free', image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400' },
            { id: 'ext_5', title: 'Deep Learning Specialization', platform: 'Coursera', instructor: 'deeplearning.ai', rating: 4.9, price: '$49/month', skills: ['Neural Networks', 'TensorFlow', 'CNN', 'RNN'], level: 'Intermediate', type: 'paid', image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400' },
            { id: 'ext_6', title: 'AI Programming with Python', platform: 'Udacity', instructor: 'Udacity', rating: 4.5, price: '$399/month', skills: ['Python', 'NumPy', 'PyTorch'], level: 'Intermediate', type: 'paid', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400' },
        ],
        'Cloud Computing': [
            { id: 'ext_7', title: 'AWS Certified Solutions Architect', platform: 'Udemy', instructor: 'Stephane Maarek', rating: 4.7, price: '$84.99', skills: ['AWS', 'Cloud', 'Architecture'], level: 'Intermediate', type: 'paid', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400' },
            { id: 'ext_8', title: 'Google Cloud Fundamentals', platform: 'Coursera', instructor: 'Google Cloud', rating: 4.6, price: '$49/month', skills: ['GCP', 'Cloud', 'DevOps'], level: 'Beginner', type: 'paid', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400' },
        ],
        'Mobile Development': [
            { id: 'ext_9', title: 'The Complete Flutter Development Guide', platform: 'Udemy', instructor: 'Maximilian Schwarzmüller', rating: 4.6, price: '$84.99', skills: ['Flutter', 'Dart', 'Mobile'], level: 'Beginner', type: 'paid', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400' },
            { id: 'ext_10', title: 'React Native - The Practical Guide', platform: 'Udemy', instructor: 'Maximilian Schwarzmüller', rating: 4.7, price: '$84.99', skills: ['React Native', 'JavaScript', 'Mobile'], level: 'Intermediate', type: 'paid', image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400' },
        ],
        'Data Science': [
            { id: 'ext_11', title: 'Python for Data Science', platform: 'Udemy', instructor: 'Jose Portilla', rating: 4.6, price: '$84.99', skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib'], level: 'Intermediate', type: 'paid', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400' },
            { id: 'ext_12', title: 'Data Science Professional Certificate', platform: 'IBM/Coursera', instructor: 'IBM', rating: 4.6, price: '$39/month', skills: ['Python', 'SQL', 'Machine Learning'], level: 'Beginner', type: 'paid', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400' },
        ],
    };

    // Get courses for user's specialization (or default to Full Stack)
    const courses = specializationCourses[specialization] || specializationCourses['Full Stack Development'];

    // Filter out enrolled courses
    return courses.filter(c => !enrolledIds.has(c.id));
}

function analyzeWeakAreas(testSubmissions: any[]): string[] {
    if (!testSubmissions || testSubmissions.length === 0) {
        return [];
    }

    // Find tests with low scores
    const weakTests = testSubmissions.filter(s => s.percentage < 70);

    // Extract topics from test titles (simplified analysis)
    const weakAreas: Set<string> = new Set();
    weakTests.forEach(t => {
        const title = t.test?.title?.toLowerCase() || '';
        if (title.includes('javascript')) weakAreas.add('JavaScript');
        if (title.includes('react')) weakAreas.add('React');
        if (title.includes('python')) weakAreas.add('Python');
        if (title.includes('sql')) weakAreas.add('SQL');
        if (title.includes('algorithm')) weakAreas.add('Algorithms');
        if (title.includes('data structure')) weakAreas.add('Data Structures');
    });

    return Array.from(weakAreas);
}

function generateLearningPath(specialization: string): any[] {
    const paths: Record<string, any[]> = {
        'Full Stack Development': [
            { step: 1, title: 'HTML & CSS Fundamentals', duration: '2 weeks', level: 'Beginner' },
            { step: 2, title: 'JavaScript Essentials', duration: '3 weeks', level: 'Beginner' },
            { step: 3, title: 'React.js Framework', duration: '4 weeks', level: 'Intermediate' },
            { step: 4, title: 'Node.js & Express', duration: '3 weeks', level: 'Intermediate' },
            { step: 5, title: 'Database (MongoDB/PostgreSQL)', duration: '2 weeks', level: 'Intermediate' },
            { step: 6, title: 'Full Stack Project', duration: '4 weeks', level: 'Advanced' },
        ],
        'AI/ML': [
            { step: 1, title: 'Python Programming', duration: '3 weeks', level: 'Beginner' },
            { step: 2, title: 'Mathematics for ML', duration: '2 weeks', level: 'Intermediate' },
            { step: 3, title: 'Machine Learning Basics', duration: '4 weeks', level: 'Intermediate' },
            { step: 4, title: 'Deep Learning', duration: '4 weeks', level: 'Advanced' },
            { step: 5, title: 'ML Project Deployment', duration: '3 weeks', level: 'Advanced' },
        ],
    };

    return paths[specialization] || paths['Full Stack Development'];
}
