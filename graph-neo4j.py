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

def add_metabolism(driver, metabolite, metabolism):
    driver.execute_query(
        """MERGE (a:METABOLITE {name: $metabolite}) 
        MERGE (b:PATHWAY {name: $metabolism}) 
        MERGE (a)-[:LINKED]->(b)""",
        metabolite=metabolite,metabolism=metabolism, database_="neo4j",
    )

def print_friends(driver, name):
    records, _, _ = driver.execute_query(
        "MATCH (a:Person)-[:KNOWS]->(friend) WHERE a.name = $name "
        "RETURN friend.name ORDER BY friend.name",
        name=name, database_="neo4j", routing_=RoutingControl.READ,
    )
    for record in records:
        print(record["friend.name"])


def main():
    metabol = []
    with sqlite3.connect('compounds.db') as conn:
        cur = conn.cursor()
        cur.execute('''SELECT compound_id, compound_name
                    FROM compounds
                    GROUP BY compound_id
                    ''')
        rows = cur.fetchall()
        for row in rows:
            metabolite = row[1]

            entry = {"metabolite" : metabolite}
            kegg_pathways = get_kegg_pathways(metabolite)
            if kegg_pathways != "\n" and kegg_pathways != None:
                metabol.append(metabolite)
                entry["kegg-pathways"] = []
                for metabolism_entry in kegg_pathways.split("\n")[:-1]:
                    metabolism = metabolism_entry.split("\t")[-1]
                    
                    with GraphDatabase.driver(URI, auth=AUTH) as driver:
                        add_metabolism(driver, metabolite, metabolism)
                    
                    entry["kegg-pathways"].append(metabolism)
            #entry["hmdb-pathways"] = get_hmdb_pathways(metabolite)
            print(entry)
            metabol.append(entry)
            with open('metabolit-pathways.json', 'w') as json_file:
                json.dump(metabol, json_file, indent=4)    
            
    print(metabol)
 
main()

