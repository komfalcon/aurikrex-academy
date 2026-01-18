/**
 * Comprehensive Digital Skills Taxonomy for Aurikrex Academy
 * 
 * This list includes:
 * - Software development (all stacks)
 * - Data science & AI
 * - Machine learning
 * - Cybersecurity
 * - Cloud computing
 * - UI/UX design
 * - Product management
 * - Digital marketing
 * - Content creation
 * - Video editing
 * - Game development
 * - DevOps
 * - Blockchain
 * - Technical writing
 * - No-code / low-code tools
 * - Emerging and future-oriented digital skills
 * - Soft skills and professional skills
 * 
 * Total: 200+ skills for a career-grade skills taxonomy
 */

import { MultiSelectOption } from "@/components/ui/multi-select";

export const SKILLS: MultiSelectOption[] = [
  // ===================================================================
  // PROGRAMMING LANGUAGES
  // ===================================================================
  
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "go", label: "Go (Golang)" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "scala", label: "Scala" },
  { value: "r-lang", label: "R" },
  { value: "dart", label: "Dart" },
  { value: "elixir", label: "Elixir" },
  { value: "clojure", label: "Clojure" },
  { value: "haskell", label: "Haskell" },
  { value: "lua", label: "Lua" },
  { value: "perl", label: "Perl" },
  { value: "sql", label: "SQL" },
  { value: "bash-scripting", label: "Bash Scripting" },
  { value: "powershell", label: "PowerShell" },
  { value: "assembly", label: "Assembly" },
  { value: "solidity", label: "Solidity" },
  { value: "matlab", label: "MATLAB" },
  { value: "julia", label: "Julia" },
  { value: "groovy", label: "Groovy" },
  { value: "objective-c", label: "Objective-C" },
  { value: "cobol", label: "COBOL" },
  { value: "fortran", label: "Fortran" },
  
  // ===================================================================
  // WEB DEVELOPMENT
  // ===================================================================
  
  // Frontend
  { value: "html5", label: "HTML5" },
  { value: "css3", label: "CSS3" },
  { value: "react", label: "React.js" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "nextjs", label: "Next.js" },
  { value: "nuxtjs", label: "Nuxt.js" },
  { value: "gatsby", label: "Gatsby" },
  { value: "astro", label: "Astro" },
  { value: "remix", label: "Remix" },
  { value: "solidjs", label: "SolidJS" },
  { value: "qwik", label: "Qwik" },
  { value: "jquery", label: "jQuery" },
  { value: "tailwindcss", label: "Tailwind CSS" },
  { value: "bootstrap", label: "Bootstrap" },
  { value: "sass-scss", label: "Sass/SCSS" },
  { value: "less", label: "Less" },
  { value: "styled-components", label: "Styled Components" },
  { value: "emotion", label: "Emotion" },
  { value: "material-ui", label: "Material UI" },
  { value: "chakra-ui", label: "Chakra UI" },
  { value: "ant-design", label: "Ant Design" },
  { value: "shadcn-ui", label: "shadcn/ui" },
  { value: "radix-ui", label: "Radix UI" },
  { value: "framer-motion", label: "Framer Motion" },
  { value: "gsap", label: "GSAP Animation" },
  { value: "threejs", label: "Three.js" },
  { value: "webgl", label: "WebGL" },
  { value: "webpack", label: "Webpack" },
  { value: "vite", label: "Vite" },
  { value: "rollup", label: "Rollup" },
  { value: "parcel", label: "Parcel" },
  { value: "esbuild", label: "esbuild" },
  
  // Backend
  { value: "nodejs", label: "Node.js" },
  { value: "express", label: "Express.js" },
  { value: "nestjs", label: "NestJS" },
  { value: "fastify", label: "Fastify" },
  { value: "koa", label: "Koa.js" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  { value: "fastapi", label: "FastAPI" },
  { value: "rails", label: "Ruby on Rails" },
  { value: "spring-boot", label: "Spring Boot" },
  { value: "laravel", label: "Laravel" },
  { value: "symfony", label: "Symfony" },
  { value: "dotnet-core", label: ".NET Core" },
  { value: "aspnet", label: "ASP.NET" },
  { value: "gin", label: "Gin (Go)" },
  { value: "fiber", label: "Fiber (Go)" },
  { value: "actix", label: "Actix (Rust)" },
  { value: "phoenix", label: "Phoenix (Elixir)" },
  
  // APIs & Data
  { value: "rest-api", label: "REST API Design" },
  { value: "graphql", label: "GraphQL" },
  { value: "grpc", label: "gRPC" },
  { value: "websockets", label: "WebSockets" },
  { value: "api-gateway", label: "API Gateway" },
  { value: "oauth", label: "OAuth/OAuth2" },
  { value: "jwt", label: "JWT Authentication" },
  { value: "openapi-swagger", label: "OpenAPI/Swagger" },
  
  // ===================================================================
  // MOBILE DEVELOPMENT
  // ===================================================================
  
  { value: "react-native", label: "React Native" },
  { value: "flutter", label: "Flutter" },
  { value: "ios-dev", label: "iOS Development" },
  { value: "android-dev", label: "Android Development" },
  { value: "swiftui", label: "SwiftUI" },
  { value: "jetpack-compose", label: "Jetpack Compose" },
  { value: "ionic", label: "Ionic" },
  { value: "xamarin", label: "Xamarin" },
  { value: "capacitor", label: "Capacitor" },
  { value: "expo", label: "Expo" },
  { value: "pwa", label: "Progressive Web Apps (PWA)" },
  
  // ===================================================================
  // DATABASES
  // ===================================================================
  
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mongodb", label: "MongoDB" },
  { value: "redis", label: "Redis" },
  { value: "elasticsearch", label: "Elasticsearch" },
  { value: "dynamodb", label: "DynamoDB" },
  { value: "firebase", label: "Firebase" },
  { value: "supabase", label: "Supabase" },
  { value: "sqlite", label: "SQLite" },
  { value: "oracle-db", label: "Oracle Database" },
  { value: "sql-server", label: "SQL Server" },
  { value: "cassandra", label: "Cassandra" },
  { value: "couchdb", label: "CouchDB" },
  { value: "neo4j", label: "Neo4j" },
  { value: "influxdb", label: "InfluxDB" },
  { value: "prisma", label: "Prisma ORM" },
  { value: "sequelize", label: "Sequelize" },
  { value: "typeorm", label: "TypeORM" },
  { value: "drizzle", label: "Drizzle ORM" },
  { value: "mongoose", label: "Mongoose" },
  
  // ===================================================================
  // CLOUD & DEVOPS
  // ===================================================================
  
  { value: "aws", label: "Amazon Web Services (AWS)" },
  { value: "gcp", label: "Google Cloud Platform (GCP)" },
  { value: "azure", label: "Microsoft Azure" },
  { value: "digitalocean", label: "DigitalOcean" },
  { value: "heroku", label: "Heroku" },
  { value: "vercel", label: "Vercel" },
  { value: "netlify", label: "Netlify" },
  { value: "cloudflare", label: "Cloudflare" },
  { value: "docker", label: "Docker" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "terraform", label: "Terraform" },
  { value: "ansible", label: "Ansible" },
  { value: "jenkins", label: "Jenkins" },
  { value: "github-actions", label: "GitHub Actions" },
  { value: "gitlab-ci", label: "GitLab CI/CD" },
  { value: "circleci", label: "CircleCI" },
  { value: "travis-ci", label: "Travis CI" },
  { value: "argocd", label: "ArgoCD" },
  { value: "helm", label: "Helm" },
  { value: "prometheus", label: "Prometheus" },
  { value: "grafana", label: "Grafana" },
  { value: "datadog", label: "Datadog" },
  { value: "elk-stack", label: "ELK Stack" },
  { value: "nginx", label: "Nginx" },
  { value: "apache", label: "Apache" },
  { value: "serverless", label: "Serverless Architecture" },
  { value: "aws-lambda", label: "AWS Lambda" },
  { value: "microservices", label: "Microservices Architecture" },
  { value: "service-mesh", label: "Service Mesh (Istio)" },
  { value: "linux-admin", label: "Linux Administration" },
  { value: "shell-scripting", label: "Shell Scripting" },
  
  // ===================================================================
  // DATA SCIENCE & ANALYTICS
  // ===================================================================
  
  { value: "data-analysis", label: "Data Analysis" },
  { value: "data-visualization", label: "Data Visualization" },
  { value: "pandas", label: "Pandas" },
  { value: "numpy", label: "NumPy" },
  { value: "scipy", label: "SciPy" },
  { value: "matplotlib", label: "Matplotlib" },
  { value: "seaborn", label: "Seaborn" },
  { value: "plotly", label: "Plotly" },
  { value: "tableau", label: "Tableau" },
  { value: "power-bi", label: "Power BI" },
  { value: "looker", label: "Looker" },
  { value: "apache-spark", label: "Apache Spark" },
  { value: "hadoop", label: "Hadoop" },
  { value: "apache-kafka", label: "Apache Kafka" },
  { value: "airflow", label: "Apache Airflow" },
  { value: "dbt", label: "dbt (data build tool)" },
  { value: "snowflake", label: "Snowflake" },
  { value: "bigquery", label: "BigQuery" },
  { value: "redshift", label: "Amazon Redshift" },
  { value: "etl", label: "ETL Pipelines" },
  { value: "data-warehousing", label: "Data Warehousing" },
  { value: "data-modeling", label: "Data Modeling" },
  { value: "statistical-analysis", label: "Statistical Analysis" },
  { value: "ab-testing", label: "A/B Testing" },
  { value: "excel-advanced", label: "Advanced Excel" },
  { value: "google-analytics", label: "Google Analytics" },
  { value: "mixpanel", label: "Mixpanel" },
  { value: "amplitude", label: "Amplitude" },
  
  // ===================================================================
  // ARTIFICIAL INTELLIGENCE & MACHINE LEARNING
  // ===================================================================
  
  { value: "machine-learning", label: "Machine Learning" },
  { value: "deep-learning", label: "Deep Learning" },
  { value: "neural-networks", label: "Neural Networks" },
  { value: "tensorflow", label: "TensorFlow" },
  { value: "pytorch", label: "PyTorch" },
  { value: "keras", label: "Keras" },
  { value: "scikit-learn", label: "Scikit-learn" },
  { value: "computer-vision", label: "Computer Vision" },
  { value: "opencv", label: "OpenCV" },
  { value: "nlp", label: "Natural Language Processing" },
  { value: "transformers", label: "Hugging Face Transformers" },
  { value: "langchain", label: "LangChain" },
  { value: "llm-prompt-eng", label: "LLM Prompt Engineering" },
  { value: "gpt-api", label: "GPT API Integration" },
  { value: "openai-api", label: "OpenAI API" },
  { value: "generative-ai", label: "Generative AI" },
  { value: "stable-diffusion", label: "Stable Diffusion" },
  { value: "midjourney", label: "Midjourney" },
  { value: "rag", label: "Retrieval-Augmented Generation (RAG)" },
  { value: "mlops", label: "MLOps" },
  { value: "feature-engineering", label: "Feature Engineering" },
  { value: "model-deployment", label: "Model Deployment" },
  { value: "reinforcement-learning", label: "Reinforcement Learning" },
  { value: "recommender-systems", label: "Recommender Systems" },
  { value: "time-series-analysis", label: "Time Series Analysis" },
  { value: "anomaly-detection", label: "Anomaly Detection" },
  
  // ===================================================================
  // CYBERSECURITY
  // ===================================================================
  
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "network-security", label: "Network Security" },
  { value: "penetration-testing", label: "Penetration Testing" },
  { value: "ethical-hacking", label: "Ethical Hacking" },
  { value: "vulnerability-assessment", label: "Vulnerability Assessment" },
  { value: "incident-response", label: "Incident Response" },
  { value: "siem", label: "SIEM Tools" },
  { value: "security-operations", label: "Security Operations (SOC)" },
  { value: "cryptography", label: "Cryptography" },
  { value: "web-security", label: "Web Application Security" },
  { value: "cloud-security", label: "Cloud Security" },
  { value: "devsecops", label: "DevSecOps" },
  { value: "identity-management", label: "Identity & Access Management" },
  { value: "compliance", label: "Security Compliance (GDPR, SOC2)" },
  { value: "forensics", label: "Digital Forensics" },
  { value: "malware-analysis", label: "Malware Analysis" },
  { value: "threat-modeling", label: "Threat Modeling" },
  { value: "security-auditing", label: "Security Auditing" },
  
  // ===================================================================
  // UI/UX DESIGN
  // ===================================================================
  
  { value: "ui-design", label: "UI Design" },
  { value: "ux-design", label: "UX Design" },
  { value: "user-research", label: "User Research" },
  { value: "wireframing", label: "Wireframing" },
  { value: "prototyping", label: "Prototyping" },
  { value: "figma", label: "Figma" },
  { value: "sketch", label: "Sketch" },
  { value: "adobe-xd", label: "Adobe XD" },
  { value: "invision", label: "InVision" },
  { value: "framer", label: "Framer" },
  { value: "principle", label: "Principle" },
  { value: "zeplin", label: "Zeplin" },
  { value: "design-systems", label: "Design Systems" },
  { value: "responsive-design", label: "Responsive Design" },
  { value: "accessibility-design", label: "Accessibility (a11y)" },
  { value: "information-architecture", label: "Information Architecture" },
  { value: "interaction-design", label: "Interaction Design" },
  { value: "usability-testing", label: "Usability Testing" },
  { value: "design-thinking", label: "Design Thinking" },
  { value: "typography", label: "Typography" },
  { value: "color-theory", label: "Color Theory" },
  { value: "iconography", label: "Iconography" },
  
  // ===================================================================
  // GRAPHIC DESIGN & CREATIVE
  // ===================================================================
  
  { value: "graphic-design", label: "Graphic Design" },
  { value: "adobe-photoshop", label: "Adobe Photoshop" },
  { value: "adobe-illustrator", label: "Adobe Illustrator" },
  { value: "adobe-indesign", label: "Adobe InDesign" },
  { value: "adobe-after-effects", label: "Adobe After Effects" },
  { value: "adobe-premiere", label: "Adobe Premiere Pro" },
  { value: "final-cut", label: "Final Cut Pro" },
  { value: "davinci-resolve", label: "DaVinci Resolve" },
  { value: "blender", label: "Blender" },
  { value: "cinema4d", label: "Cinema 4D" },
  { value: "maya", label: "Maya" },
  { value: "3ds-max", label: "3ds Max" },
  { value: "zbrush", label: "ZBrush" },
  { value: "substance-painter", label: "Substance Painter" },
  { value: "motion-graphics", label: "Motion Graphics" },
  { value: "video-editing", label: "Video Editing" },
  { value: "video-production", label: "Video Production" },
  { value: "animation", label: "Animation" },
  { value: "2d-animation", label: "2D Animation" },
  { value: "3d-animation", label: "3D Animation" },
  { value: "visual-effects", label: "Visual Effects (VFX)" },
  { value: "color-grading", label: "Color Grading" },
  { value: "sound-design", label: "Sound Design" },
  { value: "audio-editing", label: "Audio Editing" },
  { value: "podcast-production", label: "Podcast Production" },
  { value: "photography", label: "Photography" },
  { value: "photo-editing", label: "Photo Editing" },
  { value: "lightroom", label: "Adobe Lightroom" },
  { value: "canva", label: "Canva" },
  
  // ===================================================================
  // GAME DEVELOPMENT
  // ===================================================================
  
  { value: "game-development", label: "Game Development" },
  { value: "unity", label: "Unity" },
  { value: "unreal-engine", label: "Unreal Engine" },
  { value: "godot", label: "Godot" },
  { value: "game-design", label: "Game Design" },
  { value: "level-design", label: "Level Design" },
  { value: "game-physics", label: "Game Physics" },
  { value: "game-ai", label: "Game AI" },
  { value: "multiplayer-networking", label: "Multiplayer Networking" },
  { value: "ar-development", label: "AR Development" },
  { value: "vr-development", label: "VR Development" },
  { value: "xr-development", label: "XR/Mixed Reality Development" },
  
  // ===================================================================
  // BLOCKCHAIN & WEB3
  // ===================================================================
  
  { value: "blockchain", label: "Blockchain" },
  { value: "smart-contracts", label: "Smart Contracts" },
  { value: "ethereum", label: "Ethereum" },
  { value: "web3-development", label: "Web3 Development" },
  { value: "defi", label: "DeFi (Decentralized Finance)" },
  { value: "nft-development", label: "NFT Development" },
  { value: "crypto-trading", label: "Cryptocurrency Trading" },
  { value: "hardhat", label: "Hardhat" },
  { value: "truffle", label: "Truffle" },
  { value: "ethersjs", label: "ethers.js" },
  { value: "web3js", label: "web3.js" },
  { value: "ipfs", label: "IPFS" },
  { value: "polygon", label: "Polygon" },
  { value: "solana", label: "Solana Development" },
  
  // ===================================================================
  // DIGITAL MARKETING
  // ===================================================================
  
  { value: "digital-marketing", label: "Digital Marketing" },
  { value: "seo", label: "SEO" },
  { value: "sem", label: "SEM/PPC" },
  { value: "google-ads", label: "Google Ads" },
  { value: "facebook-ads", label: "Meta/Facebook Ads" },
  { value: "social-media-marketing", label: "Social Media Marketing" },
  { value: "content-marketing", label: "Content Marketing" },
  { value: "email-marketing", label: "Email Marketing" },
  { value: "marketing-automation", label: "Marketing Automation" },
  { value: "hubspot", label: "HubSpot" },
  { value: "salesforce", label: "Salesforce" },
  { value: "mailchimp", label: "Mailchimp" },
  { value: "klaviyo", label: "Klaviyo" },
  { value: "affiliate-marketing", label: "Affiliate Marketing" },
  { value: "influencer-marketing", label: "Influencer Marketing" },
  { value: "conversion-optimization", label: "Conversion Rate Optimization" },
  { value: "growth-hacking", label: "Growth Hacking" },
  { value: "brand-strategy", label: "Brand Strategy" },
  { value: "copywriting", label: "Copywriting" },
  { value: "content-writing", label: "Content Writing" },
  
  // ===================================================================
  // PRODUCT MANAGEMENT
  // ===================================================================
  
  { value: "product-management", label: "Product Management" },
  { value: "product-strategy", label: "Product Strategy" },
  { value: "product-roadmapping", label: "Product Roadmapping" },
  { value: "user-stories", label: "User Stories" },
  { value: "agile", label: "Agile Methodology" },
  { value: "scrum", label: "Scrum" },
  { value: "kanban", label: "Kanban" },
  { value: "jira", label: "Jira" },
  { value: "asana", label: "Asana" },
  { value: "notion", label: "Notion" },
  { value: "trello", label: "Trello" },
  { value: "monday", label: "Monday.com" },
  { value: "product-analytics", label: "Product Analytics" },
  { value: "okrs", label: "OKRs" },
  { value: "stakeholder-management", label: "Stakeholder Management" },
  { value: "prioritization-frameworks", label: "Prioritization Frameworks" },
  
  // ===================================================================
  // NO-CODE / LOW-CODE
  // ===================================================================
  
  { value: "no-code", label: "No-Code Development" },
  { value: "low-code", label: "Low-Code Development" },
  { value: "webflow", label: "Webflow" },
  { value: "bubble", label: "Bubble" },
  { value: "airtable", label: "Airtable" },
  { value: "zapier", label: "Zapier" },
  { value: "make-integromat", label: "Make (Integromat)" },
  { value: "retool", label: "Retool" },
  { value: "appsmith", label: "Appsmith" },
  { value: "wordpress", label: "WordPress" },
  { value: "wix", label: "Wix" },
  { value: "squarespace", label: "Squarespace" },
  { value: "shopify", label: "Shopify" },
  { value: "framer-sites", label: "Framer Sites" },
  { value: "glide", label: "Glide Apps" },
  { value: "adalo", label: "Adalo" },
  { value: "memberstack", label: "Memberstack" },
  
  // ===================================================================
  // TECHNICAL WRITING & DOCUMENTATION
  // ===================================================================
  
  { value: "technical-writing", label: "Technical Writing" },
  { value: "api-documentation", label: "API Documentation" },
  { value: "user-documentation", label: "User Documentation" },
  { value: "developer-relations", label: "Developer Relations (DevRel)" },
  { value: "markdown", label: "Markdown" },
  { value: "mdx", label: "MDX" },
  { value: "docusaurus", label: "Docusaurus" },
  { value: "gitbook", label: "GitBook" },
  { value: "confluence", label: "Confluence" },
  
  // ===================================================================
  // VERSION CONTROL & COLLABORATION
  // ===================================================================
  
  { value: "git", label: "Git" },
  { value: "github", label: "GitHub" },
  { value: "gitlab", label: "GitLab" },
  { value: "bitbucket", label: "Bitbucket" },
  { value: "code-review", label: "Code Review" },
  { value: "pair-programming", label: "Pair Programming" },
  { value: "open-source", label: "Open Source Contribution" },
  
  // ===================================================================
  // TESTING & QA
  // ===================================================================
  
  { value: "testing", label: "Software Testing" },
  { value: "unit-testing", label: "Unit Testing" },
  { value: "integration-testing", label: "Integration Testing" },
  { value: "e2e-testing", label: "End-to-End Testing" },
  { value: "jest", label: "Jest" },
  { value: "cypress", label: "Cypress" },
  { value: "playwright", label: "Playwright" },
  { value: "selenium", label: "Selenium" },
  { value: "test-automation", label: "Test Automation" },
  { value: "performance-testing", label: "Performance Testing" },
  { value: "load-testing", label: "Load Testing" },
  { value: "tdd", label: "Test-Driven Development (TDD)" },
  { value: "bdd", label: "Behavior-Driven Development (BDD)" },
  { value: "qa-manual", label: "Manual QA Testing" },
  
  // ===================================================================
  // SOFT SKILLS & PROFESSIONAL SKILLS
  // ===================================================================
  
  { value: "communication", label: "Communication" },
  { value: "leadership", label: "Leadership" },
  { value: "teamwork", label: "Teamwork" },
  { value: "problem-solving", label: "Problem Solving" },
  { value: "critical-thinking", label: "Critical Thinking" },
  { value: "time-management", label: "Time Management" },
  { value: "project-management", label: "Project Management" },
  { value: "presentation", label: "Presentation Skills" },
  { value: "negotiation", label: "Negotiation" },
  { value: "research-skills", label: "Research Skills" },
  { value: "public-speaking", label: "Public Speaking" },
  { value: "mentoring", label: "Mentoring" },
  { value: "adaptability", label: "Adaptability" },
  { value: "emotional-intel", label: "Emotional Intelligence" },
  { value: "conflict-resolution", label: "Conflict Resolution" },
  { value: "decision-making", label: "Decision Making" },
  { value: "strategic-thinking", label: "Strategic Thinking" },
  { value: "creativity", label: "Creativity" },
  { value: "attention-to-detail", label: "Attention to Detail" },
  { value: "analytical-skills", label: "Analytical Skills" },
  { value: "remote-work", label: "Remote Work" },
  { value: "cross-functional-collab", label: "Cross-Functional Collaboration" },
  
  // ===================================================================
  // EMERGING TECHNOLOGIES
  // ===================================================================
  
  { value: "quantum-computing", label: "Quantum Computing" },
  { value: "edge-computing", label: "Edge Computing" },
  { value: "5g-technology", label: "5G Technology" },
  { value: "iot", label: "Internet of Things (IoT)" },
  { value: "embedded-systems", label: "Embedded Systems" },
  { value: "robotics", label: "Robotics" },
  { value: "autonomous-vehicles", label: "Autonomous Vehicles" },
  { value: "drones", label: "Drone Technology" },
  { value: "biotechnology", label: "Biotechnology" },
  { value: "nanotechnology", label: "Nanotechnology" },
  { value: "digital-twins", label: "Digital Twins" },
  
].sort((a, b) => a.label.localeCompare(b.label));

export default SKILLS;
