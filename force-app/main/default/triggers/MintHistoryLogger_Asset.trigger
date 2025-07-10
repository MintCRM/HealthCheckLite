trigger MintHistoryLogger_Asset on Asset (after update) { 
 	 String objectName = Trigger.new[0].getSObjectType().getDescribe().getName(); 

 	 MintHistoryTrackingLogger.logFieldChanges(Trigger.oldMap, Trigger.newMap, objectName); 
}