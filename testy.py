from neo4j import GraphDatabase

class MetaboliteQuery:

    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def get_metabolite_and_neighbors(self, metabolite_name):
        query = """
            MATCH (m:METABOLITE {name: $metabolite_name})--(neighbor)
            RETURN m.name AS metabolite, neighbor.name AS neighbor
        """
        with self.driver.session() as session:
            result = session.run(query, metabolite_name=metabolite_name)
            for record in result:
                print(f"Metabolite: {record['metabolite']} -> Neighbor: {record['neighbor']}")

if __name__ == "__main__":
    uri = "bolt://localhost:7687"  
    user = "neo4j"             
    password = "password"          

    metabolite_query = MetaboliteQuery(uri, user, password)
    try:
        metabolite_name = "A"
        metabolite_query.get_metabolite_and_neighbors(metabolite_name)
    finally:
        metabolite_query.close()
