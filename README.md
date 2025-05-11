# Project Title
What is hidden in the metabolomics of the tear film of the eye?
# Specialisations
Artificial intelligence (Machine/ Deep learning, NLP); Bioinformatics/Biomedical
# Background
Tear film samples have been collected from normal and diseased eyes.
Mass spectrometry analysis has been run on these samples (revealing hundreds of compounds that could reveal new discoveries and hypotheses that can be further tested.)
# Project Goals
Use raw data from mass spectrometry to find pathways that could lead to discoveries about:
The immune and inflammation system in normal and diseased eyes
The microbes that infect and live in the microbiome of the eye
External environmental effects such as PFAs and microplastics in the eye
The effects of ageing on the eye
# Requirements and scope
Access to web-based bioinformatic tools and biological databases like the human metabolome.
# Required knowledge and skills
Interest in bioinformatics, algorithms, and artificial intelligence
# Expected outcomes/deliverables
Preliminary data that can be acted on to determine clinical hypotheses that can be tested in vitro and in animal models
# Running Program
1. Unzip neo4j_db.zip
2. Confirm all permissions are okay with the files
      - for mac, run "chmod -R 777 neo4j_db"
      - for windows, just make sure the folder is stored locally
3. Open docker
4. Run "docker-compose up" to run the backend
5. Check the backend is working at https://localhost:7474
      - If prompted for username and password, type in "neo4j" and "password" respectively
6. Run "python -m http.server" in neo4j_frontend to run the frontend
7. Main website should be running at https://localhost:8000
