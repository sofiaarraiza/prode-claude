-- ============================================================
-- SEED: Insertar todos los partidos de fase de grupos
-- Ejecutar en Supabase SQL Editor DESPUÉS del schema.sql
-- ============================================================

INSERT INTO public.matches (match_number, phase, group_name, home_team, away_team, home_flag, away_flag, match_date, venue, city) VALUES

-- GRUPO A
(1, 'group', 'A', 'México', 'Ecuador', '🇲🇽', '🇪🇨', '2026-06-11 23:00:00+00', 'Estadio Azteca', 'Ciudad de México'),
(2, 'group', 'A', 'Bolivia', 'Panamá', '🇧🇴', '🇵🇦', '2026-06-12 02:00:00+00', 'SoFi Stadium', 'Los Ángeles'),
(3, 'group', 'A', 'México', 'Bolivia', '🇲🇽', '🇧🇴', '2026-06-15 23:00:00+00', 'Estadio Azteca', 'Ciudad de México'),
(4, 'group', 'A', 'Ecuador', 'Panamá', '🇪🇨', '🇵🇦', '2026-06-16 02:00:00+00', 'AT&T Stadium', 'Dallas'),
(5, 'group', 'A', 'Ecuador', 'Bolivia', '🇪🇨', '🇧🇴', '2026-06-19 23:00:00+00', 'Rose Bowl', 'Los Ángeles'),
(6, 'group', 'A', 'Panamá', 'México', '🇵🇦', '🇲🇽', '2026-06-19 23:00:00+00', 'Estadio Azteca', 'Ciudad de México'),

-- GRUPO B
(7, 'group', 'B', 'USA', 'Colombia', '🇺🇸', '🇨🇴', '2026-06-12 23:00:00+00', 'MetLife Stadium', 'Nueva York'),
(8, 'group', 'B', 'Perú', 'Senegal', '🇵🇪', '🇸🇳', '2026-06-13 02:00:00+00', 'Gillette Stadium', 'Boston'),
(9, 'group', 'B', 'USA', 'Perú', '🇺🇸', '🇵🇪', '2026-06-16 23:00:00+00', 'MetLife Stadium', 'Nueva York'),
(10, 'group', 'B', 'Colombia', 'Senegal', '🇨🇴', '🇸🇳', '2026-06-17 02:00:00+00', 'Arrowhead Stadium', 'Kansas City'),
(11, 'group', 'B', 'Colombia', 'Perú', '🇨🇴', '🇵🇪', '2026-06-20 23:00:00+00', 'Hard Rock Stadium', 'Miami'),
(12, 'group', 'B', 'Senegal', 'USA', '🇸🇳', '🇺🇸', '2026-06-20 23:00:00+00', 'Levi''s Stadium', 'San Francisco'),

-- GRUPO C
(13, 'group', 'C', 'Argentina', 'Marruecos', '🇦🇷', '🇲🇦', '2026-06-13 23:00:00+00', 'MetLife Stadium', 'Nueva York'),
(14, 'group', 'C', 'Irak', 'Eslovaquia', '🇮🇶', '🇸🇰', '2026-06-14 02:00:00+00', 'Lincoln Financial Field', 'Filadelfia'),
(15, 'group', 'C', 'Argentina', 'Irak', '🇦🇷', '🇮🇶', '2026-06-17 23:00:00+00', 'Hard Rock Stadium', 'Miami'),
(16, 'group', 'C', 'Marruecos', 'Eslovaquia', '🇲🇦', '🇸🇰', '2026-06-18 02:00:00+00', 'AT&T Stadium', 'Dallas'),
(17, 'group', 'C', 'Marruecos', 'Irak', '🇲🇦', '🇮🇶', '2026-06-21 23:00:00+00', 'Gillette Stadium', 'Boston'),
(18, 'group', 'C', 'Eslovaquia', 'Argentina', '🇸🇰', '🇦🇷', '2026-06-21 23:00:00+00', 'MetLife Stadium', 'Nueva York'),

-- GRUPO D
(19, 'group', 'D', 'Francia', 'Arabia Saudita', '🇫🇷', '🇸🇦', '2026-06-14 23:00:00+00', 'SoFi Stadium', 'Los Ángeles'),
(20, 'group', 'D', 'Nigeria', 'Honduras', '🇳🇬', '🇭🇳', '2026-06-15 02:00:00+00', 'Levi''s Stadium', 'San Francisco'),
(21, 'group', 'D', 'Francia', 'Nigeria', '🇫🇷', '🇳🇬', '2026-06-18 23:00:00+00', 'Rose Bowl', 'Los Ángeles'),
(22, 'group', 'D', 'Arabia Saudita', 'Honduras', '🇸🇦', '🇭🇳', '2026-06-19 02:00:00+00', 'Arrowhead Stadium', 'Kansas City'),
(23, 'group', 'D', 'Arabia Saudita', 'Nigeria', '🇸🇦', '🇳🇬', '2026-06-22 23:00:00+00', 'AT&T Stadium', 'Dallas'),
(24, 'group', 'D', 'Honduras', 'Francia', '🇭🇳', '🇫🇷', '2026-06-22 23:00:00+00', 'Hard Rock Stadium', 'Miami'),

-- GRUPO E
(25, 'group', 'E', 'España', 'Cuba', '🇪🇸', '🇨🇺', '2026-06-11 23:00:00+00', 'AT&T Stadium', 'Dallas'),
(26, 'group', 'E', 'Camerún', 'Serbia', '🇨🇲', '🇷🇸', '2026-06-12 02:00:00+00', 'Lincoln Financial Field', 'Filadelfia'),
(27, 'group', 'E', 'España', 'Camerún', '🇪🇸', '🇨🇲', '2026-06-15 23:00:00+00', 'SoFi Stadium', 'Los Ángeles'),
(28, 'group', 'E', 'Cuba', 'Serbia', '🇨🇺', '🇷🇸', '2026-06-16 02:00:00+00', 'Gillette Stadium', 'Boston'),
(29, 'group', 'E', 'Cuba', 'Camerún', '🇨🇺', '🇨🇲', '2026-06-19 23:00:00+00', 'MetLife Stadium', 'Nueva York'),
(30, 'group', 'E', 'Serbia', 'España', '🇷🇸', '🇪🇸', '2026-06-19 23:00:00+00', 'Hard Rock Stadium', 'Miami'),

-- GRUPO F
(31, 'group', 'F', 'Brasil', 'Japón', '🇧🇷', '🇯🇵', '2026-06-12 23:00:00+00', 'Levi''s Stadium', 'San Francisco'),
(32, 'group', 'F', 'Noruega', 'Australia', '🇳🇴', '🇦🇺', '2026-06-13 02:00:00+00', 'Arrowhead Stadium', 'Kansas City'),
(33, 'group', 'F', 'Brasil', 'Noruega', '🇧🇷', '🇳🇴', '2026-06-16 23:00:00+00', 'SoFi Stadium', 'Los Ángeles'),
(34, 'group', 'F', 'Japón', 'Australia', '🇯🇵', '🇦🇺', '2026-06-17 02:00:00+00', 'Gillette Stadium', 'Boston'),
(35, 'group', 'F', 'Japón', 'Noruega', '🇯🇵', '🇳🇴', '2026-06-20 23:00:00+00', 'Lincoln Financial Field', 'Filadelfia'),
(36, 'group', 'F', 'Australia', 'Brasil', '🇦🇺', '🇧🇷', '2026-06-20 23:00:00+00', 'AT&T Stadium', 'Dallas'),

-- GRUPO G
(37, 'group', 'G', 'Portugal', 'Angola', '🇵🇹', '🇦🇴', '2026-06-13 23:00:00+00', 'Rose Bowl', 'Los Ángeles'),
(38, 'group', 'G', 'Rep. Checa', 'Paraguay', '🇨🇿', '🇵🇾', '2026-06-14 02:00:00+00', 'Levi''s Stadium', 'San Francisco'),
(39, 'group', 'G', 'Portugal', 'Rep. Checa', '🇵🇹', '🇨🇿', '2026-06-17 23:00:00+00', 'MetLife Stadium', 'Nueva York'),
(40, 'group', 'G', 'Angola', 'Paraguay', '🇦🇴', '🇵🇾', '2026-06-18 02:00:00+00', 'Gillette Stadium', 'Boston'),
(41, 'group', 'G', 'Angola', 'Rep. Checa', '🇦🇴', '🇨🇿', '2026-06-21 23:00:00+00', 'Hard Rock Stadium', 'Miami'),
(42, 'group', 'G', 'Paraguay', 'Portugal', '🇵🇾', '🇵🇹', '2026-06-21 23:00:00+00', 'Rose Bowl', 'Los Ángeles'),

-- GRUPO H
(43, 'group', 'H', 'Alemania', 'Indonesia', '🇩🇪', '🇮🇩', '2026-06-14 23:00:00+00', 'Levi''s Stadium', 'San Francisco'),
(44, 'group', 'H', 'Uruguay', 'Hungría', '🇺🇾', '🇭🇺', '2026-06-15 02:00:00+00', 'MetLife Stadium', 'Nueva York'),
(45, 'group', 'H', 'Alemania', 'Uruguay', '🇩🇪', '🇺🇾', '2026-06-18 23:00:00+00', 'AT&T Stadium', 'Dallas'),
(46, 'group', 'H', 'Indonesia', 'Hungría', '🇮🇩', '🇭🇺', '2026-06-19 02:00:00+00', 'Lincoln Financial Field', 'Filadelfia'),
(47, 'group', 'H', 'Indonesia', 'Uruguay', '🇮🇩', '🇺🇾', '2026-06-22 23:00:00+00', 'Rose Bowl', 'Los Ángeles'),
(48, 'group', 'H', 'Hungría', 'Alemania', '🇭🇺', '🇩🇪', '2026-06-22 23:00:00+00', 'Arrowhead Stadium', 'Kansas City'),

-- GRUPO I
(49, 'group', 'I', 'Inglaterra', 'Ghana', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇬🇭', '2026-06-12 23:00:00+00', 'BC Place', 'Vancouver'),
(50, 'group', 'I', 'Túnez', 'Eslovenia', '🇹🇳', '🇸🇮', '2026-06-13 02:00:00+00', 'BMO Field', 'Toronto'),
(51, 'group', 'I', 'Inglaterra', 'Túnez', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇹🇳', '2026-06-16 23:00:00+00', 'BC Place', 'Vancouver'),
(52, 'group', 'I', 'Ghana', 'Eslovenia', '🇬🇭', '🇸🇮', '2026-06-17 02:00:00+00', 'Stade Olympique', 'Montreal'),
(53, 'group', 'I', 'Ghana', 'Túnez', '🇬🇭', '🇹🇳', '2026-06-20 23:00:00+00', 'BMO Field', 'Toronto'),
(54, 'group', 'I', 'Eslovenia', 'Inglaterra', '🇸🇮', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '2026-06-20 23:00:00+00', 'BC Place', 'Vancouver'),

-- GRUPO J
(55, 'group', 'J', 'Países Bajos', 'Corea del Sur', '🇳🇱', '🇰🇷', '2026-06-13 23:00:00+00', 'Estadio Akron', 'Guadalajara'),
(56, 'group', 'J', 'Ucrania', 'Nueva Zelanda', '🇺🇦', '🇳🇿', '2026-06-14 02:00:00+00', 'Estadio BBVA', 'Monterrey'),
(57, 'group', 'J', 'Países Bajos', 'Ucrania', '🇳🇱', '🇺🇦', '2026-06-17 23:00:00+00', 'Estadio Azteca', 'Ciudad de México'),
(58, 'group', 'J', 'Corea del Sur', 'Nueva Zelanda', '🇰🇷', '🇳🇿', '2026-06-18 02:00:00+00', 'Estadio Akron', 'Guadalajara'),
(59, 'group', 'J', 'Corea del Sur', 'Ucrania', '🇰🇷', '🇺🇦', '2026-06-21 23:00:00+00', 'Estadio BBVA', 'Monterrey'),
(60, 'group', 'J', 'Nueva Zelanda', 'Países Bajos', '🇳🇿', '🇳🇱', '2026-06-21 23:00:00+00', 'Estadio Azteca', 'Ciudad de México'),

-- GRUPO K
(61, 'group', 'K', 'Italia', 'Argelia', '🇮🇹', '🇩🇿', '2026-06-14 23:00:00+00', 'Estadio Akron', 'Guadalajara'),
(62, 'group', 'K', 'Croacia', 'Guatemala', '🇭🇷', '🇬🇹', '2026-06-15 02:00:00+00', 'Estadio BBVA', 'Monterrey'),
(63, 'group', 'K', 'Italia', 'Croacia', '🇮🇹', '🇭🇷', '2026-06-18 23:00:00+00', 'Estadio Azteca', 'Ciudad de México'),
(64, 'group', 'K', 'Argelia', 'Guatemala', '🇩🇿', '🇬🇹', '2026-06-19 02:00:00+00', 'Estadio Akron', 'Guadalajara'),
(65, 'group', 'K', 'Argelia', 'Croacia', '🇩🇿', '🇭🇷', '2026-06-22 23:00:00+00', 'Estadio BBVA', 'Monterrey'),
(66, 'group', 'K', 'Guatemala', 'Italia', '🇬🇹', '🇮🇹', '2026-06-22 23:00:00+00', 'Estadio Azteca', 'Ciudad de México'),

-- GRUPO L
(67, 'group', 'L', 'Bélgica', 'Costa Rica', '🇧🇪', '🇨🇷', '2026-06-11 23:00:00+00', 'Stade Olympique', 'Montreal'),
(68, 'group', 'L', 'Suiza', 'Burkina Faso', '🇨🇭', '🇧🇫', '2026-06-12 02:00:00+00', 'BMO Field', 'Toronto'),
(69, 'group', 'L', 'Bélgica', 'Suiza', '🇧🇪', '🇨🇭', '2026-06-15 23:00:00+00', 'BC Place', 'Vancouver'),
(70, 'group', 'L', 'Costa Rica', 'Burkina Faso', '🇨🇷', '🇧🇫', '2026-06-16 02:00:00+00', 'Stade Olympique', 'Montreal'),
(71, 'group', 'L', 'Costa Rica', 'Suiza', '🇨🇷', '🇨🇭', '2026-06-19 23:00:00+00', 'BMO Field', 'Toronto'),
(72, 'group', 'L', 'Burkina Faso', 'Bélgica', '🇧🇫', '🇧🇪', '2026-06-19 23:00:00+00', 'BC Place', 'Vancouver');
