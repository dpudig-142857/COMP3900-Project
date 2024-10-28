from flask import Flask, request, render_template
import requests
import pandas as pd
from bs4 import BeautifulSoup

app = Flask(__name__)

def get_kegg_pathways(metabolite):
    url = f'http://rest.kegg.jp/find/pathway/{metabolite}'
    response = requests.get(url)
    if response.status_code == 200:
        return response.text 
    else:
        return None

def get_hmdb_id(metabolite_name):
    search_url = f'https://hmdb.ca/unearth/q?query={metabolite_name}&searcher=metabolites'
    response = requests.get(search_url)
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        result_link = soup.find('a', href=True, text=metabolite_name)
        if result_link:
            metabolite_url = result_link['href']
            hmdb_id = metabolite_url.split('/')[-1]
            return hmdb_id
        else:
            return None
    else:
        return None

def batch_query(metabolites):
    kegg_results = {}

    for metabolite in metabolites:
        metabolite = metabolite.strip()
        kegg_data = get_kegg_pathways(metabolite)
        hmdb_id = get_hmdb_id(metabolite)

        kegg_results[metabolite] = {
            "kegg": kegg_data if kegg_data else 'No data found',
            "hmdb_id": hmdb_id if hmdb_id else 'HMDB ID not found'
        }

    return kegg_results

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        metabolite_input = request.form["metabolites"]
        metabolites = metabolite_input.split(",") 
        kegg_data = batch_query(metabolites)
        return render_template("results.html", kegg=kegg_data)
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
