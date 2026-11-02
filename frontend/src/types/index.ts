export interface UserProfile {
  id: number;
  user_id: number;
  full_name: string;
  university: string;
  department: string;
  grade: string;
  bio?: string;
  interests?: string;
  avatar_url?: string;
  phone?: string;
  is_public: boolean;
}

export interface User {
  id: number;
  email: string;
  role: 'student' | 'admin';
  is_active: boolean;
  created_at: string;
  profile?: UserProfile;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: string;
  user_id: number;
  full_name: string;
}

export interface Topic {
  id: number;
  course_id: number;
  name: string;
  description?: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  description?: string;
  faculty?: string;
  created_at: string;
  topics?: Topic[];
}

export interface CoursePreference {
  id: number;
  user_id: number;
  course_id: number;
  preference_type: 'teach' | 'learn' | 'both';
  topics_list?: string;
  description?: string;
  mode_preference: 'online' | 'in_person' | 'both';
  course?: Course;
}

export interface StudentAvailability {
  id: number;
  user_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  mode: string;
}

export interface TutorMatchResult {
  user_id: number;
  full_name: string;
  university: string;
  department: string;
  grade: string;
  bio?: string;
  avatar_url?: string;
  topics?: string;
  mode_preference: string;
  availabilities: string[];
  match_score: number;
  match_explanation: string;
}

export interface SupportRequest {
  id: number;
  requester_id: number;
  helper_id?: number;
  course_id: number;
  topic_name: string;
  description?: string;
  preferred_schedule?: string;
  mode: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  created_at: string;
  course?: Course;
  requester_name?: string;
  helper_name?: string;
}

export interface SupportSession {
  id: number;
  request_id: number;
  course_id: number;
  tutor_id: number;
  student_id: number;
  topic_name: string;
  scheduled_at: string;
  duration_minutes: number;
  mode: string;
  meeting_link?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  course?: Course;
  tutor_name?: string;
  student_name?: string;
}

export interface StudyMaterial {
  id: number;
  uploader_id: number;
  course_id: number;
  topic_id?: number;
  title: string;
  description?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  download_count: number;
  is_flagged: boolean;
  sha256_hash?: string;
  scan_status?: 'clean' | 'quarantined' | 'suspicious';
  security_note?: string;
  created_at: string;
  uploader_name?: string;
  course?: Course;
  topic?: Topic;
}

export interface StudyGroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: 'creator' | 'member';
  joined_at: string;
  user_name?: string;
  user_department?: string;
}

export interface StudyGroup {
  id: number;
  creator_id: number;
  course_id: number;
  title: string;
  topic: string;
  description?: string;
  max_members: number;
  mode: string;
  scheduled_at?: string;
  meeting_link?: string;
  location?: string;
  status: 'open' | 'full' | 'completed' | 'cancelled';
  created_at: string;
  current_members_count: number;
  course?: Course;
  creator_name?: string;
  members: StudyGroupMember[];
}

export interface Opportunity {
  id: number;
  source_identifier?: string;
  title: string;
  organization: string;
  summary?: string;
  category: string;
  fields?: string;
  target_audience?: string;
  application_type: 'individual' | 'team' | 'both';
  requirements?: string;
  start_date?: string;
  end_date?: string;
  published_date?: string;
  prize_support?: string;
  official_url: string;
  application_url?: string;
  last_verified_date: string;
  last_checked_at?: string;
  status: 'open' | 'upcoming' | 'closed' | 'pending_verification' | 'active' | 'expired';
  is_sample: boolean;
  created_at: string;
  is_favorited?: boolean;
  tracking_status?: string;
}

export interface OpportunityTracking {
  id: number;
  user_id: number;
  opportunity_id: number;
  status: 'examining' | 'preparing' | 'applied' | 'completed' | 'abandoned';
  notes?: string;
  updated_at: string;
  opportunity?: Opportunity;
}

export interface GuideArticle {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  target_audience?: string;
  content: string;
  checklist_items?: string;
  template_example?: string;
  official_sources?: string;
  read_time_minutes: number;
  updated_at?: string;
  created_at: string;
}

export interface ProjectTeamApplication {
  id: number;
  project_id: number;
  applicant_id: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  applicant_name?: string;
  applicant_department?: string;
}

export interface ProjectIdea {
  id: number;
  creator_id: number;
  title: string;
  description: string;
  category: string;
  required_skills: string;
  status: 'open' | 'closed';
  created_at: string;
  creator_name?: string;
  applications: ProjectTeamApplication[];
}

export interface LearningGoal {
  id: number;
  user_id: number;
  course_id: number;
  topic: string;
  description?: string;
  target_date?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_support_requests: number;
  completed_sessions: number;
  total_materials: number;
  active_opportunities: number;
  pending_reports: number;
}

export type PomodoroMode = 'focus' | 'short_break' | 'long_break';

export interface PomodoroSession {
  id?: number;
  user_id?: number;
  session_type: PomodoroMode;
  planned_duration: number; // in seconds
  actual_duration: number; // in seconds
  started_at: string;
  ended_at: string;
  completed: boolean;
  tag?: string;
  client_id?: string;
  created_at?: string;
}

export interface PomodoroStats {
  today_sessions_count: number;
  today_focus_minutes: number;
  total_completed_pomodoros: number;
  total_focus_minutes: number;
  daily_goal: number;
  today_goal_progress_percent: number;
}

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  dailyGoal: number;
}
