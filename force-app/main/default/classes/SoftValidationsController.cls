/**
* @description      Reusable SoftValidations component to display advisory field conditions
* @author           David Bradburn
* @date             20-02-2022
* @group            Controller
*/

public without sharing class SoftValidationsController {
    
    // Retrieve all Soft Validation records for the Object Page the component is on
    @AuraEnabled
    public static List<Soft_Validation__c> getValidations(string objectName, String recordId) {
        // Get all validaion Records for this Object
        List<Soft_Validation__c> activeSoftValidationsToShowOnScreen = new List<Soft_Validation__c>();

        for(Soft_Validation__c validationRecord : [SELECT Id, 
                                                        Object__c, 
                                                        Title__c, 
                                                        Message__c, 
                                                        Validation_Style__c, 
                                                        Where_Clause__c, 
                                                        Validation_Icon__c, 
                                                        Position__c, 
                                                        Active__c 
                                                    FROM Soft_Validation__c 
                                                    WHERE Object__c =: objectName 
                                                    AND Active__c = true 
                                                    ORDER BY Position__c ASC NULLS LAST]) {
            // Build Query String
            list<sObject> result = new list<sObject>();
            String query = 'SELECT Id FROM ' + objectName + ' WHERE Id =: recordId AND ' + validationRecord.Where_Clause__c;
            
            result = Database.query(query);
            
            if(result.size() > 0){
                activeSoftValidationsToShowOnScreen.add(validationRecord);
            }
        }

        return activeSoftValidationsToShowOnScreen;

    }
    
}