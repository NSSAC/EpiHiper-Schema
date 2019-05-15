# BEGIN: Copyright 
# Copyright (C) 2019 Rector and Visitors of the University of Virginia 
# All rights reserved 
# END: Copyright 

# BEGIN: License 
# Licensed under the Apache License, Version 2.0 (the "License"); 
# you may not use this file except in compliance with the License. 
# You may obtain a copy of the License at 
#  
#   http://www.apache.org/licenses/LICENSE-2.0 
# END: License 

import os
import json
import sys
import jsonschema

class Configuration:
    
    def __init__(self, runParameters):
        self.runParameters = runParameters
        self.schemaLocation = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "schema")) 
        self.schemas = {
            "runParameters": os.path.join(self.schemaLocation, "runParametersSchema.json"),
            "traits": os.path.join(self.schemaLocation, "traitsSchema.json"),
            "diseaseModel": os.path.join(self.schemaLocation, "diseaseModelSchema.json"),
            "intervention": os.path.join(self.schemaLocation, "interventionSchema.json"),
            "initialization": os.path.join(self.schemaLocation, "initializationSchema.json"),
            "personTraitDB": os.path.join(self.schemaLocation, "personTraitDB/schemas/tabular-data-resource.json")
        }
        
        self.data = {}
        
        return
    
    def getData(self):
        return self.data
    
    def validate(self):
        self.data["runParameters"] = self.loadJsonFile(self.runParameters, self.schemas["runParameters"])
        
        self.addData("traits")
        self.addData("diseaseModel")
        self.addData("initialization")
        self.addData("intervention")
        self.addData("traits")
        
        self.data["personTraitDB"] = []
        
        if "personTraitDB" in self.data["runParameters"]:
            for db in self.data["runParameters"]["personTraitDB"]:  
                self.appendData(self.data["personTraitDB"], db, self.schemas["personTraitDB"])   
    
    def addData(self, what, schema = None):
        if not schema:
            schema = self.schemas[what]
            
        self.data[what] = self.loadJsonFile(os.path.join(os.path.dirname(self.runParameters), self.data["runParameters"][what]), schema)
        
    def appendData(self, to, what, schema):
        to.append(self.loadJsonFile(os.path.join(os.path.dirname(self.runParameters), what), schema))
        
    def loadJsonFile(self, fileName, jsonSchema = None):
    
        try:
            jsonFile = open(fileName,"r")
        
        except:
            sys.exit("ERROR: File '" + fileName + "' does not exist.")
        
        dictionary = json.load(jsonFile)
        
        if jsonSchema != None:
            try:
                schemaFile = open(jsonSchema,"r")
        
            except:
                sys.exit("ERROR: File '" + schemaFile + "' does not exist.")
                    
            schema = json.load(schemaFile)
            resolver = jsonschema.RefResolver('file://' + os.path.dirname(jsonSchema) + '/', schema)
            schemaFile.close()
            jsonschema.validate(dictionary, schema, resolver=resolver)
            
        jsonFile.close()
        return dictionary
