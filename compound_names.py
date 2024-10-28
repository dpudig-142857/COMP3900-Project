import re
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class Compound(Base):
    __tablename__ = 'compounds'
    id = Column(Integer, primary_key=True, autoincrement=True)
    compound_id = Column(String, nullable=False)
    compound_name = Column(String, nullable=False)

engine = create_engine('sqlite:///compounds.db')
Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)
session = Session()

def parse_text_file(file_path):
    compounds = []
    with open(file_path, 'r') as file:
        data = file.read()

    pattern = r'(C\d{5})\s+(.*)'
    matches = re.findall(pattern, data)

    for match in matches:
        compound_id = match[0]
        compound_names = match[1].split(';')

        for name in compound_names:
            name = name.strip()
            compounds.append((compound_id, name))
    
    return compounds

def compounds_insert(compounds):
    for compound_id, compound_name in compounds:
        new_compound = Compound(compound_id=compound_id, compound_name=compound_name)
        session.add(new_compound)

    session.commit()

def main():
    file_path = 'compound.txt'
    compounds = parse_text_file(file_path)
    compounds_insert(compounds)

if __name__ == '__main__':
    main()

session.close()