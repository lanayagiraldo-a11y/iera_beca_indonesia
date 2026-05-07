// iERA Team — Dawah Pioneers Indonesia 2026 Program
// Centralizes names and roles for use in forms, notifications, and signatures

export const TEAM = {
  director_continental: {
    name: 'Ibrahim Zahrani',
    title: 'Continental Director',
    email: '', // pending corporate email
    role: 'director'
  },
  coordinador: {
    name: 'Jacob Sully',
    title: 'Coordinator',
    email: '', // pending corporate email
    role: 'coordinator'
  }
}

// Country Managers are loaded dynamically from Supabase once roles module is added.
// In Phase 1, all operate under the Admin user (Liliana).

export const DIRECTOR_NAME = TEAM.director_continental.name
export const COORDINATOR_NAME = TEAM.coordinador.name
