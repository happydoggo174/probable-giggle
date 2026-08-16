import asyncpg
import os
import json
async def run():
    con:asyncpg.Connection=await asyncpg.connect(user="postgres",password="postgres")
    async with con.transaction():
        #await con.execute("create type problem_difficulty as enum('easy','medium','hard')")
        #await con.execute('''
            #create table problem(
                #id serial primary key,
                #title text unique,
                #author_id text,
                #author_name text,
                #description text,
                #difficulty problem_difficulty,
                #reaction integer default 0,
                #parameter text[],
                #output JSONB,
                #comment_count INTEGER DEFAULT 0,
                #display_name TEXT[][],
                #hint TEXT[],
                #plain_desc boolean default false,
                #related_problem JSONB default '{}',
                #likes INTEGER DEFAULT 0,
                #dislikes INTEGER DEFAULT 0
            #);
        #''')
        #await con.execute("create type problem_status as enum('none','attempted','solved')")
        #await con.execute("create type user_reaction as enum('disliked','none','liked')")
        #await con.execute('''create table problem_info(
                            #uid text,
                            #problem_id integer,
                            #status problem_status,
                            #reaction user_reaction,
                            #primary key(problem_id,uid) 
                          #)''')
        #await con.execute('''create table account(
                            #uid TEXT primary key,
                            #username TEXT,
                            #profile TEXT
                          #)''')
        #await con.execute('''create table comment(
                            #problem_id INTEGER,
                            #user_id TEXT,
                            #content TEXT,
                            #primary key(problem_id,user_id)
                          #)''')
        #await con.execute('''create index prob_search on problem_info(uid,problem_id) ''')
        #await con.execute('''create table knowledge(
                            #id serial primary key,
                            #title text,
                            #content text,  
                            #author_id text,
                            #author_name text,
                            #category text[],
                            #likes integer default 0,
                            #dislikes integer default 0
                            #difficulty problem_difficulty
                            #plain_content boolean default false;
                          #)''')
        #await con.execute('''create table knowledge_info(
                            #knowledge_id INTEGER,
                            #uid text,
                            #reaction user_reaction,
                            #learned boolean,
                            #primary key(knowledge_id,uid)
                          #)''')
        #await con.execute('''create table solution(
                            #solution_id SERIAL,
                            #problem_id INTEGER REFERENCES problem(id),
                            #author_id TEXT NOT NULL REFERENCES account(uid),
                            #title TEXT,
                            #content TEXT NOT NULL,
                            #is_plain BOOLEAN
                          #)''')
        #await con.execute("create index solution_get_idx on solution(solution_id)")
        #await con.execute("create index solution_ls_idx on solution(problem_id)")
import asyncio
asyncio.run(run())