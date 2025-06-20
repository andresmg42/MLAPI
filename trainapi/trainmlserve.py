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
from dotenv import load_dotenv
import os
load_dotenv()
app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Puedes poner ["*"] en desarrollo si quieres permitir todos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def store_portfolio_supabase(portfolio_returns,index_p):
    try:
        supabase=create_client(os.getenv("SUPABASE_URL"),os.getenv('SUPABASE_KEY'))
        
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
                    path=f"train/{index_p}.csv",
                    file_options={"cache-control": "3600", "upsert": "true"}
                )
            )
        return response
    except Exception as  e:
        print(f'error uploading file: {e}')

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
        result=store_portfolio_supabase(portfolio_returns,item.index)
        return result
    



if __name__=='__main__':

    serve.start(detached=True, http_options={'host':'0.0.0.0','port':8000})
    
    serve.run(TrainAPI.bind(), route_prefix='/train',blocking=True)

    print("Ray Serve app is running at http://0.0.0.0:8000/train")



    
