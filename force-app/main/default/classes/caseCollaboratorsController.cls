public with sharing class caseCollaboratorsController {

    @AuraEnabled
    public static Case getCaseDetails(String recordId) {
        try {
            return [SELECT Id, 
                    AccountId
                FROM Case
                WHERE Id = :recordId
                LIMIT 1];
        } catch(Exception e) {
            throw new AuraHandledException('Failed to retrieve Case Details: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static List<mint__Case_Collaborator__c> getExistingCollaborators(String caseId) {
        try{
            return [SELECT Id, 
                        Name,
                        mint__Case__c,
                        mint__Collaborators_Email__c,
                        mint__Manually_Added__c,
                        mint__Excluded__c,
                        mint__Collaborator__r.IsEmailBounced
                    FROM mint__Case_Collaborator__c
                    WHERE mint__Case__c = :caseId
                    ORDER BY mint__Manually_Added__c, mint__Excluded__c];
        } catch(Exception e) {
            throw new AuraHandledException('Failed to retrieve Existing Case Collaborators: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static list<Contact> searchContacts(String searchTerm, String accountId, String caseId) {
        try{
            String wildcardSearchTerm = '%' + searchTerm + '%';

            List<mint__Case_Collaborator__c> existingCaseCOllabs = [SELECT Id, 
                                                                        Name,
                                                                        mint__Case__c,
                                                                        mint__Collaborators_Email__c,
                                                                        mint__Manually_Added__c,
                                                                        mint__Excluded__c
                                                                    FROM mint__Case_Collaborator__c
                                                                    WHERE mint__Case__c = :caseId];

            Set<String> existingCollabEmails = new Set<String>();
            for(mint__Case_Collaborator__c collab : existingCaseCOllabs) {
                existingCollabEmails.add(collab.mint__Collaborators_Email__c);
            }
                                                            
            return [SELECT Id, 
                        FirstName, 
                        LastName, 
                        Name, 
                        Email,
                        IsEmailBounced 
                    FROM Contact 
                    WHERE AccountId = :accountId
                    AND (FirstName LIKE :wildcardSearchTerm
                    OR LastName LIKE :wildcardSearchTerm
                    OR Email LIKE :wildcardSearchTerm
                    OR Name LIKE :wildcardSearchTerm)
                    AND Email NOT IN : existingCollabEmails];
        } catch(Exception e) {
            throw new AuraHandledException('Failed whilst searching for Contacts: ' + e.getMessage());
        }
    }
}