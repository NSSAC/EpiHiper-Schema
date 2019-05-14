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
import a_module
import json
import sys
from jsonschema import validate

class Configuration:
    
    def __init__(self, runParameters):
        self.runParameter = runParameters
        self.schemaLocation = os.path.abspath(os.path.join(a_module.__file__, "..", "schema")) 
        self.schemas = {
            "runParameters": "runParametersSchema.json",
            "traits": "traitsSchema.json",
            "diseaseModel": "diseaseModelSchema.json",
            "intervention": "interventionSchema.json",
            "initialization": "initializationSchema.json",
            "personTraitDB": "personTraitDB/schemas/tabular-data-resource.json"
        }
        
        return
    
    def validate(self):
        self.loadJsonFile(self.runParameter, os.path.join(self.schemaLocation, self.schemas["runParameters"]))        
        
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
            schemaFile.close()
            validate(dictionary, schema)
            
        jsonFile.close()
        return dictionary
