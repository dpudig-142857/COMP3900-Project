import re
import json

with open("KEGG_PATHWAY_Database.mhtml", "r", encoding="utf-8") as file:
    html_content = file.read()

pathways_data = {}

pattern = re.compile(r'(\d{5})(?:[^>]*>)([^<]*)')

matches = pattern.findall(html_content)

for match in matches:
    pathway_id = match[0].strip()
    pathway_name = match[1].strip()

    if pathway_id and pathway_name:
        pathways_data[pathway_name] = pathway_id

if pathways_data:
    with open("pathways.json", "w", encoding="utf-8") as json_file:
        json.dump(pathways_data, json_file, indent=4)
    print(f"Pathway data has been successfully saved to pathways.json with {len(pathways_data)} entries.")
else:
    print("No pathway data found. Please check the HTML structure.")