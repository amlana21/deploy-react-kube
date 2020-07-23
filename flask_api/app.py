from flask import Flask,jsonify,make_response
from flask_pymongo import PyMongo
import os
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)
app.config["MONGO_URI"] = os.getenv('MONGO_URL')
mongo = PyMongo(app)

@app.route("/allcontacts")
def home_page():
    all_contacts = mongo.db.contacts.find()
    contacts=[]
    for rw in all_contacts:
        rw.pop('_id')
        contacts.append(rw)
    print(contacts)
    resp=make_response(jsonify(contacts),200)
    # resp=make_response(jsonify(status='done'),200)
    return resp

if __name__=='__main__':
    app.run(debug=True,host='0.0.0.0')