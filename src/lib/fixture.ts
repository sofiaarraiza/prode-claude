// Fixture oficial Copa del Mundo 2026
// Fuente: FIFA - Sorteo 5 diciembre 2025
// 48 equipos, 12 grupos de 4

export const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

export const GROUP_TEAMS: Record<string, string[]> = {
  A: ["México", "Sudáfrica", "Corea del Sur", "Europa D"],
  B: ["Canadá", "Europa A", "Qatar", "Suiza"],
  C: ["Brasil", "Marruecos", "Haití", "Escocia"],
  D: ["Estados Unidos", "Paraguay", "Australia", "Europa C"],
  E: ["Alemania", "Curazao", "Costa de Marfil", "Ecuador"],
  F: ["Países Bajos", "Japón", "Europa B", "Túnez"],
  G: ["Bélgica", "Egipto", "Irán", "Nueva Zelanda"],
  H: ["España", "Cabo Verde", "Arabia Saudita", "Uruguay"],
  I: ["Francia", "Senegal", "Repechaje 2", "Noruega"],
  J: ["Argentina", "Argelia", "Austria", "Jordania"],
  K: ["Portugal", "Repechaje 1", "Uzbekistán", "Colombia"],
  L: ["Inglaterra", "Croacia", "Ghana", "Panamá"],
}

// Notas sobre equipos pendientes:
// Europa A: Italia/Irlanda del Norte o Gales/Bosnia
// Europa B: Ucrania/Suecia o Polonia/Albania
// Europa C: Turquía/Rumania o Eslovaquia/Kosovo
// Europa D: Dinamarca/Macedonia del Norte o Rep.Checa/Irlanda
// Repechaje 1: Nueva Caledonia/Jamaica o Rep. Dem. Congo
// Repechaje 2: Surinam/Bolivia o Irak

export function isMatchEditable(matchDate: string): boolean {
  const match = new Date(matchDate)
  const now = new Date()
  const sevenDaysBefore = new Date(match.getTime() - 7 * 24 * 60 * 60 * 1000)
  return now < sevenDaysBefore
}
