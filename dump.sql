--
-- PostgreSQL database dump
--

\restrict GElsBToBtfJKOP1VkIzUzezOcAD1Os6HcXcle7O4EDgoVeevFjhimMl2EkuARIj

-- Dumped from database version 17.9
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: problem_difficulty; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.problem_difficulty AS ENUM (
    'easy',
    'medium',
    'hard'
);


ALTER TYPE public.problem_difficulty OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: problem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.problem (
    id integer NOT NULL,
    title text,
    author_id text,
    author_name text,
    description text,
    difficulty public.problem_difficulty,
    reaction integer DEFAULT 0,
    parameter text[],
    output jsonb
);


ALTER TABLE public.problem OWNER TO postgres;

--
-- Name: problem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.problem_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.problem_id_seq OWNER TO postgres;

--
-- Name: problem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.problem_id_seq OWNED BY public.problem.id;


--
-- Name: problem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.problem ALTER COLUMN id SET DEFAULT nextval('public.problem_id_seq'::regclass);


--
-- Data for Name: problem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.problem (id, title, author_id, author_name, description, difficulty, reaction, parameter, output) FROM stdin;
1	easy problem	auth0|6a1d56b73668b52679f86a2f	phuc	a really long description here	easy	3	{x,y}	[{"x": 9, "y": 3, "output": 12}, {"x": 4, "y": 5, "output": 9}]
2	medium problem	auth0|6a1d56b73668b52679f86a2f	phuc	a really long description here	medium	-13	{x,y}	[{"x": 9, "y": 3, "output": 27}, {"x": 4, "y": 5, "output": 20}]
3	hard problem	auth0|6a1d56b73668b52679f86a2f	phuc	a really long description here	hard	26	{x,y}	[{"x": 9, "y": 3, "output": 2}, {"x": 125, "y": 5, "output": 3}]
\.


--
-- Name: problem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.problem_id_seq', 3, true);


--
-- Name: problem problem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.problem
    ADD CONSTRAINT problem_pkey PRIMARY KEY (id);


--
-- Name: problem problem_title_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.problem
    ADD CONSTRAINT problem_title_key UNIQUE (title);


--
-- PostgreSQL database dump complete
--

\unrestrict GElsBToBtfJKOP1VkIzUzezOcAD1Os6HcXcle7O4EDgoVeevFjhimMl2EkuARIj

