@isTest
private class caseCollaboratorsControllerTEST {

    @TestSetup
    static void makeData(){
        Account accountRecord = new Account();
        accountRecord.Name = 'TestAccount1';
        accountRecord.Website = 'test.com';
        insert accountRecord;

        Contact contactRecord = new Contact();
        contactRecord.FirstName = 'TEST USER';
        contactRecord.LastName = 'TEST USER';
        contactRecord.Email = 'testCollaborator@mail.com';
        contactRecord.AccountId = accountRecord.Id;
        insert contactRecord;

        Case caseRecord = new Case();
        caseRecord.Status = 'New';
        caseRecord.Origin = 'Phone';
        caseRecord.ContactId = contactRecord.Id;
        caseRecord.accountId = accountRecord.Id;
        insert caseRecord;

        mint__Case_Collaborator__c collab = new mint__Case_Collaborator__c();
        collab.mint__Case__c = caseRecord.Id;
        collab.mint__Collaborator__c = contactRecord.Id;
        collab.mint__Manually_Added__c = true;
        insert collab;
    }

    @isTest
    static void getCaseDetailsTEST() {
        
        Test.startTest();
            Case caseRecord = [SELECT Id FROM Case LIMIT 1];
            Case caseDetails = caseCollaboratorsController.getCaseDetails(caseRecord.Id);
        Test.stopTest();

        system.assert(caseDetails != null, 'Found Case Record');
    }
    
    @isTest
    static void getExistingCollaboratorsTEST() {
        
        Test.startTest();
            Case caseRecord = [SELECT Id FROM Case LIMIT 1];
            List<mint__Case_Collaborator__c> collabs = caseCollaboratorsController.getExistingCollaborators(caseRecord.Id);
        Test.stopTest();

        system.assert(collabs.size() > 0, 'Found Case Collabs');
    }
    
    @isTest
    static void searchContactsTEST() {
        
        Test.startTest();
            Case caseRecord = [SELECT Id, AccountId FROM Case LIMIT 1];

            // Create a Contact with is not a Collaborator
            Contact contactRecord = new Contact();
            contactRecord.FirstName = 'Non';
            contactRecord.LastName = 'Collaborator';
            contactRecord.Email = 'nonCollaborator@mail.com';
            contactRecord.AccountId = caseRecord.AccountId;
            insert contactRecord;

            List<Contact> results = caseCollaboratorsController.searchContacts('Collaborator', caseRecord.AccountId, caseRecord.Id);
        Test.stopTest();

        system.assert(results.size() > 0, 'Found Account Contacts');
    }
}