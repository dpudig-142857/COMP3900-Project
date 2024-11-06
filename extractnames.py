import sqlite3

conn = sqlite3.connect("compounds.db")
cursor = conn.cursor()

cursor.execute("SELECT compound_name FROM compounds")
compounds = cursor.fetchall()

with open("compound_names.txt", "w") as file:
    for compound in compounds:
        file.write(compound[0] + "\n")

conn.close()
