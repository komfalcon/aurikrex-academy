/**
 * Comprehensive Courses List for Aurikrex Academy
 * 
 * This list includes:
 * - Primary and Secondary School subjects
 * - Nigerian education system courses
 * - Global university/college courses
 * - Professional certifications
 * - Vocational courses
 * 
 * Total: 400+ courses for a truly comprehensive educational platform
 */

import { MultiSelectOption } from "@/components/ui/multi-select";

export const COURSES: MultiSelectOption[] = [
  // ===================================================================
  // PRIMARY & SECONDARY SCHOOL SUBJECTS (Nigerian & Global)
  // ===================================================================
  
  // Core Primary School Subjects
  { value: "primary-english", label: "English Language", description: "Primary/Secondary" },
  { value: "primary-math", label: "Mathematics", description: "Primary/Secondary" },
  { value: "basic-science", label: "Basic Science", description: "Primary/Secondary" },
  { value: "basic-tech", label: "Basic Technology", description: "Primary/Secondary" },
  { value: "social-studies", label: "Social Studies", description: "Primary/Secondary" },
  { value: "civic-education", label: "Civic Education", description: "Primary/Secondary" },
  { value: "religious-knowledge-crs", label: "Christian Religious Studies", description: "Primary/Secondary" },
  { value: "religious-knowledge-irs", label: "Islamic Religious Studies", description: "Primary/Secondary" },
  { value: "physical-health-edu", label: "Physical and Health Education", description: "Primary/Secondary" },
  { value: "creative-arts", label: "Creative Arts", description: "Primary/Secondary" },
  { value: "vocational-aptitude", label: "Vocational Aptitude", description: "Primary/Secondary" },
  { value: "computer-studies", label: "Computer Studies", description: "Primary/Secondary" },
  { value: "nigerian-languages", label: "Nigerian Languages", description: "Primary/Secondary" },
  { value: "french-language", label: "French Language", description: "Primary/Secondary" },
  { value: "home-economics", label: "Home Economics", description: "Primary/Secondary" },
  { value: "agricultural-science", label: "Agricultural Science", description: "Primary/Secondary" },
  { value: "cultural-creative-arts", label: "Cultural and Creative Arts", description: "Primary/Secondary" },
  
  // Secondary School Sciences
  { value: "physics", label: "Physics", description: "Secondary/Higher" },
  { value: "chemistry", label: "Chemistry", description: "Secondary/Higher" },
  { value: "biology", label: "Biology", description: "Secondary/Higher" },
  { value: "further-math", label: "Further Mathematics", description: "Secondary/Higher" },
  { value: "technical-drawing", label: "Technical Drawing", description: "Secondary" },
  { value: "health-education", label: "Health Education", description: "Secondary" },
  { value: "food-nutrition", label: "Food and Nutrition", description: "Secondary" },
  
  // Secondary School Arts & Humanities
  { value: "literature-english", label: "Literature in English", description: "Secondary/Higher" },
  { value: "history", label: "History", description: "Secondary/Higher" },
  { value: "geography", label: "Geography", description: "Secondary/Higher" },
  { value: "government", label: "Government", description: "Secondary" },
  { value: "economics", label: "Economics", description: "Secondary/Higher" },
  { value: "commerce", label: "Commerce", description: "Secondary" },
  { value: "accounting-sec", label: "Financial Accounting", description: "Secondary" },
  { value: "fine-arts-sec", label: "Fine Arts", description: "Secondary" },
  { value: "music-sec", label: "Music", description: "Secondary" },
  { value: "visual-arts", label: "Visual Arts", description: "Secondary" },
  
  // Secondary School Commercial
  { value: "business-studies", label: "Business Studies", description: "Secondary" },
  { value: "book-keeping", label: "Book Keeping", description: "Secondary" },
  { value: "office-practice", label: "Office Practice", description: "Secondary" },
  { value: "typewriting", label: "Typewriting", description: "Secondary" },
  { value: "shorthand", label: "Shorthand", description: "Secondary" },
  { value: "insurance", label: "Insurance", description: "Secondary" },
  { value: "store-management", label: "Store Management", description: "Secondary" },
  
  // ===================================================================
  // ENGINEERING & TECHNOLOGY
  // ===================================================================
  
  { value: "comp-sci", label: "Computer Science", description: "High demand" },
  { value: "software-eng", label: "Software Engineering", description: "High demand" },
  { value: "data-science", label: "Data Science", description: "High demand" },
  { value: "ai-ml", label: "Artificial Intelligence & ML", description: "Very high demand" },
  { value: "cybersecurity", label: "Cybersecurity", description: "High demand" },
  { value: "info-tech", label: "Information Technology", description: "High demand" },
  { value: "info-systems", label: "Information Systems", description: "Moderate demand" },
  { value: "computer-eng", label: "Computer Engineering", description: "High demand" },
  { value: "elec-eng", label: "Electrical Engineering", description: "Moderate demand" },
  { value: "elec-electronics-eng", label: "Electrical & Electronics Engineering", description: "High demand" },
  { value: "electronics-eng", label: "Electronics Engineering", description: "Moderate demand" },
  { value: "mech-eng", label: "Mechanical Engineering", description: "Moderate demand" },
  { value: "civil-eng", label: "Civil Engineering", description: "Moderate demand" },
  { value: "chem-eng", label: "Chemical Engineering", description: "Moderate demand" },
  { value: "petro-eng", label: "Petroleum Engineering", description: "Specialized" },
  { value: "gas-eng", label: "Gas Engineering", description: "Specialized" },
  { value: "marine-eng", label: "Marine Engineering", description: "Specialized" },
  { value: "aero-eng", label: "Aerospace Engineering", description: "Moderate demand" },
  { value: "biomed-eng", label: "Biomedical Engineering", description: "High demand" },
  { value: "env-eng", label: "Environmental Engineering", description: "Growing demand" },
  { value: "ind-eng", label: "Industrial Engineering", description: "Moderate demand" },
  { value: "production-eng", label: "Production Engineering", description: "Moderate demand" },
  { value: "materials-eng", label: "Materials Engineering", description: "Moderate demand" },
  { value: "metallurgical-eng", label: "Metallurgical Engineering", description: "Specialized" },
  { value: "mining-eng", label: "Mining Engineering", description: "Specialized" },
  { value: "nuclear-eng", label: "Nuclear Engineering", description: "Specialized" },
  { value: "robotics", label: "Robotics Engineering", description: "High demand" },
  { value: "mechatronics", label: "Mechatronics Engineering", description: "High demand" },
  { value: "telecom-eng", label: "Telecommunications Engineering", description: "Moderate demand" },
  { value: "systems-eng", label: "Systems Engineering", description: "High demand" },
  { value: "agric-eng", label: "Agricultural Engineering", description: "Moderate demand" },
  { value: "food-eng", label: "Food Science Engineering", description: "Moderate demand" },
  { value: "polymer-eng", label: "Polymer Engineering", description: "Specialized" },
  { value: "textile-eng", label: "Textile Engineering", description: "Specialized" },
  { value: "structural-eng", label: "Structural Engineering", description: "Moderate demand" },
  { value: "water-resources-eng", label: "Water Resources Engineering", description: "Growing demand" },
  { value: "highway-eng", label: "Highway Engineering", description: "Moderate demand" },
  { value: "geotechnical-eng", label: "Geotechnical Engineering", description: "Specialized" },
  { value: "surveying-geoinformatics", label: "Surveying & Geoinformatics", description: "Moderate demand" },
  { value: "building-tech", label: "Building Technology", description: "Moderate demand" },
  { value: "quantity-surveying", label: "Quantity Surveying", description: "Moderate demand" },
  { value: "estate-management", label: "Estate Management", description: "Moderate demand" },
  { value: "urban-regional-planning", label: "Urban and Regional Planning", description: "Moderate demand" },
  { value: "land-surveying", label: "Land Surveying", description: "Specialized" },
  
  // ===================================================================
  // SCIENCES
  // ===================================================================
  
  { value: "physics-deg", label: "Physics (Degree)", description: "Research focused" },
  { value: "chemistry-deg", label: "Chemistry (Degree)", description: "Research focused" },
  { value: "biology-deg", label: "Biology (Degree)", description: "Moderate demand" },
  { value: "math-deg", label: "Mathematics (Degree)", description: "Research focused" },
  { value: "statistics", label: "Statistics", description: "High demand" },
  { value: "biochemistry", label: "Biochemistry", description: "Research focused" },
  { value: "microbiology", label: "Microbiology", description: "Research focused" },
  { value: "genetics", label: "Genetics", description: "Research focused" },
  { value: "molecular-biology", label: "Molecular Biology", description: "Research focused" },
  { value: "cell-biology", label: "Cell Biology", description: "Research focused" },
  { value: "biotechnology", label: "Biotechnology", description: "High demand" },
  { value: "neuroscience", label: "Neuroscience", description: "Research focused" },
  { value: "astronomy", label: "Astronomy", description: "Research focused" },
  { value: "astrophysics", label: "Astrophysics", description: "Specialized" },
  { value: "geology", label: "Geology", description: "Moderate demand" },
  { value: "geophysics", label: "Geophysics", description: "Specialized" },
  { value: "env-science", label: "Environmental Science", description: "Growing demand" },
  { value: "marine-bio", label: "Marine Biology", description: "Specialized" },
  { value: "ecology", label: "Ecology", description: "Growing demand" },
  { value: "zoology", label: "Zoology", description: "Research focused" },
  { value: "botany", label: "Botany", description: "Research focused" },
  { value: "plant-science", label: "Plant Science", description: "Research focused" },
  { value: "industrial-chemistry", label: "Industrial Chemistry", description: "Moderate demand" },
  { value: "applied-physics", label: "Applied Physics", description: "Moderate demand" },
  { value: "applied-math", label: "Applied Mathematics", description: "High demand" },
  { value: "actuarial-science", label: "Actuarial Science", description: "High demand" },
  { value: "meteorology", label: "Meteorology", description: "Specialized" },
  { value: "oceanography", label: "Oceanography", description: "Specialized" },
  { value: "forensic-science", label: "Forensic Science", description: "Specialized" },
  { value: "bioinformatics", label: "Bioinformatics", description: "High demand" },
  { value: "computational-biology", label: "Computational Biology", description: "High demand" },
  
  // ===================================================================
  // MEDICAL & HEALTH SCIENCES
  // ===================================================================
  
  { value: "medicine", label: "Medicine (MBBS/MD)", description: "Very high demand" },
  { value: "surgery", label: "Surgery", description: "Very high demand" },
  { value: "nursing", label: "Nursing", description: "High demand" },
  { value: "nursing-science", label: "Nursing Science", description: "High demand" },
  { value: "pharmacy", label: "Pharmacy", description: "Moderate demand" },
  { value: "pharmaceutical-science", label: "Pharmaceutical Science", description: "Moderate demand" },
  { value: "dentistry", label: "Dentistry", description: "High demand" },
  { value: "dental-surgery", label: "Dental Surgery", description: "High demand" },
  { value: "veterinary", label: "Veterinary Medicine", description: "Moderate demand" },
  { value: "public-health", label: "Public Health", description: "Growing demand" },
  { value: "physiotherapy", label: "Physiotherapy", description: "Moderate demand" },
  { value: "radiography", label: "Radiography", description: "Moderate demand" },
  { value: "optometry", label: "Optometry", description: "Moderate demand" },
  { value: "medical-lab-science", label: "Medical Laboratory Science", description: "Moderate demand" },
  { value: "anatomy", label: "Anatomy", description: "Research focused" },
  { value: "physiology", label: "Physiology", description: "Research focused" },
  { value: "pharmacology", label: "Pharmacology", description: "Research focused" },
  { value: "pathology", label: "Pathology", description: "Research focused" },
  { value: "medical-imaging", label: "Medical Imaging", description: "Growing demand" },
  { value: "health-info-mgmt", label: "Health Information Management", description: "Growing demand" },
  { value: "medical-rehab", label: "Medical Rehabilitation", description: "Moderate demand" },
  { value: "occupational-therapy", label: "Occupational Therapy", description: "Moderate demand" },
  { value: "speech-therapy", label: "Speech and Language Therapy", description: "Moderate demand" },
  { value: "audiology", label: "Audiology", description: "Specialized" },
  { value: "prosthetics-orthotics", label: "Prosthetics and Orthotics", description: "Specialized" },
  { value: "clinical-psychology", label: "Clinical Psychology", description: "High demand" },
  { value: "nutrition", label: "Nutrition & Dietetics", description: "Growing demand" },
  { value: "human-nutrition", label: "Human Nutrition", description: "Growing demand" },
  { value: "community-health", label: "Community Health", description: "Moderate demand" },
  { value: "environmental-health", label: "Environmental Health", description: "Growing demand" },
  { value: "health-education-deg", label: "Health Education", description: "Moderate demand" },
  { value: "midwifery", label: "Midwifery", description: "High demand" },
  { value: "emergency-medicine", label: "Emergency Medical Services", description: "High demand" },
  { value: "anesthesiology", label: "Anesthesiology", description: "Specialized" },
  { value: "dermatology", label: "Dermatology", description: "Specialized" },
  { value: "cardiology", label: "Cardiology", description: "Specialized" },
  { value: "neurology", label: "Neurology", description: "Specialized" },
  { value: "pediatrics", label: "Pediatrics", description: "High demand" },
  { value: "obstetrics-gynecology", label: "Obstetrics and Gynecology", description: "High demand" },
  { value: "orthopedics", label: "Orthopedics", description: "Specialized" },
  { value: "psychiatry", label: "Psychiatry", description: "High demand" },
  { value: "ophthalmology", label: "Ophthalmology", description: "Specialized" },
  { value: "oncology", label: "Oncology", description: "Specialized" },
  { value: "nephrology", label: "Nephrology", description: "Specialized" },
  { value: "gastroenterology", label: "Gastroenterology", description: "Specialized" },
  
  // ===================================================================
  // BUSINESS & ECONOMICS
  // ===================================================================
  
  { value: "business-admin", label: "Business Administration", description: "High demand" },
  { value: "finance", label: "Finance", description: "High demand" },
  { value: "accounting", label: "Accounting", description: "Moderate demand" },
  { value: "economics-deg", label: "Economics (Degree)", description: "Moderate demand" },
  { value: "marketing", label: "Marketing", description: "Moderate demand" },
  { value: "management", label: "Management", description: "Moderate demand" },
  { value: "int-business", label: "International Business", description: "Moderate demand" },
  { value: "entrepreneurship", label: "Entrepreneurship", description: "Growing demand" },
  { value: "hr", label: "Human Resource Management", description: "Moderate demand" },
  { value: "supply-chain", label: "Supply Chain Management", description: "Growing demand" },
  { value: "operations-mgmt", label: "Operations Management", description: "Moderate demand" },
  { value: "project-mgmt", label: "Project Management", description: "High demand" },
  { value: "risk-management", label: "Risk Management", description: "Growing demand" },
  { value: "banking-finance", label: "Banking and Finance", description: "High demand" },
  { value: "insurance-deg", label: "Insurance (Degree)", description: "Moderate demand" },
  { value: "taxation", label: "Taxation", description: "Moderate demand" },
  { value: "business-economics", label: "Business Economics", description: "Moderate demand" },
  { value: "development-economics", label: "Development Economics", description: "Research focused" },
  { value: "agricultural-economics", label: "Agricultural Economics", description: "Moderate demand" },
  { value: "public-finance", label: "Public Finance", description: "Moderate demand" },
  { value: "corporate-governance", label: "Corporate Governance", description: "Growing demand" },
  { value: "business-analytics", label: "Business Analytics", description: "High demand" },
  { value: "e-commerce", label: "E-Commerce", description: "High demand" },
  { value: "retail-management", label: "Retail Management", description: "Moderate demand" },
  { value: "logistics", label: "Logistics", description: "Moderate demand" },
  { value: "procurement", label: "Procurement Management", description: "Moderate demand" },
  { value: "cooperative-economics", label: "Cooperative Economics", description: "Specialized" },
  
  // ===================================================================
  // LAW & POLITICAL SCIENCE
  // ===================================================================
  
  { value: "law", label: "Law (LLB)", description: "High demand" },
  { value: "civil-law", label: "Civil Law", description: "Specialized" },
  { value: "criminal-law", label: "Criminal Law", description: "Specialized" },
  { value: "corporate-law", label: "Corporate Law", description: "High demand" },
  { value: "constitutional-law", label: "Constitutional Law", description: "Specialized" },
  { value: "international-law", label: "International Law", description: "Specialized" },
  { value: "human-rights-law", label: "Human Rights Law", description: "Specialized" },
  { value: "environmental-law", label: "Environmental Law", description: "Growing demand" },
  { value: "intellectual-property", label: "Intellectual Property Law", description: "High demand" },
  { value: "pol-sci", label: "Political Science", description: "Moderate demand" },
  { value: "int-relations", label: "International Relations", description: "Moderate demand" },
  { value: "public-admin", label: "Public Administration", description: "Moderate demand" },
  { value: "diplomacy", label: "Diplomacy and International Studies", description: "Moderate demand" },
  { value: "peace-conflict", label: "Peace and Conflict Studies", description: "Specialized" },
  { value: "security-studies", label: "Security Studies", description: "Growing demand" },
  { value: "policy-studies", label: "Policy Studies", description: "Moderate demand" },
  { value: "governance", label: "Governance", description: "Moderate demand" },
  { value: "criminology", label: "Criminology", description: "Moderate demand" },
  { value: "criminal-justice", label: "Criminal Justice", description: "Moderate demand" },
  
  // ===================================================================
  // ARTS & HUMANITIES
  // ===================================================================
  
  { value: "english-lit", label: "English Literature", description: "Moderate demand" },
  { value: "english-language", label: "English Language", description: "Moderate demand" },
  { value: "linguistics", label: "Linguistics", description: "Research focused" },
  { value: "history-deg", label: "History (Degree)", description: "Research focused" },
  { value: "philosophy", label: "Philosophy", description: "Research focused" },
  { value: "sociology", label: "Sociology", description: "Moderate demand" },
  { value: "anthropology", label: "Anthropology", description: "Research focused" },
  { value: "archaeology", label: "Archaeology", description: "Specialized" },
  { value: "religious-studies", label: "Religious Studies", description: "Specialized" },
  { value: "theology", label: "Theology", description: "Specialized" },
  { value: "divinity", label: "Divinity", description: "Specialized" },
  { value: "classics", label: "Classics", description: "Specialized" },
  { value: "african-studies", label: "African Studies", description: "Specialized" },
  { value: "cultural-studies", label: "Cultural Studies", description: "Research focused" },
  { value: "gender-studies", label: "Gender Studies", description: "Research focused" },
  { value: "psychology", label: "Psychology", description: "High demand" },
  { value: "educational-psychology", label: "Educational Psychology", description: "Moderate demand" },
  { value: "social-psychology", label: "Social Psychology", description: "Research focused" },
  { value: "french", label: "French Studies", description: "Moderate demand" },
  { value: "german", label: "German Studies", description: "Moderate demand" },
  { value: "spanish", label: "Spanish Studies", description: "Moderate demand" },
  { value: "arabic-studies", label: "Arabic Studies", description: "Moderate demand" },
  { value: "chinese-studies", label: "Chinese Studies", description: "Growing demand" },
  { value: "yoruba-studies", label: "Yoruba Studies", description: "Specialized" },
  { value: "igbo-studies", label: "Igbo Studies", description: "Specialized" },
  { value: "hausa-studies", label: "Hausa Studies", description: "Specialized" },
  { value: "creative-writing", label: "Creative Writing", description: "Moderate demand" },
  { value: "comparative-literature", label: "Comparative Literature", description: "Research focused" },
  { value: "translation-studies", label: "Translation Studies", description: "Moderate demand" },
  { value: "interpretive-studies", label: "Interpretive Studies", description: "Specialized" },
  
  // ===================================================================
  // CREATIVE ARTS & DESIGN
  // ===================================================================
  
  { value: "fine-arts", label: "Fine Arts", description: "Moderate demand" },
  { value: "graphic-design", label: "Graphic Design", description: "High demand" },
  { value: "ux-design", label: "UX/UI Design", description: "Very high demand" },
  { value: "animation", label: "Animation", description: "High demand" },
  { value: "fashion-design", label: "Fashion Design", description: "Moderate demand" },
  { value: "interior-design", label: "Interior Design", description: "Moderate demand" },
  { value: "architecture", label: "Architecture", description: "Moderate demand" },
  { value: "industrial-design", label: "Industrial Design", description: "Moderate demand" },
  { value: "product-design", label: "Product Design", description: "High demand" },
  { value: "film-studies", label: "Film & Media Studies", description: "Moderate demand" },
  { value: "photography", label: "Photography", description: "Moderate demand" },
  { value: "music", label: "Music", description: "Moderate demand" },
  { value: "music-technology", label: "Music Technology", description: "Growing demand" },
  { value: "theatre", label: "Theatre & Drama", description: "Moderate demand" },
  { value: "game-design", label: "Game Design", description: "High demand" },
  { value: "painting", label: "Painting", description: "Specialized" },
  { value: "sculpture", label: "Sculpture", description: "Specialized" },
  { value: "printmaking", label: "Printmaking", description: "Specialized" },
  { value: "ceramics", label: "Ceramics", description: "Specialized" },
  { value: "textile-design", label: "Textile Design", description: "Moderate demand" },
  { value: "jewelry-design", label: "Jewelry Design", description: "Specialized" },
  { value: "visual-communication", label: "Visual Communication", description: "High demand" },
  { value: "motion-graphics", label: "Motion Graphics", description: "High demand" },
  { value: "creative-arts-education", label: "Creative Arts Education", description: "Moderate demand" },
  { value: "art-history", label: "Art History", description: "Research focused" },
  { value: "museum-studies", label: "Museum Studies", description: "Specialized" },
  { value: "curatorial-studies", label: "Curatorial Studies", description: "Specialized" },
  
  // ===================================================================
  // COMMUNICATION & MEDIA
  // ===================================================================
  
  { value: "journalism", label: "Journalism", description: "Moderate demand" },
  { value: "mass-comm", label: "Mass Communication", description: "Moderate demand" },
  { value: "public-relations", label: "Public Relations", description: "Moderate demand" },
  { value: "advertising", label: "Advertising", description: "Moderate demand" },
  { value: "digital-media", label: "Digital Media", description: "High demand" },
  { value: "broadcasting", label: "Broadcasting", description: "Moderate demand" },
  { value: "media-studies", label: "Media Studies", description: "Moderate demand" },
  { value: "communication-studies", label: "Communication Studies", description: "Moderate demand" },
  { value: "strategic-communication", label: "Strategic Communication", description: "Moderate demand" },
  { value: "corporate-communication", label: "Corporate Communication", description: "Moderate demand" },
  { value: "integrated-marketing-comm", label: "Integrated Marketing Communications", description: "High demand" },
  { value: "film-production", label: "Film Production", description: "Moderate demand" },
  { value: "television-production", label: "Television Production", description: "Moderate demand" },
  { value: "radio-production", label: "Radio Production", description: "Moderate demand" },
  { value: "media-management", label: "Media Management", description: "Moderate demand" },
  { value: "digital-journalism", label: "Digital Journalism", description: "Growing demand" },
  { value: "data-journalism", label: "Data Journalism", description: "Growing demand" },
  
  // ===================================================================
  // EDUCATION
  // ===================================================================
  
  { value: "education", label: "Education", description: "Moderate demand" },
  { value: "education-admin", label: "Educational Administration", description: "Moderate demand" },
  { value: "curriculum-instruction", label: "Curriculum and Instruction", description: "Moderate demand" },
  { value: "early-childhood", label: "Early Childhood Education", description: "Moderate demand" },
  { value: "primary-education", label: "Primary Education", description: "Moderate demand" },
  { value: "secondary-education", label: "Secondary Education", description: "Moderate demand" },
  { value: "special-ed", label: "Special Education", description: "High demand" },
  { value: "edu-tech", label: "Educational Technology", description: "Growing demand" },
  { value: "adult-education", label: "Adult Education", description: "Moderate demand" },
  { value: "guidance-counseling", label: "Guidance and Counseling", description: "Moderate demand" },
  { value: "edu-management", label: "Educational Management", description: "Moderate demand" },
  { value: "science-education", label: "Science Education", description: "Moderate demand" },
  { value: "math-education", label: "Mathematics Education", description: "Moderate demand" },
  { value: "english-education", label: "English Education", description: "Moderate demand" },
  { value: "social-studies-education", label: "Social Studies Education", description: "Moderate demand" },
  { value: "physical-education", label: "Physical Education", description: "Moderate demand" },
  { value: "technical-education", label: "Technical Education", description: "Moderate demand" },
  { value: "vocational-education", label: "Vocational Education", description: "Moderate demand" },
  { value: "business-education", label: "Business Education", description: "Moderate demand" },
  { value: "computer-education", label: "Computer Education", description: "High demand" },
  { value: "library-science", label: "Library Science", description: "Moderate demand" },
  { value: "info-science", label: "Information Science", description: "High demand" },
  
  // ===================================================================
  // AGRICULTURE & ENVIRONMENTAL
  // ===================================================================
  
  { value: "agriculture", label: "Agriculture", description: "Moderate demand" },
  { value: "agronomy", label: "Agronomy", description: "Moderate demand" },
  { value: "animal-science", label: "Animal Science", description: "Moderate demand" },
  { value: "crop-science", label: "Crop Science", description: "Moderate demand" },
  { value: "soil-science", label: "Soil Science", description: "Moderate demand" },
  { value: "agric-economics", label: "Agricultural Economics", description: "Moderate demand" },
  { value: "agric-extension", label: "Agricultural Extension", description: "Moderate demand" },
  { value: "agri-business", label: "Agribusiness", description: "Moderate demand" },
  { value: "forestry", label: "Forestry", description: "Moderate demand" },
  { value: "wildlife-management", label: "Wildlife Management", description: "Specialized" },
  { value: "fisheries", label: "Fisheries", description: "Moderate demand" },
  { value: "aquaculture", label: "Aquaculture", description: "Growing demand" },
  { value: "food-science", label: "Food Science", description: "Moderate demand" },
  { value: "food-tech", label: "Food Technology", description: "Moderate demand" },
  { value: "horticulture", label: "Horticulture", description: "Specialized" },
  { value: "landscape-architecture", label: "Landscape Architecture", description: "Moderate demand" },
  { value: "env-management", label: "Environmental Management", description: "Growing demand" },
  { value: "env-biology", label: "Environmental Biology", description: "Growing demand" },
  { value: "sustainable-development", label: "Sustainable Development", description: "Growing demand" },
  { value: "climate-science", label: "Climate Science", description: "Growing demand" },
  { value: "renewable-energy", label: "Renewable Energy", description: "High demand" },
  { value: "natural-resources", label: "Natural Resources Management", description: "Moderate demand" },
  { value: "water-management", label: "Water Resources Management", description: "Growing demand" },
  { value: "waste-management", label: "Waste Management", description: "Growing demand" },
  
  // ===================================================================
  // HOSPITALITY & TOURISM
  // ===================================================================
  
  { value: "hospitality", label: "Hospitality Management", description: "Moderate demand" },
  { value: "hotel-management", label: "Hotel Management", description: "Moderate demand" },
  { value: "tourism", label: "Tourism Management", description: "Moderate demand" },
  { value: "travel-tourism", label: "Travel and Tourism", description: "Moderate demand" },
  { value: "event-management", label: "Event Management", description: "Moderate demand" },
  { value: "culinary-arts", label: "Culinary Arts", description: "Moderate demand" },
  { value: "catering", label: "Catering Management", description: "Moderate demand" },
  { value: "leisure-management", label: "Leisure Management", description: "Moderate demand" },
  { value: "recreation-management", label: "Recreation Management", description: "Moderate demand" },
  
  // ===================================================================
  // SOCIAL SCIENCES & SERVICES
  // ===================================================================
  
  { value: "social-work", label: "Social Work", description: "Moderate demand" },
  { value: "demography", label: "Demography", description: "Specialized" },
  { value: "population-studies", label: "Population Studies", description: "Research focused" },
  { value: "development-studies", label: "Development Studies", description: "Research focused" },
  { value: "urban-studies", label: "Urban Studies", description: "Moderate demand" },
  { value: "regional-planning", label: "Regional Planning", description: "Moderate demand" },
  { value: "human-services", label: "Human Services", description: "Moderate demand" },
  { value: "family-studies", label: "Family Studies", description: "Moderate demand" },
  { value: "gerontology", label: "Gerontology", description: "Growing demand" },
  { value: "child-development", label: "Child Development", description: "Moderate demand" },
  { value: "youth-development", label: "Youth Development", description: "Moderate demand" },
  { value: "community-development", label: "Community Development", description: "Moderate demand" },
  
  // ===================================================================
  // SPORTS & EXERCISE SCIENCE
  // ===================================================================
  
  { value: "sports-science", label: "Sports Science", description: "Growing demand" },
  { value: "exercise-science", label: "Exercise Science", description: "Growing demand" },
  { value: "kinesiology", label: "Kinesiology", description: "Moderate demand" },
  { value: "sports-management", label: "Sports Management", description: "Moderate demand" },
  { value: "sports-medicine", label: "Sports Medicine", description: "Specialized" },
  { value: "athletic-training", label: "Athletic Training", description: "Moderate demand" },
  { value: "coaching", label: "Coaching", description: "Moderate demand" },
  { value: "physical-therapy", label: "Physical Therapy", description: "High demand" },
  
  // ===================================================================
  // TECHNOLOGY & DIGITAL SKILLS
  // ===================================================================
  
  { value: "web-development", label: "Web Development", description: "Very high demand" },
  { value: "mobile-development", label: "Mobile App Development", description: "Very high demand" },
  { value: "cloud-computing", label: "Cloud Computing", description: "Very high demand" },
  { value: "devops", label: "DevOps", description: "Very high demand" },
  { value: "blockchain", label: "Blockchain Technology", description: "High demand" },
  { value: "iot", label: "Internet of Things (IoT)", description: "High demand" },
  { value: "embedded-systems", label: "Embedded Systems", description: "High demand" },
  { value: "network-admin", label: "Network Administration", description: "High demand" },
  { value: "database-admin", label: "Database Administration", description: "High demand" },
  { value: "system-admin", label: "System Administration", description: "High demand" },
  { value: "it-security", label: "IT Security", description: "Very high demand" },
  { value: "digital-forensics", label: "Digital Forensics", description: "High demand" },
  { value: "game-development", label: "Game Development", description: "High demand" },
  { value: "vr-ar", label: "Virtual/Augmented Reality", description: "Growing demand" },
  { value: "3d-modeling-tech", label: "3D Modeling & Visualization", description: "High demand" },
  { value: "cad-cam", label: "CAD/CAM Technology", description: "Moderate demand" },
  { value: "gis", label: "Geographic Information Systems (GIS)", description: "Moderate demand" },
  { value: "quantum-computing", label: "Quantum Computing", description: "Emerging" },
  { value: "big-data", label: "Big Data Analytics", description: "Very high demand" },
  { value: "natural-language-processing", label: "Natural Language Processing", description: "High demand" },
  { value: "computer-vision", label: "Computer Vision", description: "High demand" },
  { value: "deep-learning", label: "Deep Learning", description: "Very high demand" },
  
  // ===================================================================
  // PROFESSIONAL & VOCATIONAL
  // ===================================================================
  
  { value: "secretarial-studies", label: "Secretarial Studies", description: "Moderate demand" },
  { value: "office-management", label: "Office Management", description: "Moderate demand" },
  { value: "paralegal", label: "Paralegal Studies", description: "Moderate demand" },
  { value: "real-estate", label: "Real Estate", description: "Moderate demand" },
  { value: "property-management", label: "Property Management", description: "Moderate demand" },
  { value: "construction-management", label: "Construction Management", description: "Moderate demand" },
  { value: "facility-management", label: "Facility Management", description: "Moderate demand" },
  { value: "aviation-management", label: "Aviation Management", description: "Specialized" },
  { value: "maritime-studies", label: "Maritime Studies", description: "Specialized" },
  { value: "shipping-logistics", label: "Shipping and Logistics", description: "Moderate demand" },
  { value: "port-management", label: "Port Management", description: "Specialized" },
  { value: "fashion-merchandising", label: "Fashion Merchandising", description: "Moderate demand" },
  { value: "beauty-cosmetology", label: "Beauty and Cosmetology", description: "Moderate demand" },
  { value: "baking-pastry", label: "Baking and Pastry Arts", description: "Moderate demand" },
  
  // ===================================================================
  // MILITARY & SECURITY
  // ===================================================================
  
  { value: "military-science", label: "Military Science", description: "Specialized" },
  { value: "defense-studies", label: "Defense Studies", description: "Specialized" },
  { value: "intelligence-studies", label: "Intelligence Studies", description: "Specialized" },
  { value: "security-management", label: "Security Management", description: "Growing demand" },
  { value: "emergency-management", label: "Emergency Management", description: "Growing demand" },
  { value: "disaster-management", label: "Disaster Management", description: "Growing demand" },
  
].sort((a, b) => a.label.localeCompare(b.label));

export default COURSES;
