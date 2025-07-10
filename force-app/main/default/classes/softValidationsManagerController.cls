public without sharing class softValidationsManagerController {
    public softValidationsManagerController() {

    }

    /* Get List of SObjects */
    @AuraEnabled(cacheable=true)
    public static Map<String, String> getSObjects() {        
        Map<String, String> sObjectNamebyLabel = new Map<String, String>();
        for(SObjectType objectType : Schema.getGlobalDescribe().values()) {
            DescribeSObjectResult sObjectDescribe = objectType.getDescribe();
            if(sObjectDescribe.isAccessible() && sObjectDescribe.isQueryable()) {
                sObjectNamebyLabel.put(sObjectDescribe.getName(),sObjectDescribe.getLabel());
            }
        }

        // Put options in alphabetical order
        // Put Keys (Name) into list. 
        list<string> sObjectNameList = new list<string>();
        sObjectNameList.addAll(sObjectNamebyLabel.keySet());
        sObjectNameList.sort();

        Map<String, String> sObjectOrderedMap = new Map<String, String>();

        for(string objectName : sObjectNameList){
            sObjectOrderedMap.put(objectName, sObjectNamebyLabel.get(objectName));
        }

        return sObjectOrderedMap;
    }

    /* Get list of existing Soft Validation Records */
    @AuraEnabled
    public static List<Soft_Validation__c> getExistingValidations() {        
        return [SELECT Id, Name,
                    Object__c, 
                    Validation_Style__c, 
                    Title__c, 
                    Message__c, 
                    Where_Clause__c, 
                    Position__c, 
                    Active__c  
                FROM Soft_Validation__c 
                ORDER BY Object__c ASC, Position__c ASC];
    }


    /* Clone Soft Validation Record */
    @AuraEnabled
    public static void cloneValidationRecord(String recordToCloneId) {    
        
        // Get record to clone
        Soft_Validation__c originalValidation = [SELECT Id, 
                                                    Name, 
                                                    Object__c, 
                                                    Validation_Style__c, 
                                                    Title__c, 
                                                    Message__c, 
                                                    Where_Clause__c, 
                                                    Position__c, 
                                                    Active__c 
                                                FROM Soft_Validation__c 
                                                WHERE id =: recordToCloneId];

        //Make a deep clone of the original account 
        Soft_Validation__c clonedValidation = originalValidation.clone(false, true, false, false);
        insert clonedValidation;
        
    }
    

}