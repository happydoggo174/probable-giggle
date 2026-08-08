from fastapi import FastAPI,staticfiles
import os
app=FastAPI()
public=[]
with open("fs_public.txt") as fp:
    public=fp.read().split('\n')
for dir in public:
    app.mount("/"+dir,staticfiles.StaticFiles(directory=dir))