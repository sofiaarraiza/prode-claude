-- ============================================================
-- SEED OFICIAL: Copa del Mundo 2026
-- Fuente: FIFA (sorteo 5 dic 2025)
-- Horarios en UTC. Hora Este EE.UU = UTC-4 en junio/julio
-- Equipos pendientes de repechaje marcados como "Por definir"
-- ============================================================

-- Limpiar datos anteriores
truncate table public.predictions restart identity cascade;
delete from public.matches;

INSERT INTO public.matches (match_number, phase, group_name, home_team, away_team, home_flag, away_flag, match_date, venue, city) VALUES

-- ==================== GRUPO A ====================
-- México, Sudáfrica, Corea del Sur, Europa D (Dinamarca/Macedonia o Rep.Checa/Irlanda)
(1,  'group', 'A', 'México',        'Sudáfrica',     '🇲🇽', '🇿🇦', '2026-06-11 19:00:00+00', 'Estadio Azteca',    'Ciudad de México'),
(2,  'group', 'A', 'Corea del Sur', 'Europa D',       '🇰🇷', '🏳️',  '2026-06-12 02:00:00+00', 'Estadio Akron',     'Guadalajara'),
(3,  'group', 'A', 'Europa D',      'Sudáfrica',      '🏳️',  '🇿🇦', '2026-06-18 17:00:00+00', 'Atlanta Stadium',   'Atlanta'),
(4,  'group', 'A', 'México',        'Corea del Sur',  '🇲🇽', '🇰🇷', '2026-06-19 02:00:00+00', 'Estadio Akron',     'Guadalajara'),
(5,  'group', 'A', 'Europa D',      'México',         '🏳️',  '🇲🇽', '2026-06-25 02:00:00+00', 'Estadio Azteca',    'Ciudad de México'),
(6,  'group', 'A', 'Sudáfrica',     'Corea del Sur',  '🇿🇦', '🇰🇷', '2026-06-25 02:00:00+00', 'Estadio BBVA',      'Monterrey'),

-- ==================== GRUPO B ====================
-- Canadá, Europa A (Italia/Irlanda N. o Gales/Bosnia), Qatar, Suiza
(7,  'group', 'B', 'Canadá',    'Europa A',  '🇨🇦', '🏳️',  '2026-06-12 19:00:00+00', 'BMO Field',          'Toronto'),
(8,  'group', 'B', 'Qatar',     'Suiza',     '🇶🇦', '🇨🇭', '2026-06-13 19:00:00+00', 'Levi''s Stadium',    'San Francisco'),
(9,  'group', 'B', 'Suiza',     'Europa A',  '🇨🇭', '🏳️',  '2026-06-18 19:00:00+00', 'SoFi Stadium',       'Los Ángeles'),
(10, 'group', 'B', 'Canadá',    'Qatar',     '🇨🇦', '🇶🇦', '2026-06-18 23:00:00+00', 'BC Place',           'Vancouver'),
(11, 'group', 'B', 'Suiza',     'Canadá',    '🇨🇭', '🇨🇦', '2026-06-24 19:00:00+00', 'BC Place',           'Vancouver'),
(12, 'group', 'B', 'Europa A',  'Qatar',     '🏳️',  '🇶🇦', '2026-06-24 19:00:00+00', 'Lumen Field',        'Seattle'),

-- ==================== GRUPO C ====================
-- Brasil, Marruecos, Haití, Escocia
(13, 'group', 'C', 'Brasil',    'Marruecos', '🇧🇷', '🇲🇦', '2026-06-13 22:00:00+00', 'MetLife Stadium',    'Nueva York'),
(14, 'group', 'C', 'Haití',     'Escocia',   '🇭🇹', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '2026-06-14 01:00:00+00', 'Gillette Stadium',   'Boston'),
(15, 'group', 'C', 'Escocia',   'Marruecos', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🇲🇦', '2026-06-19 22:00:00+00', 'Gillette Stadium',   'Boston'),
(16, 'group', 'C', 'Brasil',    'Haití',     '🇧🇷', '🇭🇹', '2026-06-20 01:00:00+00', 'Lincoln Financial',  'Filadelfia'),
(17, 'group', 'C', 'Escocia',   'Brasil',    '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🇧🇷', '2026-06-24 22:00:00+00', 'Hard Rock Stadium',  'Miami'),
(18, 'group', 'C', 'Marruecos', 'Haití',     '🇲🇦', '🇭🇹', '2026-06-24 22:00:00+00', 'Mercedes-Benz',      'Atlanta'),

-- ==================== GRUPO D ====================
-- Estados Unidos, Paraguay, Australia, Europa C (Turquía/Rumania o Eslovaquia/Kosovo)
(19, 'group', 'D', 'Estados Unidos', 'Paraguay',  '🇺🇸', '🇵🇾', '2026-06-13 01:00:00+00', 'SoFi Stadium',       'Los Ángeles'),
(20, 'group', 'D', 'Australia',      'Europa C',  '🇦🇺', '🏳️',  '2026-06-14 04:00:00+00', 'BC Place',           'Vancouver'),
(21, 'group', 'D', 'Estados Unidos', 'Australia', '🇺🇸', '🇦🇺', '2026-06-19 19:00:00+00', 'Lumen Field',        'Seattle'),
(22, 'group', 'D', 'Europa C',       'Paraguay',  '🏳️',  '🇵🇾', '2026-06-20 04:00:00+00', 'Levi''s Stadium',    'San Francisco'),
(23, 'group', 'D', 'Europa C',       'Estados Unidos', '🏳️', '🇺🇸', '2026-06-26 02:00:00+00', 'SoFi Stadium',  'Los Ángeles'),
(24, 'group', 'D', 'Paraguay',       'Australia', '🇵🇾', '🇦🇺', '2026-06-26 02:00:00+00', 'Levi''s Stadium',    'San Francisco'),

-- ==================== GRUPO E ====================
-- Alemania, Curazao, Costa de Marfil, Ecuador
(25, 'group', 'E', 'Alemania',        'Curazao',          '🇩🇪', '🇨🇼', '2026-06-14 17:00:00+00', 'NRG Stadium',        'Houston'),
(26, 'group', 'E', 'Costa de Marfil', 'Ecuador',          '🇨🇮', '🇪🇨', '2026-06-14 23:00:00+00', 'Lincoln Financial',  'Filadelfia'),
(27, 'group', 'E', 'Alemania',        'Costa de Marfil',  '🇩🇪', '🇨🇮', '2026-06-20 19:00:00+00', 'BMO Field',          'Toronto'),
(28, 'group', 'E', 'Ecuador',         'Curazao',           '🇪🇨', '🇨🇼', '2026-06-21 00:00:00+00', 'Arrowhead Stadium',  'Kansas City'),
(29, 'group', 'E', 'Ecuador',         'Alemania',          '🇪🇨', '🇩🇪', '2026-06-25 20:00:00+00', 'MetLife Stadium',    'Nueva York'),
(30, 'group', 'E', 'Curazao',         'Costa de Marfil',   '🇨🇼', '🇨🇮', '2026-06-25 20:00:00+00', 'Lincoln Financial',  'Filadelfia'),

-- ==================== GRUPO F ====================
-- Países Bajos, Japón, Europa B (Ucrania/Suecia o Polonia/Albania), Túnez
(31, 'group', 'F', 'Países Bajos', 'Japón',     '🇳🇱', '🇯🇵', '2026-06-14 20:00:00+00', 'AT&T Stadium',       'Dallas'),
(32, 'group', 'F', 'Europa B',     'Túnez',     '🏳️',  '🇹🇳', '2026-06-15 02:00:00+00', 'Estadio BBVA',       'Monterrey'),
(33, 'group', 'F', 'Países Bajos', 'Europa B',  '🇳🇱', '🏳️',  '2026-06-20 17:00:00+00', 'NRG Stadium',        'Houston'),
(34, 'group', 'F', 'Túnez',        'Japón',     '🇹🇳', '🇯🇵', '2026-06-21 04:00:00+00', 'Estadio BBVA',       'Monterrey'),
(35, 'group', 'F', 'Túnez',        'Países Bajos', '🇹🇳', '🇳🇱', '2026-06-25 23:00:00+00', 'Arrowhead Stadium', 'Kansas City'),
(36, 'group', 'F', 'Japón',        'Europa B',  '🇯🇵', '🏳️',  '2026-06-25 23:00:00+00', 'AT&T Stadium',       'Dallas'),

-- ==================== GRUPO G ====================
-- Bélgica, Egipto, Irán, Nueva Zelanda
(37, 'group', 'G', 'Bélgica',      'Egipto',        '🇧🇪', '🇪🇬', '2026-06-15 19:00:00+00', 'Lumen Field',        'Seattle'),
(38, 'group', 'G', 'Irán',         'Nueva Zelanda', '🇮🇷', '🇳🇿', '2026-06-16 01:00:00+00', 'SoFi Stadium',       'Los Ángeles'),
(39, 'group', 'G', 'Bélgica',      'Irán',          '🇧🇪', '🇮🇷', '2026-06-21 19:00:00+00', 'SoFi Stadium',       'Los Ángeles'),
(40, 'group', 'G', 'Nueva Zelanda','Egipto',         '🇳🇿', '🇪🇬', '2026-06-22 01:00:00+00', 'BC Place',           'Vancouver'),
(41, 'group', 'G', 'Nueva Zelanda','Bélgica',        '🇳🇿', '🇧🇪', '2026-06-27 03:00:00+00', 'BC Place',           'Vancouver'),
(42, 'group', 'G', 'Egipto',       'Irán',           '🇪🇬', '🇮🇷', '2026-06-27 03:00:00+00', 'Lumen Field',        'Seattle'),

-- ==================== GRUPO H ====================
-- España, Cabo Verde, Arabia Saudita, Uruguay
(43, 'group', 'H', 'España',        'Cabo Verde',     '🇪🇸', '🇨🇻', '2026-06-15 16:00:00+00', 'Mercedes-Benz',      'Atlanta'),
(44, 'group', 'H', 'Arabia Saudita','Uruguay',        '🇸🇦', '🇺🇾', '2026-06-15 23:00:00+00', 'Hard Rock Stadium',  'Miami'),
(45, 'group', 'H', 'España',        'Arabia Saudita', '🇪🇸', '🇸🇦', '2026-06-21 17:00:00+00', 'Mercedes-Benz',      'Atlanta'),
(46, 'group', 'H', 'Uruguay',       'Cabo Verde',     '🇺🇾', '🇨🇻', '2026-06-21 22:00:00+00', 'Hard Rock Stadium',  'Miami'),
(47, 'group', 'H', 'Uruguay',       'España',         '🇺🇾', '🇪🇸', '2026-06-27 01:00:00+00', 'Estadio Akron',      'Guadalajara'),
(48, 'group', 'H', 'Cabo Verde',    'Arabia Saudita', '🇨🇻', '🇸🇦', '2026-06-27 01:00:00+00', 'NRG Stadium',        'Houston'),

-- ==================== GRUPO I ====================
-- Francia, Senegal, Repechaje 2 (Surinam/Bolivia o Irak), Noruega
(49, 'group', 'I', 'Francia',    'Senegal',     '🇫🇷', '🇸🇳', '2026-06-16 19:00:00+00', 'MetLife Stadium',    'Nueva York'),
(50, 'group', 'I', 'Repechaje 2','Noruega',     '🏳️',  '🇳🇴', '2026-06-16 22:00:00+00', 'Gillette Stadium',   'Boston'),
(51, 'group', 'I', 'Francia',    'Repechaje 2', '🇫🇷', '🏳️',  '2026-06-22 21:00:00+00', 'Lincoln Financial',  'Filadelfia'),
(52, 'group', 'I', 'Noruega',    'Senegal',     '🇳🇴', '🇸🇳', '2026-06-23 00:00:00+00', 'MetLife Stadium',    'Nueva York'),
(53, 'group', 'I', 'Noruega',    'Francia',     '🇳🇴', '🇫🇷', '2026-06-26 19:00:00+00', 'Gillette Stadium',   'Boston'),
(54, 'group', 'I', 'Senegal',    'Repechaje 2', '🇸🇳', '🏳️',  '2026-06-26 19:00:00+00', 'BMO Field',          'Toronto'),

-- ==================== GRUPO J ====================
-- Argentina, Argelia, Austria, Jordania
(55, 'group', 'J', 'Argentina', 'Argelia',   '🇦🇷', '🇩🇿', '2026-06-17 01:00:00+00', 'Arrowhead Stadium',  'Kansas City'),
(56, 'group', 'J', 'Austria',   'Jordania',  '🇦🇹', '🇯🇴', '2026-06-17 04:00:00+00', 'Levi''s Stadium',    'San Francisco'),
(57, 'group', 'J', 'Argentina', 'Austria',   '🇦🇷', '🇦🇹', '2026-06-22 17:00:00+00', 'AT&T Stadium',       'Dallas'),
(58, 'group', 'J', 'Jordania',  'Argelia',   '🇯🇴', '🇩🇿', '2026-06-23 03:00:00+00', 'Levi''s Stadium',    'San Francisco'),
(59, 'group', 'J', 'Jordania',  'Argentina', '🇯🇴', '🇦🇷', '2026-06-28 02:00:00+00', 'AT&T Stadium',       'Dallas'),
(60, 'group', 'J', 'Argelia',   'Austria',   '🇩🇿', '🇦🇹', '2026-06-28 02:00:00+00', 'Arrowhead Stadium',  'Kansas City'),

-- ==================== GRUPO K ====================
-- Portugal, Repechaje 1 (Nueva Caledonia/Jamaica o Rep.D.Congo), Uzbekistán, Colombia
(61, 'group', 'K', 'Portugal',    'Repechaje 1', '🇵🇹', '🏳️',  '2026-06-17 17:00:00+00', 'NRG Stadium',        'Houston'),
(62, 'group', 'K', 'Uzbekistán',  'Colombia',    '🇺🇿', '🇨🇴', '2026-06-18 02:00:00+00', 'Estadio Azteca',     'Ciudad de México'),
(63, 'group', 'K', 'Portugal',    'Uzbekistán',  '🇵🇹', '🇺🇿', '2026-06-23 17:00:00+00', 'NRG Stadium',        'Houston'),
(64, 'group', 'K', 'Colombia',    'Repechaje 1', '🇨🇴', '🏳️',  '2026-06-24 02:00:00+00', 'Estadio Akron',      'Guadalajara'),
(65, 'group', 'K', 'Colombia',    'Portugal',    '🇨🇴', '🇵🇹', '2026-06-28 00:30:00+00', 'Hard Rock Stadium',  'Miami'),
(66, 'group', 'K', 'Repechaje 1', 'Uzbekistán',  '🏳️',  '🇺🇿', '2026-06-28 00:30:00+00', 'Mercedes-Benz',      'Atlanta'),

-- ==================== GRUPO L ====================
-- Inglaterra, Croacia, Ghana, Panamá
(67, 'group', 'L', 'Inglaterra', 'Croacia',   '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇭🇷', '2026-06-17 20:00:00+00', 'AT&T Stadium',       'Dallas'),
(68, 'group', 'L', 'Ghana',      'Panamá',    '🇬🇭', '🇵🇦', '2026-06-17 23:00:00+00', 'BMO Field',          'Toronto'),
(69, 'group', 'L', 'Inglaterra', 'Ghana',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇬🇭', '2026-06-23 21:00:00+00', 'Gillette Stadium',   'Boston'),
(70, 'group', 'L', 'Panamá',     'Croacia',   '🇵🇦', '🇭🇷', '2026-06-24 00:00:00+00', 'BMO Field',          'Toronto'),
(71, 'group', 'L', 'Panamá',     'Inglaterra','🇵🇦', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '2026-06-27 22:00:00+00', 'MetLife Stadium',    'Nueva York'),
(72, 'group', 'L', 'Croacia',    'Ghana',     '🇭🇷', '🇬🇭', '2026-06-27 22:00:00+00', 'Lincoln Financial',  'Filadelfia');
