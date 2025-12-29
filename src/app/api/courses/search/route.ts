import { NextResponse } from 'next/server';

// This API searches for courses from multiple platforms
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';
        const type = searchParams.get('type') || 'all'; // free, paid, all
        const platform = searchParams.get('platform') || 'all';

        // Curated course data from major platforms
        // In production, you would scrape or use APIs from these platforms
        const courses = getCuratedCourses(query, type, platform);

        return NextResponse.json({ courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

function getCuratedCourses(query: string, type: string, platform: string) {
    // Curated list of popular courses from major platforms
    const allCourses = [
        // Coursera
        {
            id: '1',
            title: 'Machine Learning Specialization',
            platform: 'Coursera',
            instructor: 'Andrew Ng',
            rating: 4.9,
            students: '4.5M',
            duration: '3 months',
            level: 'Beginner',
            type: 'free',
            price: 'Free (Audit)',
            image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400',
            url: 'https://www.coursera.org/specializations/machine-learning-introduction',
            description: 'Learn the fundamentals of machine learning from AI pioneer Andrew Ng',
            skills: ['Python', 'Machine Learning', 'AI', 'Deep Learning'],
        },
        {
            id: '2',
            title: 'Full Stack Web Development',
            platform: 'Coursera',
            instructor: 'Meta',
            rating: 4.7,
            students: '2.1M',
            duration: '8 months',
            level: 'Beginner',
            type: 'paid',
            price: '$49/month',
            image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
            url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer',
            description: 'Become a professional full-stack developer with Meta',
            skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Node.js'],
        },
        // Udemy
        {
            id: '3',
            title: 'The Complete Web Developer Bootcamp',
            platform: 'Udemy',
            instructor: 'Dr. Angela Yu',
            rating: 4.7,
            students: '1.2M',
            duration: '65 hours',
            level: 'Beginner',
            type: 'paid',
            price: '$84.99',
            image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
            url: 'https://www.udemy.com/course/the-complete-web-development-bootcamp/',
            description: 'Become a full-stack web developer with just one course',
            skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'],
        },
        {
            id: '4',
            title: 'Python for Data Science and Machine Learning',
            platform: 'Udemy',
            instructor: 'Jose Portilla',
            rating: 4.6,
            students: '800K',
            duration: '25 hours',
            level: 'Intermediate',
            type: 'paid',
            price: '$84.99',
            image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
            url: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/',
            description: 'Learn Python for data science, machine learning, and data visualization',
            skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Machine Learning'],
        },
        // edX
        {
            id: '5',
            title: 'CS50: Introduction to Computer Science',
            platform: 'edX',
            instructor: 'Harvard University',
            rating: 4.9,
            students: '3M',
            duration: '12 weeks',
            level: 'Beginner',
            type: 'free',
            price: 'Free (Certificate: $199)',
            image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
            url: 'https://www.edx.org/course/introduction-computer-science-harvardx-cs50x',
            description: 'Harvard University\'s introduction to computer science',
            skills: ['C', 'Python', 'SQL', 'JavaScript', 'HTML', 'CSS'],
        },
        // LinkedIn Learning
        {
            id: '6',
            title: 'Become a Software Developer',
            platform: 'LinkedIn Learning',
            instructor: 'Multiple Instructors',
            rating: 4.6,
            students: '500K',
            duration: '21 hours',
            level: 'Beginner',
            type: 'paid',
            price: '$39.99/month',
            image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
            url: 'https://www.linkedin.com/learning/paths/become-a-software-developer',
            description: 'Complete learning path to become a professional software developer',
            skills: ['Programming', 'Software Development', 'Git', 'Algorithms'],
        },
        // FreeCodeCamp
        {
            id: '7',
            title: 'Responsive Web Design Certification',
            platform: 'freeCodeCamp',
            instructor: 'freeCodeCamp',
            rating: 4.8,
            students: '2M',
            duration: '300 hours',
            level: 'Beginner',
            type: 'free',
            price: 'Free',
            image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400',
            url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
            description: 'Learn responsive web design by building projects',
            skills: ['HTML', 'CSS', 'Flexbox', 'Grid', 'Responsive Design'],
        },
        {
            id: '8',
            title: 'JavaScript Algorithms and Data Structures',
            platform: 'freeCodeCamp',
            instructor: 'freeCodeCamp',
            rating: 4.8,
            students: '1.5M',
            duration: '300 hours',
            level: 'Intermediate',
            type: 'free',
            price: 'Free',
            image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400',
            url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
            description: 'Master JavaScript fundamentals and algorithms',
            skills: ['JavaScript', 'ES6', 'Algorithms', 'Data Structures'],
        },
        // Udacity
        {
            id: '9',
            title: 'AI Programming with Python Nanodegree',
            platform: 'Udacity',
            instructor: 'Udacity',
            rating: 4.5,
            students: '300K',
            duration: '3 months',
            level: 'Intermediate',
            type: 'paid',
            price: '$399/month',
            image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400',
            url: 'https://www.udacity.com/course/ai-programming-python-nanodegree--nd089',
            description: 'Learn Python and AI fundamentals',
            skills: ['Python', 'NumPy', 'Pandas', 'PyTorch', 'Neural Networks'],
        },
        // Codecademy
        {
            id: '10',
            title: 'Learn Python 3',
            platform: 'Codecademy',
            instructor: 'Codecademy',
            rating: 4.7,
            students: '5M',
            duration: '25 hours',
            level: 'Beginner',
            type: 'free',
            price: 'Free (Pro: $19.99/month)',
            image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400',
            url: 'https://www.codecademy.com/learn/learn-python-3',
            description: 'Learn Python 3 from scratch with interactive lessons',
            skills: ['Python', 'Programming Basics', 'Syntax', 'Functions'],
        },
    ];

    // Filter courses
    let filtered = allCourses;

    // Filter by query
    if (query) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter(course =>
            course.title.toLowerCase().includes(lowerQuery) ||
            course.description.toLowerCase().includes(lowerQuery) ||
            course.skills.some(skill => skill.toLowerCase().includes(lowerQuery))
        );
    }

    // Filter by type
    if (type !== 'all') {
        filtered = filtered.filter(course => course.type === type);
    }

    // Filter by platform
    if (platform !== 'all') {
        filtered = filtered.filter(course => course.platform.toLowerCase() === platform.toLowerCase());
    }

    return filtered;
}
