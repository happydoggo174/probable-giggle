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
                #output JSONB
            #);
        #''')
        await con.execute("create type problem_status as enum('none','attempted','solved')")
        await con.execute("create type user_reaction as enum('disliked','none','liked')")
        await con.execute('''create table problem_info(
                            uid text,
                            problem_id integer,
                            status problem_status,
                            reaction user_reaction,
                            primary key(problem_id,uid) 
                          )''')
import asyncio
asyncio.run(run())