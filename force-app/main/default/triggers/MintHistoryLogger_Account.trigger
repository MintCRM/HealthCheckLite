trigger MintHistoryLogger_Account on Account (after update) { 
 	 String objectName = Trigger.new[0].getSObjectType().getDescribe().getName(); 

 	 MintHistoryTrackingLogger.logFieldChanges(Trigger.oldMap, Trigger.newMap, objectName); 
}