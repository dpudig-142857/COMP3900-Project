import sqlite3
import json

database_path = 'compounds.db'
output_json_path = 'compounds.json'

conn = sqlite3.connect(database_path)
cursor = conn.cursor()

cursor.execute("SELECT compound_name, compound_id FROM compounds")
rows = cursor.fetchall()

compounds_data = [{"compound_name": row[0], "compound_id": row[1]} for row in rows]

with open(output_json_path, 'w') as json_file:
    json.dump(compounds_data, json_file, indent=4)

conn.close()

print(f"Data successfully written to {output_json_path}")