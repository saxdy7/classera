'use client';

interface Course {
  id: string;
  title: string;
  platform: string;
  instructor: string;
  rating: number;
  students: string;
  duration: string;
  level: string;
  type: string;
  price: string;
  image: string;
  url: string;
  description: string;
  skills: string[];
}

interface CourseCardProps {
  course: Course;
  isFavorite: boolean;
  onToggleFavorite: (courseId: string) => void;
}

const CARD_COLORS = [
  'bg-orange-100',
  'bg-emerald-100',
  'bg-purple-100',
  'bg-blue-100',
  'bg-pink-100',
  'bg-gray-100',
];

// Platform icon components
const PlatformIcon = ({ platform }: { platform: string }) => {
  const platformLower = platform.toLowerCase();

  if (platformLower.includes('coursera')) {
    return (
      <svg className="w-6 h-6" viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="1200" rx="200" fill="#0056D2"/>
        <path d="M350 400C350 361.34 381.34 330 420 330H780C818.66 330 850 361.34 850 400V800C850 838.66 818.66 870 780 870H420C381.34 870 350 838.66 350 800V400Z" fill="white"/>
        <circle cx="520" cy="520" r="80" fill="#0056D2"/>
        <circle cx="680" cy="520" r="80" fill="#0056D2"/>
        <path d="M450 680C450 680 520 750 600 750C680 750 750 680 750 680" stroke="#0056D2" strokeWidth="40" strokeLinecap="round"/>
      </svg>
    );
  }

  if (platformLower.includes('linkedin')) {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0A66C2" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    );
  }

  if (platformLower.includes('udemy')) {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#A435F0" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.954 10.542c-.026-2.756-1.175-5.153-3.286-6.814A10.344 10.344 0 0012 1.5c-3.354 0-6.336 1.588-8.668 4.228C1.221 7.389.046 9.786.02 12.542v.916c.026 2.756 1.201 5.153 3.312 6.814A10.344 10.344 0 0012 22.5c3.354 0 6.336-1.588 8.668-4.228 2.111-2.661 3.286-5.058 3.312-6.814v-.916zm-2.395 1.228c-.104 1.993-.884 3.77-2.317 5.294-1.536 1.633-3.588 2.605-5.79 2.743v-6.391h3.64l-5.49-7.833-5.491 7.833h3.64v6.391c-2.202-.138-4.254-1.11-5.79-2.743-1.433-1.524-2.213-3.301-2.317-5.294v-.54c.104-1.993.884-3.77 2.317-5.294C5.498 5.303 7.55 4.331 9.752 4.193v3.64h4.496v-3.64c2.202.138 4.254 1.11 5.79 2.743 1.433 1.524 2.213 3.301 2.317 5.294v.54z"/>
      </svg>
    );
  }

  if (platformLower.includes('edx')) {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#02262B" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.744 7.618c-.223.995-.643 1.896-1.237 2.646l-6.006-6.006c.75-.594 1.65-1.014 2.646-1.237 2.836-.635 5.6.812 6.861 3.422.396.82.593 1.706.593 2.592 0 .886-.197 1.772-.593 2.592-.42.868-.999 1.625-1.724 2.238l-6.006-6.006c.75-.594 1.65-1.014 2.646-1.237zm-7.248 8.764c.223-.995.643-1.896 1.237-2.646l6.006 6.006c-.75.594-1.65 1.014-2.646 1.237-2.836.635-5.6-.812-6.861-3.422-.396-.82-.593-1.706-.593-2.592 0-.886.197-1.772.593-2.592.42-.868.999-1.625 1.724-2.238l6.006 6.006c-.75.594-1.65 1.014-2.646 1.237z"/>
      </svg>
    );
  }

  if (platformLower.includes('freecodecamp')) {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0A0A23" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.885 3.906a.621.621 0 00-.354.12c-.08.08-.161.196-.161.313 0 .2.236.474.673.923 1.822 1.754 2.738 3.903 2.738 6.449 0 2.545-.916 4.695-2.738 6.449-.437.449-.673.723-.673.923 0 .117.081.233.161.313.08.08.196.12.354.12.2 0 .437-.081.752-.396 2.149-2.11 3.224-4.694 3.224-7.41 0-2.715-1.075-5.299-3.224-7.408-.314-.315-.552-.396-.752-.396zm-15.77 0c-.2 0-.437.081-.752.396C1.107 6.41.032 8.995.032 11.71c0 2.715 1.075 5.3 3.224 7.41.315.314.552.395.752.395.158 0 .274-.04.354-.12.08-.08.161-.196.161-.313 0-.2-.236-.474-.673-.923-1.822-1.754-2.738-3.904-2.738-6.449 0-2.546.916-4.695 2.738-6.449.437-.449.673-.722.673-.923 0-.117-.081-.233-.161-.313a.621.621 0 00-.354-.12zm7.92 4.465c-1.015 0-1.832.833-1.832 1.848 0 1.015.817 1.832 1.832 1.832s1.848-.817 1.848-1.832c0-1.015-.833-1.848-1.848-1.848zm-4.583 2.134c-1.015 0-1.832.817-1.832 1.832s.817 1.848 1.832 1.848c1.015 0 1.832-.833 1.832-1.848s-.817-1.832-1.832-1.832zm9.166 0c-1.015 0-1.848.817-1.848 1.832s.833 1.848 1.848 1.848c1.015 0 1.832-.833 1.832-1.848s-.817-1.832-1.832-1.832zm-4.583 2.134c-1.015 0-1.848.817-1.848 1.832s.833 1.848 1.848 1.848 1.832-.833 1.832-1.848-.817-1.832-1.832-1.832z"/>
      </svg>
    );
  }

  if (platformLower.includes('youtube')) {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FF0000" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }

  // Default icon for unknown platforms
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#6B7280" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
};

export function CourseCard({ course, isFavorite, onToggleFavorite }: CourseCardProps) {
  const cardIndex = parseInt(course.id) || 0;
  const bgColor = CARD_COLORS[cardIndex % CARD_COLORS.length];
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const day = (cardIndex % 28) + 1;
  const month = months[cardIndex % 5];
  const year = 2023;
  const date = `${day} ${month}, ${year}`;

  const getLocation = () => {
    const locations = [
      'San Francisco, CA',
      'California, CA',
      'New York, NY',
      'Seattle, WA',
      'Austin, TX'
    ];
    return locations[cardIndex % locations.length];
  };

  // Build tags array from course data
  const tags = [];
  if (course.type === 'free') {
    tags.push('Free course');
  }
  if (course.duration) {
    tags.push(course.duration);
  }
  if (course.level) {
    tags.push(course.level);
  }
  if (course.skills && course.skills.length > 0) {
    tags.push(...course.skills.slice(0, 2));
  }

  return (
    <div
      className="w-full rounded-3xl shadow-sm border border-black/5 transition-transform hover:scale-[1.02] hover:shadow-md overflow-hidden"
    >
      {/* Top Section - Light Yellow Background */}
      <div className="bg-yellow-50 p-5 relative">
        {/* Decorative curves and lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          {/* Curved line top right */}
          <svg className="absolute -top-4 -right-4 w-32 h-32" viewBox="0 0 100 100">
            <path d="M 0,50 Q 25,25 50,50 T 100,50" stroke="#FCD34D" strokeWidth="2" fill="none" />
            <path d="M 0,60 Q 25,35 50,60 T 100,60" stroke="#FCD34D" strokeWidth="1.5" fill="none" />
          </svg>
          {/* Diagonal lines */}
          <div className="absolute top-0 right-0 w-full h-full">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <line x1="100%" y1="0" x2="80%" y2="100%" stroke="#FCD34D" strokeWidth="1" />
              <line x1="90%" y1="0" x2="70%" y2="100%" stroke="#FCD34D" strokeWidth="0.5" />
            </svg>
          </div>
          {/* Small circles */}
          <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-yellow-300 rounded-full"></div>
          <div className="absolute top-8 right-16 w-4 h-4 bg-yellow-200 rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-800">
            {date}
          </span>
          {/* Platform Icon */}
          <div className="bg-white p-2 rounded-full shadow-sm" title={course.platform}>
            <PlatformIcon platform={course.platform} />
          </div>
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold leading-snug mb-4 text-gray-900 line-clamp-2 min-h-[3.5rem] relative z-10">
          {course.title}
        </h2>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 min-h-[2.5rem] relative z-10">
          {tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full text-xs bg-white border border-black/10 text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Section - White Background */}
      <div className="bg-white p-5 relative">
        {/* Decorative curves and lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          {/* Curved line bottom left */}
          <svg className="absolute -bottom-4 -left-4 w-32 h-32" viewBox="0 0 100 100">
            <path d="M 100,50 Q 75,75 50,50 T 0,50" stroke="#E5E7EB" strokeWidth="2" fill="none" />
            <path d="M 100,40 Q 75,65 50,40 T 0,40" stroke="#E5E7EB" strokeWidth="1.5" fill="none" />
          </svg>
          {/* Diagonal lines */}
          <div className="absolute top-0 left-0 w-full h-full">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="20%" y2="100%" stroke="#E5E7EB" strokeWidth="1" />
              <line x1="10%" y1="0" x2="30%" y2="100%" stroke="#E5E7EB" strokeWidth="0.5" />
            </svg>
          </div>
          {/* Small shapes */}
          <div className="absolute top-4 right-8 w-6 h-6 border-2 border-gray-200 rotate-45"></div>
          <div className="absolute bottom-8 right-4 w-3 h-3 bg-gray-200 rounded-full"></div>
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-lg font-bold text-gray-900">{course.type === 'free' ? 'FREE' : course.price}</p>
            <p className="text-sm text-gray-600">{getLocation()}</p>
          </div>

          <a
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black text-white px-5 py-2 rounded-full text-sm hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            Details
          </a>
        </div>
      </div>
    </div>
  );
}
