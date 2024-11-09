import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import sqlite3
import json
import time
import threading
from backend import get_kegg_pathways
import os


# Function to get HMDB pathways (same as before)
def get_kegg_pathways(metabolite_id):
    # URL of the page
    url = "https://www.kegg.jp/entry/"+str(metabolite_id)

    # Fetch the page content
    response = requests.get(url)
    response.raise_for_status()  # Check for request errors

    # Parse the HTML content
    soup = BeautifulSoup(response.text, 'html.parser')
    try:
        # Find the "Pathway" header
        pathway_header = soup.find('th', string="Pathway")

        # Extract pathways from the row directly following the header
        pathways = ""
        if pathway_header:
            pathway_row = pathway_header.find_parent('tr')
            if pathway_row:
                rows = pathway_row.find_all('a', href=True)
                for row in rows:
                    pathway_id = row['href'].split('/')[-1].split('+')[0]  # Extract ID (e.g., map00071)
                    pathway_name = row.find_next('td').text.strip()  # Extract pathway name
                    pathways += pathway_id + "ඞ"+pathway_name+"Ω"
        
        return pathways
    except Exception as e:
        print(f"Error fetching data for {metabolite_id}: {e}")
    return ""

def modify_table():
    with sqlite3.connect('compounds.db') as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("ALTER TABLE compounds ADD COLUMN pathways;")
            conn.commit()
        except sqlite3.OperationalError as e:
            print(f"Error: {e}")


def main():
    
    with sqlite3.connect('compounds.db') as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT compound_id, id, compound_name FROM compounds")
        compounds = cursor.fetchall()
        previous_id = None
        pathways = None
        for compound_id, id, compound_name in compounds:
            if compound_id != previous_id:
                pathways = get_kegg_pathways(compound_id)
                previous_id = compound_id
            if pathways:
                cursor.execute("""
                    UPDATE compounds
                    SET pathways = ?
                    WHERE id = ?
                """, (pathways, id))
                print (compound_name+" "+pathways)
            else:
                print(f"No data found for compound {compound_name}")


if __name__ == "__main__":
    main()
    #modify_table()