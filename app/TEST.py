from fastapi import FastAPI, Depends, HTTPException
from authx import AuthX, AuthXConfig, RequestToken

app = FastAPI()

config = AuthXConfig(
    JWT_ALGORITHM="HS256",
    JWT_SECRET_KEY="AXIOASUDOIDODFJASODCJASOFJSDFOSDMFOSDIJFCSODICJSDOCJSDOCJSDOCIJOFJ",
    JWT_TOKEN_LOCATION=["headers"],
)

auth = AuthX(config=config)
auth.handle_errors(app)


@app.get("/login")
def login(username: str, password: str):
    if username == "123" and password == "123":
        token = auth.create_access_token(uid=username)
        return {"access_token": token}
    raise HTTPException(401, detail={"message": "Invalid credentials"})


@app.get("/protected", dependencies=[Depends(auth.get_token_from_request)])
def get_protected(token: RequestToken = Depends()):
    try:
        auth.verify_token(token=token)
        return {"message": "Hello world !"}
    except Exception as e:
        raise HTTPException(401, detail={"message": str(e)}) from e
