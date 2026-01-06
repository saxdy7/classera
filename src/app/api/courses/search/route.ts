import { NextResponse } from 'next/server';

// Comprehensive curated course database covering major topics
const CURATED_COURSES = [
    // ============ FULL STACK DEVELOPMENT ============
    { id: 'fs1', title: 'The Complete 2024 Full Stack Web Development Bootcamp', platform: 'Udemy', instructor: 'Dr. Angela Yu', rating: 4.7, students: '1.2M', duration: '65 hours', level: 'Beginner', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400', url: 'https://www.udemy.com/course/the-complete-web-development-bootcamp/', description: 'Become a full-stack web developer with HTML, CSS, JavaScript, React, Node.js, MongoDB. Complete bootcamp.', skills: ['Full Stack', 'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'] },
    { id: 'fs2', title: 'Full-Stack Web Development with React Specialization', platform: 'Coursera', instructor: 'Hong Kong University', rating: 4.7, students: '500K', duration: '4 months', level: 'Intermediate', type: 'paid', price: '$49/month', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400', url: 'https://www.coursera.org/specializations/full-stack-react', description: 'Master full-stack web development with React. Build complete web and mobile apps.', skills: ['Full Stack', 'React', 'React Native', 'Node.js', 'MongoDB', 'Express'] },
    { id: 'fs3', title: 'Meta Full-Stack Developer Professional Certificate', platform: 'Coursera', instructor: 'Meta', rating: 4.7, students: '800K', duration: '7 months', level: 'Beginner', type: 'paid', price: '$49/month', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400', url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer', description: 'Become a full-stack developer. Learn front-end and back-end development from Meta.', skills: ['Full Stack', 'React', 'JavaScript', 'Python', 'Django', 'MySQL'] },
    { id: 'fs4', title: 'The Complete Full-Stack JavaScript Course', platform: 'Udemy', instructor: 'Jonas Schmedtmann', rating: 4.8, students: '400K', duration: '42 hours', level: 'Intermediate', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400', url: 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/', description: 'Build a complete full-stack app with Node.js, Express, MongoDB, and more.', skills: ['Full Stack', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'API'] },
    { id: 'fs5', title: 'Full Stack Open 2024', platform: 'University of Helsinki', instructor: 'University of Helsinki', rating: 4.9, students: '200K', duration: '14 weeks', level: 'Intermediate', type: 'free', price: 'Free', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400', url: 'https://fullstackopen.com/en/', description: 'Deep dive into modern web development. React, Redux, Node.js, MongoDB, GraphQL.', skills: ['Full Stack', 'React', 'Redux', 'Node.js', 'GraphQL', 'TypeScript'] },
    { id: 'fs6', title: 'MERN Stack Full Tutorial', platform: 'freeCodeCamp', instructor: 'freeCodeCamp', rating: 4.8, students: '1M', duration: '300 hours', level: 'Beginner', type: 'free', price: 'Free', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400', url: 'https://www.freecodecamp.org/learn/', description: 'Learn the complete MERN stack: MongoDB, Express, React, and Node.js.', skills: ['Full Stack', 'MERN', 'MongoDB', 'Express', 'React', 'Node.js'] },

    // ============ PYTHON ============
    { id: 'py1', title: '100 Days of Code: Python Bootcamp', platform: 'Udemy', instructor: 'Dr. Angela Yu', rating: 4.7, students: '1M', duration: '60 hours', level: 'Beginner', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400', url: 'https://www.udemy.com/course/100-days-of-code/', description: 'Master Python by building 100 projects in 100 days. Web development, data science, automation.', skills: ['Python', 'Web Development', 'Data Science', 'Automation', 'Flask'] },
    { id: 'py2', title: 'Python for Everybody Specialization', platform: 'Coursera', instructor: 'University of Michigan', rating: 4.8, students: '3M', duration: '8 months', level: 'Beginner', type: 'free', price: 'Free (Audit)', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400', url: 'https://www.coursera.org/specializations/python', description: 'Learn to program and analyze data with Python. Web scraping, SQL, JSON.', skills: ['Python', 'SQL', 'Web Scraping', 'JSON', 'Data Analysis'] },
    { id: 'py3', title: 'Complete Python Developer in 2024', platform: 'Udemy', instructor: 'Andrei Neagoie', rating: 4.6, students: '600K', duration: '31 hours', level: 'Beginner', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400', url: 'https://www.udemy.com/course/complete-python-developer-zero-to-mastery/', description: 'Learn Python from scratch. Build 12+ projects including ML and web apps.', skills: ['Python', 'Web Scraping', 'Automation', 'Machine Learning', 'Flask'] },
    { id: 'py4', title: 'Learn Python 3', platform: 'Codecademy', instructor: 'Codecademy', rating: 4.7, students: '5M', duration: '25 hours', level: 'Beginner', type: 'free', price: 'Free', image: 'https://images.unsplash.com/photo-1509718443690-d8e2fb3474b7?w=400', url: 'https://www.codecademy.com/learn/learn-python-3', description: 'Learn Python 3 with interactive lessons. Syntax, functions, classes.', skills: ['Python', 'Programming Basics', 'Functions', 'Classes', 'OOP'] },

    // ============ REACT / FRONTEND ============
    { id: 'r1', title: 'React - The Complete Guide 2024 (incl. Redux)', platform: 'Udemy', instructor: 'Maximilian Schwarzmüller', rating: 4.7, students: '900K', duration: '60 hours', level: 'Beginner', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400', url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', description: 'Dive in and learn React from scratch. Hooks, Redux, React Router, Next.js.', skills: ['React', 'Redux', 'Next.js', 'JavaScript', 'TypeScript', 'Hooks'] },
    { id: 'r2', title: 'Meta Front-End Developer Professional Certificate', platform: 'Coursera', instructor: 'Meta', rating: 4.7, students: '2.1M', duration: '7 months', level: 'Beginner', type: 'paid', price: '$49/month', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400', url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer', description: 'Become a professional front-end developer with Meta certification.', skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Git', 'Testing'] },
    { id: 'r3', title: 'Front End Development Libraries', platform: 'freeCodeCamp', instructor: 'freeCodeCamp', rating: 4.7, students: '1M', duration: '300 hours', level: 'Intermediate', type: 'free', price: 'Free', image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400', url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/', description: 'Learn Bootstrap, jQuery, Sass, React, and Redux by building projects.', skills: ['React', 'Redux', 'Bootstrap', 'Sass', 'jQuery'] },
    { id: 'r4', title: 'Next.js 14 & React - The Complete Guide', platform: 'Udemy', instructor: 'Maximilian Schwarzmüller', rating: 4.7, students: '200K', duration: '40 hours', level: 'Intermediate', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1555066931-bf19f8fd1085?w=400', url: 'https://www.udemy.com/course/nextjs-react-the-complete-guide/', description: 'Learn Next.js 14 and build production-ready React apps with App Router.', skills: ['Next.js', 'React', 'Server Components', 'App Router', 'TypeScript'] },

    // ============ MACHINE LEARNING / AI ============
    { id: 'ml1', title: 'Machine Learning Specialization', platform: 'Coursera', instructor: 'Andrew Ng', rating: 4.9, students: '4.5M', duration: '3 months', level: 'Beginner', type: 'free', price: 'Free (Audit)', image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400', url: 'https://www.coursera.org/specializations/machine-learning-introduction', description: 'Learn the fundamentals of machine learning from AI pioneer Andrew Ng.', skills: ['Machine Learning', 'Python', 'AI', 'Deep Learning', 'TensorFlow'] },
    { id: 'ml2', title: 'Deep Learning Specialization', platform: 'Coursera', instructor: 'deeplearning.ai', rating: 4.9, students: '1.8M', duration: '5 months', level: 'Intermediate', type: 'paid', price: '$49/month', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400', url: 'https://www.coursera.org/specializations/deep-learning', description: 'Master deep learning. Build neural networks and lead ML projects.', skills: ['Deep Learning', 'Neural Networks', 'TensorFlow', 'CNN', 'RNN'] },
    { id: 'ml3', title: 'Python for Data Science and Machine Learning', platform: 'Udemy', instructor: 'Jose Portilla', rating: 4.6, students: '800K', duration: '25 hours', level: 'Intermediate', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400', url: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/', description: 'Learn Python for data science, ML, and data visualization.', skills: ['Machine Learning', 'Python', 'Pandas', 'NumPy', 'Scikit-Learn'] },
    { id: 'ml4', title: 'AI Programming with Python Nanodegree', platform: 'Udacity', instructor: 'Udacity', rating: 4.5, students: '300K', duration: '3 months', level: 'Intermediate', type: 'paid', price: '$399/month', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400', url: 'https://www.udacity.com/course/ai-programming-python-nanodegree--nd089', description: 'Learn Python, NumPy, Pandas, and PyTorch. Build your own image classifier.', skills: ['AI', 'Python', 'NumPy', 'Pandas', 'PyTorch', 'Neural Networks'] },
    { id: 'ml5', title: 'Introduction to Artificial Intelligence', platform: 'edX', instructor: 'IBM', rating: 4.5, students: '500K', duration: '4 weeks', level: 'Beginner', type: 'free', price: 'Free', image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400', url: 'https://www.edx.org/course/introduction-to-artificial-intelligence-ai', description: 'Learn what AI is, explore use cases and applications.', skills: ['AI', 'Machine Learning', 'Neural Networks', 'AI Ethics'] },

    // ============ DATA SCIENCE ============
    { id: 'ds1', title: 'Google Data Analytics Professional Certificate', platform: 'Coursera', instructor: 'Google', rating: 4.8, students: '3.2M', duration: '6 months', level: 'Beginner', type: 'paid', price: '$49/month', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', description: 'Get job-ready for data analytics. No experience required.', skills: ['Data Analytics', 'SQL', 'Tableau', 'R', 'Spreadsheets'] },
    { id: 'ds2', title: 'IBM Data Science Professional Certificate', platform: 'Coursera', instructor: 'IBM', rating: 4.6, students: '1.5M', duration: '5 months', level: 'Beginner', type: 'paid', price: '$39/month', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', url: 'https://www.coursera.org/professional-certificates/ibm-data-science', description: 'Learn Python, SQL, and machine learning for data science.', skills: ['Data Science', 'Python', 'SQL', 'Machine Learning', 'Data Visualization'] },
    { id: 'ds3', title: 'Data Analyst with Python', platform: 'Codecademy', instructor: 'Codecademy', rating: 4.6, students: '800K', duration: '30 hours', level: 'Beginner', type: 'paid', price: '$19.99/month', image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400', url: 'https://www.codecademy.com/learn/paths/data-analyst', description: 'Learn to analyze data with Python. Pandas, NumPy, data visualization.', skills: ['Data Analysis', 'Python', 'Pandas', 'NumPy', 'Matplotlib'] },

    // ============ WEB DEVELOPMENT BASICS ============
    { id: 'wd1', title: 'CS50: Introduction to Computer Science', platform: 'edX', instructor: 'Harvard University', rating: 4.9, students: '3M', duration: '12 weeks', level: 'Beginner', type: 'free', price: 'Free', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400', url: 'https://www.edx.org/course/introduction-computer-science-harvardx-cs50x', description: 'Harvard\'s introduction to computer science. The most popular CS course.', skills: ['C', 'Python', 'SQL', 'JavaScript', 'HTML', 'CSS', 'Algorithms'] },
    { id: 'wd2', title: 'Responsive Web Design Certification', platform: 'freeCodeCamp', instructor: 'freeCodeCamp', rating: 4.8, students: '2M', duration: '300 hours', level: 'Beginner', type: 'free', price: 'Free', image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', description: 'Learn responsive web design by building 20 projects.', skills: ['HTML', 'CSS', 'Flexbox', 'Grid', 'Responsive Design'] },
    { id: 'wd3', title: 'The Web Developer Bootcamp 2024', platform: 'Udemy', instructor: 'Colt Steele', rating: 4.7, students: '1M', duration: '74 hours', level: 'Beginner', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400', url: 'https://www.udemy.com/course/the-web-developer-bootcamp/', description: 'Learn web development from scratch. HTML, CSS, JS, Node, Express, MongoDB.', skills: ['Web Development', 'HTML', 'CSS', 'JavaScript', 'Node.js', 'MongoDB'] },

    // ============ JAVASCRIPT ============
    { id: 'js1', title: 'JavaScript Algorithms and Data Structures', platform: 'freeCodeCamp', instructor: 'freeCodeCamp', rating: 4.8, students: '1.5M', duration: '300 hours', level: 'Intermediate', type: 'free', price: 'Free', image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', description: 'Master JavaScript fundamentals, ES6, algorithms and data structures.', skills: ['JavaScript', 'ES6', 'Algorithms', 'Data Structures', 'OOP'] },
    { id: 'js2', title: 'The Complete JavaScript Course 2024', platform: 'Udemy', instructor: 'Jonas Schmedtmann', rating: 4.7, students: '800K', duration: '69 hours', level: 'Beginner', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400', url: 'https://www.udemy.com/course/the-complete-javascript-course/', description: 'From zero to expert. Modern JavaScript with projects and challenges.', skills: ['JavaScript', 'ES6+', 'OOP', 'Async', 'DOM'] },
    { id: 'js3', title: 'Learn JavaScript', platform: 'Codecademy', instructor: 'Codecademy', rating: 4.6, students: '4M', duration: '20 hours', level: 'Beginner', type: 'free', price: 'Free', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400', url: 'https://www.codecademy.com/learn/introduction-to-javascript', description: 'Learn JavaScript fundamentals with interactive lessons.', skills: ['JavaScript', 'ES6', 'Functions', 'Objects', 'Arrays'] },

    // ============ CLOUD / DEVOPS ============
    { id: 'cl1', title: 'AWS Certified Solutions Architect Associate 2024', platform: 'Udemy', instructor: 'Stephane Maarek', rating: 4.7, students: '500K', duration: '27 hours', level: 'Intermediate', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400', url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/', description: 'Pass the AWS Solutions Architect exam. Full study guide with practice tests.', skills: ['AWS', 'Cloud', 'EC2', 'S3', 'Lambda', 'VPC'] },
    { id: 'cl2', title: 'Google Cloud Fundamentals', platform: 'Coursera', instructor: 'Google Cloud', rating: 4.6, students: '400K', duration: '4 weeks', level: 'Beginner', type: 'paid', price: '$49/month', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400', url: 'https://www.coursera.org/learn/gcp-fundamentals', description: 'Learn Google Cloud Platform basics. Compute, storage, networking.', skills: ['GCP', 'Cloud', 'Compute Engine', 'Cloud Storage'] },
    { id: 'cl3', title: 'Docker & Kubernetes: The Practical Guide', platform: 'Udemy', instructor: 'Maximilian Schwarzmüller', rating: 4.7, students: '300K', duration: '24 hours', level: 'Intermediate', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400', url: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', description: 'Learn Docker and Kubernetes for DevOps and development.', skills: ['Docker', 'Kubernetes', 'DevOps', 'Containers', 'CI/CD'] },

    // ============ MOBILE DEVELOPMENT ============
    { id: 'mo1', title: 'The Complete Flutter Development Guide', platform: 'Udemy', instructor: 'Maximilian Schwarzmüller', rating: 4.6, students: '400K', duration: '42 hours', level: 'Beginner', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400', url: 'https://www.udemy.com/course/learn-flutter-dart-to-build-ios-android-apps/', description: 'Build beautiful native iOS and Android apps with Flutter and Dart.', skills: ['Flutter', 'Dart', 'Mobile Development', 'iOS', 'Android'] },
    { id: 'mo2', title: 'React Native - The Practical Guide', platform: 'Udemy', instructor: 'Maximilian Schwarzmüller', rating: 4.7, students: '300K', duration: '28 hours', level: 'Intermediate', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400', url: 'https://www.udemy.com/course/react-native-the-practical-guide/', description: 'Build native mobile apps for iOS and Android with React Native.', skills: ['React Native', 'JavaScript', 'Mobile', 'iOS', 'Android'] },
    { id: 'mo3', title: 'iOS & Swift - The Complete iOS App Development Bootcamp', platform: 'Udemy', instructor: 'Dr. Angela Yu', rating: 4.8, students: '500K', duration: '60 hours', level: 'Beginner', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', url: 'https://www.udemy.com/course/ios-13-app-development-bootcamp/', description: 'Learn iOS app development from scratch with Swift and Xcode.', skills: ['iOS', 'Swift', 'Xcode', 'UIKit', 'SwiftUI'] },

    // ============ BACKEND ============
    { id: 'be1', title: 'Node.js, Express, MongoDB & More: The Complete Bootcamp', platform: 'Udemy', instructor: 'Jonas Schmedtmann', rating: 4.8, students: '400K', duration: '42 hours', level: 'Intermediate', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1555066931-bf19f8fd1085?w=400', url: 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/', description: 'Master Node.js by building a complete RESTful API and web app.', skills: ['Node.js', 'Express', 'MongoDB', 'REST API', 'Backend'] },
    { id: 'be2', title: 'Django for Everybody Specialization', platform: 'Coursera', instructor: 'University of Michigan', rating: 4.8, students: '300K', duration: '4 months', level: 'Intermediate', type: 'paid', price: '$49/month', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400', url: 'https://www.coursera.org/specializations/django', description: 'Learn to build web applications with Python and Django framework.', skills: ['Django', 'Python', 'Backend', 'SQL', 'ORM'] },
    { id: 'be3', title: 'Spring Boot 3 & Spring Framework 6 for Beginners', platform: 'Udemy', instructor: 'Chad Darby', rating: 4.7, students: '200K', duration: '35 hours', level: 'Beginner', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400', url: 'https://www.udemy.com/course/spring-hibernate-tutorial/', description: 'Learn Spring Boot 3, Spring MVC, Spring Security, JPA/Hibernate.', skills: ['Spring Boot', 'Java', 'Spring Security', 'JPA', 'REST API'] },

    // ============ DATABASES ============
    { id: 'db1', title: 'The Complete SQL Bootcamp: Go from Zero to Hero', platform: 'Udemy', instructor: 'Jose Portilla', rating: 4.7, students: '800K', duration: '9 hours', level: 'Beginner', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400', url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/', description: 'Learn SQL for database management with PostgreSQL.', skills: ['SQL', 'PostgreSQL', 'Database', 'Queries', 'Data Analysis'] },
    { id: 'db2', title: 'MongoDB - The Complete Developer\'s Guide', platform: 'Udemy', instructor: 'Maximilian Schwarzmüller', rating: 4.7, students: '200K', duration: '17 hours', level: 'Intermediate', type: 'paid', price: '$84.99', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400', url: 'https://www.udemy.com/course/mongodb-the-complete-developers-guide/', description: 'Master MongoDB development for web and mobile applications.', skills: ['MongoDB', 'NoSQL', 'Database', 'Aggregation', 'Indexes'] },
];

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';
        const type = searchParams.get('type') || 'all';
        const platform = searchParams.get('platform') || 'all';
        const level = searchParams.get('level') || 'all';
        const sortBy = searchParams.get('sortBy') || 'popular';

        let courses = [...CURATED_COURSES];

        // Filter by search query (enhanced matching)
        if (query) {
            const lowerQuery = query.toLowerCase();
            const searchTerms = lowerQuery.split(' ').filter(t => t.length > 1);

            courses = courses.filter(course => {
                const searchableText = `
          ${course.title} 
          ${course.description} 
          ${course.skills.join(' ')} 
          ${course.instructor} 
          ${course.platform}
        `.toLowerCase();

                // Match if any search term is found
                return searchTerms.some(term => searchableText.includes(term));
            });

            // Sort by relevance (more term matches = higher)
            courses.sort((a, b) => {
                const aText = `${a.title} ${a.description} ${a.skills.join(' ')}`.toLowerCase();
                const bText = `${b.title} ${b.description} ${b.skills.join(' ')}`.toLowerCase();
                const aMatches = searchTerms.filter(term => aText.includes(term)).length;
                const bMatches = searchTerms.filter(term => bText.includes(term)).length;
                return bMatches - aMatches;
            });
        }

        // Filter by type
        if (type !== 'all') {
            courses = courses.filter(course => course.type === type);
        }

        // Filter by platform
        if (platform !== 'all') {
            courses = courses.filter(course =>
                course.platform.toLowerCase() === platform.toLowerCase()
            );
        }

        // Filter by level
        if (level !== 'all') {
            courses = courses.filter(course =>
                course.level.toLowerCase() === level.toLowerCase()
            );
        }

        // Sort courses (if not already sorted by relevance)
        if (!query) {
            switch (sortBy) {
                case 'rating':
                    courses.sort((a, b) => b.rating - a.rating);
                    break;
                case 'popular':
                    courses.sort((a, b) => {
                        const parseStudents = (s: string) => {
                            const num = parseFloat(s.replace(/[^\d.]/g, ''));
                            return s.includes('M') ? num * 1000000 : s.includes('K') ? num * 1000 : num;
                        };
                        return parseStudents(b.students) - parseStudents(a.students);
                    });
                    break;
                case 'price-low':
                    courses.sort((a, b) => {
                        const priceA = a.type === 'free' ? 0 : parseFloat(a.price.replace(/[^0-9.]/g, ''));
                        const priceB = b.type === 'free' ? 0 : parseFloat(b.price.replace(/[^0-9.]/g, ''));
                        return priceA - priceB;
                    });
                    break;
            }
        }

        return NextResponse.json({
            courses,
            total: courses.length,
            source: 'curated',
            filters: { query, type, platform, level, sortBy }
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}
