trigger caseCollab_caseTrigger on Case (before insert, before update, before delete, after insert, after update, after delete, after undelete) {

    switch on Trigger.operationType {

        when AFTER_INSERT {
            caseCollab_triggerHandler.case_afterInsert(Trigger.new);
        }

        when AFTER_UPDATE {
            // Verify Account lookup has changed
            List<Case> casesToProcess = new List<Case>();
            for( Id caseId : Trigger.newMap.keySet() ){
                if( Trigger.oldMap.get(caseId).AccountId != Trigger.newMap.get(caseId).AccountId ){
                    casesToProcess.add(Trigger.newMap.get(caseId));
                }
            }

            caseCollab_triggerHandler.case_afterUpdate(casesToProcess);
        }

    }

}