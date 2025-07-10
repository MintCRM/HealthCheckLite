trigger MintHistoryLogger_Conga_Merge_Query on APXTConga4__Conga_Merge_Query__c (after update) { 
 	 String objectName = Trigger.new[0].getSObjectType().getDescribe().getName(); 

 	 MintHistoryTrackingLogger.logFieldChanges(Trigger.oldMap, Trigger.newMap, objectName); 
}