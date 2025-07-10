trigger caseCollab_emailMessageTrigger on EmailMessage (before insert, before update, before delete, after insert, after update, after delete, after undelete) {

    switch on Trigger.operationType {
        when BEFORE_INSERT {
            caseCollab_triggerHandler.emailMessage_beforeInsert(Trigger.new);
        } 

        when AFTER_INSERT {
            caseCollab_triggerHandler.emailMessage_afterInsert(Trigger.new);
        }

    }

}