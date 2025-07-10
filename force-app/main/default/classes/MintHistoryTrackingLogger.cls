/**
 * @File Name          : MintHistoryTrackingLogger.cls
 * @Description        : This class is used to log the field changes for the tracked fields
 * @Author             : Mint CRM
 * @Test Class         : MintHistoryTrackingLoggerTEST
 * 
 * @Modification Log   :
 * Ver       Date            Author      		    Modification
 * 1.0       2025-01-01      Mint CRM               Initial Version
 */

public without sharing class MintHistoryTrackingLogger {

    /**
     * @description logFieldChanges - This method is used to log the field changes for the tracked fields
     * @param  oldMap     - Map<Id, sObject> - Trigger Old Map
     * @param  newMap     - Map<Id, sObject> - Trigger New Map
     * @param  objectName - String of Object API Name
    */ 
    public static void logFieldChanges(Map<Id, sObject> oldMap, Map<Id, sObject> newMap, String objectName) {

        List<Mint_History_Tracking_Configuration__c> defaultSettings = [SELECT Name, 
                                                                                    Archive_Period_Years__c,
                                                                                    Field_Tracking_Limit__c,
                                                                                    Archive_Schedule_Active__c,
                                                                                    Post_Changes_to_Chatter_Feed__c,
                                                                                    Tracking_Active__c
                                                                                FROM Mint_History_Tracking_Configuration__c
                                                                                WHERE Name = 'Default_Settings' 
                                                                                ORDER BY CreatedDate DESC
                                                                                LIMIT 1];
        
        // If Tracking is set to Active on Default Settings
        if(defaultSettings[0].Tracking_Active__c){
            // Retrieve tracked fields for the specified object
            List<Mint_Tracked_Field__c> trackedFields = [SELECT Id, 
                                                                    Field_API_Name__c,
                                                                    Object_Name__c,
                                                                    Field_Name__c,
                                                                    Field_Unavailable__c
                                                                FROM Mint_Tracked_Field__c 
                                                                WHERE Object_API_Name__c = :objectName];
    
            if (trackedFields.isEmpty()) {
                return;
            }
    
            List<FeedItem> feedItemsToPost = new List<FeedItem>();
            List<Mint_History_Tracking_Record__c> historyRecords = new List<Mint_History_Tracking_Record__c>();
            List<Mint_Tracked_Field__c> trackedFieldsToUpdate = new List<Mint_Tracked_Field__c>();
    
            // Loop through each record in the trigger
            for (Id recordId : newMap.keySet()) {
                SObject oldRecord = oldMap.get(recordId);
                SObject newRecord = newMap.get(recordId);
    
                // Loop through each tracked field
                for (Mint_Tracked_Field__c trackedField : trackedFields) {
                    String fieldAPI = trackedField.Field_API_Name__c;
    
                    // Check if the field exists in the object schema
                    if (!Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap().containsKey(fieldAPI)) {
                        // Mark the tracked field record as invalid
                        trackedField.Field_Unavailable__c = true;
                    } else {
                        trackedField.Field_Unavailable__c = false;
    
                        // Check if the field value has changed
                        if (oldRecord.get(fieldAPI) != newRecord.get(fieldAPI)) {
                            // Create the History Record
                            Mint_History_Tracking_Record__c historyRecord = new Mint_History_Tracking_Record__c();
                            historyRecord.Mint_Tracked_Field__c = trackedField.Id;
                            historyRecord.New_Value__c = String.valueOf(newRecord.get(fieldAPI));
                            historyRecord.Old_Value__c = String.valueOf(oldRecord.get(fieldAPI));
                            historyRecord.Change_Made_By__c = UserInfo.getUserId();
                            historyRecord.Related_Record_Id__c = recordId;
                            historyRecord.Change_Date_Time__c = DateTime.now();
                            historyRecord.Object__c = trackedField.Object_Name__c;
                            historyRecord.Field__c = trackedField.Field_Name__c;
                            historyRecords.add(historyRecord);
    
                            // If custom metadata record exists then post to chatter
                            if(defaultSettings.size() > 0 && defaultSettings[0].Post_Changes_to_Chatter_Feed__c) {

                                // Check if Object has Feeds Enabled
                                // Query the EntitySubscription object to check if there are any records for the specified object
                                String query = 'SELECT Id FROM EntitySubscription WHERE Parent.Type = :objectName LIMIT 1';
                                List<EntitySubscription> subscriptions = Database.query(query);

                                // If there are any records, feeds are enabled for the object
                                if (!subscriptions.isEmpty()) {
                                    // Create Feed Item 
                                    FeedItem post = new FeedItem();
                                    post.ParentId = recordId;
                                    post.Body = UserInfo.getName()+' changed '+trackedField.Field_Name__c+' from '+oldRecord.get(fieldAPI)+' to '+newRecord.get(fieldAPI);
                                    feedItemsToPost.add(post);
                                }
                            }
                        }
                    }
                    trackedFieldsToUpdate.add(trackedField);
                }
            }
    
            if (!historyRecords.isEmpty()) {
                insert historyRecords;
            } else {
                System.debug('No changes detected.');
            }
    
            if (!trackedFieldsToUpdate.isEmpty()) {
                update trackedFieldsToUpdate;
            } else {
                System.debug('No Tracked Fields detected.');
            }
    
            if (!feedItemsToPost.isEmpty()) {
                insert feedItemsToPost;
            } else {
                System.debug('No Feed Items detected.');
            }
        }
    }
}