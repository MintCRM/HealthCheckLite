trigger MintHistoryLogger_Mint_History_Tracking_Record on mint__Mint_History_Tracking_Record__c (after update) { 
 	 String objectName = Trigger.new[0].getSObjectType().getDescribe().getName(); 

 	 MintHistoryTrackingLogger.logFieldChanges(Trigger.oldMap, Trigger.newMap, objectName); 
}