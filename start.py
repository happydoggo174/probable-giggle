import asyncpg
import os
import json
async def run():
    con:asyncpg.Connection=await asyncpg.connect(user="postgres")
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
        await con.executemany('''insert into problem(title,author_id,
                              author_name,description,difficulty,reaction,parameter,output) values($1,$2,$3,$4,$5,$6,$7,$8)''',
                              [(
                                    "easy problem",
                                    "auth0|6a1d56b73668b52679f86a2f",
                                    "phuc",
                                    "a really long description here",
                                    "easy",
                                    3,
                                    ['x','y']
                                    ,json.dumps([{"x":9,"y":3,"output":12},{"x":4,"y":5,"output":9}])),
                                (
                                    "medium problem",
                                    "auth0|6a1d56b73668b52679f86a2f",
                                    "phuc",
                                    "a really long description here",
                                    "medium",
                                    -13,
                                    ['x','y'],
                                    json.dumps([{"x":9,"y":3,"output":27},{"x":4,"y":5,"output":20}])),
                                (
                                    "hard problem",
                                    "auth0|6a1d56b73668b52679f86a2f",
                                    "phuc",
                                    "a really long description here",
                                    "hard",
                                    26,
                                    ['x','y'],
                                    json.dumps([{"x":9,"y":3,"output":2},{"x":125,"y":5,"output":3}])
                                )])
import asyncio
asyncio.run(run())