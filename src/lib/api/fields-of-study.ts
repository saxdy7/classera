// Fields of Study API utilities
// Comprehensive list of academic programs and degrees from various sources

interface FieldOfStudy {
  code: string;
  name: string;
  category: string;
  level?: string;
}

// Comprehensive list of fields from UNESCO ISCED classification
const fieldsOfStudyData: FieldOfStudy[] = [
  // Generic programmes and qualifications
  { code: '00', name: 'Generic programmes and qualifications', category: 'Generic' },
  { code: '001', name: 'Basic programmes and qualifications', category: 'Generic' },
  { code: '002', name: 'Literacy and numeracy', category: 'Generic' },
  { code: '003', name: 'Personal skills and development', category: 'Generic' },

  // Education
  { code: '01', name: 'Education', category: 'Education' },
  { code: '011', name: 'Education', category: 'Education' },
  { code: '0111', name: 'Education science', category: 'Education' },
  { code: '0112', name: 'Training for pre-school teachers', category: 'Education' },
  { code: '0113', name: 'Teacher training without subject specialization', category: 'Education' },
  { code: '0114', name: 'Teacher training with subject specialization', category: 'Education' },

  // Arts and humanities
  { code: '02', name: 'Arts and humanities', category: 'Arts and Humanities' },
  { code: '021', name: 'Arts', category: 'Arts and Humanities' },
  { code: '0211', name: 'Audio-visual techniques and media production', category: 'Arts and Humanities' },
  { code: '0212', name: 'Fashion, interior and industrial design', category: 'Arts and Humanities' },
  { code: '0213', name: 'Fine arts', category: 'Arts and Humanities' },
  { code: '0214', name: 'Handicrafts', category: 'Arts and Humanities' },
  { code: '0215', name: 'Music and performing arts', category: 'Arts and Humanities' },
  { code: '022', name: 'Humanities (except languages)', category: 'Arts and Humanities' },
  { code: '0221', name: 'Religion and theology', category: 'Arts and Humanities' },
  { code: '0222', name: 'History and archaeology', category: 'Arts and Humanities' },
  { code: '0223', name: 'Philosophy and ethics', category: 'Arts and Humanities' },
  { code: '023', name: 'Languages', category: 'Arts and Humanities' },
  { code: '0231', name: 'Language acquisition', category: 'Arts and Humanities' },
  { code: '0232', name: 'Literature and linguistics', category: 'Arts and Humanities' },

  // Social sciences, journalism and information
  { code: '03', name: 'Social sciences, journalism and information', category: 'Social Sciences' },
  { code: '031', name: 'Social and behavioural sciences', category: 'Social Sciences' },
  { code: '0311', name: 'Economics', category: 'Social Sciences' },
  { code: '0312', name: 'Political sciences and civics', category: 'Social Sciences' },
  { code: '0313', name: 'Psychology', category: 'Social Sciences' },
  { code: '0314', name: 'Sociology and cultural studies', category: 'Social Sciences' },
  { code: '032', name: 'Journalism and information', category: 'Social Sciences' },
  { code: '0321', name: 'Journalism and reporting', category: 'Social Sciences' },
  { code: '0322', name: 'Library, information and archival studies', category: 'Social Sciences' },

  // Business, administration and law
  { code: '04', name: 'Business, administration and law', category: 'Business and Law' },
  { code: '041', name: 'Business and administration', category: 'Business and Law' },
  { code: '0411', name: 'Accounting and taxation', category: 'Business and Law' },
  { code: '0412', name: 'Finance, banking and insurance', category: 'Business and Law' },
  { code: '0413', name: 'Management and administration', category: 'Business and Law' },
  { code: '0414', name: 'Marketing and advertising', category: 'Business and Law' },
  { code: '0415', name: 'Secretarial and office work', category: 'Business and Law' },
  { code: '0416', name: 'Wholesale and retail sales', category: 'Business and Law' },
  { code: '0417', name: 'Work skills', category: 'Business and Law' },
  { code: '042', name: 'Law', category: 'Business and Law' },
  { code: '0421', name: 'Law', category: 'Business and Law' },

  // Natural sciences, mathematics and statistics
  { code: '05', name: 'Natural sciences, mathematics and statistics', category: 'Sciences' },
  { code: '051', name: 'Biological and related sciences', category: 'Sciences' },
  { code: '0511', name: 'Biology', category: 'Sciences' },
  { code: '0512', name: 'Biochemistry', category: 'Sciences' },
  { code: '052', name: 'Environment', category: 'Sciences' },
  { code: '0521', name: 'Environmental sciences', category: 'Sciences' },
  { code: '0522', name: 'Natural environments and wildlife', category: 'Sciences' },
  { code: '053', name: 'Physical sciences', category: 'Sciences' },
  { code: '0531', name: 'Chemistry', category: 'Sciences' },
  { code: '0532', name: 'Earth sciences', category: 'Sciences' },
  { code: '0533', name: 'Physics', category: 'Sciences' },
  { code: '054', name: 'Mathematics and statistics', category: 'Sciences' },
  { code: '0541', name: 'Mathematics', category: 'Sciences' },
  { code: '0542', name: 'Statistics', category: 'Sciences' },

  // Information and Communication Technologies (ICTs)
  { code: '06', name: 'Information and Communication Technologies', category: 'Technology' },
  { code: '061', name: 'Information and Communication Technologies (ICTs)', category: 'Technology' },
  { code: '0611', name: 'Computer use', category: 'Technology' },
  { code: '0612', name: 'Database and network design and administration', category: 'Technology' },
  { code: '0613', name: 'Software and applications development and analysis', category: 'Technology' },

  // Engineering, manufacturing and construction
  { code: '07', name: 'Engineering, manufacturing and construction', category: 'Engineering' },
  { code: '071', name: 'Engineering and engineering trades', category: 'Engineering' },
  { code: '0711', name: 'Chemical engineering and processes', category: 'Engineering' },
  { code: '0712', name: 'Environmental protection technology', category: 'Engineering' },
  { code: '0713', name: 'Electricity and energy', category: 'Engineering' },
  { code: '0714', name: 'Electronics and automation', category: 'Engineering' },
  { code: '0715', name: 'Mechanics and metal trades', category: 'Engineering' },
  { code: '0716', name: 'Motor vehicles, ships and aircraft', category: 'Engineering' },
  { code: '072', name: 'Manufacturing and processing', category: 'Engineering' },
  { code: '0721', name: 'Food processing', category: 'Engineering' },
  { code: '0722', name: 'Materials (glass, paper, plastic and wood)', category: 'Engineering' },
  { code: '0723', name: 'Textiles (clothes, footwear and leather)', category: 'Engineering' },
  { code: '0724', name: 'Mining and extraction', category: 'Engineering' },
  { code: '073', name: 'Architecture and construction', category: 'Engineering' },
  { code: '0731', name: 'Architecture and town planning', category: 'Engineering' },
  { code: '0732', name: 'Building and civil engineering', category: 'Engineering' },

  // Agriculture, forestry, fisheries and veterinary
  { code: '08', name: 'Agriculture, forestry, fisheries and veterinary', category: 'Agriculture' },
  { code: '081', name: 'Agriculture', category: 'Agriculture' },
  { code: '0811', name: 'Crop and livestock production', category: 'Agriculture' },
  { code: '0812', name: 'Horticulture', category: 'Agriculture' },
  { code: '082', name: 'Forestry', category: 'Agriculture' },
  { code: '0821', name: 'Forestry', category: 'Agriculture' },
  { code: '083', name: 'Fisheries', category: 'Agriculture' },
  { code: '0831', name: 'Fisheries', category: 'Agriculture' },
  { code: '084', name: 'Veterinary', category: 'Agriculture' },
  { code: '0841', name: 'Veterinary', category: 'Agriculture' },

  // Health and welfare
  { code: '09', name: 'Health and welfare', category: 'Health' },
  { code: '091', name: 'Health', category: 'Health' },
  { code: '0911', name: 'Dental studies', category: 'Health' },
  { code: '0912', name: 'Medicine', category: 'Health' },
  { code: '0913', name: 'Nursing and midwifery', category: 'Health' },
  { code: '0914', name: 'Medical diagnostic and treatment technology', category: 'Health' },
  { code: '0915', name: 'Therapy and rehabilitation', category: 'Health' },
  { code: '0916', name: 'Pharmacy', category: 'Health' },
  { code: '0917', name: 'Traditional and complementary medicine and therapy', category: 'Health' },
  { code: '092', name: 'Welfare', category: 'Health' },
  { code: '0921', name: 'Care of the elderly and of disabled adults', category: 'Health' },
  { code: '0922', name: 'Child care and youth services', category: 'Health' },
  { code: '0923', name: 'Social work and counselling', category: 'Health' },

  // Services
  { code: '10', name: 'Services', category: 'Services' },
  { code: '101', name: 'Personal services', category: 'Services' },
  { code: '1011', name: 'Domestic services', category: 'Services' },
  { code: '1012', name: 'Hair and beauty services', category: 'Services' },
  { code: '1013', name: 'Hotel, restaurants and catering', category: 'Services' },
  { code: '1014', name: 'Sports', category: 'Services' },
  { code: '1015', name: 'Travel, tourism and leisure', category: 'Services' },
  { code: '102', name: 'Hygiene and occupational health services', category: 'Services' },
  { code: '1021', name: 'Community sanitation', category: 'Services' },
  { code: '1022', name: 'Occupational health and safety', category: 'Services' },
  { code: '103', name: 'Security services', category: 'Services' },
  { code: '1031', name: 'Military and defence', category: 'Services' },
  { code: '1032', name: 'Protection of persons and property', category: 'Services' },
  { code: '104', name: 'Transport services', category: 'Services' },
  { code: '1041', name: 'Transport services', category: 'Services' },

  // Bachelor's Degrees (B.Tech, BE, BSc, BA, BBA, etc.)
  { code: 'BTech-CS', name: 'B.Tech Computer Science', category: 'Technology', level: 'Bachelor' },
  { code: 'BTech-IT', name: 'B.Tech Information Technology', category: 'Technology', level: 'Bachelor' },
  { code: 'BTech-ECE', name: 'B.Tech Electronics and Communication', category: 'Engineering', level: 'Bachelor' },
  { code: 'BTech-EEE', name: 'B.Tech Electrical and Electronics', category: 'Engineering', level: 'Bachelor' },
  { code: 'BTech-Mech', name: 'B.Tech Mechanical Engineering', category: 'Engineering', level: 'Bachelor' },
  { code: 'BTech-Civil', name: 'B.Tech Civil Engineering', category: 'Engineering', level: 'Bachelor' },
  { code: 'BTech-Chem', name: 'B.Tech Chemical Engineering', category: 'Engineering', level: 'Bachelor' },
  { code: 'BTech-AI', name: 'B.Tech Artificial Intelligence', category: 'Technology', level: 'Bachelor' },
  { code: 'BTech-DS', name: 'B.Tech Data Science', category: 'Technology', level: 'Bachelor' },
  { code: 'BTech-Cyber', name: 'B.Tech Cybersecurity', category: 'Technology', level: 'Bachelor' },
  { code: 'BE-CS', name: 'BE Computer Science', category: 'Technology', level: 'Bachelor' },
  { code: 'BE-Mech', name: 'BE Mechanical Engineering', category: 'Engineering', level: 'Bachelor' },
  { code: 'BE-Civil', name: 'BE Civil Engineering', category: 'Engineering', level: 'Bachelor' },
  { code: 'BSc-CS', name: 'BSc Computer Science', category: 'Technology', level: 'Bachelor' },
  { code: 'BSc-IT', name: 'BSc Information Technology', category: 'Technology', level: 'Bachelor' },
  { code: 'BSc-Phys', name: 'BSc Physics', category: 'Sciences', level: 'Bachelor' },
  { code: 'BSc-Chem', name: 'BSc Chemistry', category: 'Sciences', level: 'Bachelor' },
  { code: 'BSc-Math', name: 'BSc Mathematics', category: 'Sciences', level: 'Bachelor' },
  { code: 'BSc-Bio', name: 'BSc Biology', category: 'Sciences', level: 'Bachelor' },
  { code: 'BSc-Biotech', name: 'BSc Biotechnology', category: 'Health', level: 'Bachelor' },
  { code: 'BBA', name: 'BBA Business Administration', category: 'Business and Law', level: 'Bachelor' },
  { code: 'BBA-Fin', name: 'BBA Finance', category: 'Business and Law', level: 'Bachelor' },
  { code: 'BBA-Marketing', name: 'BBA Marketing', category: 'Business and Law', level: 'Bachelor' },
  { code: 'BBA-HR', name: 'BBA Human Resources', category: 'Business and Law', level: 'Bachelor' },
  { code: 'BCom', name: 'BCom Commerce', category: 'Business and Law', level: 'Bachelor' },
  { code: 'BCom-Acc', name: 'BCom Accounting', category: 'Business and Law', level: 'Bachelor' },
  { code: 'BA-Eng', name: 'BA English', category: 'Arts and Humanities', level: 'Bachelor' },
  { code: 'BA-Psy', name: 'BA Psychology', category: 'Social Sciences', level: 'Bachelor' },
  { code: 'BA-Eco', name: 'BA Economics', category: 'Social Sciences', level: 'Bachelor' },
  { code: 'BA-Pol', name: 'BA Political Science', category: 'Social Sciences', level: 'Bachelor' },
  { code: 'BA-Hist', name: 'BA History', category: 'Arts and Humanities', level: 'Bachelor' },
  { code: 'LLB', name: 'LLB Law', category: 'Business and Law', level: 'Bachelor' },
  { code: 'BArch', name: 'BArch Architecture', category: 'Engineering', level: 'Bachelor' },
  { code: 'BDes', name: 'BDes Design', category: 'Arts and Humanities', level: 'Bachelor' },
  { code: 'BFA', name: 'BFA Fine Arts', category: 'Arts and Humanities', level: 'Bachelor' },
  { code: 'MBBS', name: 'MBBS Medicine', category: 'Health', level: 'Bachelor' },
  { code: 'BDS', name: 'BDS Dental Surgery', category: 'Health', level: 'Bachelor' },
  { code: 'BPharm', name: 'BPharm Pharmacy', category: 'Health', level: 'Bachelor' },
  { code: 'BPT', name: 'BPT Physiotherapy', category: 'Health', level: 'Bachelor' },
  { code: 'BSc-Nursing', name: 'BSc Nursing', category: 'Health', level: 'Bachelor' },

  // Master's Degrees (M.Tech, ME, MSc, MA, MBA, etc.)
  { code: 'MTech-CS', name: 'M.Tech Computer Science', category: 'Technology', level: 'Master' },
  { code: 'MTech-AI', name: 'M.Tech Artificial Intelligence', category: 'Technology', level: 'Master' },
  { code: 'MTech-DS', name: 'M.Tech Data Science', category: 'Technology', level: 'Master' },
  { code: 'MTech-Cyber', name: 'M.Tech Cybersecurity', category: 'Technology', level: 'Master' },
  { code: 'MTech-VLSI', name: 'M.Tech VLSI Design', category: 'Engineering', level: 'Master' },
  { code: 'MTech-Mech', name: 'M.Tech Mechanical Engineering', category: 'Engineering', level: 'Master' },
  { code: 'ME-CS', name: 'ME Computer Science', category: 'Technology', level: 'Master' },
  { code: 'MSc-CS', name: 'MSc Computer Science', category: 'Technology', level: 'Master' },
  { code: 'MSc-IT', name: 'MSc Information Technology', category: 'Technology', level: 'Master' },
  { code: 'MSc-DS', name: 'MSc Data Science', category: 'Technology', level: 'Master' },
  { code: 'MSc-AI', name: 'MSc Artificial Intelligence', category: 'Technology', level: 'Master' },
  { code: 'MSc-Phys', name: 'MSc Physics', category: 'Sciences', level: 'Master' },
  { code: 'MSc-Chem', name: 'MSc Chemistry', category: 'Sciences', level: 'Master' },
  { code: 'MSc-Math', name: 'MSc Mathematics', category: 'Sciences', level: 'Master' },
  { code: 'MSc-Bio', name: 'MSc Biology', category: 'Sciences', level: 'Master' },
  { code: 'MSc-Biotech', name: 'MSc Biotechnology', category: 'Health', level: 'Master' },
  { code: 'MBA', name: 'MBA Business Administration', category: 'Business and Law', level: 'Master' },
  { code: 'MBA-Fin', name: 'MBA Finance', category: 'Business and Law', level: 'Master' },
  { code: 'MBA-Marketing', name: 'MBA Marketing', category: 'Business and Law', level: 'Master' },
  { code: 'MBA-HR', name: 'MBA Human Resources', category: 'Business and Law', level: 'Master' },
  { code: 'MBA-IT', name: 'MBA Information Technology', category: 'Business and Law', level: 'Master' },
  { code: 'MCA', name: 'MCA Computer Applications', category: 'Technology', level: 'Master' },
  { code: 'MCom', name: 'MCom Commerce', category: 'Business and Law', level: 'Master' },
  { code: 'MA-Eng', name: 'MA English', category: 'Arts and Humanities', level: 'Master' },
  { code: 'MA-Psy', name: 'MA Psychology', category: 'Social Sciences', level: 'Master' },
  { code: 'MA-Eco', name: 'MA Economics', category: 'Social Sciences', level: 'Master' },
  { code: 'MA-Pol', name: 'MA Political Science', category: 'Social Sciences', level: 'Master' },
  { code: 'LLM', name: 'LLM Law', category: 'Business and Law', level: 'Master' },
  { code: 'MArch', name: 'MArch Architecture', category: 'Engineering', level: 'Master' },
  { code: 'MDes', name: 'MDes Design', category: 'Arts and Humanities', level: 'Master' },
  { code: 'MFA', name: 'MFA Fine Arts', category: 'Arts and Humanities', level: 'Master' },
  { code: 'MPH', name: 'MPH Public Health', category: 'Health', level: 'Master' },
  { code: 'MPharm', name: 'MPharm Pharmacy', category: 'Health', level: 'Master' },

  // Doctoral Degrees (PhD)
  { code: 'PhD-CS', name: 'PhD Computer Science', category: 'Technology', level: 'Doctorate' },
  { code: 'PhD-AI', name: 'PhD Artificial Intelligence', category: 'Technology', level: 'Doctorate' },
  { code: 'PhD-ML', name: 'PhD Machine Learning', category: 'Technology', level: 'Doctorate' },
  { code: 'PhD-DS', name: 'PhD Data Science', category: 'Technology', level: 'Doctorate' },
  { code: 'PhD-ECE', name: 'PhD Electronics and Communication', category: 'Engineering', level: 'Doctorate' },
  { code: 'PhD-Mech', name: 'PhD Mechanical Engineering', category: 'Engineering', level: 'Doctorate' },
  { code: 'PhD-Civil', name: 'PhD Civil Engineering', category: 'Engineering', level: 'Doctorate' },
  { code: 'PhD-Phys', name: 'PhD Physics', category: 'Sciences', level: 'Doctorate' },
  { code: 'PhD-Chem', name: 'PhD Chemistry', category: 'Sciences', level: 'Doctorate' },
  { code: 'PhD-Math', name: 'PhD Mathematics', category: 'Sciences', level: 'Doctorate' },
  { code: 'PhD-Bio', name: 'PhD Biology', category: 'Sciences', level: 'Doctorate' },
  { code: 'PhD-Biotech', name: 'PhD Biotechnology', category: 'Health', level: 'Doctorate' },
  { code: 'PhD-Mgmt', name: 'PhD Management', category: 'Business and Law', level: 'Doctorate' },
  { code: 'PhD-Eco', name: 'PhD Economics', category: 'Social Sciences', level: 'Doctorate' },
  { code: 'PhD-Psy', name: 'PhD Psychology', category: 'Social Sciences', level: 'Doctorate' },
  { code: 'PhD-Eng', name: 'PhD English', category: 'Arts and Humanities', level: 'Doctorate' },
  { code: 'PhD-Hist', name: 'PhD History', category: 'Arts and Humanities', level: 'Doctorate' },
  { code: 'PhD-Law', name: 'PhD Law', category: 'Business and Law', level: 'Doctorate' },
  { code: 'PhD-Med', name: 'PhD Medicine', category: 'Health', level: 'Doctorate' },
  { code: 'PhD-PH', name: 'PhD Public Health', category: 'Health', level: 'Doctorate' },

  // Diploma and Certificate Programs
  { code: 'Dip-CS', name: 'Diploma Computer Science', category: 'Technology', level: 'Diploma' },
  { code: 'Dip-IT', name: 'Diploma Information Technology', category: 'Technology', level: 'Diploma' },
  { code: 'Dip-Mech', name: 'Diploma Mechanical Engineering', category: 'Engineering', level: 'Diploma' },
  { code: 'Dip-Civil', name: 'Diploma Civil Engineering', category: 'Engineering', level: 'Diploma' },
  { code: 'Dip-Elec', name: 'Diploma Electrical Engineering', category: 'Engineering', level: 'Diploma' },
  { code: 'PGDip-DM', name: 'PG Diploma Digital Marketing', category: 'Business and Law', level: 'Diploma' },
  { code: 'PGDip-DS', name: 'PG Diploma Data Science', category: 'Technology', level: 'Diploma' },
  { code: 'PGDip-ML', name: 'PG Diploma Machine Learning', category: 'Technology', level: 'Diploma' },

  // Modern Tech Fields
  { code: 'CS01', name: 'Computer Science', category: 'Technology' },
  { code: 'CS02', name: 'Artificial Intelligence', category: 'Technology' },
  { code: 'CS03', name: 'Machine Learning', category: 'Technology' },
  { code: 'CS04', name: 'Data Science', category: 'Technology' },
  { code: 'CS05', name: 'Cybersecurity', category: 'Technology' },
  { code: 'CS06', name: 'Software Engineering', category: 'Technology' },
  { code: 'CS07', name: 'Web Development', category: 'Technology' },
  { code: 'CS08', name: 'Mobile App Development', category: 'Technology' },
  { code: 'CS09', name: 'Cloud Computing', category: 'Technology' },
  { code: 'CS10', name: 'DevOps', category: 'Technology' },
  { code: 'CS11', name: 'Blockchain Technology', category: 'Technology' },
  { code: 'CS12', name: 'Internet of Things', category: 'Technology' },
  { code: 'CS13', name: 'Game Development', category: 'Technology' },
  { code: 'CS14', name: 'UI/UX Design', category: 'Technology' },

  // Business Fields
  { code: 'BUS01', name: 'Digital Marketing', category: 'Business and Law' },
  { code: 'BUS02', name: 'E-commerce', category: 'Business and Law' },
  { code: 'BUS03', name: 'Entrepreneurship', category: 'Business and Law' },
  { code: 'BUS04', name: 'Human Resource Management', category: 'Business and Law' },
  { code: 'BUS05', name: 'Project Management', category: 'Business and Law' },
  { code: 'BUS06', name: 'Supply Chain Management', category: 'Business and Law' },
  { code: 'BUS07', name: 'Financial Management', category: 'Business and Law' },
  { code: 'BUS08', name: 'Investment Banking', category: 'Business and Law' },

  // Engineering Fields
  { code: 'ENG01', name: 'Aerospace Engineering', category: 'Engineering' },
  { code: 'ENG02', name: 'Biomedical Engineering', category: 'Engineering' },
  { code: 'ENG03', name: 'Civil Engineering', category: 'Engineering' },
  { code: 'ENG04', name: 'Electrical Engineering', category: 'Engineering' },
  { code: 'ENG05', name: 'Mechanical Engineering', category: 'Engineering' },
  { code: 'ENG06', name: 'Robotics', category: 'Engineering' },
  { code: 'ENG07', name: 'Automobile Engineering', category: 'Engineering' },
  { code: 'ENG08', name: 'Petroleum Engineering', category: 'Engineering' },

  // Health Fields
  { code: 'MED01', name: 'Public Health', category: 'Health' },
  { code: 'MED02', name: 'Biotechnology', category: 'Health' },
  { code: 'MED03', name: 'Genetics', category: 'Health' },
  { code: 'MED04', name: 'Pharmacology', category: 'Health' },
  { code: 'MED05', name: 'Clinical Research', category: 'Health' },
  { code: 'MED06', name: 'Medical Imaging', category: 'Health' },

  // Arts Fields
  { code: 'ART01', name: 'Graphic Design', category: 'Arts and Humanities' },
  { code: 'ART02', name: 'Animation', category: 'Arts and Humanities' },
  { code: 'ART03', name: 'Film Studies', category: 'Arts and Humanities' },
  { code: 'ART04', name: 'Photography', category: 'Arts and Humanities' },
  { code: 'ART05', name: 'Fashion Design', category: 'Arts and Humanities' },
  { code: 'ART06', name: 'Interior Design', category: 'Arts and Humanities' },

  // Science Fields
  { code: 'SCI01', name: 'Astronomy', category: 'Sciences' },
  { code: 'SCI02', name: 'Environmental Science', category: 'Sciences' },
  { code: 'SCI03', name: 'Forensic Science', category: 'Sciences' },
  { code: 'SCI04', name: 'Marine Biology', category: 'Sciences' },
  { code: 'SCI05', name: 'Microbiology', category: 'Sciences' },
  { code: 'SCI06', name: 'Zoology', category: 'Sciences' },
  { code: 'SCI07', name: 'Botany', category: 'Sciences' },
];

/**
 * Search fields of study by query string
 */
export function searchFieldsOfStudy(query: string, limit: number = 10): FieldOfStudy[] {
  if (!query || query.length < 2) return [];

  const searchTerm = query.toLowerCase().trim();

  // Filter and score results
  const results = fieldsOfStudyData
    .map((field) => {
      const nameLower = field.name.toLowerCase();
      const categoryLower = field.category.toLowerCase();

      let score = 0;

      // Exact match gets highest score
      if (nameLower === searchTerm) {
        score = 1000;
      }
      // Starts with query gets high score
      else if (nameLower.startsWith(searchTerm)) {
        score = 500;
      }
      // Contains query gets medium score
      else if (nameLower.includes(searchTerm)) {
        score = 250;
      }
      // Category match gets lower score
      else if (categoryLower.includes(searchTerm)) {
        score = 100;
      }

      return { field, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      // Sort by score descending
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Then alphabetically by name
      return a.field.name.localeCompare(b.field.name);
    })
    .slice(0, limit)
    .map((result) => result.field);

  return results;
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  const categories = Array.from(new Set(fieldsOfStudyData.map((field) => field.category)));
  return categories.sort();
}

/**
 * Get fields by category
 */
export function getFieldsByCategory(category: string): FieldOfStudy[] {
  return fieldsOfStudyData
    .filter((field) => field.category === category)
    .sort((a, b) => a.name.localeCompare(b.name));
}
