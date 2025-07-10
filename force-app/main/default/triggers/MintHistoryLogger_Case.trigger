trigger MintHistoryLogger_Case on Case (after update) { 
 	 String objectName = Trigger.new[0].getSObjectType().getDescribe().getName(); 

 	 MintHistoryTrackingLogger.logFieldChanges(Trigger.oldMap, Trigger.newMap, objectName); 
}