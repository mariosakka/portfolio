// Shapes of the JSON under src/data/ (live schema, see the design spec "Live field names").
// Fields missing from some items are optional. Sections assign the imported JSON to these types,
// so a misspelled or missing field is a compile error.

export interface SocialLink {
  platform: string
  url: string
}

export interface ContactMethod {
  id: number
  type: string // Email | GitHub | Phone | LinkedIn (a plain string: JSON imports are not literal types)
  value: string
}

export interface About {
  id: string
  photo: string
  fullName: string
  preferredName: string
  role: string
  location: string
  languages: string[]
  skills: string[]
  description: string
  welcomeMessage: string
  repositoryPath: string
  commitMessage: string // stale; the commit badge uses the build-time commit
  codeSample: string // unused; the code panel was removed
  contact: {
    title: string
    subtitle: string
    methods: ContactMethod[]
  }
}

export interface Project {
  id: string
  title: string
  role: string
  teamType: string
  category: string
  shortDescription: string
  description: string
  longDescription: string
  technologies: string[]
  githubUrl: string
  liveUrl: string
  socialMedia: SocialLink[]
  image: string
}

export interface Experience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  isPresent: boolean
  isCurrent?: boolean
  shortDescription: string
  description?: string
  longDescription: string
  technologies: string[]
  websiteUrl: string
  image: string
}

export interface Education {
  id: string
  degree: string
  fieldOfStudy: string
  department: string
  institution: string
  location: string
  startDate: string
  endDate: string
  isPresent: boolean
  gpa: string
  subjects: string[]
  description: string
  shortDescription: string
  longDescription: string
  websiteUrl: string
  socialMedia: SocialLink[]
  image: string
}

export interface Certificate {
  id: string
  title: string
  issuer: string
  credentialId: string
  credentialUrl: string
  skills: string[]
  shortDescription: string
  description?: string
  longDescription: string
  image: string
}

export interface Organization {
  id: string
  name: string
  role: string
  location: string
  startDate: string
  endDate: string
  isPresent: boolean
  description: string
  shortDescription: string
  longDescription: string
  websiteUrl: string
  socialUrl: string
  socialMedia: SocialLink[]
  image: string
}
