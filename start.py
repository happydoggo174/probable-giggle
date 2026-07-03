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
                #hint TEXT[]
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
        #await con.execute("create index fav_prob_index on problem_info(uid,problem_id) where reaction='liked'")
        #await con.execute("create index solved_prob_index on problem_info(uid,problem_id) where status='solved'")
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
                          #)''')
        #await con.execute('''create table knowledge_info(
                            #knowledge_id INTEGER,
                            #uid text,
                            #reaction user_reaction,
                            #learned boolean,
                            #primary key(knowledge_id,uid)
                          #)''')
import asyncio
asyncio.run(run())