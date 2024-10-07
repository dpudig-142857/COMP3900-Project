import pandas as pd
import numpy as np
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class CompoundAverage(Base):
    __tablename__ = 'compound_averages'
    id = Column(Integer, primary_key=True)
    compound_name = Column(String)
    formula = Column(String)

    mass_accuracy_c18neg = Column(Float)
    mass_accuracy_c18pos = Column(Float)
    mass_accuracy_hilicneg = Column(Float)
    mass_accuracy_hilicpos = Column(Float)

    calculated_mw_c18neg = Column(Float)
    calculated_mw_c18pos = Column(Float)
    calculated_mw_hilicneg = Column(Float)
    calculated_mw_hilicpos = Column(Float)

    mz_c18neg = Column(Float)
    mz_c18pos = Column(Float)
    mz_hilicneg = Column(Float)
    mz_hilicpos = Column(Float)

    retention_time_c18neg = Column(Float)
    retention_time_c18pos = Column(Float)
    retention_time_hilicneg = Column(Float)
    retention_time_hilicpos = Column(Float)

    area_max_c18neg = Column(Float)
    area_max_c18pos = Column(Float)
    area_max_hilicneg = Column(Float)
    area_max_hilicpos = Column(Float)

    confidence_c18neg = Column(Float)
    confidence_c18pos = Column(Float)
    confidence_hilicneg = Column(Float)
    confidence_hilicpos = Column(Float)

    avg_glaucoma_c18neg = Column(Float)
    avg_glaucoma_c18pos = Column(Float)
    avg_glaucoma_hilicneg = Column(Float)
    avg_glaucoma_hilicpos = Column(Float)

    avg_healthy_c18neg = Column(Float)
    avg_healthy_c18pos = Column(Float)
    avg_healthy_hilicneg = Column(Float)
    avg_healthy_hilicpos = Column(Float)

    avg_blank_c18neg = Column(Float)
    avg_blank_c18pos = Column(Float)
    avg_blank_hilicneg = Column(Float)
    avg_blank_hilicpos = Column(Float)

    avg_cvgpool_c18neg = Column(Float)

    avg_cvhpool_c18neg = Column(Float)
    avg_cvhpool_c18pos = Column(Float)

    avg_pooled_c18pos = Column(Float)
    avg_pooled_hilicneg = Column(Float)
    avg_pooled_hilicpos = Column(Float)

engine = create_engine('sqlite:///compound_data.db')
Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)
session = Session()

def is_valid_float(value):
    if pd.isna(value) or value == "":
        return False
    try:
        float(value)
        return True
    except (ValueError, TypeError):
        return False

def process_file(file_name):
    print(f"Processing {file_name}...")
    df = pd.read_excel(file_name)

    patient_columns = [col for col in df.columns if (col.startswith('CVG') or col.startswith('CVH')) and 'POOL' not in col]
    glaucoma_columns = [col for col in patient_columns if col.startswith('CVG')]
    healthy_columns = [col for col in patient_columns if col.startswith('CVH')]
    blank_columns = [col for col in df.columns if col.startswith('Blank')]
    cvgpool_columns = [col for col in df.columns if col.startswith('CVGPool')]
    cvhpool_columns = [col for col in df.columns if col.startswith('CVHPool')]
    pooled_columns = [col for col in df.columns if col.startswith('Pooled')]

    for index, row in df.iterrows():
        compound_name = row['Name']

        formula = row['Formula']
        mass_accuracy_ppm = row['Mass Accuracy [ppm]'] if is_valid_float(row['Mass Accuracy [ppm]']) else None
        calculated_mw = row[[col for col in df.columns if col.startswith('Calculated')][0]] if len([col for col in df.columns if col.startswith('Calculated')]) > 0 and is_valid_float(row[[col for col in df.columns if col.startswith('Calculated')][0]]) else None
        mz = row['m/z'] if is_valid_float(row['m/z']) else None
        retention_time_min = row['Retention time [min]'] if is_valid_float(row['Retention time [min]']) else None
        area_max = row['Area (Max.)'] if is_valid_float(row['Area (Max.)']) else None
        confidence = row['mzCloud Best Match Confidence'] if 'mzCloud Best Match Confidence' in row else None

        glaucoma_values = [row[col] for col in glaucoma_columns if is_valid_float(row[col])]
        healthy_values = [row[col] for col in healthy_columns if is_valid_float(row[col])]
        blank_values = [row[col] for col in blank_columns if is_valid_float(row[col])]
        cvgpool_values = [row[col] for col in cvgpool_columns if is_valid_float(row[col])]
        cvhpool_values = [row[col] for col in cvhpool_columns if is_valid_float(row[col])]
        pooled_values = [row[col] for col in pooled_columns if is_valid_float(row[col])]

        avg_glaucoma = np.nanmean(glaucoma_values) if glaucoma_values else None
        avg_healthy = np.nanmean(healthy_values) if healthy_values else None
        avg_blank = np.nanmean(blank_values) if blank_values else None
        avg_cvgpool = np.nanmean(cvgpool_values) if cvgpool_values else None
        avg_cvhpool = np.nanmean(cvhpool_values) if cvhpool_values else None
        avg_pooled = np.nanmean(pooled_values) if pooled_values else None

        existing_entry = session.query(CompoundAverage).filter_by(compound_name=compound_name).first()

        if existing_entry:
            if 'C18-Neg' in file_name:
                existing_entry.mass_accuracy_c18neg = mass_accuracy_ppm
                existing_entry.calculated_mw_c18neg = calculated_mw
                existing_entry.mz_c18neg = mz
                existing_entry.retention_time_c18neg = retention_time_min
                existing_entry.area_max_c18neg = area_max
                existing_entry.confidence_c18neg = confidence
                existing_entry.avg_glaucoma_c18neg = avg_glaucoma
                existing_entry.avg_healthy_c18neg = avg_healthy
                existing_entry.avg_blank_c18neg = avg_blank
                existing_entry.avg_cvgpool_c18neg = avg_cvgpool
                existing_entry.avg_cvhpool_c18neg = avg_cvhpool
            elif 'C18-Pos' in file_name:
                existing_entry.mass_accuracy_c18pos = mass_accuracy_ppm
                existing_entry.calculated_mw_c18pos = calculated_mw
                existing_entry.mz_c18pos = mz
                existing_entry.retention_time_c18pos = retention_time_min
                existing_entry.area_max_c18pos = area_max
                existing_entry.confidence_c18pos = confidence
                existing_entry.avg_glaucoma_c18pos = avg_glaucoma
                existing_entry.avg_healthy_c18pos = avg_healthy
                existing_entry.avg_blank_c18pos = avg_blank
                existing_entry.avg_cvhpool_c18pos = avg_cvhpool
                existing_entry.avg_pooled_c18pos = avg_pooled
            elif 'HILIC-Neg' in file_name:
                existing_entry.mass_accuracy_hilicneg = mass_accuracy_ppm
                existing_entry.calculated_mw_hilicneg = calculated_mw
                existing_entry.mz_hilicneg = mz
                existing_entry.retention_time_hilicneg = retention_time_min
                existing_entry.area_max_hilicneg = area_max
                existing_entry.confidence_hilicneg = confidence
                existing_entry.avg_glaucoma_hilicneg = avg_glaucoma
                existing_entry.avg_healthy_hilicneg = avg_healthy
                existing_entry.avg_blank_hilicneg = avg_blank
                existing_entry.avg_pooled_hilicneg = avg_pooled
            elif 'HILIC-Pos' in file_name:
                existing_entry.mass_accuracy_hilicpos = mass_accuracy_ppm
                existing_entry.calculated_mw_hilicpos = calculated_mw
                existing_entry.mz_hilicpos = mz
                existing_entry.retention_time_hilicpos = retention_time_min
                existing_entry.area_max_hilicpos = area_max
                existing_entry.confidence_hilicpos = confidence
                existing_entry.avg_glaucoma_hilicpos = avg_glaucoma
                existing_entry.avg_healthy_hilicpos = avg_healthy
                existing_entry.avg_blank_hilicpos = avg_blank
                existing_entry.avg_pooled_hilicpos = avg_pooled
        else:
            new_entry = CompoundAverage(
                compound_name=compound_name,
                formula=formula,
                mass_accuracy_c18neg = mass_accuracy_ppm if 'C18-Neg' in file_name else None,
                calculated_mw_c18neg = calculated_mw if 'C18-Neg' in file_name else None,
                mz_c18neg = mz if 'C18-Neg' in file_name else None,
                retention_time_c18neg = retention_time_min if 'C18-Neg' in file_name else None,
                area_max_c18neg = area_max if 'C18-Neg' in file_name else None,
                confidence_c18neg = confidence if 'C18-Neg' in file_name else None,
                avg_glaucoma_c18neg = avg_glaucoma if 'C18-Neg' in file_name else None,
                avg_healthy_c18neg = avg_healthy if 'C18-Neg' in file_name else None,
                avg_blank_c18neg = avg_blank if 'C18-Neg' in file_name else None,
                avg_cvgpool_c18neg = avg_cvgpool if 'C18-Neg' in file_name else None,
                avg_cvhpool_c18neg = avg_cvhpool if 'C18-Neg' in file_name else None,

                mass_accuracy_c18pos = mass_accuracy_ppm if 'C18-Pos' in file_name else None,
                calculated_mw_c18pos = calculated_mw if 'C18-Pos' in file_name else None,
                mz_c18pos = mz if 'C18-Pos' in file_name else None,
                retention_time_c18pos = retention_time_min if 'C18-Pos' in file_name else None,
                area_max_c18pos = area_max if 'C18-Pos' in file_name else None,
                confidence_c18pos = confidence if 'C18-Pos' in file_name else None,
                avg_glaucoma_c18pos = avg_glaucoma if 'C18-Pos' in file_name else None,
                avg_healthy_c18pos = avg_healthy if 'C18-Pos' in file_name else None,
                avg_blank_c18pos = avg_blank if 'C18-Pos' in file_name else None,
                avg_cvhpool_c18pos = avg_cvhpool if 'C18-Pos' in file_name else None,
                avg_pooled_c18pos = avg_pooled if 'C18-Pos' in file_name else None,

                mass_accuracy_hilicneg = mass_accuracy_ppm if 'HILIC-Neg' in file_name else None,
                calculated_mw_hilicneg = calculated_mw if 'HILIC-Neg' in file_name else None,
                mz_hilicneg = mz if 'HILIC-Neg' in file_name else None,
                retention_time_hilicneg = retention_time_min if 'HILIC-Neg' in file_name else None,
                area_max_hilicneg = area_max if 'HILIC-Neg' in file_name else None,
                confidence_hilicneg = confidence if 'HILIC-Neg' in file_name else None,
                avg_glaucoma_hilicneg = avg_glaucoma if 'HILIC-Neg' in file_name else None,
                avg_healthy_hilicneg = avg_healthy if 'HILIC-Neg' in file_name else None,
                avg_blank_hilicneg = avg_blank if 'HILIC-Neg' in file_name else None,
                avg_pooled_hilicneg = avg_pooled if 'HILIC-Neg' in file_name else None,

                mass_accuracy_hilicpos = mass_accuracy_ppm if 'HILIC-Pos' in file_name else None,
                calculated_mw_hilicpos = calculated_mw if 'HILIC-Pos' in file_name else None,
                mz_hilicpos = mz if 'HILIC-Pos' in file_name else None,
                retention_time_hilicpos = retention_time_min if 'HILIC-Pos' in file_name else None,
                area_max_hilicpos = area_max if 'HILIC-Pos' in file_name else None,
                confidence_hilicpos = confidence if 'HILIC-Pos' in file_name else None,
                avg_glaucoma_hilicpos = avg_glaucoma if 'HILIC-Pos' in file_name else None,
                avg_healthy_hilicpos = avg_healthy if 'HILIC-Pos' in file_name else None,
                avg_blank_hilicpos = avg_blank if 'HILIC-Pos' in file_name else None,
                avg_pooled_hilicpos = avg_pooled if 'HILIC-Pos' in file_name else None,
            )
            session.add(new_entry)

    session.commit()

def main():
    files = [
        "CVG-CVH-C18-Neg.xlsx",
        "CVG-CVH-C18-Pos.xlsx",
        "CVG-CVH-HILIC-Neg.xlsx",
        "CVG-CVH-HILIC-Pos.xlsx"
    ]

    for file_name in files:
        process_file(file_name)

if __name__ == "__main__":
    main()