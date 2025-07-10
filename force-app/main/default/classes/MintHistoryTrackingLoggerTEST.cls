/**
 * @File Name          : MintHistoryTrackingLoggerTEST.cls
 * @Description        : Test Class for the MintHistoryTrackingLogger class
 * @Author             : Mint CRM
 * 
 * @Modification Log   :
 * Ver       Date            Author      		    Modification
 * 1.0       2025-01-01      Mint CRM               Initial Version
 */

@isTest
private class MintHistoryTrackingLoggerTEST {

    // Create Test Data
    @testSetup
    static void setupTestData() {
        // Create a Tracked Field Record
        Mint_Tracked_Field__c trackedField = new Mint_Tracked_Field__c();
        trackedField.Field_Name__c = 'Name';
        trackedField.Field_API_Name__c = 'Name';
        trackedField.Object_Name__c = 'Account';
        trackedField.Object_API_Name__c = 'Account';
        insert trackedField;

        // Create a History Tracking Configuration Record
        Mint_History_Tracking_Configuration__c defaultSettings = new Mint_History_Tracking_Configuration__c();
        defaultSettings.Name = 'Default_Settings';
        defaultSettings.Archive_Period_Years__c = '2';
        defaultSettings.Field_Tracking_Limit__c = 100;
        defaultSettings.Archive_Schedule_Active__c = true;
        defaultSettings.Post_Changes_to_Chatter_Feed__c = true;
        defaultSettings.Tracking_Active__c = true;
        insert defaultSettings;
    }

    // Test Field Change Logging
    @isTest
    static void testLogFieldChanges() {
        // Retrieve the tracked field from the test setup
        Mint_Tracked_Field__c trackedField = [SELECT Id, Field_API_Name__c, Object_Name__c FROM Mint_Tracked_Field__c LIMIT 1];

        // Create old and new Account records
        Account oldAccount = new Account(Name = 'Old Account Name');
        insert oldAccount;

        Account newAccount = new Account(Id = oldAccount.Id, Name = 'New Account Name');

        // Simulate the trigger context
        Map<Id, SObject> oldMap = new Map<Id, SObject>{oldAccount.Id => oldAccount};
        Map<Id, SObject> newMap = new Map<Id, SObject>{newAccount.Id => newAccount};

        // Call the logFieldChanges method
        Test.startTest();
            MintHistoryTrackingLogger.logFieldChanges(oldMap, newMap, 'Account');
        Test.stopTest();

        // Verify the results
        // Verify that a history tracking record was created
        List<Mint_History_Tracking_Record__c> historyRecords = [
            SELECT Old_Value__c, New_Value__c, Field__c
            FROM Mint_History_Tracking_Record__c
        ];
        
        System.assertEquals(1, historyRecords.size(), 'One history tracking record should have been created');
        System.assertEquals('Old Account Name', historyRecords[0].Old_Value__c, 'The old value should match');
        System.assertEquals('New Account Name', historyRecords[0].New_Value__c, 'The new value should match');
        System.assertEquals('Name', historyRecords[0].Field__c, 'The field name should match');
    }
}