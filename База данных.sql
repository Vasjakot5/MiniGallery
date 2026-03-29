--
-- PostgreSQL database dump
--

-- Dumped from database version 14.5
-- Dumped by pg_dump version 14.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name) FROM stdin;
2	Города
3	Люди
4	Животные
6	Архитектура
1	Природа
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, password, role) FROM stdin;
2	VasyaCat	37770c47dd3e19157cf70a07bb49abc3170c1b8278d9f8de886db455031e7f4e	user
1	AdminMiniGallery	815aeee84c5eab50cf85c658a5744bc5124980ce6a81f7045eb1460979998f91	admin
4	Remy	fb95c4f2eca12cd263f4e3346f73ad5b509105a30b2f3bd9da77ca2ba56f1b8f	user
\.


--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.images (id, title, description, file_path, category_id, uploaded_by, created_at) FROM stdin;
36	Большой шлёпа!		/uploads/images/2_1774806681716027400.webp	4	2	2026-03-29 20:51:21.722611
37	Пётр I	Последний царь и первый император	/uploads/images/4_1774806815622902300.webp	3	4	2026-03-29 20:53:35.650764
32	Церковь Покрова на Нерли	Белокаменный православный храм во Владимирской области	/uploads/images/2_1774794972154345000.webp	6	2	2026-03-29 17:36:12.165728
35	Закат в Кургане	Люблю смотреть закаты над любимым Курганом!	/uploads/images/4_1774806609051344300.webp	2	4	2026-03-29 20:50:09.066007
38	Берёзовая роща	Далматово	/uploads/images/2_1774806961578472300.jpeg	1	2	2026-03-29 20:56:01.582184
\.


--
-- Name: Category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Category_id_seq"', 7, true);


--
-- Name: Image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Image_id_seq"', 38, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 4, true);


--
-- PostgreSQL database dump complete
--

