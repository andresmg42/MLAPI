import ray
import requests
import time
from fastapi import FastAPI,Query
from ray import serve
from ml_parallel_pipeline import RollingOLSRegressionParallel
from symbols_list_distribution import symbolsList
import pandas as pd
from supabase import create_client
from pydantic import BaseModel
from io import BytesIO
import tempfile


SUPABASE_URL='https://mdjgxsstjlggrgbaelyk.supabase.co'
SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kamd4c3N0amxnZ3JnYmFlbHlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTc4MTA3NywiZXhwIjoyMDY1MzU3MDc3fQ.-OMTnFooHXSKPXdRIFPpozh4J5WB8-idBEH1gv4NJOM'



    

def store_portfolio_supabase(portfolio_returns):
    try:
        supabase=create_client(SUPABASE_URL,SUPABASE_KEY)
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            temp_path = tmp.name
            portfolio_returns.to_csv(temp_path, index=True)

        
        with open(temp_path, "rb") as f:
            response = (
                supabase.storage
                .from_("datasets")
                .upload(
                    file=f,
                    path="train.csv",
                    file_options={"cache-control": "3600", "upsert": "true"}
                )
            )
        return response
    except Exception as  e:
        print(f'error uploading file: {e}')


app = FastAPI()

class Item(BaseModel):
    index:str
    start_date:str
    end_date:str
    batch_size:int

@serve.deployment
@serve.ingress(app)
class TrainAPI:
    @app.post("/")
    def get_portfolio_returns(self,item:Item):
        symbols_list=symbolsList(item.index)
        model=RollingOLSRegressionParallel(symbols_list,item.start_date,item.end_date)
        portfolio_returns=model.train_parallel_pipeline(item.batch_size)
        result=store_portfolio_supabase(portfolio_returns)
        return result
    



if __name__=='__main__':

    serve.start(detached=True, http_options={'host':'0.0.0.0','port':8000})
    serve.run(TrainAPI.bind(), route_prefix='/train')



    
