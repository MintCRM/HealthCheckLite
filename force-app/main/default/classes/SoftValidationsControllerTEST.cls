/**
 * @description     - Test Class for softValidations app
 * @author          - david.bradburn@hyphen8.com
 * @date            - 31/03/2022
 * @group           - Tests
*/
@isTest
private with sharing class SoftValidationsControllerTEST {
    
    static testMethod void testTriggerValidationTest(){
    
        Contact con = new Contact();
        con.FirstName = 'Test';
        con.LastName = 'Test';
        con.Email = 'test@mail.com';
        insert con;
        
        Soft_Validation__c softVal = new Soft_Validation__c();
        softVal.Object__c = 'Contact';
        softVal.Title__c = 'Test';
        softVal.Message__c = 'Test';
        softVal.Where_Clause__c = 'LastName != null';
        softVal.Validation_Style__c = 'Info';
        softVal.Active__c = true;
        insert softVal;
    
        List<Soft_Validation__c> result = SoftValidationsController.getValidations('Contact', con.Id);

        system.assert(result.size() > 0, 'Check for Validaton records');
    }
    
    
    static testMethod void testTriggerValidationManagerTestOne(){   
        Map<String, String> result = softValidationsManagerController.getSObjects();
    }
    
    static testMethod void testTriggerValidationManagerTestTwo(){
    
        Contact con = new Contact();
        con.FirstName = 'Test';
        con.LastName = 'Test';
        con.Email = 'test@mail.com';
        insert con;
        
        Soft_Validation__c softVal = new Soft_Validation__c();
        softVal.Object__c = 'Contact';
        softVal.Title__c = 'Test';
        softVal.Message__c = 'Test';
        softVal.Where_Clause__c = 'LastName != null';
        softVal.Validation_Style__c = 'Info';
        softVal.Active__c = true;
        insert softVal;
    
        List<Soft_Validation__c> result = softValidationsManagerController.getExistingValidations();
    }
    
    static testMethod void testTriggerValidationManagerTestThree(){
    
        Contact con = new Contact();
        con.FirstName = 'Test';
        con.LastName = 'Test';
        con.Email = 'test@mail.com';
        insert con;
        
        Soft_Validation__c softVal = new Soft_Validation__c();
        softVal.Object__c = 'Contact';
        softVal.Title__c = 'Test';
        softVal.Message__c = 'Test';
        softVal.Where_Clause__c = 'LastName != null';
        softVal.Validation_Style__c = 'Info';
        softVal.Active__c = true;
        insert softVal;
    
        softValidationsManagerController.cloneValidationRecord(softVal.Id);
    }
    
    
    
     
    
    
    /**
     * @description - Basic Validation TRIGGERED Test
    */
    /*static testMethod void testTriggerValidationTest(){
        Account acc = new Account(Name = 'TestAccount1');
        insert acc;
        
        String accountId = acc.Id;

        string validationResponse = SoftValidationsController.getMessage(accountId, 'Account', 'Website = null');
        system.assertEquals('Validation Match!', validationResponse, 'Validation Triggered as website is indeed null');
    }*/

    /**
     * @description - Basic Validation NOT TRIGGERED Test
    */
    /*static testMethod void testNonTriggerValidationTest(){
        Account acc = new Account(Name = 'TestAccount1', Website = 'test.com');
        insert acc;
        
        String accountId = acc.Id;

        string validationResponse = SoftValidationsController.getMessage(accountId , 'Account', 'Website = null');
        system.assertEquals('', validationResponse, 'Validation Not Triggered due to blank website');
    }*/

    /**
     * @description - Parent Record - Basic Validation TRIGGERED Test
    */
    /*static testMethod void testParentTriggerValidationTest(){
        Account acc = new Account(Name = 'TestAccount1');
        insert acc;

        Contact con = new Contact(LastName='TEST USER', AccountID=acc.Id);
        insert con;
        
        String contactId= con.Id;

        string validationResponse = SoftValidationsController.getMessage(contactId, 'Contact', 'Account.Website = null');
        system.assertEquals('Validation Match!', validationResponse, 'Validation Triggered as website is indeed null');
    }*/

    /**
     * @description - Parent Record - Basic Validation NOT TRIGGERED Test
    */
    /*static testMethod void testPArentNonTriggerValidationTest(){
        Account acc = new Account(Name = 'TestAccount1', Website = 'test.com');
        insert acc;

        Contact con = new Contact(LastName='TEST USER', AccountID=acc.Id);
        insert con;
        
        String contactId= con.Id;

        string validationResponse = SoftValidationsController.getMessage(contactId, 'Contact', 'Account.Website = null');
        system.assertEquals('', validationResponse, 'Validation Not Triggered due to blank website');
    }*/
}