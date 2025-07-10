/**
 * @File Name          : MintHistoryTrackingControllerTEST.cls
 * @Description        : Test Class for the MintHistoryTrackingController class.
 * @Author             : Mint CRM
 * 
 * @Modification Log   :
 * Ver       Date            Author      		    Modification
 * 1.0       2025-01-01      Mint CRM               Initial Version
 */

@isTest
private class MintHistoryTrackingControllerTEST {

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
        defaultSettings.Post_Changes_to_Chatter_Feed__c = false;
        defaultSettings.Tracking_Active__c = true;
        insert defaultSettings;

        // Create Account Record
        Mint_History_Tracking_Record__c testRecord = new Mint_History_Tracking_Record__c();
        testRecord.Mint_Tracked_Field__c = trackedField.Id;
        testRecord.Related_Record_Id__c = trackedField.Id;
        testRecord.Change_Date_Time__c = System.now();
        insert testRecord;
    }


    @isTest
    static void getSObjectsTest() {
        Test.startTest();
            Map<String, String> objectMap = MintHistoryTrackingController.getSObjects();
        Test.stopTest();

        System.assertNotEquals(null, objectMap, 'The object map should not be null');
    }

    @isTest
    static void getObjectFieldsTest() {
        Test.startTest();
            Map<String, String> objectFieldMap = MintHistoryTrackingController.getObjectFields('Account');
        Test.stopTest();

        System.assertNotEquals(null, objectFieldMap, 'The object field map should not be null');
    }

    @isTest
    static void deselectAllTrackedFieldsTest() {
        Test.startTest();
            String responseMessage = MintHistoryTrackingController.deselectAllTrackedFields('Account');
        Test.stopTest();

        System.assertEquals('success', responseMessage, 'The response message should match the expected value');
    }

    @isTest
    static void getExistingTrackedFieldsTest() {
        Test.startTest();
            List<Mint_Tracked_Field__c> trackedFields = MintHistoryTrackingController.getExistingTrackedFields('Account');
        Test.stopTest();
        
        System.assertNotEquals(null, trackedFields, 'The tracked fields list should not be null');
    }

    @isTest
    static void getExistingTrackedObjectsTest() {
        Test.startTest();
            List<Mint_Tracked_Field__c> trackedFields = MintHistoryTrackingController.getExistingTrackingObjects();
        Test.stopTest();
        
        System.assertNotEquals(null, trackedFields, 'The tracked fields list should not be null');
    }

    @isTest
    static void deleteTrackingRecordTest() {
        List<Mint_Tracked_Field__c> trackedFields = [SELECT Id, 
                                                                    Object_API_Name__c,
                                                                    Field_API_Name__c
                                                                FROM Mint_Tracked_Field__c
                                                                WHERE Object_API_Name__c = 'Account'
                                                                AND Field_API_Name__c = 'Name'];

        System.assert(trackedFields.size() > 0, 'Verify Fields currently exist for Account / Name');

        test.startTest();
            MintHistoryTrackingController.deleteTrackingRecord('Account', 'Name');

            List<Mint_Tracked_Field__c> updatedTrackedFields = [SELECT Id, 
                                                                        Object_API_Name__c,
                                                                        Field_API_Name__c
                                                                    FROM Mint_Tracked_Field__c
                                                                    WHERE Object_API_Name__c = 'Account'
                                                                    AND Field_API_Name__c = 'Name'];
        test.stopTest();

        System.assert(updatedTrackedFields.size() == 0, 'Verify Fields no longer exist for Account / Name');
    }
    
    @isTest
    static void getAutoArchiveDefaultRecordTest() {
        test.startTest();
            Mint_History_Tracking_Configuration__c configRecord = MintHistoryTrackingController.getAutoArchiveDefaultRecord();
        test.stopTest();      
        
        System.assertEquals(configRecord.Name, 'Default_Settings', 'Verify Config Record Located and Name Correct');
        System.assertEquals(configRecord.Archive_Period_Years__c, '2', 'Verify Config Record Located and Arhice Period Correct');
        System.assertEquals(configRecord.Field_Tracking_Limit__c, 100, 'Verify Config Record Located and Field Tracking Limit Correct');
        System.assertEquals(configRecord.Archive_Schedule_Active__c, true, 'Verify Config Record Located and Acrhive Schedule Correct');
        System.assertEquals(configRecord.Post_Changes_to_Chatter_Feed__c, false, 'Verify Config Record Located and Post To Chatter Correct');
        System.assertEquals(configRecord.Tracking_Active__c, true, 'Verify Config Record Located and Tracking Active Correct');
    }

    @isTest
    static void checkTriggerIsPresentTest() {
        test.startTest();
            Boolean response = MintHistoryTrackingController.checkTriggerIsPresent('Test');
        test.stopTest();

        System.assertEquals(response, false, 'Verify the Account Trigger is not present');
    }

    @isTest
    static void createAutoArchiveDefaultRecordTest() {
        test.startTest();
            String response = MintHistoryTrackingController.createAutoArchiveDefaultRecord();
        test.stopTest();

        Mint_History_Tracking_Configuration__c defaultSetting = [SELECT Name, 
                                                                                Archive_Period_Years__c,
                                                                                Field_Tracking_Limit__c,
                                                                                Archive_Schedule_Active__c,
                                                                                Post_Changes_to_Chatter_Feed__c,
                                                                                Tracking_Active__c
                                                                            FROM Mint_History_Tracking_Configuration__c
                                                                            WHERE Name = 'Default_Settings' 
                                                                            ORDER BY CreatedDate DESC
                                                                            LIMIT 1];
        
        System.assertEquals(response, 'success', 'Verify Default Config Record created successfully');
        System.assertEquals(defaultSetting.Name, 'Default_Settings', 'Verify Config Record Located and Name Correct');
        System.assertEquals(defaultSetting.Archive_Period_Years__c, '2', 'Verify Config Record Located and Arhice Period Correct');
        System.assertEquals(defaultSetting.Field_Tracking_Limit__c, 100, 'Verify Config Record Located and Field Tracking Limit Correct');
        System.assertEquals(defaultSetting.Archive_Schedule_Active__c, true, 'Verify Config Record Located and Acrhive Schedule Correct');
        System.assertEquals(defaultSetting.Post_Changes_to_Chatter_Feed__c, false, 'Verify Config Record Located and Post To Chatter Correct');
        System.assertEquals(defaultSetting.Tracking_Active__c, true, 'Verify Config Record Located and Tracking Active Correct');
    }

    @isTest
    static void updateAutoArchiveDefaultRecordTest() {
        test.startTest();
            Mint_History_Tracking_Configuration__c configRecord = MintHistoryTrackingController.getAutoArchiveDefaultRecord();
            String response = MintHistoryTrackingController.updateAutoArchiveDefaultRecord('5', true, true, configRecord.Id);
        test.stopTest();

        System.assertEquals(response, 'success', 'Verify that the AutoArchive Settings were updated successfully');
    }

    @isTest
    static void createObjectTriggerTest() {
        // Set up the HTTP callout mock
        Test.setMock(HttpCalloutMock.class, new Mint_CreateObjectTriggerMock());

        // Define the object API name to test
        String objectAPI = 'Account';

        // Start the test
        Test.startTest();
            String response = MintHistoryTrackingController.createObjectTrigger(objectAPI);
        Test.stopTest();

        // Assert the response
        // System.assertEquals('Success', response, 'The response should indicate success');
    }

    @isTest
    static void deleteObjectTriggerTest() {
        // Set up the HTTP callout mock
        Test.setMock(HttpCalloutMock.class, new Mint_CreateObjectTriggerMock());

        // Define the trigger name to test
        String triggerName = 'MintHistoryLogger_Account';

        // Start the test
        Test.startTest();
            String response = MintHistoryTrackingController.deleteObjectTrigger(triggerName);
        Test.stopTest();

        // Assert the response
        // System.assertEquals('Success', response, 'The response should indicate success');
    }

    @isTest
    static void getMintHistoryRecordsTest() {
        test.startTest();
            Mint_Tracked_Field__c trackedRecord = [SELECT Id FROM Mint_Tracked_Field__c LIMIT 1];
            List<Mint_History_Tracking_Record__c> trackingRecords = MintHistoryTrackingController.getMintHistoryRecords(trackedRecord.Id);
        test.stopTest();
        
        System.assertNotEquals(null, trackingRecords, 'The tracking records list should not be null');
    }
}