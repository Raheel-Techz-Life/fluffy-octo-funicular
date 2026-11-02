export type AvailabilityStatus =
  | 'available'
  | 'temporarily_unavailable'
  | 'availability_pending'
  | 'contact_unsuccessful'
  | 'not_interested'
  | 'profile_inactive';

export type VerificationLevel =
  | 'verified'
  | 'skill_tested'
  | 'agent_checked'
  | 'pending_check';

export type DurationType = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'project';

export interface ServiceRates {
  hourly?: number;
  daily?: number;
  weekly?: number;
  monthly?: number;
  project?: number;
}

export interface WorkerSkill {
  skillId: string;
  workerId: string;
  occupation: string;
  skillTags: string[];
  experienceYears: number;
  completedJobs: number;
  totalRatings: number;
  averageRating: number; // 0 for unrated/new
  serviceRates: ServiceRates;
  availabilityStatus: AvailabilityStatus;
  verificationLevel: VerificationLevel;
  workDescription: string;
}

export interface WorkerProfile {
  workerId: string;
  fullName: string;
  phoneNumber: string; // masked in public views (e.g. +91 98XXX X4210)
  location: string;
  area: string;
  preferredLanguages: string[];
  experienceYears: number;
  registrationDate: string;
  agentId: string;
  registrationStatus: 'regular' | 'new';
  lastAvailabilityConfirmation: string;
  expectedAvailableAt: string | null;
  unavailabilityReason?: string;
  lastUpdatedAt: string;
  profileCreatedBy: string;
  profileVisibility: 'public' | 'restricted' | 'hidden';
  avatarSeed?: string;
}

export type FeedbackMediaType = 'photo' | 'video';

export interface SkillReview {
  reviewId: string;
  workerId: string;
  skillId: string;
  jobId: string;
  customerName: string;
  customerLocation?: string;
  rating: number; // 1 to 5
  feedback: string;
  createdAt: string;
  jobDuration: string;
  durationUnit: DurationType;
  mediaType: FeedbackMediaType;
  mediaUrl: string;
}

export interface SearchCriteria {
  occupation: string; // 'all' or specific occupation like 'Electrician'
  selectedTags: string[];
  location: string; // 'all' or 'Hubballi', 'Dharwad'
  duration: 'any' | DurationType;
  budgetMin?: number;
  budgetMax?: number;
  availability: 'all' | AvailabilityStatus;
  minRating: number; // 0 for any, 3.5, 4.0, 4.5
  minExperience: number;
  includeNewWorkers: boolean;
  sortBy: 'relevance' | 'rating' | 'experience' | 'price_low_high' | 'jobs';
}

export interface RankingBreakdown {
  tagMatchScore: number;       // max 35
  ratingScore: number;         // max 25
  jobsScore: number;           // max 15
  experienceScore: number;     // max 10
  availabilityScore: number;   // max 10
  locationScore: number;       // max 5
  totalScore: number;          // max 100
  reasons: string[];
  matchedTags: string[];
  isNewWorker: boolean;
  effectiveRate: number | null;
}

export interface WorkerSearchResult {
  worker: WorkerProfile;
  matchingSkill: WorkerSkill;
  allSkills: WorkerSkill[];
  ranking: RankingBreakdown;
  isNewPlacementSlot?: boolean;
}

export interface JobCompletionPayload {
  jobId: string;
  workerId: string;
  skillId: string;
  customerId: string;
  customerName: string;
  agreedStartDate: string;
  agreedEndDate: string;
  jobDuration: string;
  jobDurationUnit: DurationType;
  customerRating: number;
  feedback: string;
  isDisputed?: boolean;
  mediaType: FeedbackMediaType;
  mediaUrl: string;
}

export interface AvailabilityUpdatePayload {
  workerId: string;
  status: AvailabilityStatus;
  reason?: string;
  expectedAvailableAt?: string | null;
  agentId: string;
  skillSpecificSkillId?: string; // If updating only one specific skill availability
}
