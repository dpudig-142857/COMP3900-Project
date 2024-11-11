from flask import Flask, request, render_template
import requests
import pandas as pd
from bs4 import BeautifulSoup
from backend import get_kegg_pathways 
from neo4j import GraphDatabase, RoutingControl
import sqlite3
import json
import time

URI = "bolt://localhost:7687"
AUTH = ("neo4j", "password")


app = Flask(__name__)

def get_hmdb_pathways(metabolite_name):
    metabolite_name = metabolite_name.replace(' ', '+')
    page = 1
    search_url = f'https://hmdb.ca/unearth/q?button=&page={page}&query={metabolite_name}&searcher=pathways'
    soup = None
    strong_texts = []
    while page == 1 or 'rel="next">Next ›</a>' in str(soup):
        response = requests.get(search_url)
        print(response)
        print(search_url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # looks for the first search result link that contains the metabolite name

            #metabolisms =  soup.find('div', class_='panel-heading')
            panels = soup.find_all("div", class_="panel-heading")

            # Extract the text inside the <strong> tags
            
            for panel in panels:
                strong_tag = panel.find("strong")
                if strong_tag:
                    strong_texts.append(strong_tag.text)
            
            if 'rel="next">Next ›</a>' in str(soup):
                page +=1    
                search_url = f'https://hmdb.ca/unearth/q?button=&page={page}&query={metabolite_name}&searcher=pathways'
            else:
                break
        elif (response.status_code == 502):
            time.sleep(1)
        else:
            break
    return strong_texts

def add_metabolite(driver, meta):
    driver.execute_query(
        """CREATE (a:METABOLITE {name: $metabolite, kegg_id:$kegg_id, cid:$cid, molecular_formula:$molecular_formula, canonical_smiles:$canonical_smiles, isomeric_smiles:$isomeric_smiles, fold_change:$fold_change, log2_fold_change:$log2_fold_change, p_value:$p_value, CVG_count:$CVG_count, CVH_count:$CVH_count, status:$status, regulation:$regulation, source:$source}) 
        """,
        metabolite=meta[0],kegg_id=meta[1],cid=meta[2],molecular_formula=meta[3],canonical_smiles=meta[4],isomeric_smiles=meta[5],fold_change=meta[7],log2_fold_change=meta[8],p_value=meta[9],CVG_count=meta[9],CVH_count=meta[10],status=meta[11],regulation=meta[12],source=meta[13], database_="neo4j",
    )

def add_metabolism(driver,kegg_id, metabolism, mapp_id):
    driver.execute_query(
        """MERGE (a:METABOLITE {kegg_id:$kegg_id}) 
        MERGE (b:PATHWAY {name: $metabolism, mapp_id: $mapp_id}) 
        MERGE (a)-[:LINKED]->(b)""",
        kegg_id=kegg_id,metabolism=metabolism,mapp_id=mapp_id, database_="neo4j",
    )


def main():
    with sqlite3.connect('compounds.db') as conn:
        cur = conn.cursor()
        cur.execute('''SELECT MIN(compound_name), compound_id, MIN(cid), MIN(molecular_formula), MIN(canonical_smiles), MIN(isomeric_smiles), pathways, MIN(FoldChange), MIN(Log2FoldChange), MIN(PValue), MIN(CVG_Count), MIN(CVH_Count), MIN(Status), MIN(Regulation), MIN(Source) 
                    FROM compounds
                    GROUP BY compound_id
                    ''')
        rows = cur.fetchall()
        
        for row in rows:
            if row[6] is not None:
                kegg_id = row[1]
                pathways = []
                stored_pathways = []

                stored_pathways = row[6].split("Ω")
                for pathway in stored_pathways:
                    if pathway != "":
                        stored_pathway = {}
                        stored_pathway["name"] = pathway.split("ඞ")[1]
                        stored_pathway["mmap"] = pathway.split("ඞ")[0]
                        pathways.append(stored_pathway)
                
                with GraphDatabase.driver(URI, auth=AUTH) as driver:
                    add_metabolite(driver, row)
                    for pathway in pathways:
                        add_metabolism(driver, kegg_id, pathway["name"], pathway["mmap"])
                print(f"Metabolite: {row[0]}, Pathways: {pathways}")
    
 
main()

