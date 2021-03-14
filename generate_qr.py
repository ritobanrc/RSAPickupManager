import qrcode
import csv
from PIL import Image 
from PIL import ImageDraw 
from PIL import ImageFont 


with open('roster.csv') as roster: 
    reader = csv.reader(roster)
    for row in reader:
        if row[0] == "Grade":
            continue
        name = row[2] + " " + row[1]
        img = qrcode.make(name)
        print("Generating QR for ", name, "with size: ", img.size)

        myFont = ImageFont.truetype('font.ttf', size=20) 
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), name, font=myFont)

        filename = 'qr/grade' + row[0] + '/' + row[0] + ' ' + name + '.png'
        print(filename)
        img.save(filename)
