from flask import Flask, request, render_template
import requests
import pandas as pd

app = Flask(__name__)

def get_kegg_pathways(metabolite):
    url = f'http://rest.kegg.jp/find/pathway/{metabolite}'
    response = requests.get(url)
    if response.status_code == 200:
        return response.text 
    else:
        return None

def batch_query(metabolites):
    kegg_results = {}

    for metabolite in metabolites:
        metabolite = metabolite.strip()
        kegg_data = get_kegg_pathways(metabolite)
        kegg_results[metabolite] = kegg_data if kegg_data else 'No data found'

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
