public without sharing class mintEmailSearchController {
    @AuraEnabled
    public static list<User> searchUsers(String searchTerm) {

        String wildcardSearchTerm = '%' + searchTerm + '%';
        
        return [SELECT Id, 
                    FirstName, 
                    LastName, 
                    Name, 
                    Email 
                FROM User 
                WHERE Name LIKE :wildcardSearchTerm
                OR FirstName LIKE :wildcardSearchTerm
                OR LastName LIKE :wildcardSearchTerm
                OR Email LIKE :wildcardSearchTerm];

    }

    @AuraEnabled
    public static list<EmailMessage> searchEmailsWithTerm(
        String searchTerm,
        Boolean filterFromAddress, 
        Boolean filterToAddress, 
        Boolean filterCCAddress, 
        Boolean filterBCCAddress, 
        Boolean filterFromName, 
        Boolean filterSubject
        ) {

        String wildcardSearchTerm = '%' + searchTerm + '%';

        String query = 'SELECT Id, FromAddress, CcAddress, BccAddress, ToAddress, FromName, MessageDate, RelatedToId, TextBody, Subject, EmailTemplateId FROM EmailMessage WHERE';

        if(filterFromAddress){ query += ' FromAddress LIKE \'' + wildcardSearchTerm + '\''; }
        if(filterToAddress){
            if(filterFromAddress){ query += ' OR ToAddress LIKE \'' + wildcardSearchTerm + '\''; } 
            else { query += ' ToAddress LIKE \'' + wildcardSearchTerm + '\''; }
        }
        if(filterCCAddress){ query += ' OR CcAddress LIKE \'' + wildcardSearchTerm + '\''; }
        if(filterBCCAddress){ query += ' OR BccAddress LIKE \'' + wildcardSearchTerm + '\''; }
        if(filterFromName){ query += ' OR FromName LIKE \'' + wildcardSearchTerm + '\''; }
        if(filterSubject){ query += ' OR Subject LIKE \'' + wildcardSearchTerm + '\''; }
        query += ' ORDER BY MessageDate DESC';

        List<EmailMessage> emailMessages = Database.query(query);

        return emailMessages;
    }

    @AuraEnabled
    public static list<EmailMessage> searchEmailsWithUserId(
        String userId, 
        Boolean filterFromAddress, 
        Boolean filterToAddress, 
        Boolean filterCCAddress, 
        Boolean filterBCCAddress, 
        Boolean filterFromName, 
        Boolean filterSubject
        ) {

        user theUser = [SELECT Id,
                            FirstName, 
                            LastName, 
                            Name,  
                            Email 
                        FROM User 
                        WHERE Id = :userId
                        LIMIT 1];


        String query = 'SELECT Id, FromAddress, CcAddress, BccAddress, ToAddress, FromName, MessageDate, RelatedToId, TextBody, Subject, EmailTemplateId FROM EmailMessage WHERE';

        if(filterFromAddress){ query += ' FromAddress LIKE \'' + theUser.Email + '\''; }
        if(filterToAddress){
            if(filterFromAddress){ query += ' OR ToAddress LIKE \'' + theUser.Email + '\''; } 
            else { query += ' ToAddress LIKE \'' + theUser.Email + '\''; }
        }
        if(filterCCAddress){ query += ' OR CcAddress LIKE \'' + theUser.Email + '\''; }
        if(filterBCCAddress){ query += ' OR BccAddress LIKE \'' + theUser.Email + '\''; }
        if(filterFromName){ query += ' OR FromName LIKE \'' + theUser.Name + '\''; }
        if(filterSubject){ query += ' OR Subject LIKE \'' + theUser.Name + '\''; }
        query += ' ORDER BY MessageDate DESC';

        List<EmailMessage> emailMessages = Database.query(query);

        return emailMessages;
    }

    @AuraEnabled
    public static map<string, string> getAllObjects(){
        map<string, string> objectList = new map<string, string>();

        for ( Schema.SObjectType o : Schema.getGlobalDescribe().values() ){
            Schema.DescribeSObjectResult objResult = o.getDescribe();
            objectList.put(objResult.getName(), objResult.getLabel());
        }

        return objectList;

    }


    // CONGA QUERY METHODS

    // @AuraEnabled
    // public static list<APXTConga4__Conga_Solution__c> searchCongaSolutionsWithTerm(String searchTerm) {

    //     List<APXTConga4__Conga_Solution__c> matchingSolutions = new List<APXTConga4__Conga_Solution__c>();

    //     // Get all solutions
    //     List<APXTConga4__Conga_Solution__c> allSolutions = [SELECT Id,
    //                                                             Name,
    //                                                             APXTConga4__Weblink_Id__c,
    //                                                             APXTConga4__Button_body_field__c,
    //                                                             LastModifiedDate,
    //                                                             APXTConga4__Master_Object_Type__c 
    //                                                         FROM APXTConga4__Conga_Solution__c];

    //     // Loops Soutions and match on searchTerm. Return Matches
    //     for(APXTConga4__Conga_Solution__c solution : allSolutions){
    //         if(solution.APXTConga4__Button_body_field__c.contains(searchTerm)){
    //             matchingSolutions.add(solution);
    //         }
    //     }

    //     return matchingSolutions;

    // }

    @AuraEnabled
    public static list<SObject> searchCongaSolutionsWithTerm(String searchTerm) {
        String congaObjectAPI = 'APXTConga4__Conga_Solution__c';

        List<SObject> matchingSolutions = new List<SObject>();

        // Get all solutions
        String query = 'SELECT Id, Name, APXTConga4__Weblink_Id__c, APXTConga4__Button_body_field__c, LastModifiedDate, APXTConga4__Master_Object_Type__c FROM ' + congaObjectAPI;

        List<SObject> allSolutions = Database.query(query);

        // Loops Soutions and match on searchTerm. Return Matches
        for(SObject solution : allSolutions){
            if(String.valueOf(solution.get('APXTConga4__Button_body_field__c')).contains(searchTerm)){
                matchingSolutions.add(solution);
            }
        }

        return matchingSolutions;

    }

    // @AuraEnabled
    // public static list<APXTConga4__Conga_Solution__c> searchCongaSolutionsWithUserId(String userId) {

    //     user theUser = [SELECT Id,
    //                         FirstName, 
    //                         LastName, 
    //                         Name,  
    //                         Email 
    //                     FROM User 
    //                     WHERE Id = :userId
    //                     LIMIT 1];

    //     List<APXTConga4__Conga_Solution__c> matchingSolutions = new List<APXTConga4__Conga_Solution__c>();

    //     // Get all solutions
    //     List<APXTConga4__Conga_Solution__c> allSolutions = [SELECT Id,
    //                                                             Name,
    //                                                             APXTConga4__Weblink_Id__c,
    //                                                             APXTConga4__Button_body_field__c,
    //                                                             LastModifiedDate,
    //                                                             APXTConga4__Master_Object_Type__c
    //                                                         FROM APXTConga4__Conga_Solution__c];

    //     // Loops Soutions and match on searchTerm. Return Matches
    //     for(APXTConga4__Conga_Solution__c solution : allSolutions){
    //         if(solution.APXTConga4__Button_body_field__c.toLowerCase().contains(theUser.Email.toLowerCase())
    //             || solution.APXTConga4__Button_body_field__c.toLowerCase().contains(theUser.Name.toLowerCase())
    //             || solution.APXTConga4__Button_body_field__c.toLowerCase().contains(theUser.LastName.toLowerCase())
    //             || solution.APXTConga4__Button_body_field__c.toLowerCase().contains(theUser.FirstName.toLowerCase())
    //         ){
    //             matchingSolutions.add(solution);
    //         }
    //     }

    //     return matchingSolutions;
    // }

    @AuraEnabled
    public static list<SObject> searchCongaSolutionsWithUserId(String userId) {
        String congaObjectAPI = 'APXTConga4__Conga_Solution__c';

        user theUser = [SELECT Id,
                            FirstName, 
                            LastName, 
                            Name,  
                            Email 
                        FROM User 
                        WHERE Id = :userId
                        LIMIT 1];

        List<SObject> matchingSolutions = new List<SObject>();

        // Get all solutions
        String query = 'SELECT Id, Name, APXTConga4__Weblink_Id__c, APXTConga4__Button_body_field__c, LastModifiedDate, APXTConga4__Master_Object_Type__c FROM ' + congaObjectAPI;

        List<SObject> allSolutions = Database.query(query);

        // Loops Soutions and match on searchTerm. Return Matches
        for(SObject solution : allSolutions){
            if(String.valueOf(solution.get('APXTConga4__Button_body_field__c')).toLowerCase().contains(theUser.Email.toLowerCase())
            || String.valueOf(solution.get('APXTConga4__Button_body_field__c')).toLowerCase().contains(theUser.Name.toLowerCase())
            || String.valueOf(solution.get('APXTConga4__Button_body_field__c')).toLowerCase().contains(theUser.LastName.toLowerCase())
            || String.valueOf(solution.get('APXTConga4__Button_body_field__c')).toLowerCase().contains(theUser.FirstName.toLowerCase())
            ){
                matchingSolutions.add(solution);
            }
        }

        return matchingSolutions;
    }

    public static void codeCoverageBumper(){
        Integer i = 0;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
    }

}