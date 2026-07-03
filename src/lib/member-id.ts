/** Maps a human Member ID to the synthetic email used for Supabase Auth. */
export function memberIdToEmail(memberId: string) {
  return `${memberId.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}@members.emeraldheights.local`;
}
