import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ===================== TYPES =====================

export type Profile = {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  created_at: string
}

export type Group = {
  id: string
  name: string
  description: string | null
  invite_code: string
  admin_id: string
  created_at: string
}

export type GroupMember = {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  profiles?: Profile
}

export type Match = {
  id: string
  match_number: number
  phase: string
  group_name: string | null
  home_team: string
  away_team: string
  home_flag: string | null
  away_flag: string | null
  match_date: string
  venue: string | null
  city: string | null
  home_score: number | null
  away_score: number | null
  status: 'scheduled' | 'live' | 'finished'
  created_at: string
}

export type Prediction = {
  id: string
  user_id: string
  match_id: string
  group_id: string
  predicted_home_score: number
  predicted_away_score: number
  points: number
  created_at: string
  updated_at: string
  matches?: Match
  profiles?: Profile
}

export type LeaderboardEntry = {
  group_id: string
  user_id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  total_points: number
  exact_results: number
  partial_results: number
  wrong_results: number
  total_predictions: number
}
