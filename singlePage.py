import os
import fileinput
import sys

entries = os.listdir('../MHWProject/client/my-app/src/component')
f1 = open("oneFile.js", "a")
f2 = open('../MHWProject/client/my-app/src/component/MonsterSelection.js',"r")
f3 = open('../MHWProject/server/app.js',"r")
f1.write("MonsterSelection.js: \n")
for line in f2:
    f1.write(line)
f1.write("\napp.js: \n")
for line in f3:
    f1.write(line)

f3.close()
f2.close()
f1.close()