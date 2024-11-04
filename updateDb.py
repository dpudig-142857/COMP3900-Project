import sqlite3
import requests

conn = sqlite3.connect("compounds.db")
cursor = conn.cursor()

def fetch_compound_data(compound_name):
    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{compound_name}/property/MolecularFormula,CanonicalSMILES,IsomericSMILES/JSON"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if "PropertyTable" in data and "Properties" in data["PropertyTable"]:
            properties = data["PropertyTable"]["Properties"][0]
            cid = properties.get("CID")
            molecular_formula = properties.get("MolecularFormula")
            canonical_smiles = properties.get("CanonicalSMILES")
            isomeric_smiles = properties.get("IsomericSMILES")
            return cid, molecular_formula, canonical_smiles, isomeric_smiles


cursor.execute("SELECT id, compound_name FROM compounds")
compounds = cursor.fetchall()

for compound_id, compound_name in compounds:
    cid, molecular_formula, canonical_smiles, isomeric_smiles = fetch_compound_data(compound_name)
    if cid or molecular_formula or canonical_smiles or isomeric_smiles:
        cursor.execute("""
            UPDATE compounds
            SET cid = ?, molecular_formula = ?, canonical_smiles = ?, isomeric_smiles = ?
            WHERE id = ?
        """, (cid, molecular_formula, canonical_smiles, isomeric_smiles, compound_id))
        print(f"Updated compound {compound_name} with CID: {cid}, Molecular Formula: {molecular_formula}")
    else:
        print(f"No data found for compound {compound_name}")

conn.commit()
conn.close()
