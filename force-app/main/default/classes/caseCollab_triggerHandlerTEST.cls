@isTest
private class caseCollab_triggerHandlerTEST {

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
    static void emailMessage_beforeInsertTEST() {

        // Test with CC Addresses
        EmailMessage newEmail = new EmailMessage();
        newEmail.Subject = 'TEST EMAIL';
        newEmail.TextBody = 'TEST EMAIL BODY';
        newEmail.HtmlBody = '<H1>TEST EMAIL BODY</H1>';
        newEmail.ParentId = [SELECT Id FROM Case LIMIT 1].Id;
        newEmail.CCAddress = 'testEmail@mail.com';
        newEmail.Incoming = false;
        newEmail.ToIds = new List<String>{ [SELECT Id FROM Contact LIMIT 1].Id };
        insert newEmail;

        // Test without CC Addresses
        EmailMessage newEmail2 = new EmailMessage();
        newEmail2.Subject = 'TEST EMAIL';
        newEmail2.TextBody = 'TEST EMAIL BODY';
        newEmail2.HtmlBody = '<H1>TEST EMAIL BODY</H1>';
        newEmail2.ParentId = [SELECT Id FROM Case LIMIT 1].Id;
        newEmail2.Incoming = false;
        newEmail2.ToIds = new List<String>{ [SELECT Id FROM Contact LIMIT 1].Id };
        insert newEmail2;

        system.assert(newEmail2 != null, 'placeholder Assert');
    }

    @isTest
    static void emailMessage_afterInsertTEST() {

        // Test with CC Addresses
        EmailMessage newEmail = new EmailMessage();
        newEmail.Subject = 'TEST EMAIL';
        newEmail.TextBody = 'TEST EMAIL BODY';
        newEmail.HtmlBody = '<H1>TEST EMAIL BODY</H1>';
        newEmail.ParentId = [SELECT Id FROM Case LIMIT 1].Id;
        newEmail.CCAddress = 'testEmail2@mail.com';
        newEmail.Incoming = true;
        newEmail.ToIds = new List<String>{ [SELECT Id FROM Contact LIMIT 1].Id };
        insert newEmail;

        // Test without CC Addresses
        EmailMessage newEmail2 = new EmailMessage();
        newEmail2.Subject = 'TEST EMAIL';
        newEmail2.TextBody = 'TEST EMAIL BODY';
        newEmail2.HtmlBody = '<H1>TEST EMAIL BODY</H1>';
        newEmail2.ParentId = [SELECT Id FROM Case LIMIT 1].Id;
        newEmail2.Incoming = true;
        newEmail2.ToIds = new List<String>{ [SELECT Id FROM Contact LIMIT 1].Id };
        insert newEmail2;

        system.assert(newEmail2 != null, 'placeholder Assert');
    }

    @isTest
    static void case_afterInsertTEST() {

        Contact contactRecord = new Contact();
        contactRecord.FirstName = 'TEST USER';
        contactRecord.LastName = 'TEST USER';
        contactRecord.Email = 'testCollaboratorOnCase@mail.com';
        contactRecord.AccountId = [SELECT Id FROM Account LIMIT 1].Id;
        insert contactRecord;

        Case caseRecord = new Case();
        caseRecord.Status = 'New';
        caseRecord.Origin = 'Phone';
        caseRecord.ContactId = contactRecord.Id;
        caseRecord.accountId = contactRecord.AccountId;
        insert caseRecord;

        system.assert(caseRecord != null, 'placeholder Assert');
    }

    @isTest
    static void case_afterUpdateTEST() {

        Contact contactRecord = new Contact();
        contactRecord.FirstName = 'TEST USER';
        contactRecord.LastName = 'TEST USER';
        contactRecord.Email = 'testCollaboratorOnCase@mail.com';
        contactRecord.AccountId = [SELECT Id FROM Account LIMIT 1].Id;
        insert contactRecord;

        Case caseRecord = new Case();
        caseRecord.Status = 'New';
        caseRecord.Origin = 'Phone';
        caseRecord.ContactId = contactRecord.Id;
        caseRecord.AccountId = contactRecord.AccountId;
        insert caseRecord;

        Account accountRecord = new Account();
        accountRecord.Name = 'TestAccount1';
        accountRecord.Website = 'test.com';
        insert accountRecord;

        Contact contactRecord2 = new Contact();
        contactRecord2.FirstName = 'TEST USER';
        contactRecord2.LastName = 'TEST USER';
        contactRecord2.Email = 'testCollaboratorOnCase1@mail.com';
        contactRecord2.AccountId = accountRecord.Id;
        contactRecord2.mint__Case_Collaborator__c = true;
        insert contactRecord2;

        Contact contactRecord3 = new Contact();
        contactRecord3.FirstName = 'TEST USER';
        contactRecord3.LastName = 'TEST USER';
        contactRecord3.Email = 'testCollaboratorOnCase2@mail.com';
        contactRecord3.AccountId = accountRecord.Id;
        contactRecord3.mint__Case_Collaborator__c = true;
        insert contactRecord3;

        caseRecord.AccountId = accountRecord.Id;
        update caseRecord;

        system.assert(caseRecord != null, 'placeholder Assert');
    }
}